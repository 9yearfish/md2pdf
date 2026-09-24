/**
 * Error reports, sent to our own /api/log (functions/api/log.js → D1) so
 * failures in the field can be counted and debugged.
 *
 * Never the document: only the error's message and stack, the page path and
 * language, the build, the engine state and a few non-content facts the
 * caller passes (template, whether the document has maths, …). Each distinct
 * error is sent once per visit, and at most MAX_PER_VISIT in total.
 */
export type ErrorKind = 'error' | 'rejection' | 'pdf' | 'engine' | 'network' | 'diagram';

const ENDPOINT = '/api/log';
const MAX_PER_VISIT = 10;
const sent = new Set<string>();
let engineState = () => document.documentElement.dataset.engine ?? '';

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`.slice(0, 500), stack: error.stack };
  if (typeof error === 'string') return { message: error };
  try {
    return { message: JSON.stringify(error) ?? String(error) };
  } catch {
    return { message: String(error) };
  }
}

export function reportError(kind: ErrorKind, error: unknown, detail?: Record<string, string | number | boolean>): void {
  try {
    const { message, stack } = describe(error);
    const key = `${kind}|${message}`;
    if (sent.has(key) || sent.size >= MAX_PER_VISIT) return;
    sent.add(key);
    const body = JSON.stringify({
      kind,
      message: message.slice(0, 500),
      stack: stack?.slice(0, 2000),
      page: location.pathname,
      locale: document.documentElement.lang,
      build: __BUILD_ID__,
      engine: engineState(),
      detail,
    });
    // sendBeacon survives the page closing; fetch keepalive is the fallback.
    const queued = navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }));
    if (!queued) void fetch(ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
  } catch {
    // Reporting must never throw into the app.
  }
}

/** Catch what nothing else caught: uncaught errors and unhandled rejections. */
export function installErrorReporting(): void {
  window.addEventListener('error', event => {
    // Resource load errors (an <img> 404) arrive here too, without an error object.
    if (!event.error && !event.message) return;
    reportError('error', event.error ?? event.message, event.filename ? { at: `${event.filename}:${event.lineno}:${event.colno}` } : undefined);
  });
  window.addEventListener('unhandledrejection', event => reportError('rejection', event.reason));
}
