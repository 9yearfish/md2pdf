import { chromium } from 'playwright';
import os from 'node:os';
import { CHROMIUM, downloadPdf, setDocument } from './app-helpers.mjs';

const OUT = process.env.SHOT_DIR ?? os.tmpdir();
// The English page at /; the browser's en-US locale means no redirect.
const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

const browser = await chromium.launch({ executablePath: CHROMIUM });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });

const started = Date.now();
await page.goto(URL, { waitUntil: 'domcontentloaded' });

// The preview is part of first paint and must not wait on the engine.
await page.waitForSelector('#paper h1', { timeout: 10000 });
const previewMs = Date.now() - started;
check(previewMs < 3000, 'preview renders without the engine', `${previewMs} ms`);
const engineRequested = await page.evaluate(() =>
  performance.getEntriesByType('resource').some(r => r.name.endsWith('.wasm')),
);
check(!engineRequested, 'engine not fetched before first paint');

await page.waitForSelector('#paper .diagram svg', { timeout: 30000 });
check(true, 'mermaid diagram rendered in preview');
check((await page.locator('#paper table').count()) === 1, 'table rendered');
check((await page.locator('#paper li.task input[type=checkbox]').count()) === 3, 'task list rendered');

// Editing updates the preview.
await setDocument(page, '# 新标题\n\n改过的内容。');
await page.waitForFunction(() => document.querySelector('#paper h1')?.textContent === '新标题', null, { timeout: 5000 });
check(true, 'preview follows edits');

// The engine warms up on its own once the page has loaded.
await page.waitForFunction(
  () => document.getElementById('engine-status')?.dataset.state === 'ready',
  null,
  { timeout: 240000 },
);
check(true, 'engine warmed in the background', `${Math.round((Date.now() - started) / 1000)} s after load`);

const t = Date.now();
const pdf = await downloadPdf(page);
check(pdf.header === '%PDF-', 'download produces a PDF', `${pdf.size} bytes in ${Date.now() - t} ms, ${pdf.name}`);

await page.screenshot({ path: `${OUT}/md2pdf-app.png` });

const errors = problems.filter(p => p.startsWith('pageerror') || p.startsWith('console'));
console.log(errors.length ? 'PROBLEMS:\n' + errors.join('\n') : 'no console/page errors');
await browser.close();
process.exit(problems.length ? 1 : 0);
