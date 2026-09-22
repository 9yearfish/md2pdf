/**
 * Paginated PDF viewer.
 *
 * Renders the exact bytes the download button hands over, so what is on screen
 * and what lands on disk cannot drift apart.
 *
 * Only pages near the viewport are rasterised; the rest are placeholders of the
 * correct size, which keeps scrolling honest without holding a canvas per page.
 */
import { loadPdfjs, openDocument, type PdfDocument, type PdfPage } from './pdfjs';

export type ZoomMode = 'fit-width' | 'fit-page' | number;

/** Pages this far outside the viewport are rendered ahead of being scrolled to. */
const PRERENDER_MARGIN_PX = 800;
/** Canvases kept alive at once; beyond this the furthest are released. */
const MAX_LIVE_CANVASES = 8;
const PAGE_GAP_PX = 16;

interface PageSlot {
  number: number;
  element: HTMLDivElement;
  canvas: HTMLCanvasElement | null;
  textLayer: HTMLDivElement | null;
  /** Unscaled dimensions in CSS pixels at scale 1. */
  baseWidth: number;
  baseHeight: number;
  renderTask: { cancel(): void } | null;
  rendered: boolean;
  /** Monotonic counter used to evict the least recently visible pages. */
  lastSeen: number;
}

export interface ViewerEvents {
  onPageChange?: (page: number, total: number) => void;
  onZoomChange?: (percent: number) => void;
  /** Fires when a page's text layer lands, so find-in-page can paint it. */
  onTextLayerReady?: (page: number, textLayer: HTMLElement) => void;
}

export class PdfViewer {
  private doc: PdfDocument | null = null;
  private slots: PageSlot[] = [];
  private zoom: ZoomMode = 'fit-width';
  private scale = 1;
  private observer: IntersectionObserver | null = null;
  private clock = 0;
  private currentPage = 1;
  private resizeObserver: ResizeObserver;
  /** Guards against an older document finishing its load after a newer one. */
  private generation = 0;

  constructor(
    private readonly scroller: HTMLElement,
    private readonly pageList: HTMLElement,
    private readonly events: ViewerEvents = {},
  ) {
    this.resizeObserver = new ResizeObserver(() => this.relayout());
    this.resizeObserver.observe(this.scroller);
    this.scroller.addEventListener('scroll', () => this.updateCurrentPage(), { passive: true });
  }

  get pageCount(): number {
    return this.slots.length;
  }

  get page(): number {
    return this.currentPage;
  }

  get document(): PdfDocument | null {
    return this.doc;
  }

  async load(bytes: Uint8Array): Promise<void> {
    const generation = ++this.generation;
    // Keep the reading position across a re-render of an edited document.
    const previous = this.captureScrollAnchor();

    const doc = await openDocument(bytes);
    if (generation !== this.generation) {
      // Releasing the worker's document goes through the loading task.
      void doc.loadingTask.destroy();
      return;
    }

    this.teardown();
    this.doc = doc;

    const first = await doc.getPage(1);
    if (generation !== this.generation) return;
    const baseViewport = first.getViewport({ scale: 1 });

    this.slots = [];
    const fragment = document.createDocumentFragment();
    for (let number = 1; number <= doc.numPages; number++) {
      const element = document.createElement('div');
      element.className = 'page';
      element.dataset.page = String(number);
      const slot: PageSlot = {
        number,
        element,
        canvas: null,
        textLayer: null,
        baseWidth: baseViewport.width,
        baseHeight: baseViewport.height,
        renderTask: null,
        rendered: false,
        lastSeen: 0,
      };
      this.slots.push(slot);
      fragment.append(element);
    }
    this.pageList.replaceChildren(fragment);

    // Pages can differ in size; correct the placeholders once measured.
    void this.measurePages(generation);

    this.applyScale();
    this.observePages();
    this.restoreScrollAnchor(previous);

    // Force an emit: updateCurrentPage only reports changes, and a fresh
    // document that opens on page 1 is not a change from the initial state.
    this.currentPage = 0;
    this.updateCurrentPage();
  }

