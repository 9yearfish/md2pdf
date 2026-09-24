/**
 * Live HTML preview.
 *
 * The PDF is typeset by Typst, which needs a 7 MB engine; the preview must not
 * wait on that. markdown-it renders the same parse tree to HTML in a few
 * milliseconds, styled to approximate the printed page. Pagination and exact
 * line breaks are the PDF's business and are not imitated here.
 */
import { importWithRetry } from '../ui/retry-import';
import type { MarkdownIt, Token } from 'markdown-it';
import { createParser } from '../convert/markdown';
import { isMathFence } from '../convert/math-syntax';
import { renderDiagram, type DiagramFailure } from '../diagram/mermaid';
import { findImage, type LocalImage } from '../convert/images';
import type { DocumentOptions } from '../convert/preamble';
import { t } from '../i18n/runtime';
import { detectLanguage, type LangCode, type LanguageInfo } from '../convert/lang';
import { diagramFontFamily, resolveFonts, type FontOptions, type FontSet } from '../typst/fonts';
import { shouldPrefetch } from '../typst/wasm-loader';
import { allowCjkFaces, onCjkFacesAllowed, previewFontStack, registerFaces } from './fonts';
import '../fonts.css';

const TASK = /^\[([ xX])\]\s+/;

/** The page geometry the PDF will use, in CSS units that mean the same thing. */
const PAPER_WIDTH_MM: Record<DocumentOptions['paper'], number> = {
  a4: 210,
  'us-letter': 215.9,
  a5: 148,
  'iso-b5': 176,
};

/** Quote marks as Typst sets them for each language (see `smartquote`). */
const QUOTES: Partial<Record<LangCode, string | string[]>> = {
  de: '„“‚‘',
  fr: ['«\u00a0', '\u00a0»', '“', '”'],
  es: '«»“”',
  it: '«»“”',
  ru: '«»„“',
  uk: '«»„“',
  el: '«»‘’',
  pl: '„”’’',
  ja: '「」『』',
  'zh-Hant': '「」『』',
};

/**
 * A template's effect on the preview (src/layout/preview.ts, loaded lazily):
 * extra markup around the body, token changes shared with the PDF, and a pass
 * over the rendered page.
 */
export interface PreviewLayout {
  fontOptions: FontOptions;
  /** Text typeset outside the body (title, header...), for font resolution. */
  extraText: string;
  tokens(tokens: Token[]): void;
  html(lang: LanguageInfo, renderMarkdown: (source: string) => string): { before: string; afterToc: string; after: string };
  /** Once per render, on the fresh DOM. */
  decorate(root: HTMLElement): void;
  /** Whenever the language (and so the font stack) settles. */
  style(root: HTMLElement, lang: LanguageInfo): void;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

export class HtmlPreview {
  private readonly md: MarkdownIt;
  private readonly blobUrls = new Map<LocalImage, string>();
  /**
   * Rendered diagrams by source, with the font list they were measured with:
   * the SVG, or the error box when Mermaid rejected the source.
   */
  private readonly diagrams = new Map<string, DiagramEntry>();
  /**
   * The last diagram that rendered at each position, shown while its source
   * is being edited: in place of the placeholder while the next version
   * renders, and dimmed under the error while the source does not parse.
   */
  private readonly lastGood: { code: string; svg: string }[] = [];
  private exporter: Promise<typeof import('../diagram/export')> | null = null;
  private generation = 0;
  private observer: IntersectionObserver | null = null;
  private diagramQueue: Promise<void> = Promise.resolve();
  private fonts: FontSet | null = null;
  private facesComplete = false;
  private lastSource = '';
  /** Rendered formulas by `display + source`, like the diagram cache. */
  private readonly formulas = new Map<string, string>();
  private mathObserver: IntersectionObserver | null = null;
  /** Whether the last render had any maths; the PDF engine needs a maths font then. */
  hasMath = false;
  private layout: PreviewLayout | undefined;

