/**
 * Pagination, headers and footers, covers, front matter and templates,
 * checked in the real app and in the PDFs it produces (with PyMuPDF, through
 * scripts/pdf-check.py):
 *
 * - explicit page breaks give the right page count, and code keeps its markers;
 * - header and footer text is on every page with the right {page}/{pages},
 *   and not on the cover;
 * - the cover carries the title, subtitle, author and a localised date;
 * - each template embeds the faces it should (Noto Serif for Academic) and the
 *   Default template never fetches a serif face;
 * - front matter overrides the panel, and the panel says so;
 * - invalid front matter warns but still renders.
 *
 * Then every template is rendered in English, Chinese and Japanese, to PDF, to
 * PNG (with pdftoppm) and as a preview screenshot, in $PAGES_OUT for looking at.
 *
 *   PORT=5340 npm run preview
 *   APP_URL=http://localhost:5340/ node scripts/pages.mjs [--no-samples | --samples-only] [test or sample ...]
 */
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHROMIUM } from './app-helpers.mjs';
import { SAMPLES } from './pages-samples.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const OUT = process.env.PAGES_OUT ?? path.join(os.tmpdir(), 'md2pdf-pages');
const CHECKER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pdf-check.py');
const args = process.argv.slice(2);
const samples = !args.includes('--no-samples');
const samplesOnly = args.includes('--samples-only');
// Names of tests to run, or `template-lang` samples (e.g. academic-zh).
const only = new Set(args.filter(a => !a.startsWith('--')));
mkdirSync(OUT, { recursive: true });

const hasPdftoppm = spawnSync('pdftoppm', ['-v']).error === undefined;
const browser = await chromium.launch({ executablePath: CHROMIUM });
// One context, so the engine and fonts come from the HTTP cache after the
// first document. No service worker: its fetches would hide font requests.
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });

/**
 * Open the app with `text` and `options` as the saved draft (which is how a
 * returning visitor arrives), download the PDF and inspect it.
 */
async function render(name, text, options = {}, { locale = '', screenshot = false } = {}) {
  const page = await context.newPage();
  const fonts = new Set();
  const errors = [];
  page.on('request', r => {
    const url = r.url();
    if (url.includes('/fonts/')) fonts.add(url.split('/fonts/')[1].split('?')[0]);
  });
  page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  await page.addInitScript(({ text, options }) => {
    localStorage.setItem('md2pdf:draft:v1', JSON.stringify({ text, options, savedAt: Date.now() }));
  }, { text, options });
  await page.goto(new globalThis.URL(locale, URL).href, { waitUntil: 'load' });
  // The layout chunk arrives just after first paint; the preview then re-renders.
  await page.waitForFunction(() => document.getElementById('paper')?.dataset.template, null, { timeout: 15000 });

  await page.evaluate(() => {
    window.__md2pdfDownload = new Promise(resolve => {
      const original = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        HTMLAnchorElement.prototype.click = original;
        resolve(this.href);
      };
    });
  });
  await page.click('#download');
  const result = await page.evaluate(async () => {
    const href = await Promise.race([window.__md2pdfDownload, new Promise(r => setTimeout(() => r(null), 240000))]);
    const warnings = document.getElementById('warnings')?.textContent ?? '';
    if (!href) return { error: warnings || 'no download triggered' };
    const bytes = new Uint8Array(await (await fetch(href)).arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { base64: btoa(binary), warnings };
  });
  if (result.error) {
    await page.close();
    return { error: result.error, errors };
  }
  const file = path.join(OUT, `${name}.pdf`);
  writeFileSync(file, Buffer.from(result.base64, 'base64'));
  const report = JSON.parse(execFileSync('python3', [CHECKER, file], { encoding: 'utf8', maxBuffer: 64 << 20 }));
  const preview = await page.evaluate(() => {
    const paper = document.getElementById('paper');
    return {
      template: paper.dataset.template,
      breaks: paper.querySelectorAll('.page-break').length,
      numbers: [...paper.querySelectorAll('.heading-number')].map(n => n.textContent),
      header: paper.querySelector('.page-header')?.textContent ?? '',
      footer: paper.querySelector('.page-footer')?.textContent ?? '',
      cover: paper.querySelector('.cover')?.textContent ?? '',
      fromDocument: [...document.querySelectorAll('#settings .from-doc')].map(b => b.closest('label').querySelector('input, select').id),
      disabled: [...document.querySelectorAll('#settings :disabled')].map(i => i.id),
    };
  });
  if (screenshot) {
    // Tall enough for the whole sheet: the preview scrolls inside its pane.
    const height = await page.evaluate(() => document.getElementById('paper').scrollHeight);
    await page.setViewportSize({ width: 1440, height: Math.min(8000, height + 300) });
    await page.locator('#paper').screenshot({ path: path.join(OUT, `${name}-preview.png`) }).catch(() => {});
  }
  await page.close();
  return { file, report, warnings: result.warnings, fonts: [...fonts], preview, errors };
}

