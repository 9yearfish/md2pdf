/**
 * Markdown in, Typst source plus its assets out.
 *
 * Diagrams and images have to be resolved before emission because rendering
 * them is asynchronous while emission is not, so this runs in two passes:
 * collect what needs resolving, resolve it, then emit.
 */
import type { Token } from 'markdown-it';
import { createParser, parse } from './markdown';
import { emit, assetKey, type ResolvedAsset } from './emit';
import { toTree, type Node } from './tree';
import { buildPreamble, type DocumentOptions } from './preamble';
import { renderDiagram } from '../diagram/mermaid';
import { decodeDataUri, extensionFor, type LocalImage } from './images';
import type { Asset } from '../typst/engine';

const MM_TO_PT = 2.834645;

const PAPER_WIDTH_PT: Record<DocumentOptions['paper'], number> = {
  a4: 595.276,
  'us-letter': 612,
  a5: 419.528,
  'iso-b5': 498.898,
};

const CJK = /[⺀-鿿　-ヿ豈-﫿＀-￯]/;

export interface ConversionResult {
  /** Typst source, ready to compile. */
  source: string;
  assets: Asset[];
  warnings: string[];
  /** Everything that will be typeset, used to pick a font tier. */
  textForFonts: string;
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

/** Scale down to fit the text block, but never scale a small image up. */
function fit(width: number, height: number, available: number): { width: number; height: number } {
  if (width <= available) return { width, height };
  const scale = available / width;
  return { width: available, height: height * scale };
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
  const md = createParser();
  const { tokens } = parse(md, source);

  const warnings: string[] = [];
  const assets: Asset[] = [];
  const resolved = new Map<string, ResolvedAsset>();
  const available = textWidthPt(options);

  // Pass one: find everything that needs resolving before emission.
  const diagrams: string[] = [];
  const imageRefs: string[] = [];
  walk(tokens, token => {
    if (token.type === 'fence' && (token.info || '').trim().split(/\s+/)[0] === 'mermaid') {
      if (!diagrams.includes(token.content)) diagrams.push(token.content);
    } else if (token.type === 'image') {
      const src = String(token.attrGet('src') ?? '');
      if (src && !imageRefs.includes(src)) imageRefs.push(src);
    }
  });

  // Pass two: resolve. Diagrams render concurrently; a failure in one must not
  // take down the document, so each is reported and the source kept instead.
  await Promise.all(
    diagrams.map(async (code, index) => {
      try {
        const diagram = await renderDiagram(code);
        const path = `/assets/diagram-${index}.svg`;
        assets.push({ path, bytes: new TextEncoder().encode(diagram.svg) });
        resolved.set(assetKey('mermaid', code), {
          path,
          ...fit(diagram.width, diagram.height, available),
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        warnings.push(`Diagram could not be rendered: ${detail.split('\n')[0]}`);
      }
    }),
  );

  imageRefs.forEach((src, index) => {
    const local = images.get(src) ?? images.get(src.replace(/^\.?\//, '')) ?? decodeDataUri(src);
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

  const body = emit({ tokens, assets: resolved, footnotes, warn: w => warnings.push(w) });
  const hasCjk = CJK.test(source);

  return {
    source: `${buildPreamble(options, hasCjk)}\n${body}\n`,
    assets,
    warnings: [...new Set(warnings)],
    textForFonts: source,
  };
}
