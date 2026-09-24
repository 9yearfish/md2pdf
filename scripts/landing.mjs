/**
 * Checks the feature landing pages (src/i18n/landing.ts).
 *
 *  (a) every landing page, in every locale it exists in, has the right raw
 *      HTML without JavaScript: lang, its own title and description, one
 *      <h1>, a self canonical, hreflang only for the versions that exist
 *      (x-default only where there is an English one), OG alternates, and
 *      WebApplication + FAQPage (+ HowTo) structured data;
 *  (b) paths: the trailing-slash redirect, a 404 for a page a locale does
 *      not have, and a sitemap entry with the same alternates for each page;
 *  (c) no page carries another locale's strings, and each is as light as its
 *      locale's home page: same scripts and styles, one locale's data;
 *  (d) internal links: the home page's about section and every footer link
 *      to the locale's landing pages; the language links go to the same
 *      page where it exists, else to that locale's home page;
 *  (e) in the browser: each page loads its own sample; a saved draft wins
 *      over it, with an offer to load the example; the language redirect
 *      still applies to `/` only; the switcher keeps the page.
 */
import { brotliCompressSync } from 'node:zlib';
import { chromium } from 'playwright';
import { CHROMIUM, chooseLanguage } from './app-helpers.mjs';

const BASE = new URL('/', process.env.APP_URL ?? 'http://localhost:5200/').href.replace(/\/$/, '');

const ALL = ['en', 'zh', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'ru'];
const LOCALE = {
  en: { lang: 'en', hreflang: 'en', og: 'en_US' },
  zh: { lang: 'zh-CN', hreflang: 'zh', og: 'zh_CN' },
  ja: { lang: 'ja', hreflang: 'ja', og: 'ja_JP' },
  ko: { lang: 'ko', hreflang: 'ko', og: 'ko_KR' },
  es: { lang: 'es', hreflang: 'es', og: 'es_ES' },
  pt: { lang: 'pt-BR', hreflang: 'pt', og: 'pt_BR' },
  fr: { lang: 'fr', hreflang: 'fr', og: 'fr_FR' },
  de: { lang: 'de', hreflang: 'de', og: 'de_DE' },
  ru: { lang: 'ru', hreflang: 'ru', og: 'ru_RU' },
};
/** Kept in step with LANDINGS by hand, so a page that silently disappears fails here. */
const LANDINGS = [
  { slug: 'chatgpt-to-pdf', locales: ALL, howTo: true },
  { slug: 'deepseek-to-pdf', locales: ['en', 'zh', 'es', 'pt', 'ru'], howTo: true },
  { slug: 'doubao-to-pdf', locales: ['zh'], howTo: true },
  { slug: 'claude-to-pdf', locales: ['en', 'zh', 'ja', 'ko', 'de'], howTo: true },
  { slug: 'gemini-to-pdf', locales: ['en', 'zh', 'ja', 'ko', 'es', 'pt', 'fr', 'de'], howTo: true },
  { slug: 'mermaid-to-pdf', locales: ALL, howTo: true, mermaid: true },
  { slug: 'readme-to-pdf', locales: ['en', 'zh', 'es', 'pt'], howTo: true, mermaid: true },
  { slug: 'claude-md-to-pdf', locales: ['en'], howTo: true, mermaid: true },
  { slug: 'print-markdown', locales: ['en'], howTo: true, mermaid: true },
  { slug: 'markdown-pdf-chinese', locales: ['zh'] },
  { slug: 'markdown-pdf-japanese', locales: ['ja'] },
  { slug: 'markdown-pdf-korean', locales: ['ko'] },
];

const homePath = code => (code === 'en' ? '/' : `/${code}/`);
const landingPath = (code, slug) => `${homePath(code)}${slug}/`;

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

const attr = (html, re) => re.exec(html)?.[1] ?? null;
const all = (html, re) => [...html.matchAll(re)];
const decode = s =>
  s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const titleOf = html => decode(attr(html, /<title>([^<]*)<\/title>/) ?? '');
