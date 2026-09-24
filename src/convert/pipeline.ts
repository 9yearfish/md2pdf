/**
 * Markdown in, Typst source plus its assets out.
 *
 * Diagrams and images have to be resolved before emission because rendering
 * them is asynchronous while emission is not, so this runs in two passes:
 * collect what needs resolving, resolve it, then emit.
 */
import type { Token } from 'markdown-it';
import { createParser, parse } from './markdown';
import { emit, assetKey, type EmittedFormula, type MathConversion, type ResolvedAsset } from './emit';
import { toTree, type Node } from './tree';
import { buildMathPreamble, buildPreamble, type DocumentOptions } from './preamble';
import { isMathFence } from './math-syntax';
import { renderDiagram, type DiagramFailure } from '../diagram/mermaid';
import { normalizeLang, type LangSetting } from './lang';
import { diagramFontFamily, resolveFonts, type FontSet } from '../typst/fonts';
import { registerFaces } from '../preview/fonts';
import { decodeDataUri, extensionFor, findImage, type LocalImage } from './images';
import type { Asset } from '../typst/engine';
import { t } from '../i18n/runtime';
import { loadLayout } from '../layout/load';

const MM_TO_PT = 2.834645;

const PAPER_WIDTH_PT: Record<DocumentOptions['paper'], number> = {
  a4: 595.276,
  'us-letter': 612,
  a5: 419.528,
  'iso-b5': 498.898,
};


export interface ConversionResult {
  /** Typst source, ready to compile. */
  source: string;
  assets: Asset[];
  warnings: string[];
  /** Everything that will be typeset, used to pick a font tier. */
  textForFonts: string;
  lang: LangSetting;
  /** The fonts the source was written for; the compiler loads exactly these. */
  fonts: FontSet;
  /** The document has formulas: the maths font is needed, and compiling goes through `compileRecovering`. */
  hasMath: boolean;
  /** Every formula call in `source`, so a failing one can be singled out. */
  formulas: EmittedFormula[];
}

/** Visit every token, including the children of inline tokens. */
function walk(tokens: Token[], visit: (token: Token) => void): void {
  for (const token of tokens) {
    visit(token);
    if (token.children) walk(token.children, visit);
  }
}

function textWidthPt(options: DocumentOptions): number {
  return PAPER_WIDTH_PT[options.paper] - 2 * options.margin * MM_TO_PT;
}

function collectFootnotes(tree: Node[]): Map<string, Node[]> {
  const found = new Map<string, Node[]>();
  for (const node of tree) {
    if (node.token.type !== 'footnote_block_open') continue;
    for (const entry of node.children) {
      if (entry.token.type !== 'footnote_open') continue;
      const id = String(entry.token.meta?.id ?? '');
      // `footnote_anchor` is the backlink to the reference, meaningless in print.
      found.set(id, entry.children.filter(c => c.token.type !== 'footnote_anchor'));
    }
  }
  return found;
}

