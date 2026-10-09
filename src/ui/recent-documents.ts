/**
 * A local-only archive of recently edited documents.
 *
 * The active draft remains in localStorage for synchronous first paint. This
 * separate IndexedDB keeps up to 30 complete document snapshots. Metadata and
 * image payloads use separate stores, so listing Recent files never reads
 * megabytes of images; those load only when one document is opened.
 */
import type { LocalImage } from '../convert/images';
import type { Draft, SaveResult } from './draft';
import { sanitizeOptions } from './draft';

const DB_NAME = 'md2pdf-recent';
const DB_VERSION = 2;
const DOCUMENT_STORE = 'documents';
const IMAGE_STORE = 'images';
export const RECENT_LIMIT = 30;

export interface RecentSummary extends Draft {
  title: string;
  starred: boolean;
}

export interface RecentDocument extends RecentSummary {
  images: LocalImage[];
}

export interface RecentSnapshot extends Draft {
  title: string;
  images: LocalImage[];
}

export interface RecentSaveResult {
  result: SaveResult | 'full';
  evicted: string[];
}

interface ImageRecord {
  id: string;
  images: LocalImage[];
}

let database: Promise<IDBDatabase | null> | undefined;

function openDatabase(): Promise<IDBDatabase | null> {
  database ??= new Promise(resolve => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DOCUMENT_STORE)) {
          request.result.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' });
        }
        if (!request.result.objectStoreNames.contains(IMAGE_STORE)) {
          request.result.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return database;
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

function cleanImage(value: unknown): LocalImage | null {
  const image = value as Partial<LocalImage> | null;
  if (typeof image?.name !== 'string' || typeof image.mime !== 'string' || !(image.bytes instanceof Uint8Array)) {
    return null;
  }
  return { name: image.name.slice(0, 255), mime: image.mime, bytes: image.bytes };
}

function cleanSummary(value: unknown): RecentSummary | null {
  const record = value as Partial<RecentSummary> | null;
  if (!record || typeof record.id !== 'string' || typeof record.text !== 'string') return null;
  return {
    id: record.id,
    sourceName: typeof record.sourceName === 'string' ? record.sourceName.slice(0, 255) : null,
    title: typeof record.title === 'string' ? record.title.slice(0, 120) : '',
    text: record.text,
    options: sanitizeOptions(record.options),
    savedAt: Number(record.savedAt) || 0,
    starred: record.starred === true,
  };
}

function cleanImages(value: unknown): LocalImage[] {
  const record = value as Partial<ImageRecord> | null;
  return Array.isArray(record?.images)
    ? record.images.map(cleanImage).filter((image): image is LocalImage => image !== null)
    : [];
}

async function readAll(): Promise<RecentSummary[]> {
  const db = await openDatabase();
  if (!db) throw new Error('IndexedDB unavailable');
  return new Promise((resolve, reject) => {
    const request = db.transaction(DOCUMENT_STORE).objectStore(DOCUMENT_STORE).getAll();
    request.onsuccess = () => resolve(request.result.map(cleanSummary).filter((doc): doc is RecentSummary => doc !== null));
    request.onerror = () => reject(request.error ?? new Error('read failed'));
  });
}

async function readOne(id: string): Promise<RecentDocument | null> {
  const db = await openDatabase();
  if (!db) throw new Error('IndexedDB unavailable');
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DOCUMENT_STORE, IMAGE_STORE]);
    const document = tx.objectStore(DOCUMENT_STORE).get(id);
    const images = tx.objectStore(IMAGE_STORE).get(id);
    tx.oncomplete = () => {
      const summary = cleanSummary(document.result);
      resolve(summary ? { ...summary, images: cleanImages(images.result) } : null);
    };
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('transaction failed'));
  });
}

async function readImages(ids: string[]): Promise<Map<string, LocalImage[]>> {
  const db = await openDatabase();
  if (!db) throw new Error('IndexedDB unavailable');
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE);
    const store = tx.objectStore(IMAGE_STORE);
    const requests = ids.map(id => [id, store.get(id)] as const);
    tx.oncomplete = () => resolve(new Map(requests.map(([id, request]) => [id, cleanImages(request.result)])));
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('transaction failed'));
  });
}

