/**
 * Checks the localised pages and the language selection.
 *
 *  (a) every locale page carries the right lang, title, canonical, a full
 *      hreflang set and localised structured data in its raw HTML, no JS;
 *  (b) `/` sends a ja-JP browser to /ja/ and leaves an en-US one alone;
 *  (c) a stored preference beats the browser's language;
 *  (d) the switcher changes locale and the draft comes along;
 *  (e) no page is left with another language's strings, and every sample
 *      renders its diagram;
 *  (f) a locale page, served from a subpath, still finds the fonts and
 *      produces a PDF.
 */
import { chromium } from 'playwright';
import { CHROMIUM, chooseLanguage, downloadPdf, setDocument } from './app-helpers.mjs';

const BASE = new URL('/', process.env.APP_URL ?? 'http://localhost:5200/').href.replace(/\/$/, '');
const LOCALES = [
  { code: 'en', path: '/', lang: 'en', hreflang: 'en', og: 'en_US' },
  { code: 'zh', path: '/zh/', lang: 'zh-CN', hreflang: 'zh', og: 'zh_CN' },
  { code: 'ja', path: '/ja/', lang: 'ja', hreflang: 'ja', og: 'ja_JP' },
  { code: 'ko', path: '/ko/', lang: 'ko', hreflang: 'ko', og: 'ko_KR' },
  { code: 'es', path: '/es/', lang: 'es', hreflang: 'es', og: 'es_ES' },
  { code: 'pt', path: '/pt/', lang: 'pt-BR', hreflang: 'pt', og: 'pt_BR' },
  { code: 'fr', path: '/fr/', lang: 'fr', hreflang: 'fr', og: 'fr_FR' },
  { code: 'de', path: '/de/', lang: 'de', hreflang: 'de', og: 'de_DE' },
  { code: 'ru', path: '/ru/', lang: 'ru', hreflang: 'ru', og: 'ru_RU' },
];
/** Han, kana: must not appear outside the zh and ja pages. */
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

/* ---------- (a) raw HTML ---------- */

const attr = (html, re) => re.exec(html)?.[1] ?? null;
const decode = s =>
  s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const pages = {};
for (const l of LOCALES) {
  const response = await fetch(BASE + l.path);
  const html = await response.text();
  pages[l.code] = html;
  const csp = response.headers.get('content-security-policy') ?? '';
  const title = decode(attr(html, /<title>([^<]*)<\/title>/) ?? '');
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]);
  const origin = canonical?.replace(/\/[a-z]{2}\/$|\/$/, '');
  const expected = [...LOCALES.map(x => [x.hreflang, origin + x.path]), ['x-default', origin + '/']];
  const ogLocale = attr(html, /<meta property="og:locale" content="([^"]+)"/);
  const ogAlternates = [...html.matchAll(/<meta property="og:locale:alternate" content="([^"]+)"/g)].map(m => m[1]);
  let graph = [];
  try {
    graph = JSON.parse(attr(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/) ?? '{}')['@graph'] ?? [];
  } catch {}
  const app = graph.find(n => n['@type'] === 'WebApplication');
  const faq = graph.find(n => n['@type'] === 'FAQPage');
  const details = (html.match(/<details>/g) ?? []).length;
  const data = JSON.parse(attr(html, /<script type="application\/json" id="md2pdf-locale">([\s\S]*?)<\/script>/) ?? '{}');

  const ok =
    response.status === 200 &&
    csp.includes("script-src 'self' 'wasm-unsafe-eval'") &&
    attr(html, /<html lang="([^"]+)"/) === l.lang &&
    title.length > 10 && title.length <= 70 &&
    (l.code === 'en' || title !== decode(attr(pages.en, /<title>([^<]*)<\/title>/))) &&
    canonical === origin + l.path &&
    JSON.stringify(alternates) === JSON.stringify(expected) &&
    ogLocale === l.og &&
    ogAlternates.length === LOCALES.length - 1 && !ogAlternates.includes(l.og) &&
    app?.inLanguage === l.lang && app?.url === canonical && app?.featureList?.length > 0 &&
    faq?.inLanguage === l.lang && faq?.mainEntity?.length === details && details > 0 &&
    (l.code === 'en' || app.description !== JSON.parse(attr(pages.en, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/))['@graph'][0].description) &&
    data.code === l.code && data.lang === l.lang &&
    /<script src="\/assets\/lang-redirect-[\w-]+\.js"><\/script>/.test(html) === (l.code === 'en') &&
    !/\{\{|<!--i18n:/.test(html);
  check(ok, `${l.path} raw HTML: lang, title, canonical, hreflang, OG, JSON-LD`, `${title} (${title.length})`);
}

// Landing pages have their own entries (scripts/landing.mjs checks those).
const sitemap = await (await fetch(BASE + '/sitemap.xml')).text();
{
  const origin = attr(pages.en, /<link rel="canonical" href="([^"]+)\/"/);
  const homes = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)].filter(m =>
    LOCALES.some(l => m[1] === origin + l.path),
  );
  const expected = [...LOCALES.map(l => `${l.hreflang} ${origin + l.path}`), `x-default ${origin}/`].join('|');
  check(
    homes.length === LOCALES.length &&
      homes.every(m => [...m[2].matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(a => `${a[1]} ${a[2]}`).join('|') === expected),
    'sitemap lists every locale with a full set of alternates',
  );
}

