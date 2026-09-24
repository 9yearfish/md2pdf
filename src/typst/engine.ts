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
import { resolveFonts, fontSetKey, type FontOptions, type FontSet } from './fonts';
import type { LangSetting } from '../convert/lang';
import { withMathFonts } from './math-fonts';
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
  /** The document language setting; `auto` when absent. */
  lang?: LangSetting;
  /** Fonts already resolved by `convert()`, so they are not resolved twice. */
  fonts?: FontSet;
  /** The document has formulas, so the maths font is needed too. */
  hasMath?: boolean;
}

export interface CompileOutcome {
  pdf: Uint8Array;
  fonts: FontSet;
  diagnostics: string[];
}

export class TypstCompileError extends Error {
  constructor(
    message: string,
    readonly diagnostics: string[],
    /** As Typst reported them, with path and severity, for locating a failing formula. */
    readonly raw: unknown[] = [],
  ) {
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
  const fonts = withMathFonts(req.fonts ?? (await resolveFonts(req.textForFonts, req.lang)), req.hasMath);
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
      result.diagnostics ?? [],
    );
  }
  // Copy the bytes out. The result can be a view into the compiler's WASM
  // memory, which is detached as soon as that memory grows (the next font
  // load or compile). A cached PDF kept as that view downloaded fine once,
  // then threw on the second click ("TypeError: … detached").
  return { pdf: new Uint8Array(result.result), fonts, diagnostics };
}

/**
 * Get the engine ready in the background, so that "download PDF" only has to
 * typeset.
 *
 * This builds the compiler for the font tier the current text needs, which
 * means fetching the engine and those fonts and instantiating the module.
 * Calling it again with text of the same tier is free; a new tier rebuilds.
 *
 * Skipped on metered or slow connections: downloading several megabytes of
 * someone's data allowance before they have asked for a PDF is exactly the
 * surprise this tool should avoid. Those visitors get the same download when
 * they first ask for a PDF. Returns whether preparation was started.
 */
export function prepare(
  text: string,
  onProgress: ProgressFn,
  lang: LangSetting = 'auto',
  fontOptions: FontOptions = {},
): Promise<boolean> {
  if (!shouldPrefetch()) return Promise.resolve(false);
  return warm(text, onProgress, lang, fontOptions);
}

function warm(text: string, onProgress: ProgressFn, lang: LangSetting, fontOptions: FontOptions): Promise<boolean> {
  // Start the engine download straight away, rather than after the font tier
  // is known, and fetch that tier's fonts alongside it: the compiler's own
  // font loading then finds them in the HTTP cache instead of queueing after
  // the 10 MB module.
  void loadCompilerModule(({ loaded, total }) => onProgress({ stage: 'downloading-engine', loaded, total })).catch(() => {});
  void resolveFonts(text, lang, fontOptions)
    .then(fonts => {
      for (const url of withMathFonts(fonts).urls) void fetch(url, { priority: 'low' } as RequestInit).catch(() => {});
    })
    .catch(() => {});
  // No `hasMath` here on purpose: the warm-up never fetches the maths font
  // (about 290 KB). It is fetched when a PDF with formulas is actually
  // requested; `withMathFonts` only keeps it once a download has needed it,
  // so the warmed compiler matches the one that download will use.
  return resolveFonts(text, lang, fontOptions)
    .then(fonts => getCompiler(withMathFonts(fonts), onProgress))
    .then(() => true);
}
