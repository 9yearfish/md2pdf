/**
 * Maths, end to end:
 *
 *  (a) a document without maths never fetches anything maths-related, and
 *      currency such as "$5 and $10" stays text, in the preview and the PDF;
 *  (b) a battery of formulas is typeset into the PDF as real, extractable text;
 *  (c) broken formulas each show their own error while everything around them
 *      still renders, including one whose error surfaces only in Typst;
 *  (d) the preview renders the formulas as MathML;
 *  (e) formula text cannot reach Typst code (`#read`, `\hspace{read(...)}`);
 *  (f) the background warm-up never fetches the maths font or converter, even
 *      for the sample, which has formulas: only the preview may, once they are
 *      on screen, and a PDF download.
 *
 * Needs `pdftotext` (poppler) to read the PDF; `pdftoppm` is used, when
 * present, to save page images to MATH_SHOT_DIR for a visual check.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CHROMIUM, setDocument } from './app-helpers.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const OUT = process.env.MATH_SHOT_DIR ?? path.join(os.tmpdir(), 'md2pdf-math');
mkdirSync(OUT, { recursive: true });

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

/** Anything a document with maths loads and a document without must not. */
const MATH_ASSET = /mitex|math-render|typst-math|temml|NotoSansMath/i;

const DEFAULTS = {
  paper: 'a4', margin: 20, fontSize: 11, lineHeight: 1.6, pageNumbers: true,
  tableOfContents: false, justify: true, title: '', author: '',
};

function has(cmd) {
  try {
    execFileSync(cmd, ['-v'], { stdio: 'ignore' });
    return true;
  } catch (error) {
    return error.code !== 'ENOENT';
  }
}

/** Extracted text, NFKC-normalised so maths italic 𝑥 reads as x. */
function pdfText(file) {
  return execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8' }).normalize('NFKC');
}
const squash = text => text.replace(/\s+/g, '');

