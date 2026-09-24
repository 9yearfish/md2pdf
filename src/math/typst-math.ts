/**
 * LaTeX formulas to native Typst maths, loaded only for documents that have
 * formulas.
 *
 * Conversion is done by mitex (https://github.com/mitex-rs/mitex, Apache-2.0),
 * the LaTeX-to-Typst converter behind the `@preview/mitex` package. Packages
 * are disabled in this app, so its parts are vendored under ./mitex:
 * `mitex.wasm` is the converter, `prelude.typ` and `latex/standard.typ` define
 * the Typst functions its output calls (`mitexsqrt`, `pmatrix`, `textmath`...).
 * Vendored from mitex 0.2.6; the one local change is in standard.typ, where
 * `\hspace`, `\vspace` and `\raisebox` no longer pass their argument to `eval`.
 *
 * The converter is a Typst plugin, but it runs here, in JavaScript, rather
 * than inside Typst. Its protocol is two imported functions, so hosting it
 * takes a few lines, and it means every formula's output can be checked
 * before it goes anywhere near the document:
 *
 *  1. mitex escapes everything it copies from the input (`#`, `"`, `$`, `/`,
 *     brackets...), so its output is maths markup plus calls to its own
 *     helpers. `validate` still rejects any code-mode `#` other than the few
 *     text helpers mitex emits (`#textmath[...]`, `#textbf[...]`, ...), so no
 *     formula can reach `read`, `include`, `set`, `show`, loops or any other
 *     code: maths mode itself only resolves maths functions and symbols.
 *  2. The output is passed as a *string literal* (see typst-str.ts) to
 *     `eval(mode: "math", ..., scope: mitex's helpers)`. It is parsed on its
 *     own, so an unbalanced bracket or `$` cannot leak into the surrounding
 *     document.
 *  3. A formula that still fails (a wrong argument, a missing label) makes
 *     Typst report an error inside that formula's call. `compileRecovering`
 *     finds which formula it was, replaces just that one with its source and
 *     the error, and compiles again, so one bad formula never costs the PDF.
 */
import mitexWasmUrl from './mitex/mitex.wasm?url';
import prelude from './mitex/prelude.typ?raw';
import standard from './mitex/latex/standard.typ?raw';
import { MATH_SPEC_PATH } from '../convert/preamble';
import { mathErrorCall, type EmittedFormula, type MathConversion } from '../convert/emit';
import { compileToPdf, TypstCompileError, type Asset, type CompileOutcome, type ProgressFn } from '../typst/engine';
import type { ConversionResult } from '../convert/pipeline';
import { t } from '../i18n/runtime';

const encoder = new TextEncoder();

/** The Typst side of mitex, mapped next to the document. */
export const MATH_ASSETS: Asset[] = [
  { path: MATH_SPEC_PATH.replace(/latex\/standard\.typ$/, 'prelude.typ'), bytes: encoder.encode(prelude) },
  { path: MATH_SPEC_PATH, bytes: encoder.encode(standard) },
];

type Converter = (tex: string) => string;
let converter: Promise<Converter> | null = null;

class ConversionError extends Error {}

/** Instantiate mitex.wasm and speak the Typst plugin protocol to it. */
async function instantiate(): Promise<Converter> {
  const response = await fetch(mitexWasmUrl);
  if (!response.ok) throw new Error(`maths converter failed to load (${response.status})`);
  let memory: WebAssembly.Memory;
  let args = new Uint8Array(0);
  let result = new Uint8Array(0);
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {
    typst_env: {
      wasm_minimal_protocol_write_args_to_buffer: (ptr: number) => {
        new Uint8Array(memory.buffer).set(args, ptr);
      },
      wasm_minimal_protocol_send_result_to_host: (ptr: number, len: number) => {
        result = new Uint8Array(memory.buffer, ptr, len).slice();
      },
    },
  });
  memory = instance.exports.memory as WebAssembly.Memory;
  const convertMath = instance.exports.convert_math as (texLength: number, specLength: number) => number;
  return tex => {
    // Arguments: the formula, then an empty spec, which selects the built-in one.
    args = encoder.encode(tex);
    result = new Uint8Array(0);
    const status = convertMath(args.length, 0);
    const text = new TextDecoder().decode(result);
    if (status !== 0) throw new ConversionError(text.replace(/^error:\s*/, ''));
    return text;
  };
}

/** Code-mode calls mitex emits for text inside formulas; nothing else may use `#`. */
const ALLOWED_CODE =
  /^#(?:text(?:math|md|normal|bf|it|rm|up|sf|tt)|emph|strong)\[|^#math\.equation\(block: (?:true|false), \$/;

/** Whether converted output stays within maths markup and mitex's text helpers. */
export function validate(code: string): boolean {
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '\\') i++;
    else if (code[i] === '#' && !ALLOWED_CODE.test(code.slice(i, i + 40))) return false;
  }
  return true;
}

