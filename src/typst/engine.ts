/**
 * Typst compiler wrapper.
 *
 * Everything runs in the browser: the WASM compiler, the fonts and the document
 * source. Nothing is uploaded anywhere.
 */
import { createTypstCompiler, CompileFormatEnum } from '@myriaddreamin/typst.ts/compiler';
import type { TypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { loadFonts, withAccessModel, withPackageRegistry } from '@myriaddreamin/typst.ts/options.init';
import type { FsAccessModel, PackageRegistry } from '@myriaddreamin/typst.ts/internal.types';
import { resolveFonts, fontSetKey, type FontSet } from './fonts';
import { loadCompilerModule, shouldPrefetch } from './wasm-loader';

const MAIN = '/main.typ';

export interface Asset {
  /** Path referenced from the Typst source, e.g. `/assets/fig-0.svg`. */
  path: string;
  bytes: Uint8Array;
}

export interface CompileRequest {
  source: string;
  assets: Asset[];
  /** Text used to decide which fonts are needed. */
  textForFonts: string;
}

export interface CompileOutcome {
  pdf: Uint8Array;
  fonts: FontSet;
  diagnostics: string[];
}

export class TypstCompileError extends Error {
  constructor(message: string, readonly diagnostics: string[]) {
    super(message);
    this.name = 'TypstCompileError';
  }
}

/**
 * Sources and assets are supplied through the shadow filesystem, so the
 * compiler needs no real file access, and packages are never fetched: a public
 * tool that promises the document stays local must not reach out to a registry.
 */
const NO_FILESYSTEM: FsAccessModel = {
  getMTime: () => undefined,
  isFile: () => undefined,
  getRealPath: path => path,
  readAll: () => undefined,
};

const NO_PACKAGES: PackageRegistry = { resolve: () => undefined };

/** Compilers are keyed by font tier so switching tiers does not re-download the WASM. */
const compilers = new Map<string, Promise<TypstCompiler>>();
/** Paths mapped into each compiler's shadow filesystem, so stale assets get cleared. */
const mappedAssets = new Map<string, Set<string>>();

export type EngineProgress =
  | { stage: 'downloading-engine'; loaded: number; total: number }
  | { stage: 'starting-engine' }
  | { stage: 'loading-fonts' }
  | { stage: 'compiling' };

export type ProgressFn = (progress: EngineProgress) => void;

function getCompiler(set: FontSet, onProgress: ProgressFn): Promise<TypstCompiler> {
  const key = fontSetKey(set);
  let existing = compilers.get(key);
  if (existing) return existing;

  // Drop any other tier's compiler before building this one.
  compilers.clear();
  mappedAssets.clear();

  const created = (async () => {
    const module = await loadCompilerModule(({ loaded, total }) =>
      onProgress({ stage: 'downloading-engine', loaded, total }),
    );
    onProgress({ stage: 'starting-engine' });

    const compiler = createTypstCompiler();
    await compiler.init({
      getModule: () => module,
      beforeBuild: [
        loadFonts(set.urls, { assets: false }),
        withAccessModel(NO_FILESYSTEM),
        withPackageRegistry(NO_PACKAGES),
      ],
    });
    return compiler;
  })();

  // Do not cache a rejected init, otherwise a transient network failure would
  // poison every later attempt.
  created.catch(() => compilers.delete(key));
  compilers.set(key, created);
  mappedAssets.set(key, new Set());
  return created;
}

function formatDiagnostic(d: any): string {
  if (typeof d === 'string') return d;
  const where = d?.range ? ` (${d.range})` : '';
  const hints = Array.isArray(d?.hints) && d.hints.length ? ` — ${d.hints.join('; ')}` : '';
  return `${d?.message ?? String(d)}${where}${hints}`;
}

export async function compileToPdf(
  req: CompileRequest,
  onProgress: ProgressFn = () => {},
): Promise<CompileOutcome> {
  const fonts = await resolveFonts(req.textForFonts);
  const compiler = await getCompiler(fonts, onProgress);
  const key = fontSetKey(fonts);

  onProgress({ stage: 'compiling' });

  // Clear assets from the previous run before mapping the current ones.
  const previous = mappedAssets.get(key)!;
  const current = new Set(req.assets.map(a => a.path));
  for (const path of previous) {
    if (!current.has(path)) await compiler.unmapShadow(path);
  }
  for (const asset of req.assets) await compiler.mapShadow(asset.path, asset.bytes);
  mappedAssets.set(key, current);

  compiler.addSource(MAIN, req.source);

  const result = await compiler.compile({
    mainFilePath: MAIN,
    format: CompileFormatEnum.pdf,
    diagnostics: 'full',
  });

  const diagnostics = (result.diagnostics ?? []).map(formatDiagnostic);
  if (!result.result) {
    throw new TypstCompileError(
      diagnostics[0] ?? 'Typst failed to produce a document.',
      diagnostics,
    );
  }
  return { pdf: result.result, fonts, diagnostics };
}

/**
 * Pull the compiler down while the reader is still typing, so the first
 * conversion does not start with a 7 MB wait.
 *
 * Skipped on metered or slow connections: downloading that much of someone's
 * data allowance before they have asked for anything is exactly the surprise
 * this tool should avoid. Those visitors get the same download on their first
 * conversion, with a progress bar and having chosen it.
 *
 * This fetches rather than instantiates, because the font tier is not known
 * until there is a document and a compiler built for the wrong tier would only
 * be thrown away.
 */
export function prewarm(): void {
  if (!shouldPrefetch()) return;
  const idle =
    (window as { requestIdleCallback?: (fn: () => void) => void }).requestIdleCallback ??
    ((fn: () => void) => setTimeout(fn, 1200));
  idle(() => {
    void loadCompilerModule(() => {}).catch(() => {});
  });
}
