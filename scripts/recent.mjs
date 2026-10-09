/** End-to-end checks for the local Recent files archive. */
import { chromium } from 'playwright';
import { CHROMIUM, setDocument } from './app-helpers.mjs';

const URL = new globalThis.URL('/zh/', process.env.APP_URL ?? 'http://localhost:5200/').href;
const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

const browser = await chromium.launch({ executablePath: CHROMIUM });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
page.on('console', message => { if (message.type() === 'error') problems.push(`console: ${message.text()}`); });

const records = () => page.evaluate(() => new Promise(resolve => {
  const open = indexedDB.open('md2pdf-recent');
  open.onsuccess = () => {
    const request = open.result.transaction('documents').objectStore('documents').getAll();
    request.onsuccess = () => {
      open.result.close();
      resolve(request.result);
    };
  };
}));
const waitForRecords = n => page.waitForFunction(count => new Promise(resolve => {
  const open = indexedDB.open('md2pdf-recent');
  open.onsuccess = () => {
    const request = open.result.transaction('documents').objectStore('documents').count();
    request.onsuccess = () => {
      open.result.close();
      resolve(request.result === count);
    };
  };
}), n, { timeout: 5000 });

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.cm-content', { timeout: 30000 });
await setDocument(page, '# 第一份合同\n\n甲方与乙方。');
await waitForRecords(1);

await page.click('#recent-toggle');
check(await page.locator('#recent-files').evaluate(node => node.matches(':popover-open')), 'Recent opens as a non-modal popover');
check(await page.locator('#recent-list .recent-item').count() === 1, 'the edited document appears in Recent');
check((await page.locator('.recent-name').textContent()) === '第一份合同', 'the first H1 becomes the recent-file title');
check((await page.locator('#recent-count').textContent()) === '1', 'the trigger shows the file count');
check(/^\d{4}.+\d{2}.+\d{2}/.test((await page.locator('.recent-date').textContent()) ?? ''), 'the saved date includes year, month and day');

await page.click('.recent-star');
check((await page.locator('.recent-star').getAttribute('aria-pressed')) === 'true', 'a file can be starred');
await page.keyboard.press('Escape');
await page.click('#new-doc');
await setDocument(page, '# 第二份合同\n\n新的正文。');
await waitForRecords(2);

await page.click('#recent-toggle');
check(await page.locator('#recent-list .recent-item').count() === 2, 'a second document gets its own record');
check((await page.locator('.recent-name').allTextContents())[0] === '第一份合同', 'starred files stay above newer unstarred files');
await page.click('#recent-clear');
await waitForRecords(1);
check((await page.locator('.recent-name').allTextContents()).join('|') === '第一份合同', 'Clear removes only unstarred files');
await page.click('.warnings-action');
await waitForRecords(2);
check(await page.locator('#recent-list .recent-item').count() === 2, 'Clear can be undone');

const second = page.locator('.recent-item', { hasText: '第二份合同' });
await second.locator('.recent-delete').click();
await waitForRecords(1);
check(await page.locator('#recent-list .recent-item').count() === 1, 'one recent file can be deleted');
await page.click('.warnings-action');
await waitForRecords(2);
check(await page.locator('#recent-list .recent-item').count() === 2, 'Delete can be undone');

await page.locator('.recent-item', { hasText: '第一份合同' }).locator('.recent-open').click();
await page.waitForFunction(() => document.querySelector('#paper h1')?.textContent === '第一份合同');
check(true, 'clicking a recent file restores its Markdown');
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('.cm-content', { timeout: 30000 });
check((await page.locator('#paper h1').textContent()) === '第一份合同', 'the opened recent file becomes the active draft');

// Fill the archive with starred records. A new file must not evict any of them.
await page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const open = indexedDB.open('md2pdf-recent');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  const current = await new Promise((resolve, reject) => {
    const request = db.transaction('documents').objectStore('documents').getAll();
    request.onsuccess = () => resolve(request.result[0]);
    request.onerror = () => reject(request.error);
  });
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['documents', 'images'], 'readwrite');
    const store = tx.objectStore('documents');
    store.clear();
    tx.objectStore('images').clear();
    for (let i = 0; i < 30; i++) {
      store.put({ ...current, id: `starred-${i}`, title: `Pinned ${i + 1}`, starred: true, savedAt: i + 1 });
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
});
await page.click('#new-doc');
await setDocument(page, '# 第三十一份');
await page.waitForSelector('.warnings-action, #warnings:not([hidden])');
await page.waitForFunction(() => document.getElementById('warnings')?.textContent?.includes('30 份近期文件已全部星标'));
check((await records()).length === 30, '30 starred files are never auto-evicted');

await context.close();
await browser.close();
process.exit(problems.length ? 1 : 0);