async function mutate<T>(
  change: (documents: RecentSummary[], docs: IDBObjectStore, images: IDBObjectStore) => T,
): Promise<T> {
  const db = await openDatabase();
  if (!db) throw new Error('IndexedDB unavailable');
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DOCUMENT_STORE, IMAGE_STORE], 'readwrite');
    const docs = tx.objectStore(DOCUMENT_STORE);
    const images = tx.objectStore(IMAGE_STORE);
    const request = docs.getAll();
    let result: T;
    request.onsuccess = () => {
      try {
        const documents = request.result.map(cleanSummary).filter((doc): doc is RecentSummary => doc !== null);
        result = change(documents, docs, images);
      } catch (error) {
        tx.abort();
        reject(error);
      }
    };
    request.onerror = () => reject(request.error ?? new Error('read failed'));
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('transaction failed'));
  });
}

function newestFirst(a: RecentSummary, b: RecentSummary): number {
  return Number(b.starred) - Number(a.starred) || b.savedAt - a.savedAt;
}

/** Serialisation avoids a slow image write racing a star/delete operation. */
export class RecentDocuments {
  private queue: Promise<unknown> = Promise.resolve();

  list(): Promise<RecentSummary[]> {
    return this.enqueue(async () => (await readAll()).sort(newestFirst), []);
  }

  get(id: string): Promise<RecentDocument | null> {
    return this.enqueue(() => readOne(id), null);
  }

  save(snapshot: RecentSnapshot): Promise<RecentSaveResult> {
    return this.enqueue(async () => {
      try {
        return await mutate((documents, docs, images) => {
          const existing = documents.find(document => document.id === snapshot.id);
          const { images: imageList, ...draft } = snapshot;
          const record: RecentSummary = { ...draft, starred: existing?.starred ?? false };
          const next = [...documents.filter(document => document.id !== record.id), record];
          const evicted: string[] = [];
          while (next.length > RECENT_LIMIT) {
            const oldest = [...next]
              .filter(document => !document.starred)
              .sort((a, b) => a.savedAt - b.savedAt)[0];
            if (!oldest) break;
            next.splice(next.findIndex(document => document.id === oldest.id), 1);
            evicted.push(oldest.id);
          }
          const kept = next.some(document => document.id === record.id);
          if (kept) {
            docs.put(record);
            images.put({ id: record.id, images: imageList } satisfies ImageRecord);
          }
          for (const id of evicted) {
            docs.delete(id);
            images.delete(id);
          }
          return { result: kept ? 'saved' : 'full', evicted };
        });
      } catch (error) {
        return { result: isQuotaError(error) ? 'quota' : 'unavailable', evicted: [] };
      }
    }, { result: 'unavailable', evicted: [] });
  }

  setStarred(id: string, starred: boolean): Promise<boolean> {
    return this.enqueue(async () => mutate((documents, docs) => {
      const document = documents.find(item => item.id === id);
      if (!document) return false;
      docs.put({ ...document, starred });
      return true;
    }), false);
  }

  delete(id: string): Promise<RecentDocument | null> {
    return this.enqueue(async () => {
      const document = await readOne(id);
      if (!document) return null;
      await mutate((_documents, docs, images) => {
        docs.delete(id);
        images.delete(id);
      });
      return document;
    }, null);
  }

  clearUnstarred(): Promise<RecentDocument[]> {
    return this.enqueue(async () => {
      const documents = await readAll();
      const summaries = documents.filter(document => !document.starred);
      const imageMap = await readImages(summaries.map(document => document.id));
      await mutate((current, docs, images) => {
        for (const document of current.filter(item => !item.starred)) {
          docs.delete(document.id);
          images.delete(document.id);
        }
      });
      return summaries.map(summary => ({ ...summary, images: imageMap.get(summary.id) ?? [] }));
    }, []);
  }

  restore(documents: RecentDocument[]): Promise<boolean> {
    return this.enqueue(async () => {
      try {
        const restored = await mutate((current, docs, images) => {
          const capacity = RECENT_LIMIT - current.length;
          const accepted = documents.slice(0, Math.max(0, capacity));
          for (const document of accepted) {
            const { images: imageList, ...summary } = document;
            docs.put(summary);
            images.put({ id: document.id, images: imageList } satisfies ImageRecord);
          }
          return accepted.length;
        });
        return restored === documents.length;
      } catch {
        return false;
      }
    }, false);
  }

  private enqueue<T>(task: () => Promise<T>, fallback: T): Promise<T> {
    const next = this.queue.then(task, task).catch(() => fallback);
    this.queue = next.then(() => undefined, () => undefined);
    return next;
  }
}
