// First, before anything that resolves URLs: see the file for why.
import './styles.css';
import { DEFAULT_OPTIONS, type DocumentOptions, type PaperSize } from './convert/preamble';
import type { EngineProgress } from './typst/engine';
import { isEngineCached, loadCompilerModule } from './typst/wasm-loader';
import { isSupportedImage, readImageFile, type LocalImage } from './convert/images';
import { HtmlPreview } from './preview/html';
import { detectLanguage, normalizeLang, SUPPORTED_LANGUAGES } from './convert/lang';
import { landing, lang, plural, rememberLanguage, sample, t } from './i18n/runtime';
import { createEditor, type Editor } from './ui/editor';
import { hideFrontMatter, layoutModule, loadLayout } from './layout/load';
import {
  Autosave,
  ImageStore,
  loadDraft,
  onDraftChangedElsewhere,
  type Draft,
  type ImageSyncResult,
  type SaveResult,
} from './ui/draft';

/**
 * The PDF side (the Typst emitter and the engine's JavaScript) is not needed
 * to paint the page or the preview, so it is its own chunk, fetched with the
 * background warm-up or the first download. A few KB off the first load.
 */
let pdfSide: Promise<[typeof import('./convert/pipeline'), typeof import('./typst/engine')]> | null = null;
let engineModule: typeof import('./typst/engine') | null = null;
function loadPdfSide() {
  pdfSide ??= Promise.all([import('./convert/pipeline'), import('./typst/engine')]).then(modules => {
    engineModule = modules[1];
    return modules;
  });
  return pdfSide;
}

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing element #${id}`);
  return node as T;
};

const editorPane = el<HTMLElement>('editor-pane');
const textarea = el<HTMLTextAreaElement>('editor');
/** Backed by the textarea until CodeMirror has loaded and taken over. */
let doc: Editor;
const downloadButton = el<HTMLButtonElement>('download');
const downloadLabel = el<HTMLSpanElement>('download-label');
const printButton = el<HTMLButtonElement>('print');
const printLabel = el<HTMLSpanElement>('print-label');
const scroller = el<HTMLDivElement>('scroller');
const warnings = el<HTMLDivElement>('warnings');
const stats = el<HTMLSpanElement>('stats');
const saveState = el<HTMLSpanElement>('save-state');
const paperHint = el<HTMLSpanElement>('paper-hint');
const engineStatus = el<HTMLSpanElement>('engine-status');
const engineText = el<HTMLSpanElement>('engine-text');
const dropHint = el<HTMLDivElement>('drop-hint');
const settingsPanel = el<HTMLDivElement>('settings');
const settingsToggle = el<HTMLButtonElement>('settings-toggle');
const previewPane = el<HTMLElement>('preview-pane');
const emptyState = el<HTMLDivElement>('empty-state');
const fileInput = el<HTMLInputElement>('file-input');

/** Motion is decoration; this turns every scripted animation off with the CSS ones. */
const still = matchMedia('(prefers-reduced-motion: reduce)');
/** The phone layout (styles.css): one pane at a time, actions in a bottom bar. */
const phone = matchMedia('(max-width: 760px)');

/** A one-off animation, unless the visitor has asked for less motion. */
function play(target: Element, frames: Keyframe[], options: KeyframeAnimationOptions): Animation | undefined {
  return still.matches || !target.animate ? undefined : target.animate(frames, options);
}

/** Local images the document refers to, keyed by file name. */
const images = new Map<string, LocalImage>();

let options: DocumentOptions = { ...DEFAULT_OPTIONS };
const preview = new HtmlPreview(el('paper'), images);

/** Read synchronously so a returning visitor's draft is what first paints. */
const draft = loadDraft();
const imageStore = new ImageStore(draft !== null);
const autosave = new Autosave(
  {
    snapshot: () => ({ text: doc.getValue(), options, images }),
    onSaved: showSaveResult,
    onImagesSaved: showImageSaveResult,
  },
  imageStore,
);
/** Set while the page itself replaces the text, so that is not taken for an edit. */
let replacing = false;

/** The last PDF built, and exactly what it was built from. */
let built: { key: string; pdf: Uint8Array } | null = null;
let exporting = false;
/** Whether the last build had something to say about the PDF (shown as a warning). */
let buildNoted = false;
/** Where export progress is written: the label of the button that started it. */
let progressLabel: HTMLElement = downloadLabel;

const PAPER_NAMES: Record<PaperSize, string> = {
  a4: 'A4',
  'us-letter': 'Letter',
  a5: 'A5',
  'iso-b5': 'B5',
};

/* ---------- preview ---------- */

let previewTimer: number | undefined;

/** Keystrokes arrive faster than anyone reads; render at most every 120 ms. */
function schedulePreview(): void {
  clearTimeout(previewTimer);
  previewTimer = window.setTimeout(renderPreview, 120);
}

function renderPreview(): void {
  const source = doc.getValue();
  const layout = layoutModule();
  if (layout) {
    // Front matter and the template, applied over the panel's settings.
    const resolved = layout.resolveDocument(source, options);
    applyOptions(resolved.options);
    preview.render(resolved.body, resolved.options, layout.previewLayout(resolved));
    layout.markOverrides(resolved, options);
    noteFrontMatter(layout.describeIssues(resolved.issues));
    showDetectedLanguage(resolved.body);
  } else {
    preview.render(hideFrontMatter(source), options);
    void loadLayout().then(renderPreview, () => {});
    // Front matter keys are not prose; they must not sway the detection.
    showDetectedLanguage(hideFrontMatter(source));
  }
  updateStats(source);
  scheduleWarmUp();
  pulseLive();
}