const descriptionOf = html => decode(attr(html, /<meta name="description" content="([^"]*)"/) ?? '');
const dataOf = html => JSON.parse(attr(html, /<script type="application\/json" id="md2pdf-locale">([\s\S]*?)<\/script>/) ?? '{}');
const graphOf = html => {
  try {
    return JSON.parse(attr(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/) ?? '{}')['@graph'] ?? [];
  } catch {
    return [];
  }
};
const assetsOf = html => all(html, /<(?:script|link)[^>]+(?:src|href)="(\/assets\/[^"]+)"/g).map(m => m[1]).sort().join(' ');

async function get(path) {
  const response = await fetch(BASE + path, { redirect: 'manual' });
  return { status: response.status, headers: response.headers, html: await response.text() };
}

/* ---------- fetch everything ---------- */

const home = {};
for (const code of ALL) home[code] = (await get(homePath(code))).html;
const origin = attr(home.en, /<link rel="canonical" href="([^"]+)\/"/);

const pages = [];
for (const landing of LANDINGS) {
  for (const code of landing.locales) {
    const path = landingPath(code, landing.slug);
    const response = await get(path);
    pages.push({ ...landing, code, path, ...response });
  }
}

/* ---------- (a) raw HTML ---------- */

const seenTitles = new Map();
for (const p of pages) {
  const { html } = p;
  const l = LOCALE[p.code];
  const title = titleOf(html);
  const description = descriptionOf(html);
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  const alternates = all(html, /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g).map(m => [m[1], m[2]]);
  const expected = p.locales.map(c => [LOCALE[c].hreflang, origin + landingPath(c, p.slug)]);
  if (p.locales.includes('en')) expected.push(['x-default', origin + landingPath('en', p.slug)]);
  const ogAlternates = all(html, /<meta property="og:locale:alternate" content="([^"]+)"/g).map(m => m[1]);
  const expectedOg = p.locales.filter(c => c !== p.code).map(c => LOCALE[c].og);
  const graph = graphOf(html);
  const app = graph.find(n => n['@type'] === 'WebApplication');
  const faq = graph.find(n => n['@type'] === 'FAQPage');
  const howTo = graph.find(n => n['@type'] === 'HowTo');
  const details = (html.match(/<details>/g) ?? []).length;
  const h1s = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/g).map(m => m[1]);
  const data = dataOf(html);
  const failures = [];
  const expect = (ok, what) => { if (!ok) failures.push(what); };

  expect(p.status === 200, `status ${p.status}`);
  expect(attr(html, /<html lang="([^"]+)"/) === l.lang, 'html lang');
  expect(title.length >= 10 && title.length <= 70, `title length ${title.length}`);
  expect(title !== titleOf(home[p.code]), 'title same as the home page');
  expect(!seenTitles.has(title), `title also used by ${seenTitles.get(title)}`);
  seenTitles.set(title, p.path);
  expect(description.length >= 40 && description !== descriptionOf(home[p.code]), 'description');
  expect(canonical === origin + p.path, `canonical ${canonical}`);
  expect(JSON.stringify(alternates) === JSON.stringify(expected), `hreflang ${JSON.stringify(alternates)}`);
  expect(attr(html, /<meta property="og:locale" content="([^"]+)"/) === l.og, 'og:locale');
  expect(JSON.stringify(ogAlternates) === JSON.stringify(expectedOg), `og:locale:alternate ${ogAlternates}`);
  expect(attr(html, /<meta property="og:url" content="([^"]+)"/) === canonical, 'og:url');
  expect(h1s.length === 1 && /<h1 class="intro-title">/.test(html), `${h1s.length} <h1>`);
  // The menu and the footer carry the same language links.
  const menuLinks = attr(html, /<nav class="lang-list"[^>]*>([\s\S]*?)<\/nav>/) ?? '';
  const footerLinks = attr(html, /<nav class="languages"[^>]*>([\s\S]*?)<\/nav>/) ?? '';
  expect(menuLinks.trim() && menuLinks.replace(/\s+/g, ' ') === footerLinks.replace(/\s+/g, ' '), 'menu and footer language links differ');
  expect(!/<select id="lang-select"/.test(html), 'native language <select> still present');
  expect(/<a class="brand" href="[^"]+">/.test(html), 'brand links home');
  expect(app?.url === canonical && app?.inLanguage === l.lang && app?.description === description, 'WebApplication');
  expect(faq?.inLanguage === l.lang && faq?.mainEntity?.length === details && details >= 3, `FAQPage ${faq?.mainEntity?.length} vs ${details}`);
  expect(Boolean(howTo) === Boolean(p.howTo), 'HowTo presence');
  if (howTo) {
    const steps = (html.match(/<li id="step-\d+">/g) ?? []).length;
    expect(howTo.step?.length === steps && steps >= 2 && howTo.inLanguage === l.lang, `HowTo steps ${howTo.step?.length} vs ${steps}`);
  }
  expect(!/lang-redirect/.test(html), 'redirect script on a landing page');
  expect(data.code === p.code && data.lang === l.lang && data.landing === p.slug, 'runtime data');
  expect(!/\{\{|<!--i18n:/.test(html), 'unfilled placeholder');
  check(!failures.length, `${p.path} raw HTML`, failures.length ? failures.join('; ') : `${title} (${title.length})`);
}

/* ---------- (b) paths, sitemap ---------- */

for (const path of ['/chatgpt-to-pdf', '/ja/chatgpt-to-pdf', '/ko/markdown-pdf-korean']) {
  const r = await get(path);
  check((r.status === 301 || r.status === 308) && r.headers.get('location') === `${path}/`, `${path} redirects to ${path}/`, `${r.status} ${r.headers.get('location')}`);
}
for (const path of ['/markdown-pdf-korean/', '/de/markdown-pdf-japanese/', '/ja/markdown-pdf-korean/', '/ja/deepseek-to-pdf/', '/ru/markdown-pdf-cyrillic/']) {
  check((await get(path)).status === 404, `${path} does not exist`);
}
{
  const r = await get('/ja/chatgpt-to-pdf/?utm_source=x');
  check(r.status === 200 && r.headers.get('content-security-policy')?.includes("connect-src 'self'"), 'landing pages get the production headers');
}

const sitemap = (await get('/sitemap.xml')).html;
const entries = new Map(
  all(sitemap, /<url>\s*<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g).map(m => [
    m[1],
    all(m[2], /hreflang="([^"]+)" href="([^"]+)"/g).map(a => [a[1], a[2]]),
  ]),
);
check(entries.size === ALL.length + pages.length, 'sitemap lists every home and landing page', `${entries.size} entries`);
for (const p of pages) {
  const html = p.html;
  const inPage = all(html, /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g).map(m => [m[1], m[2]]);
  const listed = entries.get(origin + p.path);
  if (!listed || JSON.stringify(listed) !== JSON.stringify(inPage)) {
    check(false, `sitemap entry for ${p.path} matches its hreflang`, JSON.stringify(listed));
  }
}
check(true, 'sitemap alternates checked for every landing page');

/* ---------- (c) weight and leaks ---------- */

/** Longer strings unique to one locale: titles, headings, UI strings, sample lines. */
function fingerprints(code) {
  const out = new Set();
  const data = dataOf(home[code]);
  for (const v of Object.values(data.ui)) if (typeof v === 'string' && v.length >= 14 && !v.includes('{')) out.add(v);
  out.add(titleOf(home[code]));
  for (const p of pages.filter(x => x.code === code)) {
    out.add(titleOf(p.html));
    out.add(descriptionOf(p.html));
    for (const line of dataOf(p.html).sample.split('\n')) if (line.length >= 24 && !/^[\s|:`$#>*-]/.test(line)) out.add(line);
  }
  return [...out];
}
const prints = Object.fromEntries(ALL.map(code => [code, fingerprints(code)]));
const shared = new Set(ALL.flatMap(a => prints[a].filter(s => ALL.some(b => b !== a && prints[b].includes(s)))));

for (const p of pages) {
  const leaks = [];
  for (const other of ALL) {
    if (other === p.code) continue;
    for (const s of prints[other]) if (!shared.has(s) && p.html.includes(s)) leaks.push(`${other}: “${s.slice(0, 40)}”`);
  }
  const data = dataOf(p.html);
  const homeData = dataOf(home[p.code]);
  const keys = Object.keys(data).sort().join();
  const size = Buffer.byteLength(p.html);
  const homeSize = Buffer.byteLength(home[p.code]);
  const br = brotliCompressSync(p.html).length;
  const homeBr = brotliCompressSync(home[p.code]).length;
  // Scripts that have no business on this page, in its text or its sample.
  const visible =
    decode(
      p.html
        .replace(/<head>[\s\S]*?<\/head>/, '')
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<nav class="languages"[\s\S]*?<\/nav>/, '')
        .replace(/<details class="lang"[\s\S]*?<\/details>/, '')
        .replace(/<[^>]+>/g, ' '),
    ) + ' ' + titleOf(p.html) + ' ' + descriptionOf(p.html) + ' ' + data.sample;
  for (const [script, allowed] of [
    [/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u, ['zh', 'ja']],
    [/\p{Script=Hangul}/u, ['ko']],
    [/\p{Script=Cyrillic}/u, ['ru']],
  ]) {
    const m = allowed.includes(p.code) ? null : visible.match(new RegExp(`.{0,12}${script.source}.{0,12}`, 'u'));
    if (m) leaks.push(`script: “${m[0].trim()}”`);
  }
  const failures = [];
  if (leaks.length) failures.push(`leaks ${leaks.slice(0, 3).join(', ')}`);
  if (keys !== 'code,landing,lang,sample,ui') failures.push(`data keys ${keys}`);
  if (JSON.stringify(data.ui) !== JSON.stringify(homeData.ui)) failures.push('ui strings differ from the home page');
  if (assetsOf(p.html) !== assetsOf(home[p.code]).replace(/\/assets\/lang-redirect-[^ ]+ ?/, '').trim()) failures.push('different scripts or styles');
  if (size > homeSize * 1.3 || br > homeBr * 1.3) failures.push(`${size} B (${br} B br) vs home ${homeSize} B (${homeBr} B br)`);
  check(!failures.length, `${p.path} is as light as ${homePath(p.code)} and carries only ${p.code}`, failures.join('; ') || `${size} B, ${br} B brotli; home ${homeSize} B, ${homeBr} B`);
}

/* ---------- (d) links ---------- */

for (const code of ALL) {
  const about = attr(home[code], /<section class="about">([\s\S]*?)<\/section>/) ?? '';
  const guides = attr(about, /<div class="features guides">([\s\S]*?)<\/div>\s*<h3>/) ?? '';
  const footer = attr(about, /<nav class="guides-nav"[^>]*>([\s\S]*?)<\/nav>/) ?? '';
  const mine = pages.filter(p => p.code === code).map(p => p.path);
  const linked = list => mine.filter(path => list.includes(`href="${path}"`));
  check(linked(guides).length === mine.length && linked(footer).length === mine.length, `${homePath(code)} links all ${mine.length} of its landing pages from the about section and footer`);
}
for (const p of pages) {
  const nav = attr(p.html, /<nav class="languages"[^>]*>([\s\S]*?)<\/nav>/) ?? '';
  const links = Object.fromEntries(all(nav, /href="([^"]+)"[^>]*data-locale="([^"]+)"/g).map(m => [m[2], m[1]]));
  const wrong = ALL.filter(c => links[c] !== (p.locales.includes(c) ? landingPath(c, p.slug) : homePath(c)));
  const footer = attr(p.html, /<nav class="guides-nav"[^>]*>([\s\S]*?)<\/nav>/) ?? '';
  const current = attr(footer, /<a href="([^"]+)" aria-current="page">/);
  if (wrong.length || current !== p.path || !footer.includes(`href="${homePath(p.code)}"`)) {
    check(false, `${p.path} language and footer links`, `wrong: ${wrong.join(' ')}; current ${current}`);
  }
}
check(true, 'language links go to the same page where it exists, else the home page');

/* ---------- (e) browser ---------- */

const browser = await chromium.launch({ executablePath: CHROMIUM });
const errors = [];
async function open(locale = 'en-US') {
  const context = await browser.newContext({ locale, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${page.url()} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${page.url()} console: ${m.text()}`); });
  return { context, page };
}
/**
 * The whole document. CodeMirror only keeps the lines in view in the DOM, so
 * a long sample is read from its state (an internal handle, fine for a test).
 */
const editorText = page =>
  page.evaluate(() => {
    const content = document.querySelector('.cm-content');
    const view = content?.cmTile?.view ?? content?.cmView?.view;
    if (view) return view.state.doc.toString();
    const lines = [...document.querySelectorAll('.cm-content .cm-line')];
    return lines.length ? lines.map(l => l.textContent).join('\n') : document.getElementById('editor')?.value;
  });
const pathOf = page => new URL(page.url()).pathname + new URL(page.url()).search;

// Every page opens with its own sample, rendered.
{
  const { context, page } = await open();
  for (const p of pages) {
    const sample = dataOf(p.html).sample;
    const heading = /^#\s+(.+)$/m.exec(sample)[1].replace(/[*_`]/g, '');
    await page.goto(BASE + p.path);
    await page.waitForSelector('#paper h1', { timeout: 10000 });
    await page.waitForSelector('.cm-content', { timeout: 30000 });
    const shown = await page.evaluate(() => document.querySelector('#paper h1')?.textContent ?? '');
    const text = await editorText(page);
    let diagrams = true;
    if (p.mermaid || sample.includes('```mermaid')) {
      const expected = (sample.match(/```mermaid/g) ?? []).length;
      diagrams = await page
        .waitForFunction(n => document.querySelectorAll('#paper .diagram svg').length === n && !document.querySelector('#paper .diagram-error'), expected, { timeout: 30000 })
        .then(() => true, () => false);
    }
    const ok = shown.trim() === heading.trim() && text === sample && diagrams;
    if (!ok) check(false, `${p.path} loads its sample`, `h1 “${shown}” vs “${heading}”, editor ${text === sample ? 'ok' : 'differs'}, diagrams ${diagrams}`);
  }
  check(true, `every landing page (${pages.length}) loads and renders its own sample`);
  // Looking is not editing: no draft was created by any of that.
  check((await page.evaluate(() => localStorage.getItem('md2pdf:draft:v1'))) === null, 'visiting landing pages saves no draft');
  await context.close();
}

// A returning visitor's draft wins over the landing sample, with an offer to load it.
{
  const { context, page } = await open('ja-JP');
  await page.goto(BASE + '/ja/');
  const draft = { text: '# 私の下書き\n\n保存された文書。', options: {}, savedAt: Date.now() };
  await page.evaluate(d => localStorage.setItem('md2pdf:draft:v1', JSON.stringify(d)), draft);
  await page.goto(BASE + '/ja/mermaid-to-pdf/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  check((await editorText(page)) === draft.text, 'a saved draft wins over the landing sample', await editorText(page));
  const offer = page.locator('.warnings-action', { hasText: 'サンプルを読み込む' });
  check(await offer.isVisible(), 'the landing page offers its example instead of hiding the draft');
  await offer.click();
  const sample = dataOf(pages.find(p => p.path === '/ja/mermaid-to-pdf/').html).sample;
  await page.waitForTimeout(300);
  check((await editorText(page)) === sample, 'loading the example shows it');
  check(JSON.parse(await page.evaluate(() => localStorage.getItem('md2pdf:draft:v1'))).text === draft.text, 'and leaves the saved draft alone');
  await page.locator('.warnings-action', { hasText: '元に戻す' }).click();
  await page.waitForTimeout(200);
  check((await editorText(page)) === draft.text, 'undo brings the draft back');
  await page.goto(BASE + '/ja/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  check(!(await page.locator('.warnings-action', { hasText: 'サンプルを読み込む' }).isVisible()), 'home pages make no such offer');
  await context.close();
}

// The pages added for specific tasks do what their copy promises.
{
  const { context, page } = await open();
  // /print-markdown/: Print is the call to action, and the sample shows a page break.
  const printHtml = pages.find(p => p.path === '/print-markdown/').html;
  check(/<strong>Print<\/strong>/.test(printHtml) && /VS Code/.test(printHtml) && /Mac/.test(printHtml), '/print-markdown/ leads with Print and answers VS Code and Mac');
  await page.goto(BASE + '/print-markdown/');
  await page.waitForSelector('#paper h1', { timeout: 10000 });
  check((await page.locator('#paper .page-break').count()) === 1, '/print-markdown/ sample shows its page break');
  check(await page.locator('#print').isVisible(), '/print-markdown/ has the Print button');

  // /readme-to-pdf/: an image the README names by a repository path is found by its file name.
  await page.goto(BASE + '/readme-to-pdf/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  await page.locator('.cm-content').fill('# Demo\n\n![Logo](docs/img/logo.png)\n\n![Badge](https://img.shields.io/badge/ci-passing-green)\n');
  await page.waitForSelector('#paper .missing-image', { timeout: 5000 });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.setInputFiles('#file-input', { name: 'logo.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('#paper img[alt="Logo"]', { timeout: 5000 }).catch(() => {});
  const images = await page.evaluate(() => ({
    logo: !!document.querySelector('#paper img[alt="Logo"]'),
    remote: document.querySelector('#paper .missing-image')?.textContent ?? '',
  }));
  check(images.logo, '/readme-to-pdf/: a dropped logo.png fills docs/img/logo.png');
  check(/Remote/i.test(images.remote), '/readme-to-pdf/: a remote badge is not fetched and says so', images.remote);
  await page.evaluate(() => localStorage.clear());

  // /claude-md-to-pdf/: an instruction file, with the @import line kept as text.
  const claudeSample = dataOf(pages.find(p => p.path === '/claude-md-to-pdf/').html).sample;
  check(/^# CLAUDE\.md$/m.test(claudeSample) && /^@docs\//m.test(claudeSample) && /```bash/.test(claudeSample), '/claude-md-to-pdf/ sample is a CLAUDE.md with commands and an @import');
  await context.close();
}

// The language redirect applies to `/` only; the switcher keeps the page.
{
  const { context, page } = await open('ja-JP');
  for (const path of ['/chatgpt-to-pdf/', '/mermaid-to-pdf/', '/de/mermaid-to-pdf/']) {
    await page.goto(BASE + path);
    await page.waitForSelector('#paper h1', { timeout: 10000 });
    await page.waitForTimeout(200);
    check(pathOf(page) === path, `a ja-JP browser on ${path} stays there`, pathOf(page));
  }
  await page.goto(BASE + '/');
  await page.waitForURL('**/ja/');
  check(pathOf(page) === '/ja/', 'while / still sends it to /ja/');

  await page.goto(BASE + '/ja/chatgpt-to-pdf/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  await Promise.all([page.waitForURL(BASE + '/de/chatgpt-to-pdf/'), chooseLanguage(page, 'de')]);
  check(pathOf(page) === '/de/chatgpt-to-pdf/', 'switching language on a landing page keeps the page');
  await page.goto(BASE + '/ja/markdown-pdf-japanese/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  await Promise.all([page.waitForURL(BASE + '/ko/'), chooseLanguage(page, 'ko')]);
  check(pathOf(page) === '/ko/', 'a page a locale lacks switches to that locale’s home page');
  await context.close();
}

// The action row sits on the panes' grid; the about section is collapsed, never hidden.
for (const width of [1440, 390]) {
  const { context, page } = await open();
  await page.setViewportSize({ width, height: 900 });
  await page.goto(BASE + '/readme-to-pdf/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  const box = sel => page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }, sel);
  const rows = async () => ({
    stats: await box('#stats'), layout: await box('#settings-toggle'), open: await box('#open-file'),
    print: await box('#print'), download: await box('#download'), full: await box('#fullscreen-toggle'),
    editor: await box('#editor-pane .editor-host'), sheet: await box('#scroller'),
  });
  let b = await rows();
  if (width === 1440) {
    check(Math.abs(b.full.r - b.sheet.r) <= 1 && b.print.l >= b.sheet.l, '1440: Print, Download and full screen sit over the proof, flush with the sheet', `${b.full.r} vs ${b.sheet.r}`);
    check(b.open.r <= b.editor.r + 1 && b.layout.l > b.stats.r, '1440: counts, Layout, New and Open sit over the source');
    check(new Set([b.stats, b.layout, b.open, b.print, b.download].map(x => Math.round((x.t + x.b) / 2))).size === 1, '1440: one row');
    await page.click('#fullscreen-toggle');
    await page.waitForTimeout(300);
    b = await rows();
    check(Math.abs(b.full.r - b.sheet.r) <= 1 && b.print.l >= b.sheet.l && b.open.r <= b.editor.r + 1, 'full screen: the row still follows the panes');
    await page.click('#fullscreen-toggle');
  } else {
    // One line for the counts and Layout; Print and Download in the bottom bar, below them.
    check(Math.abs((b.stats.t + b.stats.b) / 2 - (b.layout.t + b.layout.b) / 2) < 4 && b.download.t > b.stats.b, '390: counts and Layout first, then the buttons');
    check(b.download.r - b.download.l > 150, '390: Download takes the rest of the line', `${Math.round(b.download.r - b.download.l)} px`);
  }
  await page.click('#settings-toggle');
  const settings = await box('#settings');
  check(settings.t >= (await box('.actionbar')).b - 1, `${width}: the Layout panel opens below the row`);
  const about = await page.evaluate(() => {
    const d = document.querySelector('details.about-more');
    const faq = d.querySelector('details');
    return { open: d.open, summary: getComputedStyle(d.querySelector('summary')).display, faqInside: !!faq, text: d.textContent.length };
  });
  check(!about.open && about.summary !== 'none' && about.faqInside && about.text > 2000, `${width}: the about section and FAQ are collapsed in a <details>, all their text in the page`);
  check(await page.locator('.about footer .languages').isVisible(), `${width}: the footer stays visible outside it`);
  await page.click('details.about-more > summary');
  const faq = page.locator('details.about-more details').first();
  await faq.locator('summary').click();
  check((await page.evaluate(() => document.querySelector('details.about-more').open)) && (await faq.evaluate(d => d.open)) && (await faq.locator('p').first().isVisible()), `${width}: opening it shows the text, and FAQ entries open inside it`);
  await page.goto(BASE + '/readme-to-pdf/#step-2');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  check(await page.locator('#step-2').isVisible(), `${width}: a link to a step opens the section`);
  await context.close();
}

await browser.close();
check(!errors.length, 'no console or page errors', errors.slice(0, 3).join(' | '));
process.exit(problems.length ? 1 : 0);
