import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '/tmp/claude-0/-home-user-md2pdf/145ae161-a9f8-50b2-82c8-be6dc82893f1/scratchpad';
const URL = process.env.APP_URL ?? 'http://localhost:5199/';
const problems = [];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });

await page.goto(URL, { waitUntil: 'load' });
await page.click('#convert');

// The overlay hides only once the preview has actually rendered. Wait on the
// property: a hidden element is never "visible", so waitForSelector would
// always time out here.
await page.waitForFunction(
  () => document.getElementById('overlay')?.hidden === true,
  null,
  { timeout: 240000 },
);
await page.waitForSelector('.page canvas', { timeout: 60000 });

const pageCount = await page.locator('.page').count();
const rendered = await page.locator('.page canvas').count();
console.log(`pages=${pageCount} renderedCanvases=${rendered}`);
console.log('readout:', await page.textContent('#page-readout'));
console.log('zoom:', await page.textContent('#zoom-level'));
console.log('download enabled:', !(await page.locator('#download').isDisabled()));

await page.click('#outline-toggle');
const outline = await page.locator('.outline-item').allTextContents();
console.log('outline:', JSON.stringify(outline));

await page.click('#search-toggle');
await page.fill('#search-input', '流程图');
await page.waitForTimeout(1200);
console.log('search count:', await page.textContent('#search-count'));

await page.screenshot({ path: `${OUT}/app.png` });

// The bytes on screen must be the bytes handed over on download.
const identical = await page.evaluate(async () => {
  const [dl] = await Promise.all([
    new Promise(resolve => {
      const orig = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { resolve(this.href); };
      setTimeout(() => resolve(null), 3000);
    }),
    (document.getElementById('download')).click(),
  ]);
  if (!dl) return 'no download triggered';
  const bytes = new Uint8Array(await (await fetch(dl)).arrayBuffer());
  return `downloaded ${bytes.length} bytes, header=${String.fromCharCode(...bytes.slice(0, 5))}`;
});
console.log('download check:', identical);

console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'no console/page errors');
await browser.close();
