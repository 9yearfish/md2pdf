/**
 * Keeps the draft in this browser, so closing the tab loses nothing.
 *
 * The text and layout options go in localStorage: they are small, and reading
 * them synchronously at boot means the saved draft is what first paints, with
 * no flash of the sample. Images are binary and can be large, so they go in
 * IndexedDB, keyed by the name the Markdown refers to.
 *
 * None of this touches the network. Storage is best-effort throughout: private
 * windows, disabled storage and full quotas degrade to "not saved", never to a
 * broken page.
 */
import { DEFAULT_OPTIONS, TEMPLATE_IDS, type DocumentOptions, type PaperSize } from '../convert/preamble';
import type { LocalImage } from '../convert/images';
import { normalizeLang } from '../convert/lang';

/** Bump the version rather than migrate: a draft is a convenience, not an archive. */
const DRAFT_KEY = 'md2pdf:draft:v1';
const DB_NAME = 'md2pdf';
const IMAGE_STORE = 'images';
/** Past this, images stay in memory for the session but are not kept. */
export const IMAGE_BUDGET = 50 * 1024 * 1024;
/** Long enough to skip most keystrokes, short enough to feel instant. */
const SAVE_DELAY = 400;

export interface Draft {
  text: string;
  options: DocumentOptions;
  savedAt: number;
}

export type SaveResult = 'saved' | 'quota' | 'unavailable';

export interface ImageSyncResult {
  result: SaveResult;
  /** Some referenced images were left out to stay within IMAGE_BUDGET. */
  overBudget: boolean;
}

/* ---------- text and options: localStorage ---------- */

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft> | null;
    if (typeof parsed?.text !== 'string') return null;
    return {
      text: parsed.text,
      options: sanitizeOptions(parsed.options),
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Another tab saved or cleared the draft. `storage` events only fire in the
 * other tabs, never in the one that wrote, so this never echoes our own saves.
 * `null` means the draft was deleted there.
 */
export function onDraftChangedElsewhere(listener: (draft: Draft | null) => void): void {
  window.addEventListener('storage', event => {
    if (event.key !== DRAFT_KEY && event.key !== null) return;
    listener(loadDraft());
  });
}

function writeDraft(text: string, options: DocumentOptions): SaveResult {
  try {
    const draft: Draft = { text, options, savedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return 'saved';
  } catch (error) {
    return isQuotaError(error) ? 'quota' : 'unavailable';
  }
}

function removeDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing could have been stored either.
  }
}

const PAPERS = new Set<PaperSize>(['a4', 'us-letter', 'a5', 'iso-b5']);

/**
 * Take only fields that still exist and still have the right type, so a draft
 * saved by an older build cannot put the settings into a state the UI cannot
 * show.
 */
export function sanitizeOptions(value: unknown): DocumentOptions {
  const saved = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const options: Record<string, unknown> = { ...DEFAULT_OPTIONS };
  for (const [key, fallback] of Object.entries(DEFAULT_OPTIONS)) {
    const candidate = saved[key];
    if (typeof candidate !== typeof fallback) continue;
    if (typeof candidate === 'number' && !Number.isFinite(candidate)) continue;
    options[key] = candidate;
  }
  if (!PAPERS.has(options.paper as PaperSize)) options.paper = DEFAULT_OPTIONS.paper;
  // Drafts from before templates simply get the defaults for the new fields.
  if (!TEMPLATE_IDS.includes(options.template as DocumentOptions['template'])) options.template = DEFAULT_OPTIONS.template;
  for (const band of ['header', 'footer', 'title', 'author', 'tocTitle'] as const) {
    options[band] = String(options[band]).slice(0, 200);
  }
  // A draft from before a language was dropped or renamed falls back to auto.
  options.lang = normalizeLang(options.lang);
  return options as unknown as DocumentOptions;
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    // Firefox used its own name for the same condition.
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/* ---------- images: IndexedDB ---------- */

let database: Promise<IDBDatabase | null> | undefined;

/** Opened on first use, so a visitor who only looks never gets a database. */
function openDatabase(): Promise<IDBDatabase | null> {
  database ??= new Promise(resolve => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore(IMAGE_STORE, { keyPath: 'name' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return database;
}

/** One transaction; resolves once it has committed, rejects if it aborted. */
async function transact<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDatabase();
  if (!db) throw new Error('IndexedDB unavailable');
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, mode);
    const request = work(tx.objectStore(IMAGE_STORE));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));
  });
}

/**
 * Mirrors the document's images into IndexedDB.
 *
 * Every operation runs through one queue, so a restore always finishes before
 * the first prune (which would otherwise delete images it had not seen yet),
 * and a clear always lands before an undo puts the images back.
 */
export class ImageStore {
  /** What IndexedDB holds. Identity tells a re-dropped image from the same one. */
  private readonly stored = new Map<string, LocalImage>();
  private queue: Promise<unknown> = Promise.resolve();
  /** With no draft, anything left in the database is an orphan. */
  private stale: boolean;
  /** The images saved alongside the draft; empty if there was no draft. */
  readonly restored: Promise<LocalImage[]>;

