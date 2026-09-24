/**
 * Checks the interface's look and the files crawlers read:
 *
 *  (a) the palette is grey: every key element's computed colours are
 *      neutral (no hue) in the light and the dark theme, errors excepted,
 *      which must be red; focus is an ink ring; Mermaid draws in greys;
 *  (b) phones: Print and Download sit in a bar fixed to the bottom edge,
 *      reachable from anywhere on the page and never covering its end; the
 *      top row does not repeat them; opening a file shows its proof;
 *  (c) the empty state after New says what to do, in the page's language,
 *      and goes as soon as there is text;
 *  (d) prefers-reduced-motion: reduce turns every animation off;
 *  (e) share images: every page has an og:image (1200 x 630 PNG under 80 KB,
 *      served), its size and alt, and a large Twitter card; one <h1>;
 *  (f) robots.txt names the AI crawlers, llms.txt links every page, and
 *      _headers gives each page its Early Hints and cache policy.
 */
import { chromium } from 'playwright';
import { CHROMIUM } from './app-helpers.mjs';

const BASE = new URL('/', process.env.APP_URL ?? 'http://localhost:5200/').href.replace(/\/$/, '');

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

const get = async path => {
  const response = await fetch(BASE + path);
  return { status: response.status, headers: response.headers, body: Buffer.from(await response.arrayBuffer()) };
};

/** [r, g, b, a] from a computed colour; null for none/transparent/keywords. */
function channels(value) {
  const m = /^rgba?\(([^)]+)\)$/.exec(value.trim());
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length === 4 && parts[3] === 0) return null;
  return parts;
}
/** Neutral: the channels differ by at most 2 (rounding in colour-mix). */
const neutral = value => {
  const c = channels(value);
  return !c || Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) <= 2;
};
const red = value => {
  const c = channels(value);
  return Boolean(c && c[0] - Math.max(c[1], c[2]) > 60);
};

const browser = await chromium.launch({ executablePath: CHROMIUM });
const errors = [];
async function open(options = {}, path = '/', setup = async () => {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US', serviceWorkers: 'block', ...options });
  // Anything that must hold from the first request, e.g. blocking the engine,
  // which starts downloading right after the first frame.
  await setup(context);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + path);
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  return { context, page };
}

/** Every colour of every element worth checking, as [where, property, value]. */
const PROPS = ['color', 'background-color', 'border-top-color', 'border-left-color', 'outline-color', 'fill', 'stroke', 'box-shadow'];
const collect = page =>
  page.evaluate(props => {
    const selectors = [
      'body', '.toolbar', '.brand', '.privacy li', '.privacy .icon', '.lang summary', '.intro-title', '.intro-title span', '.intro-lead',
      '.actionbar', '#stats', '#settings-toggle', '#new-doc', '#open-file', '#print', '#download', '#fullscreen-toggle',
      '.pane-header', '.editor-host', '.cm-editor', '.cm-content', '.scroller', '.paper', '.paper a', '.statusbar', '#engine-status', '#engine-status .dot',
      '.about-more > summary', '.about a', '.about footer', '.guides-nav a', '.languages a', '#warnings', '.warnings-action', '.empty-state', '.empty-title', '#empty-paste', '#empty-open',
    ];
    const out = [];
    for (const selector of selectors) {
      for (const node of [...document.querySelectorAll(selector)].slice(0, 3)) {
        const style = getComputedStyle(node);
        for (const prop of props) {
          const value = style.getPropertyValue(prop);
          // Box shadows: only their colours matter.
          for (const colour of prop === 'box-shadow' ? value.match(/rgba?\([^)]+\)/g) ?? [] : [value]) out.push([selector, prop, colour]);
        }
      }
    }
    for (const [selector, pseudo] of [['.live', '::before'], ['.live', '::after'], ['.preview-pane', '::after'], ['.editor-pane .pane-header', '::after']]) {
      const node = document.querySelector(selector);
      if (node) out.push([selector + pseudo, 'background-color', getComputedStyle(node, pseudo).backgroundColor]);
    }
    return out;
  }, PROPS);

/* ---------- (a) palette ---------- */

