/**
 * POST /api/log — stores one error report from the app in D1.
 *
 * The client (src/ui/errors.ts) sends only error facts, never document
 * content. This endpoint trims every field, accepts small bodies only and
 * never echoes anything back, so it cannot be used to read data.
 */
const LIMITS = { kind: 16, message: 500, stack: 2000, page: 200, locale: 16, build: 40, engine: 24, detail: 600, ua: 300 };
const KINDS = new Set(['error', 'rejection', 'pdf', 'engine', 'network', 'diagram']);

const clip = (value, max) => (typeof value === 'string' ? value.slice(0, max) : null);

export async function onRequestPost({ request, env }) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 8192) return new Response(null, { status: 413 });
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const kind = KINDS.has(body?.kind) ? body.kind : null;
  const message = clip(body?.message, LIMITS.message);
  if (!kind || !message) return new Response(null, { status: 400 });

  const detail = body.detail && typeof body.detail === 'object' ? JSON.stringify(body.detail).slice(0, LIMITS.detail) : null;
  try {
    await env.ERRORS.prepare(
      'INSERT INTO errors (kind, message, stack, page, locale, build, engine, detail, ua, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        kind,
        message,
        clip(body.stack, LIMITS.stack),
        clip(body.page, LIMITS.page),
        clip(body.locale, LIMITS.locale),
        clip(body.build, LIMITS.build),
        clip(body.engine, LIMITS.engine),
        detail,
        clip(request.headers.get('user-agent'), LIMITS.ua),
        request.cf?.country ?? null,
      )
      .run();
  } catch {
    // A logging failure must never become a user-visible failure.
  }
  return new Response(null, { status: 204 });
}

export function onRequest() {
  return new Response(null, { status: 405, headers: { allow: 'POST' } });
}