  /** Page sizes beyond the first are only known after loading them. */
  private async measurePages(generation: number): Promise<void> {
    for (const slot of this.slots.slice(1)) {
      if (generation !== this.generation || !this.doc) return;
      try {
        const page = await this.doc.getPage(slot.number);
        const viewport = page.getViewport({ scale: 1 });
        if (viewport.width !== slot.baseWidth || viewport.height !== slot.baseHeight) {
          slot.baseWidth = viewport.width;
          slot.baseHeight = viewport.height;
          this.sizeSlot(slot);
        }
      } catch {
        // Leave the placeholder at the first page's size.
      }
    }
  }

  setZoom(zoom: ZoomMode): void {
    this.zoom = zoom;
    this.relayout();
  }

  zoomBy(factor: number): void {
    this.setZoom(Math.min(4, Math.max(0.25, this.scale * factor)));
  }

  private relayout(): void {
    if (!this.slots.length) return;
    const anchor = this.captureScrollAnchor();
    this.applyScale();
    this.invalidateRendered();
    this.restoreScrollAnchor(anchor);
  }

  private applyScale(): void {
    const first = this.slots[0];
    if (!first) return;

    // Leave room for the page's own padding and the scrollbar.
    const availableWidth = this.scroller.clientWidth - 48;
    const availableHeight = this.scroller.clientHeight - 48;

    if (this.zoom === 'fit-width') this.scale = availableWidth / first.baseWidth;
    else if (this.zoom === 'fit-page') {
      this.scale = Math.min(availableWidth / first.baseWidth, availableHeight / first.baseHeight);
    } else this.scale = this.zoom;

    this.scale = Math.min(4, Math.max(0.1, this.scale));
    for (const slot of this.slots) this.sizeSlot(slot);
    this.events.onZoomChange?.(Math.round(this.scale * 100));
  }

  private sizeSlot(slot: PageSlot): void {
    slot.element.style.width = `${Math.round(slot.baseWidth * this.scale)}px`;
    slot.element.style.height = `${Math.round(slot.baseHeight * this.scale)}px`;
  }

  private invalidateRendered(): void {
    for (const slot of this.slots) this.releaseSlot(slot);
    this.renderVisible();
  }

