/**
 * Find-in-document over the PDF's text.
 *
 * Text content is read from the document (not from the Markdown), so a hit
 * always corresponds to something actually on the page. Matches are painted
 * with the CSS Custom Highlight API, which leaves the text layer's DOM intact
 * and so does not disturb selection.
 */
import type { PdfDocument } from './pdfjs';

export interface SearchHit {
  page: number;
  /** Offset into that page's normalised text. */
  start: number;
  length: number;
}

const HIGHLIGHT_NAME = 'md2pdf-find';
const ACTIVE_HIGHLIGHT_NAME = 'md2pdf-find-active';

const supportsHighlights = () =>
  typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

/**
 * Collapse whitespace so a query spanning a line break still matches, while
 * recording where each surviving character came from.
 *
 * The map is what makes highlighting correct: matches are found in normalised
 * text, but the DOM Ranges that paint them need offsets into the text layer's
 * raw text, and collapsing whitespace shifts everything after it.
 */
function normalize(value: string): { text: string; map: number[] } {
  let text = '';
  const map: number[] = [];
  let pendingSpace = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]!;
    if (/\s/.test(ch)) {
      pendingSpace = text.length > 0;
      continue;
    }
    if (pendingSpace) {
      text += ' ';
      map.push(i);
      pendingSpace = false;
    }
    text += ch;
    map.push(i);
  }
  return { text, map };
}

interface PageIndex {
  /** Raw concatenation of the page's text items. */
  raw: string;
  /** Whitespace-collapsed text, which is what queries run against. */
  text: string;
  /** For each character of `text`, its offset in `raw`. */
  map: number[];
}

export class DocumentSearch {
  private pages = new Map<number, PageIndex>();
  private hits: SearchHit[] = [];
  private activeIndex = -1;
  private query = '';
  private token = 0;

  constructor(private readonly doc: PdfDocument) {}

  get matches(): SearchHit[] {
    return this.hits;
  }

  get current(): number {
    return this.activeIndex;
  }

  async run(query: string): Promise<SearchHit[]> {
    const token = ++this.token;
    this.query = query;
    this.hits = [];
    this.activeIndex = -1;
    if (query.trim() === '') {
      this.clearHighlights();
      return [];
    }

    const needle = normalize(query).text.toLowerCase();
    if (needle === '') {
      this.clearHighlights();
      return [];
    }
    for (let page = 1; page <= this.doc.numPages; page++) {
      const index = await this.indexOf(page);
      if (token !== this.token) return [];
      const haystack = index.text.toLowerCase();
      let from = 0;
      for (;;) {
        const at = haystack.indexOf(needle, from);
        if (at === -1) break;
        this.hits.push({ page, start: at, length: needle.length });
        from = at + needle.length;
      }
    }
    if (this.hits.length) this.activeIndex = 0;
    return this.hits;
  }

  private async indexOf(page: number): Promise<PageIndex> {
    const cached = this.pages.get(page);
    if (cached) return cached;
    const content = await (await this.doc.getPage(page)).getTextContent();
    const raw = content.items.map(item => ('str' in item ? item.str : '')).join('');
    const { text, map } = normalize(raw);
    const index: PageIndex = { raw, text, map };
    this.pages.set(page, index);
    return index;
  }

  step(delta: number): SearchHit | null {
    if (!this.hits.length) return null;
    this.activeIndex = (this.activeIndex + delta + this.hits.length) % this.hits.length;
    return this.hits[this.activeIndex] ?? null;
  }

  get active(): SearchHit | null {
    return this.hits[this.activeIndex] ?? null;
  }

  /**
   * Paint the hits that fall on a rendered page. Pages that are not currently
   * rasterised have no text layer, and are simply skipped until they are.
   */
  paint(pageNumber: number, textLayer: HTMLElement): void {
    if (!supportsHighlights() || this.query.trim() === '') return;

    const ranges: Range[] = [];
    const activeRanges: Range[] = [];
    const pageHits = this.hits.filter(hit => hit.page === pageNumber);
    if (!pageHits.length) return;

    const index = this.pages.get(pageNumber);
    if (!index) return;

    const { nodes, text } = flatten(textLayer);
    // Offsets are only meaningful if the layer holds exactly the text the index
    // was built from. Both come from the same items, but a mismatch here would
    // paint highlights over the wrong words, so bail instead.
    if (text !== index.raw) return;

    for (const hit of pageHits) {
      const from = index.map[hit.start];
      const to = index.map[hit.start + hit.length - 1];
      if (from === undefined || to === undefined) continue;
      const range = rangeFor(nodes, from, to + 1 - from);
      if (!range) continue;
      (this.active === hit ? activeRanges : ranges).push(range);
    }
    mergeHighlight(HIGHLIGHT_NAME, ranges);
    mergeHighlight(ACTIVE_HIGHLIGHT_NAME, activeRanges);
  }

  clearHighlights(): void {
    if (!supportsHighlights()) return;
    CSS.highlights.delete(HIGHLIGHT_NAME);
    CSS.highlights.delete(ACTIVE_HIGHLIGHT_NAME);
  }
}

interface FlatNode {
  node: Text;
  start: number;
  end: number;
}

/** Every text node in the layer, with its offset into the concatenated text. */
function flatten(root: HTMLElement): { nodes: FlatNode[]; text: string } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: FlatNode[] = [];
  let text = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue ?? '';
    nodes.push({ node: node as Text, start: text.length, end: text.length + value.length });
    text += value;
  }
  return { nodes, text };
}

function rangeFor(nodes: FlatNode[], start: number, length: number): Range | null {
  const end = start + length;
  const from = nodes.find(entry => start >= entry.start && start < entry.end);
  const to = nodes.find(entry => end > entry.start && end <= entry.end);
  if (!from || !to) return null;
  const range = document.createRange();
  range.setStart(from.node, start - from.start);
  range.setEnd(to.node, end - to.start);
  return range;
}

function mergeHighlight(name: string, ranges: Range[]): void {
  const existing = CSS.highlights.get(name);
  if (existing) {
    for (const range of ranges) existing.add(range);
    return;
  }
  if (ranges.length) CSS.highlights.set(name, new Highlight(...ranges));
}