for (const colorScheme of ['light', 'dark']) {
  const { context, page } = await open({ colorScheme });
  const coloured = (await collect(page)).filter(([, , value]) => !neutral(value));
  check(!coloured.length, `${colorScheme}: every interface colour is a neutral grey`, coloured.slice(0, 4).map(c => c.join(' ')).join('; '));

  // Focus: a 2px ink ring, standing off.
  await page.focus('#download');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { id: document.activeElement.id, width: s.outlineWidth, style: s.outlineStyle, offset: s.outlineOffset, color: s.outlineColor, ink: getComputedStyle(document.body).color };
  });
  check(ring.id === 'download' && ring.width === '2px' && ring.style === 'solid' && ring.offset === '2px' && ring.color === ring.ink, `${colorScheme}: focus is a 2px ink ring with an offset`, JSON.stringify(ring));

  // Notices: news in ink, a warning in its outlined slip, both grey.
  await page.click('#new-doc');
  await page.waitForSelector('#warnings[data-kind="ok"]:not([hidden])');
  const ok = (await collect(page)).filter(([s]) => s.startsWith('#warnings') || s.startsWith('.warnings') || s.startsWith('.empty'));
  check(ok.length > 0 && ok.every(([, , v]) => neutral(v)), `${colorScheme}: the confirmation notice and the empty state are grey`);
  await page.setInputFiles('#file-input', { name: 'archive.zip', mimeType: 'application/zip', buffer: Buffer.from('PK') });
  await page.waitForSelector('#warnings[data-kind="warn"]:not([hidden])');
  const warn = await page.evaluate(() => {
    const s = getComputedStyle(document.getElementById('warnings'));
    return { bg: s.backgroundColor, color: s.color, border: s.borderTopColor, icon: document.querySelector('#warnings .warnings-icon use')?.getAttribute('href') };
  });
  check(neutral(warn.bg) && neutral(warn.color) && neutral(warn.border) && warn.icon === '#i-warn', `${colorScheme}: a warning is grey, told apart by its shape and icon`, JSON.stringify(warn));
  await context.close();

  // An error is the one red thing.
  {
    const { context, page } = await open({ colorScheme }, '/', ctx => ctx.route(/\.wasm(\?|$)/, route => route.abort()));
    await page.click('#download');
    await page.waitForSelector('#warnings[data-kind="error"]:not([hidden])', { timeout: 60000 });
    const bg = await page.evaluate(() => getComputedStyle(document.getElementById('warnings')).backgroundColor);
    check(red(bg), `${colorScheme}: an error notice is red`, bg);
    await context.close();
  }
}

