/**
 * Renders the share images and the app icons into public/:
 *
 *   public/og/<code>[-<slug>].png   1200 x 630, one per page (src/i18n/pages.ts
 *                                   names them), in the page's language: its
 *                                   <h1>, the brand, and a proof sheet with
 *                                   crop marks
 *   public/apple-touch-icon.png     180 x 180
 *   public/icon-192.png, icon-512.png   for the web manifest
 *
 * Run `npm run og` after changing a page's heading, then commit the PNGs; the
 * build fails if a page's image is missing. Text is set with the bundled Noto
 * faces (CJK included), in Chromium via Playwright, and the result is reduced
 * to a grey palette with Pillow (python3 -m pip install pillow) so each file
 * stays well under 80 KB.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { CHROMIUM } from './app-helpers.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const FONTS = pathToFileURL(join(PUBLIC, 'fonts')).href;
const WORK = mkdtempSync(join(tmpdir(), 'md2pdf-og-'));

// The page definitions are TypeScript; Vite loads them without the app's plugins.
const vite = await createServer({ configFile: false, root: ROOT, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { PAGES, ogImagePath, pageHeading, OG_WIDTH, OG_HEIGHT, BRAND } = await vite.ssrLoadModule('/src/i18n/pages.ts');
await vite.close();

const CJK = { zh: 'OG SC', ja: 'OG JP', ko: 'OG KR' };

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const face = (family, file, weight) =>
  `@font-face { font-family: "${family}"; src: url("${FONTS}/${file}"); font-weight: ${weight}; }`;

const FACES = [
  face('OG Sans', 'NotoSans-Regular.ttf', 400),
  face('OG Sans', 'NotoSans-Bold.ttf', 700),
  face('OG Mono', 'DejaVuSansMono.ttf', 400),
  face('OG SC', 'NotoSansSC-Regular.full.otf', 400),
  face('OG SC', 'NotoSansSC-Bold.full.otf', 700),
  face('OG JP', 'NotoSansJP-Regular.full.otf', 400),
  face('OG JP', 'NotoSansJP-Bold.full.otf', 700),
  face('OG KR', 'NotoSansKR-Regular.full.otf', 400),
  face('OG KR', 'NotoSansKR-Bold.full.otf', 700),
].join('\n');

/** The brand mark: a page with a folded corner and three lines of text. */
const MARK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.75h8.5L19.25 7.5v13.75H6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.25 2.75V7.75h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12.5h7M9 15.5h7M9 18.5h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