let failures = 0;
async function test(name, run) {
  if (samplesOnly || (only.size && !only.has(name))) return;
  const problems = [];
  const expect = (ok, what) => {
    if (!ok) problems.push(what);
  };
  try {
    await run(expect);
  } catch (error) {
    problems.push(`threw: ${error.message}`);
  }
  if (problems.length) failures++;
  console.log(`${problems.length ? 'FAIL' : 'PASS'}  ${name}`);
  for (const p of problems) console.log(`      ${p}`);
}

const ok = r => !r.error && r.report;
const pages = r => r.report.pages;

await test('explicit page breaks', async expect => {
  const md = [
    '# One', 'First page.', '\\pagebreak', '# Two', 'Second page.', '\\newpage',
    'Third page, then a marker ending a paragraph', '<!-- pagebreak -->', 'Fourth page.',
    '<div style="page-break-after: always"></div>', 'Fifth page.',
    '```\n\\newpage\n<!-- pagebreak -->\n```', '> \\pagebreak in a quote is text',
  ].join('\n\n').replace('paragraph\n\n<!--', 'paragraph\n<!--');
  const r = await render('breaks', md, { pageNumbers: true });
  expect(ok(r), `no PDF: ${r.error}`);
  if (!ok(r)) return;
  expect(pages(r).length === 5, `expected 5 pages, got ${pages(r).length}`);
  expect(pages(r)[2]?.text.includes('Third page') && pages(r)[3]?.text.includes('Fourth page'), 'marker right after a paragraph line did not break');
  expect(pages(r)[4]?.text.includes('\\newpage'), 'a marker inside a code block was not kept as code');
  expect(r.preview.breaks === 4, `preview shows ${r.preview.breaks} page-break markers, expected 4`);
  // Default footer: "page / pages" centred.
  expect(pages(r).every((p, i) => p.bottom === `${i + 1} / 5`), `footers: ${pages(r).map(p => p.bottom).join(' | ')}`);
});

await test('headers, footers and the cover', async expect => {
  const md = `---
title: Annual Plan
subtitle: What we will do next year
author: [Ada Lovelace, Alan Turing]
date: 2024-03-05
cover: true
header: "{title} | {author}"
footer: "Page {page} of {pages} | {date}"
---

# First

One.

\\newpage

# Second

Two.

\\newpage

# Third

Three.
`;
  const r = await render('bands', md);
  expect(ok(r), `no PDF: ${r.error}`);
  if (!ok(r)) return;
  const p = pages(r);
  expect(p.length === 4, `expected cover + 3 pages, got ${p.length}`);
  const cover = p[0];
  expect(cover.top === '' && cover.bottom === '', `cover has a header or footer: "${cover.top}" / "${cover.bottom}"`);
  for (const text of ['Annual Plan', 'What we will do next year', 'Ada Lovelace and Alan Turing', 'March 5, 2024']) {
    expect(cover.text.includes(text), `cover lacks "${text}"`);
  }
  p.slice(1).forEach((page, i) => {
    expect(page.top.includes('Annual Plan') && page.top.includes('Ada Lovelace and Alan Turing'), `page ${i + 2} header: "${page.top}"`);
    expect(page.bottom.includes(`Page ${i + 1} of 3`) && page.bottom.includes('March 5, 2024'), `page ${i + 2} footer: "${page.bottom}"`);
  });
  expect(r.preview.header.includes('Annual Plan') && r.preview.footer.includes('Page 1 of N'), `preview bands: "${r.preview.header}" / "${r.preview.footer}"`);
  expect(r.preview.cover.includes('Annual Plan'), 'preview has no cover');
});

