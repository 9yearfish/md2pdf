/**
 * Fetches the Typst compiler with byte-level progress and keeps it in Cache
 * Storage.
 *
 * The compiler is about 7 MB over the wire and there is nothing to show until
 * it arrives, so the one thing that makes the wait tolerable is an honest
 * progress bar. Handing the bytes over ourselves is what makes that possible;
 * letting typst.ts fetch the URL would leave us with a spinner.
 */
import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';

const CACHE = 'md2pdf-engine-v1';

export interface DownloadProgress {
  /** Decompressed bytes received so far. */
  loaded: number;
  /** Decompressed size of the module. */
  total: number;
  fromCache: boolean;
}

/**
 * Injected at build time from the real file size.
 *
 * `Content-Length` cannot be used: when the server applies compression it
 * reports the compressed length while the stream yields decompressed bytes, so
 * progress would run past 100%.
 */
const TOTAL_BYTES = __WASM_BYTES__;

export const compilerWasmUrl = compilerWasm;

let inFlight: Promise<BufferSource> | null = null;

async function fromCacheStorage(): Promise<ArrayBuffer | null> {
  if (typeof caches === 'undefined') return null;
  try {
    const hit = await (await caches.open(CACHE)).match(compilerWasm);
    return hit ? await hit.arrayBuffer() : null;
  } catch {
    // Private windows and storage-pressure can both make this throw.
    return null;
  }
}

async function toCacheStorage(bytes: ArrayBuffer): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(
      compilerWasm,
      new Response(bytes, { headers: { 'content-type': 'application/wasm' } }),
    );
  } catch {
    // Not being able to cache only costs a re-download next time.
  }
}

async function download(onProgress: (progress: DownloadProgress) => void): Promise<ArrayBuffer> {
  const response = await fetch(compilerWasm);
  if (!response.ok) throw new Error(`failed to load the typesetting engine (${response.status})`);

  if (!response.body) return response.arrayBuffer();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress({ loaded, total: TOTAL_BYTES, fromCache: false });
  }

  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes.buffer;
}

export function loadCompilerModule(
  onProgress: (progress: DownloadProgress) => void,
): Promise<BufferSource> {
  // Concurrent callers (a prefetch racing the first conversion) must share one
  // download rather than each pulling 7 MB.
  inFlight ??= (async () => {
    const cached = await fromCacheStorage();
    if (cached) {
      onProgress({ loaded: cached.byteLength, total: cached.byteLength, fromCache: true });
      return cached;
    }
    const bytes = await download(onProgress);
    await toCacheStorage(bytes.slice(0));
    return bytes;
  })();

  inFlight.catch(() => {
    inFlight = null;
  });
  return inFlight;
}

/** True when the engine is already on this device, so no download is pending. */
export async function isEngineCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    return Boolean(await (await caches.open(CACHE)).match(compilerWasm));
  } catch {
    return false;
  }
}

/**
 * Whether it is reasonable to pull 7 MB down before the reader has asked for
 * anything. On a metered or slow connection it is not: it would be exactly the
 * surprise this tool should avoid.
 */
export function shouldPrefetch(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!connection) return true;
  if (connection.saveData) return false;
  return !['slow-2g', '2g', '3g'].includes(connection.effectiveType ?? '');
}
