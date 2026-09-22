import './styles.css';
import { convert } from './convert/pipeline';
import { DEFAULT_OPTIONS, type DocumentOptions, type PaperSize } from './convert/preamble';
import { compileToPdf, prewarm, TypstCompileError, type EngineProgress } from './typst/engine';
import { isEngineCached } from './typst/wasm-loader';
import { isSupportedImage, readImageFile, type LocalImage } from './convert/images';
import { PdfViewer, type ZoomMode } from './preview/viewer';
import { DocumentSearch } from './preview/search';
import { extractOutline } from './preview/outline';
import { SAMPLE_DOCUMENT } from './sample';
import { createEditor, type Editor } from './ui/editor';

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
};

const editorPane = el<HTMLElement>('editor-pane');
const textarea = el<HTMLTextAreaElement>('editor');
/** Backed by the textarea until CodeMirror has loaded and taken over. */
let doc: Editor;
const convertButton = el<HTMLButtonElement>('convert');
const downloadButton = el<HTMLButtonElement>('download');
const overlay = el<HTMLDivElement>('overlay');
const overlayTitle = el<HTMLParagraphElement>('overlay-title');
const overlayDetail = el<HTMLParagraphElement>('overlay-detail');
const progress = overlay.querySelector<HTMLDivElement>('.progress')!;
const progressBar = el<HTMLDivElement>('progress-bar');
const warnings = el<HTMLDivElement>('warnings');
const pageReadout = el<HTMLSpanElement>('page-readout');
const zoomLevel = el<HTMLSpanElement>('zoom-level');
const outlinePanel = el<HTMLElement>('outline');
const searchBar = el<HTMLDivElement>('search-bar');
const searchInput = el<HTMLInputElement>('search-input');
const searchCount = el<HTMLSpanElement>('search-count');
const dropHint = el<HTMLDivElement>('drop-hint');
const settingsPanel = el<HTMLDivElement>('settings');

/** Local images the document refers to, keyed by file name. */
const images = new Map<string, LocalImage>();

let options: DocumentOptions = { ...DEFAULT_OPTIONS };
let currentPdf: Uint8Array | null = null;
let search: DocumentSearch | null = null;
let converting = false;
/** The editor content the current PDF was built from. */
let renderedSource: string | null = null;

const viewer = new PdfViewer(el('scroller'), el('pages'), {
  onPageChange: (page, total) => {
    pageReadout.textContent = `${page} / ${total}`;
  },
  onZoomChange: percent => {
    zoomLevel.textContent = `${percent}%`;
  },
  onTextLayerReady: (page, layer) => search?.paint(page, layer),
});

/* ---------- status ---------- */

function showStatus(title: string, detail = '', percent: number | null = null): void {
  overlayTitle.textContent = title;
  overlayDetail.textContent = detail;
  overlayDetail.classList.remove('error');
  progress.hidden = percent === null;
  if (percent !== null) progressBar.style.width = `${Math.round(percent * 100)}%`;
  overlay.hidden = false;
}

function showError(title: string, detail: string): void {
  overlayTitle.textContent = title;
  overlayDetail.textContent = detail;
  overlayDetail.classList.add('error');
  progress.hidden = true;
  overlay.hidden = false;
}

function hideStatus(): void {
  overlay.hidden = true;
}

function showWarnings(messages: string[]): void {
  if (!messages.length) {
    warnings.hidden = true;
    warnings.replaceChildren();
    return;
  }
  const heading = document.createElement('strong');
  heading.textContent = `${messages.length} 个提示`;
  const list = document.createElement('ul');
  for (const message of messages) {
    const item = document.createElement('li');
    item.textContent = message;
    list.append(item);
  }
  warnings.replaceChildren(heading, list);
  warnings.hidden = false;
}

const mb = (bytes: number) => (bytes / 1_048_576).toFixed(1);

function describeProgress(progress: EngineProgress): { title: string; detail: string; percent: number } {
  switch (progress.stage) {
    case 'downloading-engine': {
      const ratio = progress.total ? Math.min(1, progress.loaded / progress.total) : 0;
      return {
        title: '正在下载排版引擎…',
        detail: `${mb(progress.loaded)} / ${mb(progress.total)} MB · 仅首次需要，之后可离线使用`,
        // The download is the bulk of the wait, so let it own most of the bar.
        percent: 0.1 + ratio * 0.6,
      };
    }
    case 'starting-engine':
      return { title: '正在启动排版引擎…', detail: '', percent: 0.72 };
    case 'loading-fonts':
      return { title: '正在加载字体…', detail: '', percent: 0.78 };
    case 'compiling':
      return { title: '正在排版…', detail: '', percent: 0.85 };
  }
}