  constructor(hasDraft: boolean) {
    this.stale = !hasDraft;
    this.restored = hasDraft ? this.enqueue(() => this.load()) : Promise.resolve([]);
  }

  /** Store what `text` refers to and drop what it no longer does. */
  sync(images: Map<string, LocalImage>, text: string): Promise<ImageSyncResult> {
    return this.enqueue(async () => {
      const { keep, overBudget } = selectImages(images, text);
      const puts = [...keep.values()].filter(image => this.stored.get(image.name) !== image);
      const deletes = [...this.stored.keys()].filter(name => !keep.has(name));
      if (!this.stale && !puts.length && !deletes.length) return { result: 'saved', overBudget };

      try {
        await transact('readwrite', store => {
          if (this.stale) store.clear();
          for (const name of deletes) store.delete(name);
          for (const image of puts) store.put({ name: image.name, bytes: image.bytes, mime: image.mime });
        });
      } catch (error) {
        // The transaction is atomic, so `stored` still describes the database.
        return { result: isQuotaError(error) ? 'quota' : 'unavailable', overBudget };
      }
      this.stale = false;
      for (const name of deletes) this.stored.delete(name);
      for (const image of puts) this.stored.set(image.name, image);
      return { result: 'saved', overBudget };
    });
  }

  /** Re-read what another tab may have written. */
  reload(): Promise<LocalImage[]> {
    return this.enqueue(async () => {
      this.stored.clear();
      this.stale = false;
      return this.load();
    });
  }

  clear(): Promise<void> {
    return this.enqueue(async () => {
      this.stored.clear();
      // Still marked stale, so the next sync clears it in the same transaction;
      // no need to open the database just for this.
      if (this.stale && !database) return;
      try {
        await transact('readwrite', store => store.clear());
        this.stale = false;
      } catch {
        this.stale = true;
      }
    });
  }

  private async load(): Promise<LocalImage[]> {
    try {
      const records = (await transact('readonly', store => store.getAll())) ?? [];
      const images = (records as LocalImage[]).filter(
        record => typeof record?.name === 'string' && record.bytes instanceof Uint8Array,
      );
      for (const image of images) this.stored.set(image.name, image);
      return images;
    } catch {
      return [];
    }
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);
    this.queue = next.catch(() => {});
    return next;
  }
}

/**
 * Only images the text still mentions are worth keeping. A plain substring test
 * errs on the side of keeping one too many, which is the cheaper mistake.
 */
function selectImages(
  images: Map<string, LocalImage>,
  text: string,
): { keep: Map<string, LocalImage>; overBudget: boolean } {
  const keep = new Map<string, LocalImage>();
  let total = 0;
  let overBudget = false;
  for (const image of images.values()) {
    if (!text.includes(image.name)) continue;
    if (total + image.bytes.byteLength > IMAGE_BUDGET) {
      overBudget = true;
      continue;
    }
    total += image.bytes.byteLength;
    keep.set(image.name, image);
  }
  return { keep, overBudget };
}

/* ---------- autosave ---------- */

export interface AutosaveHost {
  snapshot(): { text: string; options: DocumentOptions; images: Map<string, LocalImage> };
  onSaved(result: SaveResult): void;
  onImagesSaved(result: ImageSyncResult): void;
}

/**
 * Saves shortly after the last change, and at once when the page is hidden or
 * closed, so there is no window in which typing can be lost and no write on
 * every keystroke either.
 *
 * It stays idle until `touch()`: the untouched sample is not the visitor's
 * document, and looking at the page should leave nothing behind.
 */
export class Autosave {
  private timer: number | undefined;

  constructor(
    private readonly host: AutosaveHost,
    private readonly store: ImageStore,
  ) {
    // `pagehide` covers closing and navigating; `visibilitychange` covers the
    // mobile case where a backgrounded tab is killed without either firing.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    window.addEventListener('pagehide', () => this.flush());
  }

  /** The user changed something; save it soon. */
  touch(): void {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.saveNow(), SAVE_DELAY);
  }

  /** Whether there is a change not yet written. */
  get pending(): boolean {
    return this.timer !== undefined;
  }

  /** Drop a pending change without saving it, e.g. when adopting another tab's draft. */
  cancel(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Save a pending change synchronously, if there is one. */
  flush(): void {
    if (this.timer !== undefined) this.saveNow();
  }

  saveNow(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    const { text, options, images } = this.host.snapshot();
    this.host.onSaved(writeDraft(text, options));
    void this.store.sync(images, text).then(result => this.host.onImagesSaved(result));
  }

  /** Forget the stored draft and its images, and stay idle until the next change. */
  discard(): Promise<void> {
    clearTimeout(this.timer);
    this.timer = undefined;
    removeDraft();
    return this.store.clear();
  }
}