// Mermaid draws in greys unless the document says otherwise.
{
  const { context, page } = await open();
  await page.locator('.cm-content').fill('# D\n\n```mermaid\nflowchart LR\n  A[One] --> B{Two}\n  B --> C[(Three)]\n```\n');
  await page.waitForSelector('#paper .diagram svg', { timeout: 30000 });
  const fills = await page.evaluate(() =>
    [...document.querySelectorAll('#paper .diagram svg :is(rect, polygon, path, circle, ellipse)')]
      .flatMap(n => [getComputedStyle(n).fill, getComputedStyle(n).stroke])
      .filter(v => v && v !== 'none'),
  );
  const coloured = fills.filter(v => !neutral(v) && !/url\(/.test(v));
  check(fills.length > 4 && !coloured.length, 'Mermaid uses a neutral theme in the preview', coloured.slice(0, 3).join(' '));
  await context.close();
}

/* ---------- (b) phones ---------- */

{
  const { context, page } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const bar = async () =>
    page.evaluate(() => {
      const box = s => document.querySelector(s).getBoundingClientRect().toJSON();
      const actions = document.querySelector('.actions-output');
      return {
        position: getComputedStyle(actions).position,
        bar: box('.actions-output'),
        download: box('#download'),
        print: box('#print'),
        stats: box('#stats'),
        height: innerHeight,
        padding: parseFloat(getComputedStyle(document.body).paddingBottom),
        downloads: document.querySelectorAll('#download').length,
      };
    });
  // The bar rises into place on load; measure it at rest.
  await page.waitForTimeout(700);
  let b = await bar();
  check(b.position === 'fixed' && Math.abs(b.bar.bottom - b.height) <= 1, '390: Print and Download sit in a bar on the bottom edge', JSON.stringify(b.bar));
  check(b.download.width > b.print.width * 1.5 && b.download.height >= 44 && b.print.height >= 44, '390: Download is the wide primary, both thumb-sized', `${Math.round(b.download.width)} × ${Math.round(b.download.height)}`);
  check(b.downloads === 1 && b.stats.bottom < b.bar.top, '390: the top row does not repeat them');
  check(b.padding >= b.bar.height - 1, '390: the page is padded for the bar', `${b.padding} vs ${b.bar.height}`);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  b = await bar();
  const last = await page.evaluate(() => document.querySelector('.about footer .languages').getBoundingClientRect().bottom);
  check(Math.abs(b.bar.bottom - b.height) <= 1 && last <= b.bar.top + 1, '390: at the end of the page the bar is still there and covers nothing', `last line ${Math.round(last)}, bar ${Math.round(b.bar.top)}`);
  await page.evaluate(() => window.scrollTo(0, 0));

  // Opening a file shows its proof.
  await page.setInputFiles('#file-input', { name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('# Notes\n\nOpened on a phone.\n') });
  await page.waitForFunction(() => document.querySelector('#paper h1')?.textContent === 'Notes');
  const view = await page.evaluate(() => ({ view: document.querySelector('.split').dataset.view, pressed: document.getElementById('show-proof').getAttribute('aria-pressed') }));
  check(view.view === 'proof' && view.pressed === 'true', '390: opening a file switches to the proof', JSON.stringify(view));
  await context.close();
}

/* ---------- (c) empty state ---------- */

for (const [path, text] of [['/', 'Paste Markdown, drop a .md file, or open one'], ['/ja/', 'Markdown を貼り付ける']]) {
  const { context, page } = await open({}, path);
  check(!(await page.locator('#empty-state').isVisible()), `${path}: no empty state over the sample`);
  await page.click('#new-doc');
  await page.waitForTimeout(300);
  const shown = await page.evaluate(() => ({
    visible: !document.getElementById('empty-state').hidden,
    text: document.querySelector('#empty-state .empty-title').textContent,
    open: !!document.getElementById('empty-open').offsetParent,
    paste: document.getElementById('empty-paste').hidden === (typeof navigator.clipboard?.readText !== 'function'),
  }));
  check(shown.visible && shown.text.includes(text) && shown.open && shown.paste, `${path}: after New the source says what to do, with Open (and Paste where the clipboard can be read)`, JSON.stringify(shown));
  await page.locator('.cm-content').fill('# Back');
  await page.waitForTimeout(250);
  check(await page.locator('#empty-state').isHidden(), `${path}: and goes once there is text`);
  await context.close();
}
{
  // Paste reads the clipboard where it is allowed.
  const { context, page } = await open();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('#new-doc');
  await page.evaluate(() => navigator.clipboard.writeText('# From the clipboard\n\nPasted.'));
  await page.click('#empty-paste');
  await page.waitForFunction(() => document.querySelector('#paper h1')?.textContent === 'From the clipboard', null, { timeout: 5000 }).catch(() => {});
  check((await page.evaluate(() => document.querySelector('#paper h1')?.textContent)) === 'From the clipboard', 'Paste puts the clipboard into the editor');
  await context.close();
}

/* ---------- (d) reduced motion ---------- */

{
  const { context, page } = await open({ reducedMotion: 'reduce' });
  const still = await page.evaluate(() => ({
    running: document.getAnimations().map(a => a.animationName ?? a.constructor.name),
    title: getComputedStyle(document.querySelector('.intro-title')).animationName,
    pane: getComputedStyle(document.querySelector('.preview-pane')).animationName,
    live: getComputedStyle(document.querySelector('.live'), '::after').animationName,
    button: getComputedStyle(document.getElementById('download')).transitionDuration,
  }));
  check(!still.running.length && still.title === 'none' && still.pane === 'none' && still.live === 'none' && /^0s/.test(still.button), 'reduced motion: nothing animates', JSON.stringify(still));
  await page.click('#new-doc');
  await page.waitForTimeout(100);
  check(!(await page.evaluate(() => document.getAnimations().length)), 'reduced motion: not even a notice slides in');
  await context.close();

  const moving = await open({ reducedMotion: 'no-preference' });
  const names = await moving.page.evaluate(() => [getComputedStyle(document.querySelector('.intro-title')).animationName, getComputedStyle(document.querySelector('.preview-pane')).animationName]);
  check(names[0] === 'enter' && names[1].includes('marks'), 'otherwise the page settles in and the crop marks draw', names.join(' / '));
  await moving.context.close();
}

/* ---------- (e) share images, headings ---------- */

const sitemap = (await get('/sitemap.xml')).body.toString();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
check(pages.length >= 54, `the sitemap lists ${pages.length} pages`);
const attr = (html, re) => re.exec(html)?.[1] ?? null;
const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const images = new Map();
for (const path of pages) {
  const html = (await get(path)).body.toString();
  const image = attr(html, /<meta property="og:image" content="([^"]+)"/);
  const alt = decode(attr(html, /<meta property="og:image:alt" content="([^"]+)"/) ?? '');
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  const h1 = decode((h1s[0]?.[1] ?? '').replace(/<[^>]+>/g, ''));
  const failures = [];
  if (!image || !/^https?:\/\/[^/]+\/og\/[\w-]+\.png$/.test(image)) failures.push(`og:image ${image}`);
  if (attr(html, /<meta property="og:image:width" content="(\d+)"/) !== '1200' || attr(html, /<meta property="og:image:height" content="(\d+)"/) !== '630') failures.push('size');
  if (attr(html, /<meta name="twitter:card" content="([^"]+)"/) !== 'summary_large_image') failures.push('twitter:card');
  if (attr(html, /<meta name="twitter:image" content="([^"]+)"/) !== image) failures.push('twitter:image');
  if (h1s.length !== 1 || !/<h1 class="intro-title">/.test(html)) failures.push(`${h1s.length} <h1>`);
  if (!alt || alt !== h1) failures.push(`alt “${alt}” vs h1 “${h1}”`);
  if (/class="sr-only"/.test(html.replace(/<head>[\s\S]*?<\/head>/, ''))) failures.push('screen-reader-only text in the page');
  if (image) images.set(new URL(image).pathname, path);
  if (failures.length) check(false, `${path}: share image and heading`, failures.join('; '));
}
check(images.size === pages.length, `every page has its own share image, one <h1> and the image's alt is that <h1> (${images.size})`);
let largest = 0;
for (const file of images.keys()) {
  const { status, headers, body } = await get(file);
  const png = body.subarray(1, 4).toString() === 'PNG';
  const [w, h] = [body.readUInt32BE(16), body.readUInt32BE(20)];
  largest = Math.max(largest, body.length);
  if (status !== 200 || !png || w !== 1200 || h !== 630 || body.length > 80 * 1024 || !/image\/png/.test(headers.get('content-type') ?? '')) {
    check(false, `${file} is a 1200 x 630 PNG under 80 KB`, `${status} ${w}x${h} ${body.length} B`);
  }
}
check(true, `every share image is a served 1200 x 630 PNG, the largest ${Math.round(largest / 1024)} KB`);
{
  const html = (await get('/')).body.toString();
  const icons = ['/favicon.svg', '/apple-touch-icon.png', '/manifest.webmanifest'];
  const linked = icons.every(i => html.includes(`href="${i}"`));
  const served = (await Promise.all(icons.map(get))).every(r => r.status === 200);
  const themes = [...html.matchAll(/<meta name="theme-color" content="(#[0-9a-f]{6})" media="\(prefers-color-scheme: (light|dark)\)"/g)];
  check(linked && served && themes.length === 2, 'favicon, touch icon, manifest and a theme colour per scheme', `${themes.length} theme colours`);
  // The product is Free MD2PDF wherever a visitor reads its name.
  const manifest = JSON.parse((await get('/manifest.webmanifest')).body.toString());
  const graph = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1])['@graph'];
  const brand = {
    siteName: /<meta property="og:site_name" content="Free MD2PDF" \/>/.test(html),
    app: graph.find(n => n['@type'] === 'WebApplication')?.name === 'Free MD2PDF',
    manifest: manifest.name.startsWith('Free MD2PDF') && manifest.short_name === 'Free MD2PDF',
    appleTitle: /<meta name="apple-mobile-web-app-title" content="Free MD2PDF" \/>/.test(html),
    // Titles carry the brand only where it fits the ~60-character SERP width;
    // the home page names the site through its WebSite entry instead.
    title: /<title>[^<]* · Free MD2PDF<\/title>/.test((await get('/readme-to-pdf/')).body.toString()) ||
      /<title>[^<]* · Free MD2PDF<\/title>/.test((await get('/zh/deepseek-to-pdf/')).body.toString()),
    website: graph.find(n => n['@type'] === 'WebSite')?.name === 'Free MD2PDF',
    sample: html.includes('"sample":"# Free MD2PDF sample document\\n'),
    wordmark: /<span class="brand-name"><span class="brand-free">Free<\/span>MD2PDF<span class="brand-tld">\.com<\/span><\/span>/.test(html),
  };
  check(Object.values(brand).every(Boolean), 'the brand reads Free MD2PDF in the header, OG, JSON-LD and manifest', JSON.stringify(brand));
}