  constructor(
    private readonly root: HTMLElement,
    private readonly images: Map<string, LocalImage>,
  ) {
    this.md = createParser();
    // Straight quotes become the language's quote marks, as in the PDF; the
    // other typographer replacements ((c) and so on) are not what Typst does.
    this.md.set({ typographer: true });
    this.md.disable('replacements');
    this.installRules();
    // Shown on every page-break marker (`.page-break` in styles.css).
    root.style.setProperty('--page-break-label', JSON.stringify(t('pageBreak')));

    // The CJK faces are megabytes: only a while after the page has loaded, so
    // they never compete with first paint, and only on a connection the
    // engine would warm up on anyway (it fetches the same files).
    const allow = () =>
      setTimeout(() => {
        const idle = (window as { requestIdleCallback?: (fn: () => void) => void }).requestIdleCallback;
        (idle ?? ((fn: () => void) => fn()))(() => {
          if (shouldPrefetch()) allowCjkFaces();
        });
      }, 1000);
    if (document.readyState === 'complete') allow();
    else window.addEventListener('load', allow, { once: true });
    // The export actions on each diagram (copy / download SVG / PNG).
    root.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-diagram-action]');
      const figure = button?.closest<HTMLElement>('figure.diagram');
      const svg = figure && this.diagrams.get(figure.dataset.code ?? '')?.svg;
      if (!button || !svg) return;
      this.exporter ??= importWithRetry(() => import('../diagram/export'));
      this.exporter.catch(() => (this.exporter = null));
      void this.exporter.then(m => m.exportDiagram(button, svg, `diagram-${Number(figure.dataset.index) + 1}`));
    });
    onCjkFacesAllowed(() => {
      if (!this.fonts) return;
      this.facesComplete = registerFaces(this.fonts);
      this.renderDiagrams(this.generation);
    });
  }

  applyOptions(options: DocumentOptions): void {
    const style = this.root.style;
    style.setProperty('--paper-width', `${PAPER_WIDTH_MM[options.paper]}mm`);
    style.setProperty('--paper-margin', `${options.margin}mm`);
    style.setProperty('--paper-font-size', `${options.fontSize}pt`);
    style.setProperty('--paper-line-height', String(options.lineHeight));
    this.root.classList.toggle('justify', options.justify);
  }

  render(source: string, options: DocumentOptions, layout?: PreviewLayout): void {
    const generation = ++this.generation;
    this.layout = layout;
    const lang = detectLanguage(source, options.lang);
    this.applyLanguage(lang);
    this.md.set({ quotes: QUOTES[lang.code] ?? '“”‘’' });
    const env = {};
    const tokens = this.md.parse(source, env);
    layout?.tokens(tokens);
    this.pruneDiagrams(tokens);
    const toc = options.tableOfContents
      ? this.tableOfContents(tokens, options.tocTitle?.trim() || lang.tocTitle)
      : '';
    const parts = layout?.html(lang, text => this.md.render(text)) ?? { before: '', afterToc: '', after: '' };
    this.root.innerHTML =
      parts.before + toc + (toc && parts.afterToc) + this.md.renderer.render(tokens, this.md.options, env) + parts.after;
    this.root.dataset.lines = String(source.split('\n').length);
    layout?.decorate(this.root);
    // Formulas do not depend on the document's fonts, so they need not wait.
    this.renderMath(generation);
    void this.resolveFonts(source + (layout ? `\n${layout.extraText}` : ''), options, generation);
  }

  /**
   * Language and fonts need the coverage data, which is loaded on demand; the
   * first render uses a quick guess and this settles it.
   */
  private async resolveFonts(source: string, options: DocumentOptions, generation: number): Promise<void> {
    let fonts: FontSet | null = null;
    const serif = !!this.layout?.fontOptions.serif;
    if (source === this.lastSource && this.fonts?.serif === serif) fonts = this.fonts;
    else {
      try {
        fonts = await resolveFonts(source, options.lang, { serif });
      } catch {
        fonts = null; // offline and never loaded: system fonts will do
      }
    }
    if (generation !== this.generation) return;
    if (fonts) {
      this.fonts = fonts;
      this.lastSource = source;
      this.applyLanguage(fonts.lang);
      this.facesComplete = registerFaces(fonts);
    }
    this.renderDiagrams(generation);
  }

  private applyLanguage(lang: LanguageInfo): void {
    this.root.lang = lang.html;
    this.root.dir = lang.dir;
    this.root.style.setProperty('--paper-font-family', previewFontStack(lang));
    this.layout?.style(this.root, lang);
  }

  /**
   * Scroll so that source line `line` (fractional: the editor may be part-way
   * through a line) is at the top. Blocks only mark where they start, so the
   * position is interpolated between this block's start and the next one's:
   * without that, the preview sits still while a long paragraph, code block or
   * diagram scrolls past in the editor, then jumps.
   */
  scrollToLine(line: number, scroller: HTMLElement): void {
    const blocks = this.root.querySelectorAll<HTMLElement>('[data-line]');
    let index = -1;
    let low = 0;
    let high = blocks.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (Number(blocks[mid].dataset.line) <= line) {
        index = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const origin = this.root.getBoundingClientRect().top;
    const topOf = (block: HTMLElement) => block.getBoundingClientRect().top - origin;
    let top = 0;
    if (index >= 0) {
      const block = blocks[index];
      const start = Number(block.dataset.line);
      const next = blocks[index + 1];
      const from = topOf(block);
      if (next) {
        const span = Number(next.dataset.line) - start;
        const fraction = span > 0 ? Math.min(1, Math.max(0, (line - start) / span)) : 0;
        top = from + (topOf(next) - from) * fraction;
      } else {
        // The last block: spread the remaining lines over its own height.
        const lines = Number(this.root.dataset.lines) || start + 1;
        const fraction = Math.min(1, Math.max(0, (line - start) / Math.max(1, lines - start)));
        top = from + block.getBoundingClientRect().height * fraction;
      }
    }
    scroller.scrollTop = Math.max(0, top - 24);
  }

  private installRules(): void {
    const md = this.md;

    // Source line numbers on every top-level block, for scroll sync.
    md.core.ruler.push('md2pdf_lines', state => {
      for (const token of state.tokens) {
        if (token.map && token.level === 0 && token.nesting !== -1) {
          token.attrSet('data-line', String(token.map[0]));
        }
      }
    });

    // GitHub task lists; the PDF emitter recognises the same marker.
    md.core.ruler.push('md2pdf_tasks', state => {
      const tokens = state.tokens;
      for (let i = 2; i < tokens.length; i++) {
        const inline = tokens[i];
        if (inline.type !== 'inline' || tokens[i - 2].type !== 'list_item_open') continue;
        const first = inline.children?.[0];
        const match = first?.type === 'text' ? TASK.exec(first.content) : null;
        if (!first || !match) continue;
        first.content = first.content.slice(match[0].length);
        const box = new state.Token('html_inline', '', 0);
        // The item's text labels its checkbox, so it has an accessible name.
        box.content = `<label><input type="checkbox" disabled${match[1] === ' ' ? '' : ' checked'}> `;
        inline.children!.unshift(box);
        const close = new state.Token('html_inline', '', 0);
        close.content = '</label>';
        inline.children!.push(close);
        tokens[i - 2].attrJoin('class', 'task');
      }
    });

    // Formulas paint as their source first and are typeset once the maths
    // renderer has loaded; it only loads for a document that has maths.
    const formula = (tex: string, display: boolean, line?: string | number | null) => {
      const key = (display ? 'D' : 'I') + tex;
      const cached = this.formulas.get(key);
      const tag = display ? 'div' : 'span';
      return (
        `<${tag} class="math${display ? ' math-display' : ''}${cached ? '' : ' math-pending'}"` +
        `${line ? ` data-line="${line}"` : ''} data-key="${escapeHtml(key)}">${cached ?? escapeHtml(tex)}</${tag}>`
      );
    };
    md.renderer.rules.math_inline = (tokens, idx) =>
      formula(tokens[idx].content, Boolean(tokens[idx].meta?.display));
    md.renderer.rules.math_block = (tokens, idx) =>
      formula(tokens[idx].content, true, tokens[idx].attrGet('data-line'));

    const fence = md.renderer.rules.fence!;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (isMathFence(token.info)) return formula(token.content.trim(), true, token.attrGet('data-line'));
      if (token.info.trim().split(/\s+/)[0] !== 'mermaid') return fence(tokens, idx, options, env, self);
      const line = token.attrGet('data-line');
      const counter = env as { md2pdfDiagrams?: number };
      const index = (counter.md2pdfDiagrams = (counter.md2pdfDiagrams ?? -1) + 1);
      return (
        `<figure class="diagram"${line ? ` data-line="${line}"` : ''} data-index="${index}"` +
        ` data-code="${escapeHtml(token.content)}">${this.figureContent(token.content, index)}</figure>`
      );
    };

    md.renderer.rules.image = (tokens, idx) => {
      const token = tokens[idx];
      const src = String(token.attrGet('src') ?? '');
      const alt = escapeHtml(token.content);
      const url = this.resolveImage(src);
      if (url) return `<img src="${escapeHtml(url)}" alt="${alt}">`;
      const name = token.content || src;
      const reason = /^https?:/i.test(src) ? t('remoteImage', { name }) : t('missingImage', { name });
      return `<span class="missing-image" title="${escapeHtml(src)}">${escapeHtml(reason)}</span>`;
    };

    // The preview must not navigate away from an unsaved document.
    const linkOpen =
      md.renderer.rules.link_open ?? ((t, i, o, _e, self) => self.renderToken(t, i, o));
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
      return linkOpen(tokens, idx, options, env, self);
    };
  }

  private resolveImage(src: string): string | null {
    if (/^data:image\//i.test(src)) return src;
    const local = findImage(this.images, src);
    if (!local) return null;
    let url = this.blobUrls.get(local);
    if (!url) {
      url = URL.createObjectURL(new Blob([local.bytes.slice().buffer as ArrayBuffer], { type: local.mime }));
      this.blobUrls.set(local, url);
    }
    return url;
  }

  private tableOfContents(tokens: Token[], title: string): string {
    const items: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type !== 'heading_open') continue;
      const depth = Number(token.tag.slice(1));
      if (depth > 3) continue;
      const text = escapeHtml(tokens[i + 1]?.content ?? '');
      items.push(`<li style="--depth:${depth - 1}">${text}</li>`);
    }
    return items.length ? `<nav class="toc"><p>${escapeHtml(title)}</p><ul>${items.join('')}</ul></nav>` : '';
  }

  /** Forget diagrams no longer in the document, so typing does not accumulate them. */
  private pruneDiagrams(tokens: Token[]): void {
    const fences = tokens.filter(t => t.type === 'fence' && t.info.trim().split(/\s+/)[0] === 'mermaid');
    const live = new Set(fences.map(t => t.content));
    for (const code of this.diagrams.keys()) if (!live.has(code)) this.diagrams.delete(code);
    this.lastGood.length = Math.min(this.lastGood.length, fences.length);
  }

  /**
   * What a diagram's figure shows. While a source is being edited there is no
   * render for it yet, or only an error; the last version that rendered at
   * this position stays on screen meanwhile, so typing never flashes a
   * placeholder, and an error is shown on top of it rather than instead.
   */
  private figureContent(code: string, index: number): string {
    const entry = this.diagrams.get(code);
    if (entry?.svg) {
      this.lastGood[index] = { code, svg: entry.svg };
      return entry.svg + (entry.actions ?? '');
    }
    const good = this.lastGood[index];
    const stale = good && similar(good.code, code) ? good.svg : null;
    if (!entry) {
      return stale
        ? `<div class="diagram-stale updating">${stale}</div>`
        : `<span class="diagram-pending">${escapeHtml(t('diagramPending'))}</span>`;
    }
    // Only fade an error in the first time, not on every keystroke after.
    const fresh = Date.now() - (entry.shownAt ??= Date.now()) < 800 ? ' fresh' : '';
    return stale
      ? `<div class="diagram-stale" title="${escapeHtml(t('diagramStale'))}">${stale}</div>` +
          entry.error!.replace('class="diagram-error"', `class="diagram-error badge${fresh}" title="${escapeHtml(t('diagramStale'))}"`)
      : entry.error!.replace('class="diagram-error"', `class="diagram-error${fresh}"`);
  }

  /**
   * Mermaid is heavy (hundreds of KB) and async, so diagrams fill in after the
   * text, and only once they come near the visible part of the preview. On a
   * phone the preview starts below the editor, so a visitor who never scrolls
   * to a diagram never downloads Mermaid at all.
   */
  private renderDiagrams(generation: number): void {
    this.observer?.disconnect();
    const figures = [...this.root.querySelectorAll<HTMLElement>('figure.diagram[data-code]')].filter(
      figure => this.needsRender(figure.dataset.code ?? ''),
    );
    if (!figures.length) return;
    if (typeof IntersectionObserver === 'undefined') {
      for (const figure of figures) this.queueDiagram(figure, generation);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          this.queueDiagram(entry.target as HTMLElement, generation);
        }
      },
      // Start a screen early, so a diagram is usually ready by the time it scrolls in.
      { root: this.root.closest('.scroller'), rootMargin: '800px 0px' },
    );
    for (const figure of figures) observer.observe(figure);
    this.observer = observer;
  }

  /**
   * Typeset the formulas still showing their source. The renderer (Temml,
   * about 40 KB) is fetched when the first formula comes near the visible part
   * of the preview, and never for a document without maths.
   */
  private renderMath(generation: number): void {
    this.mathObserver?.disconnect();
    const all = [...this.root.querySelectorAll<HTMLElement>('.math[data-key]')];
    this.hasMath = all.length > 0;
    const live = new Set(all.map(el => el.dataset.key!));
    for (const key of this.formulas.keys()) if (!live.has(key)) this.formulas.delete(key);
    const pending = all.filter(el => el.classList.contains('math-pending'));
    if (!pending.length) return;

    const run = () =>
      import('./math-render').then(({ renderFormula }) => {
        if (generation !== this.generation) return;
        for (const el of pending) {
          const key = el.dataset.key!;
          let html = this.formulas.get(key);
          if (html === undefined) {
            html = renderFormula(key.slice(1), key[0] === 'D', detail => t('mathError', { detail }));
            this.formulas.set(key, html);
          }
          el.innerHTML = html;
          el.classList.remove('math-pending');
        }
      });
    if (typeof IntersectionObserver === 'undefined') {
      void run();
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        void run();
      },
      { root: this.root.closest('.scroller'), rootMargin: '400px 0px' },
    );
    for (const el of pending) observer.observe(el);
    this.mathObserver = observer;
  }

  /** One diagram at a time: Mermaid's renderer does not like concurrent calls. */
  private queueDiagram(figure: HTMLElement, generation: number): void {
    this.diagramQueue = this.diagramQueue.then(async () => {
      // A newer render has replaced the DOM and set up its own observer.
      if (generation !== this.generation) return;
      const code = figure.dataset.code ?? '';
      const family = this.fonts ? diagramFontFamily(this.fonts, code) : undefined;
      const index = Number(figure.dataset.index);
      if (!this.needsRender(code, family)) {
        const html = this.figureContent(code, index);
        if (figure.innerHTML !== html) figure.innerHTML = html;
        return;
      }
      let entry: DiagramEntry;
      try {
        const diagram = await renderDiagram(code, {
          fontFamily: family,
          facesComplete: this.facesComplete,
          final: this.facesComplete,
        });
        const markup = await import('../diagram/figure');
        entry = { svg: diagram.svg, actions: markup.diagramActions(), family: family ?? '', provisional: diagram.provisional };
      } catch (error) {
        const markup = await import('../diagram/figure').catch(() => null);
        const failure = error as DiagramFailure;
        const html = markup?.errorBox(failure) ?? `<span class="diagram-error">${escapeHtml(t('diagramError', { detail: failure.message }))}</span>`;
        entry = { error: html, family: family ?? '', provisional: false };
      }
      this.diagrams.set(code, entry);
      if (generation === this.generation) figure.innerHTML = this.figureContent(code, index);
    });
  }

  /**
   * A cached diagram is stale when its labels were measured with a different
   * face than the document now needs, or before the real faces had loaded.
   */
  private needsRender(code: string, family = this.fonts ? diagramFontFamily(this.fonts, code) : undefined): boolean {
    const cached = this.diagrams.get(code);
    return !cached || cached.family !== (family ?? '') || (cached.provisional && this.facesComplete);
  }
}

interface DiagramEntry {
  svg?: string;
  /** The export buttons shown with the SVG. */
  actions?: string;
  /** The error box, when Mermaid rejected the source. */
  error?: string;
  family: string;
  provisional: boolean;
  /** When the error was first on screen. */
  shownAt?: number;
}

/** Two versions of one diagram mid-edit share most of their start and end. */
function similar(a: string, b: string): boolean {
  let start = 0;
  while (start < a.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
  return start + end >= Math.min(a.length, b.length) * 0.5;
}