/* ---------- conversion ---------- */

async function runConversion(): Promise<void> {
  if (converting) return;
  converting = true;
  convertButton.disabled = true;

  const source = doc.getValue();
  try {
    showStatus('正在解析 Markdown…', '', 0.08);
    const result = await convert(source, options, images);

    const outcome = await compileToPdf(result, progress => {
      const { title, detail, percent } = describeProgress(progress);
      showStatus(title, detail, percent);
    });

    currentPdf = outcome.pdf;
    renderedSource = source;
    downloadButton.disabled = false;

    showStatus('正在渲染预览…', '', 0.92);
    await viewer.load(outcome.pdf);
    await refreshOutline();
    resetSearch();

    const notes = [...result.warnings];
    if (outcome.fonts.missing.length) {
      notes.push(
        `以下字符不在字体覆盖范围内，可能无法显示：${outcome.fonts.missing.slice(0, 20).join(' ')}`,
      );
    }
    showWarnings(notes);
    hideStatus();
    enableViewerControls(true);
  } catch (error) {
    const detail =
      error instanceof TypstCompileError
        ? error.diagnostics.slice(0, 6).join('\n')
        : error instanceof Error
          ? error.message
          : String(error);
    showError('转换失败', detail);
  } finally {
    converting = false;
    convertButton.disabled = false;
    updateDirtyState();
  }
}

function updateDirtyState(): void {
  const dirty = renderedSource !== null && renderedSource !== doc.getValue();
  convertButton.textContent = dirty || renderedSource === null ? '生成 PDF' : '已是最新';
  convertButton.classList.toggle('primary', dirty || renderedSource === null);
}

/* ---------- download ---------- */

function downloadPdf(): void {
  if (!currentPdf) return;
  // Copy into a fresh buffer: this is the same data the viewer holds, and a
  // Blob must not alias memory the viewer may still be reading.
  const blob = new Blob([currentPdf.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedFileName();
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function suggestedFileName(): string {
  const heading = /^#\s+(.+)$/m.exec(doc.getValue())?.[1]?.trim();
  const base = (heading || 'document').replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
  return `${base || 'document'}.pdf`;
}

/* ---------- outline ---------- */

async function refreshOutline(): Promise<void> {
  const doc = viewer.document;
  if (!doc) return;
  const entries = await extractOutline(doc);
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'outline-empty';
    empty.textContent = '此文档没有标题';
    outlinePanel.replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outline-item';
    button.textContent = entry.title;
    button.style.paddingLeft = `${12 + entry.depth * 14}px`;
    button.disabled = entry.page === null;
    if (entry.page !== null) {
      button.addEventListener('click', () => viewer.scrollToPage(entry.page!));
    }
    fragment.append(button);
  }
  outlinePanel.replaceChildren(fragment);
}

/* ---------- search ---------- */

function resetSearch(): void {
  search?.clearHighlights();
  search = viewer.document ? new DocumentSearch(viewer.document) : null;
  searchCount.textContent = '0/0';
  if (searchInput.value.trim() !== '') void runSearch();
}

async function runSearch(): Promise<void> {
  if (!search) return;
  const hits = await search.run(searchInput.value);
  searchCount.textContent = `${hits.length ? 1 : 0}/${hits.length}`;
  search.clearHighlights();
  if (!hits.length) return;
  const first = search.active;
  if (first) viewer.scrollToPage(first.page);
  repaintSearch();
}

function repaintSearch(): void {
  if (!search) return;
  search.clearHighlights();
  viewer.forEachTextLayer((page, layer) => search!.paint(page, layer));
}

function stepSearch(delta: number): void {
  if (!search) return;
  const hit = search.step(delta);
  if (!hit) return;
  searchCount.textContent = `${search.current + 1}/${search.matches.length}`;
  viewer.scrollToPage(hit.page);
  repaintSearch();
}

function toggleSearch(show: boolean): void {
  searchBar.hidden = !show;
  if (show) searchInput.focus();
  else {
    searchInput.value = '';
    search?.clearHighlights();
    searchCount.textContent = '0/0';
  }
}

/* ---------- controls ---------- */

function enableViewerControls(enabled: boolean): void {
  for (const id of ['outline-toggle', 'search-toggle', 'zoom-in', 'zoom-out', 'zoom-mode']) {
    el<HTMLButtonElement>(id).disabled = !enabled;
  }
}

function bindControls(): void {
  convertButton.addEventListener('click', () => void runConversion());
  downloadButton.addEventListener('click', downloadPdf);

  el('settings-toggle').addEventListener('click', () => {
    settingsPanel.hidden = !settingsPanel.hidden;
  });

  el('outline-toggle').addEventListener('click', () => {
    outlinePanel.hidden = !outlinePanel.hidden;
  });

  el('search-toggle').addEventListener('click', () => toggleSearch(searchBar.hidden));
  el('search-close').addEventListener('click', () => toggleSearch(false));
  el('search-prev').addEventListener('click', () => stepSearch(-1));
  el('search-next').addEventListener('click', () => stepSearch(1));

  let searchTimer: number | undefined;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => void runSearch(), 200);
  });
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      stepSearch(event.shiftKey ? -1 : 1);
    } else if (event.key === 'Escape') {
      toggleSearch(false);
    }
  });

  el('zoom-in').addEventListener('click', () => viewer.zoomBy(1.25));
  el('zoom-out').addEventListener('click', () => viewer.zoomBy(0.8));
  el<HTMLSelectElement>('zoom-mode').addEventListener('change', event => {
    viewer.setZoom((event.target as HTMLSelectElement).value as ZoomMode);
  });

  bindSettings();
  bindKeyboard();
  bindDragAndDrop();
  bindDivider();
}