export async function convert(
  source: string,
  options: DocumentOptions,
  images: Map<string, LocalImage>,
): Promise<ConversionResult> {
  // Front matter, template, header and footer, cover (src/layout, a lazy
  // chunk). Without it, e.g. offline before it was ever fetched, the document
  // still converts, with the base layout.
  const layout = await loadLayout().catch(() => null);
  const doc = layout?.resolveDocument(source, options);
  if (doc) {
    source = doc.body;
    options = doc.options;
  }
  const md = createParser();
  const { tokens } = parse(md, source);
  const topHeading = doc ? layout!.prepareTokens(tokens, doc) : 1;

  const warnings: string[] = [];
  const assets: Asset[] = [];
  const resolved = new Map<string, ResolvedAsset>();
  const available = textWidthPt(options);

  // Pass one: find everything that needs resolving before emission.
  const diagrams: string[] = [];
  const imageRefs: string[] = [];
  const formulas = new Set<string>();
  walk(tokens, token => {
    if (token.type === 'math_inline' || token.type === 'math_block') {
      formulas.add(token.content);
    } else if (token.type === 'fence' && isMathFence(token.info || '')) {
      formulas.add(token.content.trim());
    } else if (token.type === 'fence' && (token.info || '').trim().split(/\s+/)[0] === 'mermaid') {
      if (!diagrams.includes(token.content)) diagrams.push(token.content);
    } else if (token.type === 'image') {
      const src = String(token.attrGet('src') ?? '');
      if (src && !imageRefs.includes(src)) imageRefs.push(src);
    }
  });

  // The fonts decide the preamble and how diagram labels are measured.
  const lang = normalizeLang(options.lang);
  const fontText = doc ? `${source}\n${doc.extraText}` : source;
  const fonts = await resolveFonts(fontText, lang, doc?.fontOptions);
  // Diagram labels are measured by the browser, so it needs the PDF's faces.
  const facesComplete = diagrams.length > 0 && registerFaces(fonts, true);

  // Formulas are converted by a module that is only fetched when there are any.
  const hasMath = formulas.size > 0;
  let math: Map<string, MathConversion> | undefined;
  if (hasMath) {
    const typstMath = await import('../math/typst-math');
    math = await typstMath.convertFormulas([...formulas]);
    assets.push(...typstMath.MATH_ASSETS);
  }

  // Pass two: resolve. Diagrams render concurrently; a failure in one must not
  // take down the document, so it is reported and an error box stands in.
  // Their Typst (sizing, error box) loads only when there is a diagram.
  const typst = diagrams.length ? await import('./diagram-typst') : null;
  await Promise.all(
    diagrams.map(async (code, index) => {
      try {
        const diagram = await renderDiagram(code, {
          fontFamily: diagramFontFamily(fonts, code),
          final: true,
          facesComplete,
        });
        const path = `/assets/diagram-${index}.svg`;
        assets.push({ path, bytes: new TextEncoder().encode(diagram.pdfSvg) });
        // Natural size: Typst scales it to the page (see `diagram-typst.ts`).
        // Overlays are in SVG pixels.
        const scale = 0.75;
        resolved.set(assetKey('mermaid', code), {
          path,
          width: diagram.width,
          height: diagram.height,
          overlays: diagram.overlays.map(o => ({
            x: o.x * scale,
            y: o.y * scale,
            width: o.width * scale,
            height: o.height * scale,
            size: o.fontSize * scale,
            bold: o.bold,
            fill: o.fill,
            lines: o.lines,
          })),
        });
      } catch (error) {
        const failure = error as DiagramFailure;
        const title = failure.unknownType !== undefined
          ? t('diagramUnknown', { name: failure.unknownType })
          : failure.line ? t('diagramErrorAt', { line: failure.line }) : t('diagramErrorTitle');
        const message = failure.message ?? String(error);
        resolved.set(assetKey('mermaid', code), {
          path: '',
          markup: typst!.diagramErrorMarkup({ title, message, excerpt: failure.excerpt }),
        });
        warnings.push(t('diagramError', { detail: [title, message].filter(Boolean).join(': ') }));
      }
    }),
  );

  imageRefs.forEach((src, index) => {
    const local = findImage(images, src) ?? decodeDataUri(src);
    if (!local) {
      warnings.push(
        /^https?:/i.test(src)
          ? `Remote images are not fetched: ${src}`
          : `Image not found: ${src}. Drag the file onto the page to embed it.`,
      );
      return;
    }
    const path = `/assets/image-${index}.${extensionFor(local.mime)}`;
    assets.push({ path, bytes: local.bytes });
    // Intrinsic size is unknown here, so let Typst use the natural size and
    // only cap the width.
    resolved.set(assetKey('image', src), { path, width: available });
  });

  // Footnote definitions live in a `footnote_block` at the end of the token
  // stream, not in `env.footnotes.list` (whose entries carry no tokens). They
  // are pulled out here so the emitter can inline each one at its reference.
  const footnotes = collectFootnotes(toTree(tokens));

  const warn = (w: string) => warnings.push(w);
  const emitted: EmittedFormula[] = [];
  const body = emit({ tokens, assets: resolved, footnotes, warn, math, formulas: emitted });
  for (const [tex, result] of math ?? []) {
    if ('error' in result) warnings.push(t('mathError', { detail: `${tex} (${result.error})` }));
  }
  // The maths rules go inside the base preamble, before any table of contents
  // (whose entries may hold formulas); the diagram helpers after it all.
  const mathRules = hasMath ? buildMathPreamble() : '';
  const frame = doc
    ? layout!.layoutTypst(doc, fonts, topHeading, warn, mathRules)
    : { head: buildPreamble(options, fonts, mathRules), tail: '' };

  return {
    source: `${frame.head}\n${typst?.DIAGRAM_DEFS ?? ''}${body}\n${frame.tail}`,
    assets,
    warnings: [...new Set(warnings)],
    textForFonts: fontText,
    lang,
    fonts,
    hasMath,
    formulas: emitted,
  };
}
