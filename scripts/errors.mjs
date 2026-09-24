/**
 * Error reports: a failed PDF and an uncaught error each reach /api/log once,
 * with the build and page, and never with the document's text.
 */
import { chromium } from 'playwright';
import { CHROMIUM, setDocument } from './app-helpers.mjs';

const BASE = new URL('/', process.env.APP_URL ?? 'http://localhost:5200/').href.replace(/\/$/, '');
const SECRET = 'Top secret draft 7f3a9c';
const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

const browser = await chromium.launch({ executablePath: CHROMIUM });
const context = await browser.newContext({ serviceWorkers: 'block' });
const reports = [];
await context.route('**/api/log', route => {
  reports.push(route.request().postData() ?? '');
  return route.fulfill({ status: 204 });
});
// No engine: the download must fail.
await context.route(/\.wasm(\?|$)/, route => route.abort());
const page = await context.newPage();
await page.goto(BASE + '/');
await page.waitForSelector('.cm-content', { timeout: 30000 });
await setDocument(page, `# ${SECRET}\n\n${SECRET} body text.`);
await page.click('#download');
await page.waitForSelector('#warnings[data-kind="error"]:not([hidden])', { timeout: 60000 });
await page.click('#download');
await page.waitForSelector('#warnings[data-kind="error"]:not([hidden])', { timeout: 60000 });
await page.evaluate(() => setTimeout(() => { throw new Error('probe: uncaught'); }));
await page.waitForTimeout(800);

const parsed = reports.map(r => JSON.parse(r));
const pdf = parsed.filter(r => r.kind === 'network' || r.kind === 'pdf');
const uncaught = parsed.find(r => r.kind === 'error' && r.message.includes('probe: uncaught'));
check(pdf.length === 1, 'a failed PDF is reported once per visit', `${pdf.length} report(s)`);
check(Boolean(pdf[0]?.build) && pdf[0]?.page === '/' && typeof pdf[0]?.detail?.chars === 'number', 'the report carries build, page and document facts', JSON.stringify(pdf[0]?.detail));
check(Boolean(uncaught?.stack), 'an uncaught error is reported with its stack');
check(!reports.some(r => r.includes(SECRET) || r.includes('7f3a9c')), 'no report contains the document text');
// A code chunk that fails to load (a dropped connection): browsers remember
// the failed module for the life of the page, so the notice offers a reload,
// and after reloading the download works.
{
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  await ctx.route('**/api/log', route => route.fulfill({ status: 204 }));
  let aborted = 0;
  await ctx.route(/\/assets\/engine-[\w-]+\.js$/, route => (aborted++ === 0 ? route.abort() : route.continue()));
  const p = await ctx.newPage();
  await p.goto(BASE + '/');
  await p.waitForSelector('.cm-content', { timeout: 30000 });
  await p.click('#download');
  await p.waitForSelector('#warnings[data-kind="error"]:not([hidden])', { timeout: 60000 });
  const action = await p.locator('#warnings .warnings-action').textContent().catch(() => '');
  check(/reload/i.test(action ?? ''), 'a failed code chunk offers a page reload, not a network message', action ?? '');
  const dl = p.waitForEvent('download', { timeout: 180000 }).catch(() => null);
  await Promise.all([p.waitForEvent('load'), p.click('#warnings .warnings-action')]);
  await p.waitForSelector('.cm-content', { timeout: 30000 });
  await p.click('#download');
  check(Boolean(await dl), 'after the reload the PDF downloads');
  await ctx.close();
}
console.log(problems.length ? `FAIL: ${problems.join('; ')}` : 'all error-report checks passed');
await browser.close();
process.exit(problems.length ? 1 : 0);