function bindSettings(): void {
  const paper = el<HTMLSelectElement>('opt-paper');
  const margin = el<HTMLInputElement>('opt-margin');
  const fontSize = el<HTMLInputElement>('opt-font-size');
  const lineHeight = el<HTMLInputElement>('opt-line-height');
  const pageNumbers = el<HTMLInputElement>('opt-page-numbers');
  const toc = el<HTMLInputElement>('opt-toc');
  const justify = el<HTMLInputElement>('opt-justify');

  paper.value = options.paper;
  margin.value = String(options.margin);
  fontSize.value = String(options.fontSize);
  lineHeight.value = String(options.lineHeight);
  pageNumbers.checked = options.pageNumbers;
  toc.checked = options.tableOfContents;
  justify.checked = options.justify;

  const sync = () => {
    options = {
      ...options,
      paper: paper.value as PaperSize,
      margin: clamp(Number(margin.value), 5, 50, DEFAULT_OPTIONS.margin),
      fontSize: clamp(Number(fontSize.value), 8, 18, DEFAULT_OPTIONS.fontSize),
      lineHeight: clamp(Number(lineHeight.value), 1, 2.4, DEFAULT_OPTIONS.lineHeight),
      pageNumbers: pageNumbers.checked,
      tableOfContents: toc.checked,
      justify: justify.checked,
    };
    // Settings change the output, so the current PDF is stale.
    renderedSource = null;
    updateDirtyState();
  };

  for (const input of [paper, margin, fontSize, lineHeight, pageNumbers, toc, justify]) {
    input.addEventListener('change', sync);
  }
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function bindKeyboard(): void {
  document.addEventListener('keydown', event => {
    const meta = event.ctrlKey || event.metaKey;

    if (meta && event.key === 'Enter') {
      event.preventDefault();
      void runConversion();
      return;
    }
    if (meta && event.key.toLowerCase() === 's') {
      event.preventDefault();
      downloadPdf();
      return;
    }
    if (meta && event.key.toLowerCase() === 'f' && currentPdf) {
      event.preventDefault();
      toggleSearch(true);
      return;
    }

    // Paging keys belong to the viewer, not the editor.
    if (doc.contains(document.activeElement) || document.activeElement === searchInput) return;
    if (event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey)) {
      event.preventDefault();
      viewer.scrollToPage(viewer.page + 1);
    } else if (event.key === 'PageUp' || (event.key === ' ' && event.shiftKey)) {
      event.preventDefault();
      viewer.scrollToPage(viewer.page - 1);
    } else if (meta && event.key === '0') {
      event.preventDefault();
      viewer.setZoom('fit-width');
    }
  });
}

function bindDragAndDrop(): void {
  let depth = 0;
  document.addEventListener('dragenter', event => {
    event.preventDefault();
    depth++;
    dropHint.hidden = false;
  });
  document.addEventListener('dragover', event => event.preventDefault());
  document.addEventListener('dragleave', () => {
    depth = Math.max(0, depth - 1);
    if (depth === 0) dropHint.hidden = true;
  });
  document.addEventListener('drop', event => {
    event.preventDefault();
    depth = 0;
    dropHint.hidden = true;
    void acceptFiles([...(event.dataTransfer?.files ?? [])]);
  });

  editorPane.addEventListener('paste', event => {
    const files = [...(event.clipboardData?.files ?? [])].filter(f => isSupportedImage(f.type));
    if (files.length) {
      event.preventDefault();
      void acceptFiles(files);
    }
  });
}

