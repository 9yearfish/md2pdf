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

/**
 * Cloudflare Pages refuses files over 25 MiB and the compiler is 27 MiB, so
 * the production build splits it into parts (see `splitEngine` in
 * vite.config.ts) and writes their URLs here, separated by `|`. They are
 * fetched in parallel and joined back into the one module. In development the
 * placeholder is left as is and the whole file is fetched.
 */
const PART_LIST: string = __WASM_PARTS__;
const PARTS = PART_LIST.startsWith('/') ? PART_LIST.split('|') : [compilerWasm];

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
    // Keep one version only: an engine upgrade changes the key, and the old
    // 27 MB would otherwise stay on the device for good.
    const current = new URL(compilerWasm, location.href).href;
    for (const request of await cache.keys()) {
      if (request.url !== current) await cache.delete(request);
    }
  } catch {
    // Not being able to cache only costs a re-download next time.
  }
}

async function download(onProgress: (progress: DownloadProgress) => void): Promise<ArrayBuffer> {
  // Progress is the sum over all parts, which arrive in parallel.
  const received = new Array<number>(PARTS.length).fill(0);
  const report = () =>
    onProgress({ loaded: received.reduce((a, b) => a + b, 0), total: TOTAL_BYTES, fromCache: false });

  const parts = await Promise.all(
    PARTS.map(async (url, index) => {
      // Low priority: the page's own resources must never wait behind 10 MB.
      const response = await fetch(url, { priority: 'low' } as RequestInit);
      if (!response.ok) throw new Error(`failed to load the typesetting engine (${response.status})`);
      if (!response.body) {
        const whole = new Uint8Array(await response.arrayBuffer());
        received[index] = whole.length;
        report();
        return [whole];
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received[index] += value.length;
        report();
      }
      return chunks;
    }),
  );

  const chunks = parts.flat();
  const bytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
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
 * The engine is always fetched in the background as soon as the page has
 * painted, whatever the connection reports, so a download only has to
 * typeset. (Chrome's connection estimate misreads distant or proxied visitors
 * as slow, and a data-saver exception made the first PDF feel broken.)
 */
export function shouldPrefetch(): boolean {
  return true;
}
