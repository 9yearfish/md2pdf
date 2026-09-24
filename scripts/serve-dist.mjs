/**
 * Static server for dist/ that applies the rules in public/_headers, so the
 * production Content-Security-Policy is exercised before deploying. Vite's own
 * preview server ignores _headers, which would let a broken policy through.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT ?? 5200);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

/** Parse the Cloudflare _headers file into [globPrefix, headers] pairs. */
function parseHeaders() {
  const file = path.join(ROOT, '_headers');
  if (!fs.existsSync(file)) return [];
  const rules = [];
  let current = null;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trimEnd();
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      current = { pattern: line.trim(), headers: [] };
      rules.push(current);
    } else if (current) {
      const at = line.indexOf(':');
      if (at > 0) current.headers.push([line.slice(0, at).trim(), line.slice(at + 1).trim()]);
    }
  }
  return rules;
}

const RULES = parseHeaders();

const matches = (pattern, pathname) =>
  pattern.endsWith('*') ? pathname.startsWith(pattern.slice(0, -1)) : pattern === pathname;

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const requested = decodeURIComponent(url.pathname);
    let pathname = requested;
    if (pathname.endsWith('/')) pathname += 'index.html';

    // Like Cloudflare Pages: /zh redirects to /zh/, which serves zh/index.html,
    // and so does every landing page (/ja/chatgpt-to-pdf -> /ja/chatgpt-to-pdf/).
    const directory = path.join(ROOT, pathname);
    if (!pathname.endsWith('/index.html') && directory.startsWith(ROOT) && fs.existsSync(path.join(directory, 'index.html'))) {
      res.writeHead(308, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }

    const file = path.join(ROOT, pathname);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }

    // Rules match the URL (`/zh/`) as Pages does, or the file (`/zh/index.html`).
    // A header set by several rules, like Link, is joined as Pages joins it.
    const headers = new Map();
    for (const rule of RULES) {
      if (matches(rule.pattern, requested) || matches(rule.pattern, pathname)) {
        for (const [name, value] of rule.headers) {
          const key = name.toLowerCase();
          headers.set(key, headers.has(key) ? `${headers.get(key)}, ${value}` : value);
        }
      }
    }
    for (const [name, value] of headers) res.setHeader(name, value);
    res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream');
    res.writeHead(200);
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`serving dist on http://localhost:${PORT}`));