/** Markdown files replace the editor; images become embeddable assets. */
async function acceptFiles(files: File[]): Promise<void> {
  const notes: string[] = [];
  for (const file of files) {
    if (isSupportedImage(file.type)) {
      const image = await readImageFile(file);
      images.set(image.name, image);
      insertAtCursor(`\n![${file.name}](${file.name})\n`);
      notes.push(`已嵌入图片 ${file.name}`);
    } else if (/\.(md|markdown|txt)$/i.test(file.name) || file.type.startsWith('text/')) {
      doc.setValue(await file.text());
      renderedSource = null;
      notes.push(`已载入 ${file.name}`);
    } else {
      notes.push(`不支持的文件类型：${file.name}`);
    }
  }
  if (notes.length) showWarnings(notes);
  updateDirtyState();
  if (files.some(f => !isSupportedImage(f.type))) void runConversion();
}

function insertAtCursor(text: string): void {
  doc.insert(text);
  renderedSource = null;
}

function bindDivider(): void {
  const divider = el<HTMLDivElement>('divider');
  const pane = document.querySelector<HTMLElement>('.editor-pane')!;
  const narrow = () => window.matchMedia('(max-width: 860px)').matches;

  divider.addEventListener('pointerdown', event => {
    divider.setPointerCapture(event.pointerId);
    divider.classList.add('dragging');

    const move = (move: PointerEvent) => {
      const rect = document.querySelector<HTMLElement>('.split')!.getBoundingClientRect();
      const fraction = narrow()
        ? (move.clientY - rect.top) / rect.height
        : (move.clientX - rect.left) / rect.width;
      const clamped = Math.min(0.8, Math.max(0.15, fraction));
      pane.style.flexBasis = `${clamped * 100}%`;
    };
    const up = () => {
      divider.classList.remove('dragging');
      divider.removeEventListener('pointermove', move);
      divider.removeEventListener('pointerup', up);
    };
    divider.addEventListener('pointermove', move);
    divider.addEventListener('pointerup', up);
  });
}

/**
 * Say up front what the first conversion will cost. A 7 MB download is fine
 * when it is expected and one-time; it is not fine as a surprise.
 */
async function announceReadiness(): Promise<void> {
  const cached = await isEngineCached();
  showStatus(
    '点「生成 PDF」开始',
    cached
      ? '排版引擎已缓存在本机，无需再次下载。'
      : '首次转换需要下载约 7 MB 的排版引擎，之后可离线使用。',
  );
}

/* ---------- boot ---------- */

function boot(): void {
  textarea.value = SAMPLE_DOCUMENT;
  doc = {
    getValue: () => textarea.value,
    setValue: value => {
      textarea.value = value;
    },
    insert: () => {},
    focus: () => textarea.focus(),
    contains: node => node === textarea,
  };

  bindControls();
  updateDirtyState();
  void announceReadiness();

  // Upgrade the textarea in place; until this resolves the page is already usable.
  void createEditor(textarea, { onChange: updateDirtyState }).then(editor => {
    doc = editor;
  });
}

/**
 * Start fetching the engine when someone first touches the editor.
 *
 * Doing it on page load would spend 7 MB of a visitor's data before they have
 * shown any interest — someone who lands here, reads what the tool does and
 * leaves should cost nothing. Touching the editor is the point where a
 * conversion becomes likely, and it still buys the download a head start over
 * waiting for the button.
 */
function prewarmOnIntent(): void {
  const start = () => {
    editorPane.removeEventListener('focusin', start);
    editorPane.removeEventListener('pointerdown', start);
    editorPane.removeEventListener('keydown', start);
    prewarm();
  };
  editorPane.addEventListener('focusin', start, { once: false });
  editorPane.addEventListener('pointerdown', start, { once: false });
  editorPane.addEventListener('keydown', start, { once: false });
}

try {
  boot();
  prewarmOnIntent();
} catch (error) {
  // A failure here leaves a page that looks fine but does nothing, which is
  // the worst way to fail. Say so instead.
  showError('页面初始化失败', error instanceof Error ? error.message : String(error));
}
// Hold the engine and fonts across visits; they are several megabytes that
// never change. Failure here is not worth surfacing: it only costs a re-fetch.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