/* ---------- browser checks ---------- */

const browser = await chromium.launch({ executablePath: CHROMIUM });
const errors = [];
async function newPage(locale) {
  const context = await browser.newContext({ locale, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${locale} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${locale} console: ${m.text()}`); });
  return { context, page };
}
const pathOf = page => new URL(page.url()).pathname + new URL(page.url()).search;
const settle = page => page.waitForSelector('#paper h1', { timeout: 10000 }).then(() => page.waitForTimeout(300));
const editorText = page =>
  page.evaluate(() => {
    const lines = [...document.querySelectorAll('.cm-content .cm-line')];
    return lines.length ? lines.map(l => l.textContent).join('\n') : document.getElementById('editor')?.value;
  });

/* (b) automatic selection */
for (const [browserLocale, expected] of [
  ['ja-JP', '/ja/'],
  ['de-DE', '/de/'],
  ['zh-TW', '/zh/'],
  ['pt-PT', '/pt/'],
  ['en-US', '/'],
  ['it-IT', '/'],
]) {
  const { context, page } = await newPage(browserLocale);
  await page.goto(BASE + '/');
  await settle(page);
  check(pathOf(page) === expected, `${browserLocale} visiting / lands on ${expected}`, pathOf(page));
  await context.close();
}
{
  const { context, page } = await newPage('ja-JP');
  await page.goto(BASE + '/?lang=en');
  await settle(page);
  check(pathOf(page) === '/?lang=en', '?lang= opts out of the redirect', pathOf(page));
  await page.goto(BASE + '/de/');
  await settle(page);
  check(pathOf(page) === '/de/', 'locale pages never redirect', pathOf(page));
  await context.close();
}

/* (c) stored preference */
{
  const { context, page } = await newPage('ja-JP');
  await page.goto(BASE + '/de/');
  await page.evaluate(() => localStorage.setItem('md2pdf:lang', 'en'));
  await page.goto(BASE + '/');
  await settle(page);
  check(pathOf(page) === '/', 'stored preference overrides the browser language', pathOf(page));
  // A stored non-default choice sends a returning visitor back to it.
  await page.evaluate(() => localStorage.setItem('md2pdf:lang', 'fr'));
  await page.goto(BASE + '/');
  await settle(page);
  check(pathOf(page) === '/fr/', 'returning visitor lands on their chosen language', pathOf(page));
  await context.close();
}

/* (d) switcher keeps the draft */
{
  const { context, page } = await newPage('ja-JP');
  await page.goto(BASE + '/');
  await page.waitForURL('**/ja/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  const text = '# Switch test\n\nDraft that must survive a language switch.';
  await setDocument(page, text);
  await page.waitForFunction(() => document.getElementById('save-state')?.dataset.state === 'saved', null, { timeout: 5000 });
  await Promise.all([page.waitForURL(BASE + '/'), chooseLanguage(page, 'en')]);
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  await page.waitForTimeout(500);
  check(pathOf(page) === '/', 'choosing English from /ja/ stays on / despite a ja-JP browser', pathOf(page));
  check((await editorText(page)) === text, 'draft survives the switch', await editorText(page));
  check((await page.evaluate(() => localStorage.getItem('md2pdf:lang'))) === 'en', 'choice stored in md2pdf:lang');

  // An edit still inside the autosave debounce must not be lost either.
  const pending = '# Pending\n\nTyped right before switching.';
  await setDocument(page, pending);
  await Promise.all([page.waitForURL(BASE + '/de/'), chooseLanguage(page, 'de')]);
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  check((await page.evaluate(() => document.documentElement.lang)) === 'de', 'switcher navigates to the German page');
  check((await editorText(page)) === pending, 'pending edit survives the switch', await editorText(page));
  check(
    (await page.getAttribute('#lang-menu a[aria-current="page"]', 'data-locale')) === 'de' &&
      (await page.textContent('#lang-menu .lang-current'))?.trim() === 'Deutsch',
    'switcher shows the current language',
  );
  await context.close();
}

/* (e) no leftover strings, and every sample renders */
const enData = JSON.parse(attr(pages.en, /id="md2pdf-locale">([\s\S]*?)<\/script>/));
const englishStrings = Object.values(enData.ui).filter(v => typeof v === 'string' && !v.includes('{') && v.length >= 8);
const visibleOf = html =>
  decode(
    html
      .replace(/<head>[\s\S]*?<\/head>/, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<nav class="languages"[\s\S]*?<\/nav>/, '')
      .replace(/<details class="lang"[\s\S]*?<\/details>/, '')
      .replace(/<[^>]+>/g, ' '),
  ) +
  ' ' + [...html.matchAll(/(?:title|placeholder|aria-label)="([^"]*)"/g)].map(m => decode(m[1])).join(' ');

for (const l of LOCALES) {
  const html = pages[l.code];
  const head = attr(html, /<head>([\s\S]*?)<\/head>/) ?? '';
  const headText = [attr(head, /<title>([^<]*)</), attr(head, /name="description" content="([^"]*)"/), attr(head, /og:title" content="([^"]*)"/)].join(' ');
  const staticText = visibleOf(html) + ' ' + headText;
  const { context, page } = await newPage('en-US');
  await page.goto(BASE + l.path);
  await page.waitForSelector('#paper .diagram svg', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(300);
  const runtime = await page.evaluate(() => ({
    status: document.querySelector('.statusbar')?.innerText ?? '',
    toolbar: [...document.querySelector('.toolbar')?.childNodes ?? []].filter(n => n.id !== 'lang-menu').map(n => n.textContent).join(' '),
    paper: document.getElementById('paper')?.innerText ?? '',
    diagram: Boolean(document.querySelector('#paper .diagram svg')),
    diagramError: Boolean(document.querySelector('#paper .diagram-error')),
  }));
  await context.close();

  const everything = [staticText, runtime.status, runtime.toolbar, runtime.paper].join('\n');
  const leftovers = [];
  if (l.code !== 'zh' && l.code !== 'ja') {
    const m = everything.match(new RegExp(`.{0,12}${CJK.source}.{0,12}`, 'u'));
    if (m) leftovers.push(`CJK: “${m[0]}”`);
  }
  if (l.code !== 'en') {
    for (const s of englishStrings) if (everything.includes(s)) leftovers.push(`English: “${s}”`);
  }
  check(!leftovers.length, `${l.path} has no untranslated strings`, leftovers.slice(0, 3).join(', '));
  check(runtime.diagram && !runtime.diagramError, `${l.path} sample renders its Mermaid diagram`);
}

/* (f) the PDF path works from a subpath */
{
  const { context, page } = await newPage('en-US');
  const fonts = [];
  page.on('request', r => { if (r.url().includes('/fonts/')) fonts.push(new URL(r.url()).pathname); });
  await page.goto(BASE + '/zh/');
  await settle(page);
  const pdf = await downloadPdf(page);
  check(pdf.header === '%PDF-', '/zh/ sample downloads as a PDF', pdf.error ?? `${pdf.size} bytes`);
  check(fonts.length > 0 && fonts.every(p => p.startsWith('/fonts/')), 'fonts load from /fonts/, not the locale path', [...new Set(fonts)].join(' '));
  await context.close();
}

await browser.close();
console.log(errors.length ? 'PROBLEMS:\n' + errors.join('\n') : 'no console/page errors');
process.exit(problems.length || errors.length ? 1 : 0);