let frontMatterTimer: number | undefined;
let frontMatterShown = '';

/** Front matter problems, once typing has paused on them. */
function noteFrontMatter(messages: string[]): void {
  clearTimeout(frontMatterTimer);
  const key = messages.join('\n');
  if (!key || key === frontMatterShown) {
    frontMatterShown = key;
    return;
  }
  frontMatterTimer = window.setTimeout(() => {
    frontMatterShown = key;
    showWarnings(messages);
  }, 1500);
}

/** Han and kana count one per character; everything else, Hangul included, by word. */
const CHARACTER_SCRIPTS = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
const WORD = /[\p{L}\p{N}][\p{L}\p{M}\p{N}'’_-]*/gu;

const nativeName = (code: string) => SUPPORTED_LANGUAGES.find(l => l.value === code)?.name ?? code;

/** "Auto" names what it picked, so a wrong guess is visible and fixable. */
function showDetectedLanguage(source: string): void {
  const auto = el<HTMLSelectElement>('opt-lang').options[0];
  if (auto) auto.text = t('langAuto', { detected: nativeName(detectLanguage(source).code) });
}

let pulsedAt = 0;

/** The Live marker pulses once when the proof is re-set, at most every couple of seconds. */
function pulseLive(): void {
  const now = performance.now();
  if (now - pulsedAt < 2000) return;
  pulsedAt = now;
  const live = previewPane.querySelector('.live');
  if (live) play(live, [{ opacity: 0.5, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(3.2)' }], { duration: 900, easing: 'ease-out', pseudoElement: '::after' });
}

function updateStats(source: string): void {
  // An empty source says what to do next, in the pane itself.
  emptyState.hidden = source.trim() !== '';
  const characters = source.match(CHARACTER_SCRIPTS)?.length ?? 0;
  const words = source.replace(CHARACTER_SCRIPTS, ' ').match(WORD)?.length ?? 0;
  const lines = source.split('\n').length;
  const text = `${plural('words', characters + words)} · ${plural('lines', lines)}`;
  const grew = text.length !== stats.textContent?.length;
  stats.textContent = text;
  if (grew) fitSourceActions();
}

/**
 * Over the source pane the counts, Layout, New and Open share one line. When
 * they do not fit (a long language, a narrow window), New and Open drop their
 * labels rather than the counts being cut off.
 */
function fitSourceActions(): void {
  const row = stats.parentElement!;
  row.classList.remove('compact');
  if (stats.scrollWidth > stats.clientWidth) row.classList.add('compact');
}

/** `effective`: the options after the document's front matter, when known. */
function applyOptions(effective = options): void {
  preview.applyOptions(effective);
  paperHint.textContent = t('paperHint', { paper: PAPER_NAMES[effective.paper] });
}

let scrollFrame = 0;

/** Keep the preview on the part of the document being edited. */
function syncScroll(): void {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => preview.scrollToLine(doc.topLine(), scroller));
}

/* ---------- engine ---------- */

function setEngineState(state: 'idle' | 'loading' | 'ready' | 'error', text: string, fraction?: number): void {
  engineStatus.dataset.state = state;
  engineText.textContent = text;
  // Drives the progress line along the action row (styles.css, [data-engine]).
  const root = document.documentElement;
  root.dataset.engine = state;
  if (fraction !== undefined) root.style.setProperty('--engine-progress', String(fraction));
  else if (state === 'ready') root.style.setProperty('--engine-progress', '1');
}

/** Shared by the background warm-up and an explicit download. */
function onEngineProgress(progress: EngineProgress): void {
  switch (progress.stage) {
    case 'downloading-engine': {
      const pct = progress.total ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;
      setEngineState('loading', t('engineDownloading', { pct }), pct / 100);
      if (exporting) progressLabel.textContent = t('downloadEngine', { pct });
      break;
    }
    case 'starting-engine':
      setEngineState('loading', t('engineStarting'));
      if (exporting) progressLabel.textContent = t('downloadStarting');
      break;
    case 'loading-fonts':
      setEngineState('loading', t('engineFonts'));
      if (exporting) progressLabel.textContent = t('downloadFonts');
      break;
    case 'compiling':
      if (exporting) progressLabel.textContent = t('downloadTypesetting');
      break;
  }
}

let warmTimer: number | undefined;

/**
 * Build the compiler in the background once typing pauses, so a download only
 * has to typeset. Re-run after edits because the font tier follows the text:
 * adding the first Chinese character to an English document needs CJK fonts.
 */
function scheduleWarmUp(delay = 1500): void {
  clearTimeout(warmTimer);
  warmTimer = window.setTimeout(() => {
    if (exporting) return;
    const idle =
      (window as { requestIdleCallback?: (fn: () => void) => void }).requestIdleCallback ??
      ((fn: () => void) => setTimeout(fn, 0));
    idle(async () => {
      // The fonts depend on the template and the front matter's language.
      // Never `preview.hasMath`: the warm-up must not fetch the maths font.
      const layout = await loadLayout().catch(() => null);
      const source = doc.getValue();
      const resolved = layout?.resolveDocument(source, options);
      const text = resolved ? `${resolved.body}\n${resolved.extraText}` : source;
      loadPdfSide()
        .then(([, { prepare }]) => prepare(text, onEngineProgress, resolved?.options.lang ?? options.lang, resolved?.fontOptions))
        .then(started => {
          if (started) setEngineState('ready', t('engineReady'));
        })
        .catch(() => setEngineState('error', t('engineFailed')));
    });
  }, delay);
}

async function describeEngine(): Promise<void> {
  const cached = await isEngineCached();
  if (cached) setEngineState('idle', t('engineCached'));
  else setEngineState('idle', t('engineWillLoad'));
}

/* ---------- download ---------- */

function buildKey(source: string): string {
  return JSON.stringify([source, options, [...images.keys()]]);
}

/**
 * The PDF for the current text and options, reusing the last one if nothing
 * changed. Progress goes on `button`'s `label`. Null if it failed (the error
 * has been shown) or an export is already running.
 */
async function buildPdf(button: HTMLButtonElement, label: HTMLElement, idleText: string): Promise<Uint8Array | null> {
  if (exporting) return null;
  exporting = true;
  progressLabel = label;
  downloadButton.disabled = true;
  printButton.disabled = true;
  button.classList.add('busy');
  label.textContent = t('downloadGenerating');
  // The print head sweeps the sheet for as long as this takes.
  previewPane.style.setProperty('--sheet-h', `${scroller.clientHeight}px`);
  previewPane.classList.add('printing');

  const source = doc.getValue();
  const key = buildKey(source);
  buildNoted = false;
  try {
    if (built?.key !== key) {
      const [{ convert }, { compileToPdf }] = await loadPdfSide();
      const result = await convert(source, options, images);
      // With formulas, a broken one is set aside instead of failing the PDF.
      const { outcome, warnings: mathNotes } = result.hasMath
        ? await (await import('./math/typst-math')).compileRecovering(result, onEngineProgress)
        : { outcome: await compileToPdf(result, onEngineProgress), warnings: [] };
      setEngineState('ready', t('engineReady'));
      built = { key, pdf: outcome.pdf };

      const notes = [...result.warnings, ...mathNotes];
      const layout = layoutModule();
      if (layout) notes.push(...layout.describeIssues(layout.resolveDocument(source, options).issues));
      if (outcome.fonts.missing.length) {
        notes.push(t('missingGlyphs', { chars: outcome.fonts.missing.slice(0, 20).join(' ') }));
      }
      showWarnings(notes, 'warn');
      buildNoted = notes.length > 0;
    }
    return built.pdf;
  } catch (error) {
    const detail =
      engineModule && error instanceof engineModule.TypstCompileError
        ? error.diagnostics.slice(0, 6).join('\n')
        : isNetworkError(error)
          ? t('networkFailed')
          : error instanceof Error
            ? error.message
            : String(error);
    showWarnings([t('pdfFailedShort')], 'error', undefined, true, detail);
    return null;
  } finally {
    exporting = false;
    downloadButton.disabled = false;
    printButton.disabled = false;
    button.classList.remove('busy');
    previewPane.classList.remove('printing');
    label.textContent = idleText;
  }
}

/** The PDF is out: the sheet feeds up a little and the button's icon drops. */
function fed(button: HTMLButtonElement): void {
  play(scroller, [{ transform: 'none' }, { transform: 'translateY(-6px)', offset: 0.35 }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
  button.classList.remove('done');
  requestAnimationFrame(() => button.classList.add('done'));
  setTimeout(() => button.classList.remove('done'), 600);
}

async function downloadPdf(): Promise<void> {
  const pdf = await buildPdf(downloadButton, downloadLabel, t('download'));
  if (!pdf) return;
  const name = save(pdf);
  fed(downloadButton);
  // Warnings about the PDF matter more than the confirmation; keep them.
  if (!buildNoted) showWarnings([t('downloaded', { name })], 'ok');
}

/**
 * Browsers that cannot print a PDF from a frame get it in a tab instead:
 * Safari and everything on iOS (WebKit prints the page around the frame, or
 * nothing), Firefox (pdf.js frames are unreliable to print across versions),
 * and any browser without a built-in PDF viewer (Android, or Chrome set to
 * download PDFs), where the frame would just download the file.
 */
function printsInTab(): boolean {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & { pdfViewerEnabled?: boolean };
  return (
    nav.pdfViewerEnabled === false ||
    /Firefox\/|FxiOS|Android|iPhone|iPad|iPod/.test(ua) ||
    (/AppleWebKit/.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua)) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

/** Print the typeset PDF (the same file Download saves), never this page. */
async function printPdf(): Promise<void> {
  if (exporting) return;
  // Opened now, while the click or key press still counts as a user gesture;
  // opened later, after typesetting, it would be taken for a pop-up.
  const tab = printsInTab() ? window.open('', '_blank') : null;
  if (tab) {
    try {
      tab.document.title = t('print');
      tab.document.body.textContent = t('downloadGenerating');
    } catch {
      // Not ours to write to; it is only a placeholder.
    }
  }
  const pdf = await buildPdf(printButton, printLabel, t('print'));
  if (!pdf) {
    tab?.close();
    return;
  }
  fed(printButton);
  const printing = await import('./ui/print');
  const url = printing.pdfUrl(pdf);
  if (!printsInTab() && (await printing.printInFrame(url))) return;
  if (printing.openInTab(url, tab)) {
    showWarnings([t('printInTab')], 'info');
  } else {
    showWarnings([t('printBlocked')], 'warn', { label: t('printOpen'), run: () => void window.open(url, '_blank') }, true);
  }
}

/** Hand the PDF to the browser to save; returns the file name it was given. */
function save(pdf: Uint8Array): string {
  const blob = new Blob([pdf.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedFileName();
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return link.download;
}

/** The site's own host, e.g. freemd2pdf.com, from the build's canonical origin. */
const SITE_HOST = (() => {
  try {
    return new URL(import.meta.env.VITE_SITE_URL ?? '').hostname || 'freemd2pdf.com';
  } catch {
    return 'freemd2pdf.com';
  }
})();

/**
 * "<first heading>-freemd2pdf.com.pdf". The heading is read as plain text:
 * Markdown emphasis, code and link syntax are dropped, and `#Title` without
 * the space counts too, since that is how people often type it.
 */
function suggestedFileName(): string {
  const source = doc.getValue();
  const heading =
    layoutModule()?.resolveDocument(source, options).meta.title ||
    /^#[ \t]*([^#\s].*?)[ \t#]*$/m.exec(source)?.[1];
  const base = (heading ?? '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
  return base ? `${base}-${SITE_HOST}.pdf` : `${SITE_HOST}.pdf`;
}

/**
 * The engine or a font could not be fetched. The browser's own text for this
 * ("Failed to fetch", "NetworkError when attempting to fetch resource") is
 * English whatever the page's language, so it is replaced with ours.
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /failed to (fetch|load)|networkerror|load failed|network request failed/i.test(message);
}

/* ---------- notices ---------- */

let warningTimer: number | undefined;

interface NoticeAction {
  label: string;
  run(): void;
}

/** Confirmations and news are ink; warnings amber; errors red. */
type NoticeKind = 'info' | 'ok' | 'warn' | 'error';

const SVG = 'http://www.w3.org/2000/svg';

/** A symbol from the sprite at the top of index.html. */
function icon(name: string, className = 'icon'): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

/**
 * One notice at a time, replacing the last. `kind` also takes the older
 * booleans: `true` is an error, `false` is information. `detail` is a smaller
 * second line, e.g. compiler diagnostics under the headline.
 */
function showWarnings(
  messages: string[],
  kind: NoticeKind | boolean = false,
  action?: NoticeAction,
  sticky = kind === true || kind === 'error',
  detail?: string,
): void {
  clearTimeout(warningTimer);
  leaving?.cancel();
  leaving = undefined;
  if (!messages.length) {
    hideNotice();
    return;
  }
  const replacing = !warnings.hidden;
  const tone: NoticeKind = kind === true ? 'error' : kind === false ? 'info' : kind;
  const status = icon(tone, 'icon warnings-icon');
  const body = document.createElement('div');
  body.className = 'warnings-body';
  const list = document.createElement('ul');
  for (const message of messages) {
    const item = document.createElement('li');
    item.textContent = message;
    list.append(item);
  }
  body.append(list);
  if (detail) {
    const small = document.createElement('p');
    small.className = 'warnings-detail';
    small.textContent = detail;
    body.append(small);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'warnings-close';
  close.title = t('close');
  close.setAttribute('aria-label', t('close'));
  close.textContent = '×';
  close.addEventListener('click', () => showWarnings([]));
  const buttons: HTMLButtonElement[] = [close];
  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'warnings-action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      showWarnings([]);
      action.run();
    });
    buttons.unshift(button);
  }
  warnings.replaceChildren(status, body, ...buttons);
  warnings.dataset.kind = tone;
  warnings.classList.toggle('error', tone === 'error');
  warnings.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  warnings.hidden = false;
  // A notice that replaces another slides in again (the first one does in CSS).
  if (replacing) play(warnings, [{ opacity: 0.3, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
  // Errors, and choices the user has to make, stay until dismissed.
  if (!sticky && tone !== 'error') warningTimer = window.setTimeout(() => showWarnings([]), 6000);
}

let leaving: Animation | undefined;

/** Slide the notice out, then empty it. */
function hideNotice(): void {
  const done = () => {
    warnings.hidden = true;
    warnings.replaceChildren();
    leaving = undefined;
  };
  if (warnings.hidden) return done();
  leaving = play(warnings, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 160, easing: 'ease-in' });
  if (leaving) leaving.onfinish = done;
  else done();
}

/* ---------- draft ---------- */

/** Each problem is worth saying once; after that the status bar carries it. */
const reported = new Set<string>();

function reportOnce(key: string, message: string): void {
  if (reported.has(key)) return;
  reported.add(key);
  showWarnings([message], 'warn');
}

function setSaveState(state: 'saved' | 'restored' | 'error' | 'off' | null, text = '', title = ''): void {
  saveState.hidden = state === null;
  saveState.dataset.state = state ?? '';
  saveState.textContent = text;
  saveState.title = title;
}

function showSaveResult(result: SaveResult): void {
  const time = new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  switch (result) {
    case 'saved':
      setSaveState('saved', t('saved'), t('savedTitle', { time }));
      break;
    case 'quota':
      setSaveState('error', t('quotaState'));
      reportOnce('quota', t('quotaNotice'));
      break;
    case 'unavailable':
      // Private windows and locked-down browsers; nothing the user did wrong.
      setSaveState('off', t('storageOff'));
      break;
  }
}

function showImageSaveResult({ result, overBudget }: ImageSyncResult): void {
  if (overBudget) {
    reportOnce('image-budget', t('imageBudget'));
  } else if (result === 'quota') {
    reportOnce('image-quota', t('imageQuota'));
  }
}

/**
 * Start a blank document. Clearing is immediate and undoable rather than
 * confirmed: a dialog asks every time, an undo only costs the rare mistake.
 */
function newDocument(): void {
  const previous = { text: doc.getValue(), images: new Map(images) };
  void autosave.discard();
  images.clear();
  replaceText('');
  renderPreview();
  setSaveState(null);
  doc.focus();

  showWarnings([t('cleared')], 'ok', {
    label: t('undo'),
    run: () => {
      for (const [name, image] of previous.images) images.set(name, image);
      replaceText(previous.text);
      renderPreview();
      autosave.saveNow();
      doc.focus();
    },
  });
}

/**
 * A landing page opens with its own example, but a returning visitor's draft
 * wins, as everywhere else: work is never hidden behind a sample. Say so, and
 * offer the example. Loading it does not touch the saved draft until the
 * visitor edits, and Undo brings the draft straight back.
 */
function offerLandingExample(draftText: string): void {
  if (!landing || draftText === sample) return;
  showWarnings([t('draftNotSample')], false, {
    label: t('loadExample'),
    run: () => {
      const previous = doc.getValue();
      replaceText(sample);
      renderPreview();
      showWarnings([t('exampleLoaded')], false, {
        label: t('undo'),
        run: () => {
          replaceText(previous);
          renderPreview();
        },
      });
    },
  });
}

/** Replace the text without it counting as an edit to save. */
function replaceText(text: string): void {
  replacing = true;
  try {
    doc.setValue(text);
  } finally {
    replacing = false;
  }
}

function onEdit(): void {
  schedulePreview();
  if (!replacing) autosave.touch();
}

/** Images live in IndexedDB, which is asynchronous; the text does not wait for them. */
function restoreImages(): void {
  void imageStore.restored.then(restored => {
    let added = false;
    for (const image of restored) {
      // Something dropped in the meantime is newer than what was stored.
      if (images.has(image.name)) continue;
      images.set(image.name, image);
      added = true;
    }
    if (added) renderPreview();
  });
}

/* ---------- other tabs ---------- */

/**
 * Keep every open tab on the latest draft. Without this, a tab left open
 * with an old version would overwrite newer work the moment someone typed
 * in it, silently, which is the worst way for a writing tool to lose text.
 *
 * A tab with no unsaved change simply follows the other one. A tab that has
 * its own unsaved change is not overwritten; the user chooses.
 */
function followOtherTabs(): void {
  onDraftChangedElsewhere(remote => {
    // Cleared elsewhere: keep what is on screen; it is saved again on the next edit.
    if (!remote) return;
    if (remote.text === doc.getValue()) return;
    if (!autosave.pending) {
      adoptDraft(remote);
      return;
    }
    showWarnings([t('otherTab')], 'info', { label: t('loadLatest'), run: () => {
      // This tab's own pending edit may have been saved since the offer was
      // made, over the other tab's version; the offer is for that version.
      const latest = loadDraft();
      adoptDraft(latest && latest.text !== doc.getValue() ? latest : remote);
    } }, true);
  });
}

function adoptDraft(remote: Draft): void {
  autosave.cancel();
  options = remote.options;
  showOptionsInInputs();
  applyOptions();
  replaceText(remote.text);
  renderPreview();
  setSaveState('saved', t('syncedFromTab'), t('syncedFromTabTitle'));
  // The other tab may have added images; they are in the shared IndexedDB.
  void imageStore.reload().then(stored => {
    for (const image of stored) images.set(image.name, image);
    if (stored.length) renderPreview();
  });
}

/* ---------- controls ---------- */

function bindControls(): void {
  downloadButton.addEventListener('click', () => void downloadPdf());
  printButton.addEventListener('click', () => void printPdf());
  el('new-doc').addEventListener('click', newDocument);

  settingsToggle.addEventListener('click', () => {
    settingsPanel.hidden = !settingsPanel.hidden;
    settingsToggle.setAttribute('aria-expanded', String(!settingsPanel.hidden));
  });

  el('open-file').addEventListener('click', () => fileInput.click());
  el('empty-open').addEventListener('click', () => fileInput.click());
  bindPasteButton();
  fileInput.addEventListener('change', () => {
    void acceptFiles([...(fileInput.files ?? [])]);
    fileInput.value = '';
  });

  bindSettings();
  bindLanguage();
  bindKeyboard();
  openAboutFor(location.hash);
  window.addEventListener('hashchange', () => openAboutFor(location.hash));
  bindDragAndDrop();
  bindAiPaste();
  bindDivider();
  bindViewSwitch();
  new ResizeObserver(() => fitSourceActions()).observe(stats.parentElement!);
  el('fullscreen-toggle').addEventListener('click', () => setFullscreen(!isFullscreen()));
}

type Control = HTMLInputElement | HTMLSelectElement;

/** Every control in the settings panel, with the option it edits and how to read it. */
let controls: [Control, keyof DocumentOptions, (input: Control) => unknown][] = [];

/** Put the current options into the settings panel. */
function showOptionsInInputs(): void {
  for (const [input, key] of controls) {
    // Settings the document's front matter decides show its value instead.
    if (input.dataset.fromDocument !== undefined) continue;
    if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = Boolean(options[key]);
    else input.value = String(options[key]);
  }
}

function bindSettings(): void {
  const docLang = el<HTMLSelectElement>('opt-lang');
  // Native names, so a reader finds their language whatever the page's language.
  for (const { value, name } of SUPPORTED_LANGUAGES) docLang.add(new Option(name, value));
  const checked = (input: Control) => (input as HTMLInputElement).checked;
  const number = (min: number, max: number, fallback: number) => (input: Control) =>
    clamp(Number(input.value), min, max, fallback);
  const text = (input: Control) => input.value.slice(0, 200);
  controls = [
    [el('opt-template'), 'template', input => input.value],
    [el('opt-paper'), 'paper', input => input.value],
    [el('opt-margin'), 'margin', number(5, 50, DEFAULT_OPTIONS.margin)],
    [el('opt-font-size'), 'fontSize', number(8, 18, DEFAULT_OPTIONS.fontSize)],
    [el('opt-line-height'), 'lineHeight', number(1, 2.4, DEFAULT_OPTIONS.lineHeight)],
    [el('opt-page-numbers'), 'pageNumbers', checked],
    [el('opt-toc'), 'tableOfContents', checked],
    [el('opt-justify'), 'justify', checked],
    [docLang, 'lang', input => normalizeLang(input.value)],
    [el('opt-cover'), 'cover', checked],
    [el('opt-h1-newpage'), 'h1NewPage', checked],
    [el('opt-header'), 'header', text],
    [el('opt-footer'), 'footer', text],
  ];

  showOptionsInInputs();

  for (const [input, key, read] of controls) {
    // Only the control that changed is read: a disabled one shows the front
    // matter's value, which must not leak into the panel's own settings.
    input.addEventListener('change', async () => {
      options = { ...options, [key]: read(input) };
      if (key === 'template') {
        // A template brings its margins, sizes and cover; they stay editable.
        const layout = await loadLayout().catch(() => null);
        if (layout) options = layout.applyTemplate(options, options.template);
        showOptionsInInputs();
      }
      applyOptions();
      renderPreview();
      autosave.touch();
    });
  }
}

/* ---------- language ---------- */

/**
 * Switching language is a navigation to that locale's page. The draft lives in
 * same-origin storage, so it simply comes along; a pending edit is saved now
 * rather than left to the pagehide handler.
 */
function switchLanguage(code: string, path: string): void {
  const stored = rememberLanguage(code);
  // Without storage the `/` redirect cannot know about the choice, so say it in the URL.
  const target = !stored && path === '/' ? `/?lang=${code}` : path;
  autosave.flush();
  location.assign(target + location.hash);
}

/**
 * The language menu is a <details> of plain links (the same ones as in the
 * footer), so it works without JavaScript. Here it also remembers the choice,
 * closes on an outside click or Escape, and returns focus to its button.
 */
function bindLanguage(): void {
  const menu = document.getElementById('lang-menu') as HTMLDetailsElement | null;
  if (menu) {
    const summary = menu.querySelector('summary');
    document.addEventListener('click', event => {
      if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        event.stopPropagation();
        menu.open = false;
        summary?.focus();
      }
    });
    // Opening moves focus to the current language, so arrows and Tab start there.
    menu.addEventListener('toggle', () => {
      if (menu.open) menu.querySelector<HTMLAnchorElement>('a[aria-current="page"]')?.focus({ preventScroll: true });
    });
    menu.addEventListener('keydown', event => {
      if (!menu.open || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
      const links = [...menu.querySelectorAll<HTMLAnchorElement>('a[data-locale]')];
      const at = links.indexOf(document.activeElement as HTMLAnchorElement);
      const next = links[(at + (event.key === 'ArrowDown' ? 1 : links.length - 1)) % links.length];
      event.preventDefault();
      next?.focus();
    });
  }
  // Every language link, in the menu and the footer, remembers the choice.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-locale]')) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      if (menu) menu.open = false;
      switchLanguage(link.dataset.locale!, link.getAttribute('href')!);
    });
  }
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** A link to something inside the collapsed about section opens it. */
function openAboutFor(hash: string): void {
  let target: HTMLElement | null = null;
  try {
    target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  } catch {
    return;
  }
  const about = target?.closest<HTMLDetailsElement>('details.about-more');
  if (!about || about.open) return;
  // Opened at full height at once, so there is somewhere to scroll to.
  about.classList.add('instant');
  about.open = true;
  target!.scrollIntoView();
  requestAnimationFrame(() => about.classList.remove('instant'));
}

function bindKeyboard(): void {
  document.addEventListener('keydown', event => {
    const meta = event.ctrlKey || event.metaKey;
    if (meta && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void downloadPdf();
    } else if (meta && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'p') {
      // Only reaches us while this page has focus: in the PDF's own tab or
      // frame, the browser's print is left alone.
      event.preventDefault();
      void printPdf();
    } else if (event.key === 'Escape' && !settingsPanel.hidden) {
      settingsPanel.hidden = true;
      settingsToggle.setAttribute('aria-expanded', 'false');
    } else if (event.key === 'Escape' && isFullscreen()) {
      setFullscreen(false);
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

/* ---------- pasted AI answers ---------- */

/**
 * Text copied out of an AI chat carries artifacts: `\(...\)` maths, citation
 * markers, "Copy code" lines, zero-width characters. The paste goes in as
 * usual, instantly; then the cleaner (a small chunk, fetched on the first
 * paste) looks at exactly what was pasted and, if it is clearly AI output,
 * replaces it with the tidied version as one more undoable edit. Anything that
 * does not look like AI output is left exactly as pasted.
 */
function bindAiPaste(): void {
  // Capture phase: CodeMirror inserts the text in its own paste handler, and
  // `before` has to be read ahead of that.
  editorPane.addEventListener(
    'paste',
    event => {
      const clipboard = event.clipboardData;
      if (!clipboard || clipboard.files.length) return;
      const pasted = clipboard.getData('text/plain').replace(/\r\n?/g, '\n');
      if (!pasted.trim()) return;
      const before = doc.getValue();
      // Pasting a document (not a word or two into one) shows its proof on a phone.
      if (!before.trim() || pasted.length >= before.length / 2) setTimeout(showResultOnPhone, 0);
      void import('./convert/ai-paste').then(async ({ cleanAiPaste }) => {
        // After the browser's (or CodeMirror's) own insertion has happened.
        await new Promise(resolve => setTimeout(resolve, 0));
        const after = doc.getValue();
        const at = insertedAt(before, after, pasted);
        if (at < 0) return;
        const cleaned = cleanAiPaste(pasted);
        if (!cleaned.changed) return;
        doc.replaceRange(at, at + pasted.length, cleaned.text);
        showWarnings([t('aiCleaned')], 'ok', {
          label: t('undo'),
          run: () => {
            // Only if the cleaned text is still where it was put.
            if (doc.getValue().slice(at, at + cleaned.text.length) !== cleaned.text) return;
            doc.replaceRange(at, at + cleaned.text.length, pasted);
            doc.focus();
          },
        });
      });
    },
    true,
  );
}

/**
 * Where `pasted` landed, given the text before and after the paste, or -1 if
 * the change is not simply that paste (another edit raced it, multiple
 * cursors, an editor that transformed the text).
 */
function insertedAt(before: string, after: string, pasted: string): number {
  let prefix = 0;
  const shortest = Math.min(before.length, after.length);
  while (prefix < shortest && before[prefix] === after[prefix]) prefix++;
  // The pasted text may begin with what it replaced, so look back from there.
  const at = after.lastIndexOf(pasted, prefix);
  if (at < 0) return -1;
  const tail = after.length - at - pasted.length;
  const ok = after.slice(0, at) === before.slice(0, at) && after.slice(at + pasted.length) === before.slice(before.length - tail);
  return ok && tail <= before.length - at ? at : -1;
}

/** Markdown files replace the editor; images become embeddable assets. */
async function acceptFiles(files: File[]): Promise<void> {
  const notes: string[] = [];
  let accepted = false;
  let refused = false;
  for (const file of files) {
    if (isSupportedImage(file.type)) {
      accepted = true;
      const image = await readImageFile(file);
      images.set(image.name, image);
      doc.insert(`\n![${file.name}](${file.name})\n`);
      notes.push(t('imageEmbedded', { name: file.name }));
    } else if (/\.(md|markdown|txt)$/i.test(file.name) || file.type.startsWith('text/')) {
      accepted = true;
      doc.setValue(await file.text());
      notes.push(t('fileLoaded', { name: file.name }));
    } else {
      refused = true;
      notes.push(t('unsupportedFile', { name: file.name }));
    }
  }
  if (notes.length) showWarnings(notes, refused ? 'warn' : 'ok');
  renderPreview();
  if (accepted) showResultOnPhone();
  // A loaded file or a dropped image is a deliberate act; keep it right away
  // rather than waiting out the debounce.
  if (accepted) autosave.saveNow();
}

function bindDivider(): void {
  const divider = el<HTMLDivElement>('divider');
  // The breakpoint where the panes stack (styles.css).
  const narrow = () => window.matchMedia('(max-width: 1023px)').matches;
  const tool = document.querySelector<HTMLElement>('.tool')!;

  divider.addEventListener('pointerdown', event => {
    divider.setPointerCapture(event.pointerId);
    divider.classList.add('dragging');

    const move = (move: PointerEvent) => {
      const rect = document.querySelector<HTMLElement>('.split')!.getBoundingClientRect();
      const fraction = narrow()
        ? (move.clientY - rect.top) / rect.height
        : (move.clientX - rect.left) / rect.width;
      const clamped = Math.min(0.8, Math.max(0.15, fraction));
      editorPane.style.flexBasis = `${clamped * 100}%`;
      // The action row follows, so its halves stay over their panes.
      if (!narrow()) tool.style.setProperty('--source-width', `${clamped * 100}%`);
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
 * Phones show one pane at a time. The hidden pane keeps its layout (see
 * .split[data-view] in styles.css), so both keep their scroll positions and
 * the preview still follows the editor while out of sight.
 */
function bindViewSwitch(): void {
  for (const button of viewButtons()) {
    button.addEventListener('click', () => showView(button.id === 'show-proof' ? 'proof' : 'source'));
  }
}

const viewButtons = () => [...document.querySelectorAll<HTMLButtonElement>('.view-switch button')];

function showView(view: 'source' | 'proof'): void {
  const split = document.querySelector<HTMLElement>('.split');
  if (split) split.dataset.view = view;
  for (const button of viewButtons()) button.setAttribute('aria-pressed', String((button.id === 'show-proof') === (view === 'proof')));
}

/** On a phone, new content is worth seeing typeset: show the proof. */
function showResultOnPhone(): void {
  if (phone.matches) showView('proof');
}

/**
 * The empty state's Paste button, where the browser lets a page read the
 * clipboard on a click. If it refuses (permission denied, an insecure
 * context), the button goes and the notice points to the keyboard instead.
 */
function bindPasteButton(): void {
  const button = el<HTMLButtonElement>('empty-paste');
  const clipboard = navigator.clipboard as Clipboard | undefined;
  if (typeof clipboard?.readText !== 'function') return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    let text: string;
    try {
      text = (await clipboard.readText()).replace(/\r\n?/g, '\n');
    } catch {
      button.hidden = true;
      showWarnings([t('pasteBlocked')], 'info');
      doc.focus();
      return;
    }
    if (!text.trim()) {
      doc.focus();
      return;
    }
    // Tidied like any paste: an AI chat answer loses its artifacts.
    const { cleanAiPaste } = await import('./convert/ai-paste');
    const cleaned = cleanAiPaste(text);
    doc.setValue(cleaned.text);
    doc.focus();
    renderPreview();
    autosave.touch();
    if (cleaned.changed) showWarnings([t('aiCleaned')], 'ok');
    showResultOnPhone();
  });
}

/* ---------- full-screen editing ---------- */

/**
 * The page normally scrolls, with the tool as one part of it. Full-screen
 * editing gives the tool the whole window instead (CSS: html.fullscreen).
 * It is remembered per browser; storage may be unavailable, which only means
 * it is not remembered.
 */
const FULLSCREEN_KEY = 'md2pdf:fullscreen';

const isFullscreen = () => document.documentElement.classList.contains('fullscreen');

function setFullscreen(on: boolean, remember = true): void {
  document.documentElement.classList.toggle('fullscreen', on);
  el('fullscreen-toggle').setAttribute('aria-pressed', String(on));
  if (on) window.scrollTo(0, 0);
  if (!remember) return;
  try {
    if (on) localStorage.setItem(FULLSCREEN_KEY, '1');
    else localStorage.removeItem(FULLSCREEN_KEY);
  } catch {
    // Private mode and the like: it still works, it just is not remembered.
  }
}

function restoreFullscreen(): void {
  try {
    if (localStorage.getItem(FULLSCREEN_KEY) === '1') setFullscreen(true, false);
  } catch {
    // Nothing stored, nothing to restore.
  }
}

/* ---------- boot ---------- */

function boot(): void {
  // createEditor seeds CodeMirror from textarea.value, so setting it here is
  // all it takes for the draft to survive the upgrade.
  textarea.value = draft ? draft.text : sample;
  if (draft) {
    options = draft.options;
    setSaveState('restored', t('restored'), t('restoredTitle'));
  }
  doc = {
    getValue: () => textarea.value,
    setValue: value => {
      textarea.value = value;
    },
    insert: () => {},
    replaceRange: () => {},
    focus: () => textarea.focus(),
    contains: node => node === textarea,
    topLine: () => 0,
  };

  restoreFullscreen();
  bindControls();
  applyOptions();
  // The preview is part of first paint; nothing about it waits on a download.
  // The layout (front matter, template) follows a moment later.
  preview.render(hideFrontMatter(doc.getValue()), options);
  void loadLayout().then(renderPreview, () => {});
  updateStats(doc.getValue());
  void describeEngine();
  if (draft) restoreImages();
  if (draft) offerLandingExample(draft.text);
  followOtherTabs();

  // Upgrade the textarea in place; until this resolves the page is already usable.
  void createEditor(textarea, { onChange: onEdit, onScroll: syncScroll }).then(
    editor => {
      doc = editor;
    },
  );

  // Start the engine as soon as the page has painted. Waiting for the load
  // event cost about two seconds (Mermaid, the editor and web fonts all hold
  // it back); the download is low priority, so it doesn't slow what the
  // visitor is looking at.
  // The engine download itself needs nothing else, so it starts right after
  // the first frame instead of queueing behind the idle callback, the layout
  // module and the PDF-side chunks the rest of the warm-up waits for.
  requestAnimationFrame(() =>
    setTimeout(() => {
      void loadCompilerModule(({ loaded, total, fromCache }) => {
        if (!fromCache) onEngineProgress({ stage: 'downloading-engine', loaded, total });
      }).catch(() => {});
    }, 50),
  );
  requestAnimationFrame(() => scheduleWarmUp(300));
}

try {
  boot();
} catch (error) {
  // A failure here leaves a page that looks fine but does nothing, which is
  // the worst way to fail. Say so instead.
  showWarnings([t('initFailed', { detail: error instanceof Error ? error.message : String(error) })], true);
}
// Hold the engine and fonts across visits; they are several megabytes that
// never change. Failure here is not worth surfacing: it only costs a re-fetch.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