/** Convert every distinct formula; failures are reported per formula, never thrown. */
export async function convertFormulas(sources: string[]): Promise<Map<string, MathConversion>> {
  const out = new Map<string, MathConversion>();
  let convert: Converter;
  try {
    convert = await (converter ??= instantiate());
  } catch (error) {
    converter = null; // let a later attempt retry the download
    const detail = error instanceof Error ? error.message : String(error);
    for (const tex of sources) out.set(tex, { error: detail });
    return out;
  }
  for (const tex of sources) {
    try {
      const code = convert(tex);
      out.set(tex, validate(code) ? { code } : { error: 'unsupported command' });
    } catch (error) {
      if (error instanceof ConversionError) {
        out.set(tex, { error: error.message || 'invalid formula' });
      } else {
        // A trap inside the module (say, runaway nesting) may leave it in a
        // bad state: start the next formula on a fresh instance.
        out.set(tex, { error: 'formula too complex' });
        converter = instantiate();
        convert = await converter.catch(() => () => {
          throw new ConversionError('maths converter failed to load');
        });
      }
    }
  }
  return out;
}

interface RawDiagnostic {
  path?: string;
  range?: string;
  severity?: string;
  message?: string;
}

/** `line:col-line:col`, zero-based. */
function parseRange(range: string | undefined): { line: number; start: number; end: number } | null {
  const m = /^(\d+):(\d+)-(\d+):(\d+)$/.exec(range ?? '');
  if (!m) return null;
  const line = Number(m[1]);
  return { line, start: Number(m[2]), end: Number(m[3]) === line ? Number(m[4]) : Infinity };
}

/** Which formula a failed compile points at, via the error itself or its call trace. */
function locate(source: string, live: EmittedFormula[], diagnostics: RawDiagnostic[]): EmittedFormula | null {
  const placed = live.flatMap(formula => {
    const at = source.indexOf(formula.call);
    if (at < 0) return [];
    const lineStart = source.lastIndexOf('\n', at) + 1;
    const line = source.slice(0, at).split('\n').length - 1;
    const prefix = source.slice(lineStart, at);
    // Columns may be counted in UTF-16 units or in characters; accept either.
    const cols = [prefix.length, [...prefix].length];
    const width = [formula.call.length, [...formula.call].length];
    return [{ formula, line, cols, width }];
  });
  for (const d of diagnostics) {
    if (d.path && d.path !== '/main.typ') continue;
    const range = parseRange(d.range);
    if (!range) continue;
    const onLine = placed.filter(p => p.line === range.line);
    for (const unit of [0, 1]) {
      const hit = onLine.find(p => range.start >= p.cols[unit] && range.start < p.cols[unit] + p.width[unit]);
      if (hit) return hit.formula;
    }
  }
  return null;
}

function firstError(diagnostics: RawDiagnostic[], fallback: string): string {
  const message = diagnostics.find(d => d.severity === 'error')?.message ?? fallback;
  const short = message
    .split(', hints:')[0]
    .replace(/^plugin errored with:\s*(error:\s*)?/, '')
    .replace(/^panicked with: "(.*)"$/, '$1')
    .trim();
  return short.length > 160 ? short.slice(0, 157) + '…' : short;
}

export interface RecoveredOutcome {
  outcome: CompileOutcome;
  /** One notice per formula that had to be left as source. */
  warnings: string[];
}

/** Safety net: this many broken formulas and the rest are all left as source. */
const MAX_RETRIES = 40;

/**
 * Compile, and if a formula breaks the compile, replace that formula with its
 * source and the error message and try again.
 */
export async function compileRecovering(
  result: ConversionResult,
  onProgress?: ProgressFn,
): Promise<RecoveredOutcome> {
  let source = result.source;
  const live = [...(result.formulas ?? [])];
  const warnings: string[] = [];
  const compile = (text: string) => compileToPdf({ ...result, source: text }, onProgress);

  const disable = (text: string, formulas: EmittedFormula[], message: string) =>
    // A function, so `$` in a formula is not read as a replacement pattern.
    formulas.reduce((out, f) => out.replace(f.call, () => mathErrorCall(f.display, f.tex, message)), text);

  const fail = (formula: EmittedFormula, message: string) => {
    source = disable(source, [formula], message);
    live.splice(live.indexOf(formula), 1);
    warnings.push(t('mathError', { detail: `${formula.tex} (${message})` }));
  };

  /** The error is somewhere outside the document text: find the formula by bisection. */
  const bisect = async (unmapped: string): Promise<EmittedFormula | null> => {
    // ok(k): with the first k formulas disabled, that error is gone.
    const ok = async (k: number) => {
      try {
        await compile(disable(source, live.slice(0, k), 'disabled'));
        return true;
      } catch (error) {
        if (!(error instanceof TypstCompileError)) throw error;
        return firstError(error.raw as RawDiagnostic[], error.message) !== unmapped;
      }
    };
    let lo = 0;
    let hi = live.length;
    if (!(await ok(hi))) return null; // not caused by any formula
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (await ok(mid)) hi = mid;
      else lo = mid;
    }
    return live[hi - 1];
  };

  for (let attempt = 0; ; attempt++) {
    try {
      return { outcome: await compile(source), warnings };
    } catch (error) {
      if (!(error instanceof TypstCompileError) || live.length === 0) throw error;
      const raw = error.raw as RawDiagnostic[];
      const message = firstError(raw, error.message);
      if (attempt >= MAX_RETRIES) {
        for (const formula of [...live]) fail(formula, message);
        continue;
      }
      const culprit = locate(source, live, raw) ?? (await bisect(message));
      if (!culprit) throw error;
      fail(culprit, message);
    }
  }
}