/* ---------- (f) crawlers, headers ---------- */

{
  const robots = (await get('/robots.txt')).body.toString();
  const bots = ['GPTBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot', 'Googlebot'];
  const allowed = bots.filter(bot => new RegExp(`User-agent: ${bot}\\nAllow: /\\n`).test(robots));
  check(allowed.length === bots.length && /^User-agent: \*\nAllow: \/$/m.test(robots) && /^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(robots), 'robots.txt allows everyone and names the AI crawlers', `${allowed.length}/${bots.length}`);

  const llms = await get('/llms.txt');
  const text = llms.body.toString();
  const origin = new URL([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)][0][1]).origin;
  const missing = pages.filter(path => !text.includes(`](${origin}${path})`));
  check(llms.status === 200 && /^# Free MD2PDF\n\n> /.test(text) && /## Features/.test(text) && /## Privacy/.test(text) && !missing.length, 'llms.txt describes Free MD2PDF and links every page', missing.slice(0, 3).join(' '));
  const full = await get('/llms-full.txt');
  check(full.status === 200 && full.body.length > 5000 && /Frequently asked questions/.test(full.body.toString()), 'llms-full.txt carries the text', `${full.body.length} B`);

  for (const path of ['/', '/zh/', '/ja/chatgpt-to-pdf/']) {
    const r = await get(path);
    const html = r.body.toString();
    const css = attr(html, /<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+)"/);
    const js = attr(html, /<script type="module"[^>]*src="(\/assets\/[^"]+)"/);
    const link = r.headers.get('link') ?? '';
    const cache = r.headers.get('cache-control') ?? '';
    const hints = link.includes(`<${css}>; rel=preload; as=style`) && link.includes(`<${js}>; rel=modulepreload`) && !/\.(woff2|otf|ttf|wasm)>/.test(link) && !/mermaid/.test(link);
    check(hints && cache === 'public, max-age=0, must-revalidate', `${path}: Early Hints for its stylesheet and entry module only; revalidated HTML`, `${cache} | ${link}`);
  }
  const asset = await get(attr((await get('/')).body.toString(), /<script type="module"[^>]*src="(\/assets\/[^"]+)"/));
  check(/immutable/.test(asset.headers.get('cache-control') ?? ''), 'fingerprinted assets are immutable');
  const og = await get([...images.keys()][0]);
  check(/max-age=\d{4,}/.test(og.headers.get('cache-control') ?? '') && !/immutable/.test(og.headers.get('cache-control') ?? ''), 'share images are cached, not forever');
}

await browser.close();
check(!errors.length, 'no page errors', errors.slice(0, 3).join(' | '));
process.exit(problems.length ? 1 : 0);