await test('localised cover date and header tokens', async expect => {
  const md = '---\ntitle: 年度计划\nauthor: [张三, 李四]\ndate: 2024-03-05\ncover: true\nfooter: "{page} / {pages}"\n---\n\n# 第一章\n\n正文内容。\n';
  const r = await render('cover-zh', md);
  expect(ok(r), `no PDF: ${r.error}`);
  if (!ok(r)) return;
  const cover = pages(r)[0].text.replace(/\s+/g, '');
  expect(cover.includes('2024年3月5日'), `cover date not localised: ${cover}`);
  expect(cover.includes('张三和李四'), `authors not joined the Chinese way: ${cover}`);
  expect(pages(r)[1].bottom === '1 / 1', `footer: ${pages(r)[1].bottom}`);
});

await test('front matter overrides the settings', async expect => {
  const md = '---\npapersize: a5\nmargin: 3cm\nlang: ja-JP\ntoc: false\n---\n\n# 漢字\n\n東京都庁、直角、骨格、変化。\n';
  const r = await render('override', md, { paper: 'a4', margin: 20, lang: 'auto', tableOfContents: true });
  expect(ok(r), `no PDF: ${r.error}`);
  if (!ok(r)) return;
  const first = pages(r)[0];
  expect(Math.abs(first.width - 419.5) < 1 && Math.abs(first.height - 595.3) < 1, `page is ${first.width}×${first.height}, not A5`);
  expect(!r.report.text.includes('目次'), 'the panel\'s table of contents was not overridden');
  expect(r.report.fonts.some(f => f.includes('NotoSansJP')), `lang: ja-JP did not select Japanese glyphs: ${r.report.fonts}`);
  for (const id of ['opt-paper', 'opt-margin', 'opt-lang', 'opt-toc']) {
    expect(r.preview.fromDocument.includes(id) && r.preview.disabled.includes(id), `${id} is not shown as set by the document`);
  }
  expect(!r.preview.fromDocument.includes('opt-font-size'), 'font size marked as from document');
});

await test('invalid front matter warns but renders', async expect => {
  const md = '---\ntitle: "Unclosed\npapersize: tabloid\n  stray: indented\ncover: true\n---\n\n# Still here\n\nThe body renders.\n';
  const r = await render('invalid', md);
  expect(ok(r), `no PDF: ${r.error}`);
  if (!ok(r)) return;
  expect(r.report.text.includes('The body renders.'), 'body missing');
  expect(!r.report.text.includes('papersize'), 'front matter leaked into the document');
  expect(/line 2/.test(r.warnings) && /tabloid/.test(r.warnings), `warnings: "${r.warnings}"`);
  expect(Math.abs(pages(r)[0].width - 595.3) < 1, 'invalid paper size was applied');
  // cover: true still applied, with the first heading as the title.
  expect(pages(r).length === 2 && pages(r)[0].text.includes('Still here'), 'the valid keys were dropped');
  expect(!r.errors.length, `page errors: ${r.errors}`);
});