/** Click "Download PDF" and return the bytes the page produced. */
async function downloadBytes(page, timeout = 240000) {
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
  const b64 = await page.evaluate(async timeout => {
    const href = await Promise.race([
      window.__md2pdfDownload,
      new Promise(resolve => setTimeout(() => resolve(null), timeout)),
    ]);
    if (!href) return null;
    const bytes = new Uint8Array(await (await fetch(href)).arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, timeout);
  return b64 ? Buffer.from(b64, 'base64') : null;
}

async function openApp(browser, draftText) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (draftText !== undefined) {
    await context.addInitScript(
      ([text, options]) => localStorage.setItem('md2pdf:draft:v1', JSON.stringify({ text, options, savedAt: Date.now() })),
      [draftText, DEFAULTS],
    );
  }
  const page = await context.newPage();
  const requests = [];
  page.on('request', r => requests.push(new globalThis.URL(r.url()).pathname));
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('#paper h1', { timeout: 15000 });
  return { context, page, requests };
}

if (!has('pdftotext')) {
  console.log('FAIL  pdftotext is required (brew install poppler / apt install poppler-utils)');
  process.exit(1);
}
const browser = await chromium.launch({ executablePath: CHROMIUM });

/* ---------- (a) no maths: nothing fetched, currency stays text ---------- */
{
  const text = [
    '# Prices',
    '',
    'It costs $5 and $10 at most, or US$20 on a bad day.',
    '',
    'An escaped \\$x\\$ stays literal, and so does a lone $ sign.',
    '',
    '```js',
    'const cost = `$${price}`;',
    '```',
  ].join('\n');
  const { context, page, requests } = await openApp(browser, text);
  const previewText = await page.locator('#paper').innerText();
  check((await page.locator('#paper .math').count()) === 0, 'currency is not parsed as maths in the preview');
  check(previewText.includes('$5 and $10') && previewText.includes('$x$'), 'currency and \\$ stay literal in the preview');

  await page.waitForFunction(() => document.getElementById('engine-status')?.dataset.state === 'ready', null, { timeout: 240000 });
  const pdf = await downloadBytes(page);
  check(pdf?.subarray(0, 5).toString() === '%PDF-', 'document without maths downloads as a PDF');
  if (pdf) {
    const file = path.join(OUT, 'no-math.pdf');
    writeFileSync(file, pdf);
    const txt = pdfText(file);
    check(txt.includes('$5 and $10') && txt.includes('US$20') && txt.includes('$x$'), 'currency and \\$ stay literal in the PDF');
  }
  const math = [...new Set(requests.filter(p => MATH_ASSET.test(p)))];
  check(math.length === 0, 'no maths assets fetched for a document without maths', math.join(' ') || `${requests.length} requests, none maths`);
  await context.close();
}

/* ---------- (b)-(e) the battery ---------- */
const GOOD = [
  ['inline fraction', '$\\frac{a}{b}$'],
  ['sum with limits', '$$\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$$'],
  ['integral', '$$\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}$$'],
  ['pmatrix', '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$'],
  ['bmatrix', '$$\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$$'],
  ['cases', '$$f(x) = \\begin{cases} x^2 & \\text{if } x \\ge 0 \\\\ -x & \\text{otherwise} \\end{cases}$$'],
  ['aligned', '$$\\begin{aligned} a &= b + c \\\\ &= d \\end{aligned}$$'],
  ['fonts', '$\\mathbb{R}^n, \\mathcal{L}, \\mathbf{v}$'],
  ['greek and accents', '$\\alpha + \\beta = \\hat{\\gamma} + \\vec{v} + \\bar{y}$'],
  ['left/right', '$\\left( \\frac{a}{b} \\right)$'],
  ['operatorname', '$\\operatorname{argmax}_x f(x)$'],
];
const doc = [
  '# Maths battery',
  '',
  'Inline: Euler wrote $e^{i\\pi} + 1 = 0$ and the roots are $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$.',
  '',
  ...GOOD.flatMap(([name, tex]) => [`${name}: ${tex}`, '']),
  'Fenced:',
  '',
  '```math',
  '\\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = 0',
  '```',
  '',
  'Pasted from a chat: \\( a^2 + b^2 = c^2 \\) and',
  '',
  '\\[',
  '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
  '\\]',
  '',
  'Prices in the same document: $5 and $10.',
  '',
  'Broken, unknown command: $\\foo{x}$ Q1Q.',
  '',
  '中文前缀 broken in Typst: $\\binom{n}$ Q2Q.',
  '',
  '中文 broken inside a helper: $\\hspace{abc} y$ Q3Q.',
  '',
  'Broken with a dollar in it: $\\binom{\\$&}$ Q5Q.',
  '',
  'Injection attempt: $\\text{#read("/main.typ")}$ and $\\hspace{read("/main.typ")}$.',
  '',
  'Last paragraph Q4Q with $z^2$.',
].join('\n');

{
  const { context, page, requests } = await openApp(browser, doc);
  // The preview typesets formulas once they come near the visible area.
  await page.evaluate(() => {
    const s = document.getElementById('scroller');
    s.scrollTo({ top: s.scrollHeight });
  });
  await page.waitForFunction(() => document.querySelectorAll('#paper .math-pending').length === 0, null, { timeout: 30000 }).catch(() => {});
  const preview = await page.evaluate(() => ({
    total: document.querySelectorAll('#paper .math').length,
    mathml: document.querySelectorAll('#paper .math math').length,
    display: document.querySelectorAll('#paper .math-display math[display="block"]').length,
    errors: [...document.querySelectorAll('#paper .math-error')].map(e => e.textContent),
    pending: document.querySelectorAll('#paper .math-pending').length,
    fraction: Boolean(document.querySelector('#paper .math math mfrac')),
    matrix: Boolean(document.querySelector('#paper .math math mtable')),
    text: document.getElementById('paper').innerText,
  }));
  check(preview.pending === 0 && preview.mathml >= preview.total - preview.errors.length && preview.mathml >= 16,
    'preview renders formulas as MathML', `${preview.mathml} of ${preview.total}, ${preview.display} display`);
  check(preview.fraction && preview.matrix, 'preview has real fractions and matrices');
  check(preview.errors.some(e => e.includes('\\foo')), 'preview marks the broken formula on its own', preview.errors.join(' | '));
  check(preview.text.includes('$5 and $10'), 'currency next to maths stays text in the preview');
  await page.screenshot({ path: path.join(OUT, 'preview.png') });

  await page.waitForFunction(() => document.getElementById('engine-status')?.dataset.state === 'ready', null, { timeout: 240000 });
  const started = Date.now();
  const pdf = await downloadBytes(page);
  check(pdf?.subarray(0, 5).toString() === '%PDF-', 'battery downloads as a PDF', pdf ? `${pdf.length} bytes in ${Date.now() - started} ms` : 'no PDF');
  const warnings = await page.locator('#warnings').innerText().catch(() => '');
  if (pdf) {
    const file = path.join(OUT, 'math.pdf');
    writeFileSync(file, pdf);
    const txt = pdfText(file);
    const flat = squash(txt);
    writeFileSync(path.join(OUT, 'math.txt'), txt);

    const fonts = execFileSync('pdffonts', [file], { encoding: 'utf8' });
    check(/NotoSansMath/.test(fonts), 'formulas use the embedded Noto Sans Math font');
    const expected = ['e^iπ', 'iπ+1=0', '±', '√', '∑', '∫', '∞', 'argmax', 'otherwise', 'ifx≥0', 'α+β', 'lim', 'sin', 'a2+b2=c2', '∮', 'z2'];
    const missing = expected.filter(s => !flat.includes(squash(s.replace('^', ''))));
    // Before normalisation, so the double-struck R is not folded into a plain one.
    if (!execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8' }).includes('ℝ')) missing.push('ℝ');
    check(missing.length === 0, 'PDF contains the formulas as text', missing.length ? `missing: ${missing.join(' ')}` : `${expected.length} fragments found`);
    check(txt.includes('$5 and $10'), 'currency next to maths stays text in the PDF');

    for (const [label, source, reason] of [
      ['unknown command', '\\foo{x}', 'unknown command'],
      ['error raised by Typst', '\\binom{n}', 'missing argument'],
      ['error inside a mitex helper', '\\hspace{abc} y', 'unsupported length'],
      ['dollar-bearing', '\\binom{\\$&}', 'missing argument'],
    ]) {
      check(txt.includes(source) && txt.includes(reason), `PDF shows the ${label} error in place`, `${source} / ${reason}`);
    }
    check(['Q1Q', 'Q2Q', 'Q3Q', 'Q4Q', 'Q5Q'].every(s => txt.includes(s)),
      'everything around the broken formulas still renders');
    check(!txt.includes('everything below is plain Typst') && txt.includes('#read("/main.typ")') && txt.includes('unsupported length'),
      'formula text never runs as Typst code', 'read() stays text or fails as a length');
    check(/\\foo/.test(warnings) && /binom/.test(warnings), 'download notice lists the broken formulas', warnings.replace(/\s+/g, ' ').slice(0, 160));

    if (has('pdftoppm')) {
      execFileSync('pdftoppm', ['-r', '110', '-png', file, path.join(OUT, 'math-page')]);
      execFileSync('pdftoppm', ['-r', '110', '-png', path.join(OUT, 'no-math.pdf'), path.join(OUT, 'no-math-page')]);
      console.log(`      page images in ${OUT}`);
    }
  }
  const math = [...new Set(requests.filter(p => MATH_ASSET.test(p)))];
  check(math.some(p => /mitex.*\.wasm$/.test(p)) && math.some(p => /NotoSansMath/.test(p)) && math.some(p => /math-render/.test(p)),
    'maths assets load when a document has maths', math.join(' '));
  await context.close();
}

/* ---------- (f) the warm-up leaves the maths font alone ---------- */
{
  const { context, page, requests } = await openApp(browser);
  await page.waitForFunction(() => document.getElementById('engine-status')?.dataset.state === 'ready', null, { timeout: 240000 });
  await page.waitForTimeout(500);
  const math = [...new Set(requests.filter(p => MATH_ASSET.test(p)))];
  const previewShowedMath = math.some(p => /math-render/.test(p));
  check(!math.some(p => /mitex|typst-math/.test(p)), 'warm-up does not fetch the PDF maths converter', math.join(' ') || 'none');
  check(previewShowedMath || !math.some(p => /NotoSansMath/.test(p)), 'warm-up does not fetch the maths font',
    previewShowedMath ? 'the preview rendered formulas on screen' : math.join(' ') || 'none');
  await context.close();
}

await browser.close();
const errors = problems.filter(p => p.startsWith('pageerror') || p.startsWith('console'));
console.log(errors.length ? 'PROBLEMS:\n' + errors.join('\n') : 'no console/page errors');
process.exit(problems.length ? 1 : 0);