  private observePages(): void {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const slot = this.slots[Number((entry.target as HTMLElement).dataset.page) - 1];
          if (!slot) continue;
          if (entry.isIntersecting) {
            slot.lastSeen = ++this.clock;
            void this.renderSlot(slot);
          }
        }
        this.evictDistantPages();
      },
      { root: this.scroller, rootMargin: `${PRERENDER_MARGIN_PX}px 0px` },
    );
    for (const slot of this.slots) this.observer.observe(slot.element);
  }

  private renderVisible(): void {
    // Re-observing forces fresh intersection callbacks after a layout change.
    this.observePages();
  }

  private async renderSlot(slot: PageSlot): Promise<void> {
    if (!this.doc || slot.rendered || slot.renderTask) return;
    const generation = this.generation;
    const scale = this.scale;

    let page: PdfPage;
    try {
      page = await this.doc.getPage(slot.number);
    } catch {
      return;
    }
    if (generation !== this.generation || scale !== this.scale) return;

    const viewport = page.getViewport({ scale });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(ratio, ratio);

    const task = page.render({ canvas, canvasContext: context, viewport } as never);
    slot.renderTask = task;
    try {
      await task.promise;
    } catch {
      slot.renderTask = null;
      return; // cancelled, or the document changed underneath
    }
    slot.renderTask = null;
    if (generation !== this.generation || scale !== this.scale) return;

    slot.canvas = canvas;
    slot.rendered = true;
    slot.element.replaceChildren(canvas);

    await this.addTextLayer(slot, page, viewport, generation, scale);
  }

  /**
   * The text layer is what makes preview text selectable and searchable. It is
   * transparent and sits exactly on top of the rasterised page.
   */
  private async addTextLayer(
    slot: PageSlot,
    page: PdfPage,
    viewport: { width: number; height: number },
    generation: number,
    scale: number,
  ): Promise<void> {
    try {
      const pdfjs = await loadPdfjs();
      if (generation !== this.generation || scale !== this.scale) return;

      const container = document.createElement('div');
      container.className = 'text-layer';
      container.style.width = `${Math.floor(viewport.width)}px`;
      container.style.height = `${Math.floor(viewport.height)}px`;

      const layer = new pdfjs.TextLayer({
        textContentSource: page.streamTextContent(),
        container,
        viewport: viewport as never,
      });
      await layer.render();
      if (generation !== this.generation || scale !== this.scale) return;

      slot.textLayer = container;
      slot.element.append(container);
      this.events.onTextLayerReady?.(slot.number, container);
    } catch {
      // Selection is a bonus; a failure here must not blank the page.
    }
  }

  private releaseSlot(slot: PageSlot): void {
    slot.renderTask?.cancel();
    slot.renderTask = null;
    if (slot.canvas) {
      // Zeroing the canvas releases its backing store immediately rather than
      // waiting for the collector, which matters on long documents.
      slot.canvas.width = 0;
      slot.canvas.height = 0;
    }
    slot.canvas = null;
    slot.textLayer = null;
    slot.rendered = false;
    slot.element.replaceChildren();
  }

  private evictDistantPages(): void {
    const live = this.slots.filter(slot => slot.rendered);
    if (live.length <= MAX_LIVE_CANVASES) return;
    live
      .sort((a, b) => a.lastSeen - b.lastSeen)
      .slice(0, live.length - MAX_LIVE_CANVASES)
      .forEach(slot => this.releaseSlot(slot));
  }

  private updateCurrentPage(): void {
    if (!this.slots.length) return;
    const mid = this.scroller.scrollTop + this.scroller.clientHeight / 2;
    let page = 1;
    for (const slot of this.slots) {
      if (slot.element.offsetTop <= mid) page = slot.number;
      else break;
    }
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.events.onPageChange?.(page, this.slots.length);
    }
  }

  /** Visit the text layers currently alive, e.g. to repaint search hits. */
  forEachTextLayer(visit: (page: number, textLayer: HTMLElement) => void): void {
    for (const slot of this.slots) {
      if (slot.textLayer) visit(slot.number, slot.textLayer);
    }
  }

  scrollToPage(number: number): void {
    const slot = this.slots[Math.min(Math.max(number, 1), this.slots.length) - 1];
    if (!slot) return;
    this.scroller.scrollTo({ top: slot.element.offsetTop - PAGE_GAP_PX, behavior: 'smooth' });
  }

  /** Remember position as a page plus a fraction into it, so zoom keeps place. */
  private captureScrollAnchor(): { page: number; fraction: number } | null {
    const slot = this.slots[this.currentPage - 1];
    if (!slot || !slot.element.offsetHeight) return null;
    const offset = this.scroller.scrollTop - slot.element.offsetTop;
    return { page: this.currentPage, fraction: offset / slot.element.offsetHeight };
  }

  private restoreScrollAnchor(anchor: { page: number; fraction: number } | null): void {
    if (!anchor) return;
    const slot = this.slots[anchor.page - 1];
    if (!slot) return;
    this.scroller.scrollTop = slot.element.offsetTop + anchor.fraction * slot.element.offsetHeight;
  }

  private teardown(): void {
    this.observer?.disconnect();
    this.observer = null;
    for (const slot of this.slots) this.releaseSlot(slot);
    this.slots = [];
    if (this.doc) void this.doc.loadingTask.destroy();
    this.doc = null;
  }

  destroy(): void {
    this.generation++;
    this.resizeObserver.disconnect();
    this.teardown();
  }
}