await test('templates embed their faces', async expect => {
  const md = '# Title\n\nSome **bold** and *italic* text.\n\n## Section\n\nMore text.\n';
  for (const [template, want, reject] of [
    ['default', ['NotoSans-Regular', 'NotoSans-Bold'], ['NotoSerif']],
    ['report', ['NotoSans-Regular', 'NotoSans-Bold'], ['NotoSerif']],
    ['resume', ['NotoSans-Regular', 'NotoSans-Bold'], ['NotoSerif']],
    ['academic', ['NotoSerif-Regular', 'NotoSerif-Bold', 'NotoSerif-Italic'], ['NotoSans-Regular']],
    ['letter', ['NotoSerif-Regular'], ['NotoSans-Regular']],
  ]) {
    const r = await render(`fonts-${template}`, md, { template });
    expect(ok(r), `${template}: no PDF: ${r.error}`);
    if (!ok(r)) continue;
    for (const f of want) expect(r.report.fonts.some(e => e.includes(f)), `${template}: ${f} not embedded (${r.report.fonts})`);
    for (const f of reject) expect(!r.report.fonts.some(e => e.includes(f)), `${template}: ${f} embedded`);
    if (!want.some(f => f.includes('Serif'))) {
      const fetched = r.fonts.filter(f => f.includes('Serif'));
      expect(!fetched.length, `${template}: serif fonts fetched: ${fetched}`);
    }
  }
  // Serif Chinese: the serif face for regular text, the sans face for bold.
  const zh = await render('fonts-academic-zh', '# 标题\n\n正文使用宋体，**加粗使用黑体**。\n', { template: 'academic' });
  expect(ok(zh), `academic zh: no PDF: ${zh.error}`);
  if (ok(zh)) {
    for (const f of ['NotoSerifSC-Regular', 'NotoSansSC-Bold']) expect(zh.report.fonts.some(e => e.includes(f)), `academic zh: ${f} not embedded (${zh.report.fonts})`);
    expect(!zh.fonts.some(f => f.includes('NotoSansSC-Regular')), `academic zh fetched the sans regular face: ${zh.fonts}`);
  }
});

await test('report numbering, contents and level-1 page breaks', async expect => {
  const md = '---\ntitle: Numbered\ntemplate: report\ntoc: true\nh1-newpage: true\n---\n\n# Intro\n\nText.\n\n## Scope\n\nText.\n\n# Method\n\nText.\n\n## Data\n\n### Source\n\nText.\n';
  const r = await render('numbering', md);
  expect(ok(r), `no PDF: ${r.error}`);
  if (!ok(r)) return;
  const text = pages(r).map(p => p.text.replace(/\s+/g, ' '));
  // Cover, contents, Intro, Method.
  expect(text.length === 4, `expected 4 pages, got ${text.length}`);
  expect(/1 Intro/.test(text[2]) && /1\.1 Scope/.test(text[2]), `numbering on page 3: ${text[2]}`);
  expect(/2 Method/.test(text[3]) && /2\.1\.1 Source/.test(text[3]), `numbering on page 4: ${text[3]}`);
  expect(/1 Intro.*2 Method/.test(text[1]), `contents: ${text[1]}`);
  expect(r.preview.numbers.join(',') === '1,1.1,2,2.1,2.1.1', `preview numbers: ${r.preview.numbers}`);
});

console.log(failures ? `${failures} test(s) failed` : 'all pagination tests passed');

if (samples) {
  const dir = process.env.PAGES_SAMPLES ?? OUT;
  mkdirSync(dir, { recursive: true });
  for (const [template, byLang] of Object.entries(SAMPLES)) {
    for (const [lang, md] of Object.entries(byLang)) {
      const name = `${template}-${lang}`;
      if (only.size && !only.has(name) && !only.has(template)) continue;
      // The template comes from the front matter, with its presets.
      const r = await render(name, md, {}, { screenshot: true });
      if (!ok(r)) {
        console.log(`FAIL  sample ${name}: ${r.error}`);
        failures++;
        continue;
      }
      if (r.report.notdef?.length) {
        console.log(`FAIL  sample ${name}: drawn as .notdef: ${[...new Set(r.report.notdef)].join(' ')}`);
        failures++;
      }
      if (hasPdftoppm) execFileSync('pdftoppm', ['-r', '80', '-png', r.file, path.join(dir, name)]);
      execFileSync('cp', [path.join(OUT, `${name}-preview.png`), dir]);
      console.log(`      sample ${name}: ${pages(r).length} page(s), ${r.report.fonts.join(', ')}`);
    }
  }
  console.log(`samples in ${dir}`);
}

await browser.close();
process.exit(failures ? 1 : 0);