function card({ lang, code, title, tagline, claims }) {
  const cjk = CJK[code];
  const sans = `"OG Sans"${cjk ? `, "${cjk}"` : ''}, sans-serif`;
  const mono = `"OG Mono"${cjk ? `, "${cjk}"` : ''}, monospace`;
  const long = [...(title + tagline)].length;
  const size = cjk ? (long > 26 ? 56 : 64) : long > 60 ? 54 : long > 42 ? 60 : 68;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
${FACES}
* { box-sizing: border-box; margin: 0; }
html, body { width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; overflow: hidden; }
body { position: relative; background: #f4f4f4; color: #111; font-family: ${sans}; }
.brand { position: absolute; left: 72px; top: 64px; display: flex; align-items: center; gap: 14px; font: 400 26px/1 ${mono}; letter-spacing: 0.02em; }
.brand svg { width: 34px; height: 34px; }
.brand b { color: #6b6b6b; font-weight: 400; }
h1 { position: absolute; left: 72px; top: 150px; width: 640px; font-size: ${size}px; line-height: 1.12; font-weight: 700; letter-spacing: ${cjk ? '0' : '-0.025em'}; text-wrap: balance; word-break: ${code === 'ja' ? 'auto-phrase' : 'normal'}; }
h1 span { display: block; margin-top: 10px; color: #575757; font-weight: 400; }
.claims { position: absolute; left: 72px; bottom: 60px; width: 640px; padding-top: 22px; border-top: 1px solid #c4c4c4; color: #3a3a3a; font: 400 ${cjk ? 19 : 17}px/1.4 ${mono}; letter-spacing: ${cjk ? '0.06em' : '0.16em'}; text-transform: uppercase; }
/* The proof: a white sheet running off the bottom edge, crop marks at its corners. */
.sheet { position: absolute; left: 812px; top: 92px; width: 318px; height: 600px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 26px 48px -24px rgba(0,0,0,.35); padding: 40px 34px; }
.mark { position: absolute; background: #9a9a9a; }
.l { position: relative; height: 9px; margin-bottom: 13px; background: #d6d6d6; }
.h { height: 16px; width: 72%; margin-bottom: 22px; background: #2a2a2a; }
.h2 { height: 11px; width: 46%; margin: 24px 0 16px; background: #555; }
.flow { display: flex; align-items: center; gap: 10px; margin: 22px 0 24px; }
.flow i { display: block; width: 58px; height: 28px; border: 1.5px solid #555; background: #efefef; }
.flow b { display: block; flex: 1; height: 1.5px; background: #555; }
</style></head><body>
<div class="brand">${MARK}<span><b>${esc(BRAND.split(' ')[0])}</b> ${esc(BRAND.split(' ').slice(1).join(' '))}</span></div>
<h1>${esc(title)}<span>${esc(tagline.replace(/^[\s:：]+/, ''))}</span></h1>
<div class="claims">${esc(claims)}</div>
<div class="sheet">
  <div class="l h"></div>
  <div class="l"></div><div class="l"></div><div class="l" style="width:82%"></div>
  <div class="flow"><i></i><b></b><i></i><b></b><i></i></div>
  <div class="l"></div><div class="l" style="width:64%"></div>
  <div class="l h2"></div>
  <div class="l"></div><div class="l"></div><div class="l" style="width:90%"></div><div class="l"></div><div class="l" style="width:58%"></div>
</div>
${[
  // top-left, top-right: a horizontal and a vertical hairline 12px off each corner
  'left:782px;top:91px;width:22px;height:1px', 'left:811px;top:62px;width:1px;height:22px',
  'left:1138px;top:91px;width:22px;height:1px', 'left:1130px;top:62px;width:1px;height:22px',
].map(style => `<div class="mark" style="${style}"></div>`).join('')}
</body></html>`;
}

function icon(size) {
  const pad = Math.round(size * 0.16);
  return `<!doctype html><html><head><style>
* { margin: 0; } html, body { width: ${size}px; height: ${size}px; background: #111; color: #f4f4f4; }
svg { position: absolute; inset: ${pad}px; width: ${size - 2 * pad}px; height: ${size - 2 * pad}px; }
</style></head><body>${MARK}</body></html>`;
}

/** Grey palette, maximum compression: grey text on grey needs few levels. */
function optimise(files) {
  const script = `
import sys
from PIL import Image
for path in sys.argv[1:]:
    image = Image.open(path).convert('L').quantize(colors=48, dither=Image.Dither.NONE)
    image.save(path, optimize=True)
`;
  try {
    execFileSync('python3', ['-c', script, ...files], { stdio: 'inherit' });
  } catch {
    console.warn('og: Pillow unavailable, PNGs left unoptimised (python3 -m pip install pillow)');
  }
}

const browser = await chromium.launch({ executablePath: CHROMIUM });
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function render(html, width, height, out) {
  const file = join(WORK, 'card.html');
  writeFileSync(file, html);
  await page.setViewportSize({ width, height });
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: 'png' });
}

const written = [];
for (const ref of PAGES) {
  const { messages } = ref;
  const { title, tagline } = pageHeading(ref);
  const claims = messages.page.privacyBadge.split(' · ').slice(1, 4).join(' · ');
  const out = join(PUBLIC, ogImagePath(ref));
  await render(card({ lang: messages.locale.lang, code: messages.locale.code, title, tagline, claims }), OG_WIDTH, OG_HEIGHT, out);
  written.push(out);
}
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  const out = join(PUBLIC, name);
  await render(icon(size), size, size, out);
  written.push(out);
}
await browser.close();

optimise(written);
let largest = 0;
for (const file of written) largest = Math.max(largest, statSync(file).size);
console.log(`og: ${written.length} images, largest ${Math.round(largest / 1024)} KB`);
if (largest > 80 * 1024) {
  console.error('og: an image is over 80 KB');
  process.exit(1);
}
