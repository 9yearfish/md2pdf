/**
 * Checks that drafts survive a reload, and that only a real edit creates one.
 *
 * Everything runs in one browser context, because a reload in the same context
 * is exactly what a returning visitor looks like. Playwright gives each
 * context its own fresh storage, so no other test sees these drafts.
 */
import { chromium } from 'playwright';
import os from 'node:os';
import { CHROMIUM, setDocument } from './app-helpers.mjs';

const OUT = process.env.SHOT_DIR ?? os.tmpdir();
// Pinned to the Chinese page: the status-bar assertions below are its strings.
const URL = new globalThis.URL('/zh/', process.env.APP_URL ?? 'http://localhost:5200/').href;
const KEY = 'md2pdf:draft:v1';
// A 1x1 PNG, enough to exercise the IndexedDB path.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

const browser = await chromium.launch({ executablePath: CHROMIUM });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()); });

const draft = () => page.evaluate(key => localStorage.getItem(key), KEY);
const heading = () => page.evaluate(() => document.querySelector('#paper h1')?.textContent ?? null);
const editorText = () =>
  page.evaluate(() => {
    const lines = [...document.querySelectorAll('.cm-content .cm-line')];
    return lines.length ? lines.map(l => l.textContent).join('\n') : document.getElementById('editor')?.value;
  });
const storedImages = () =>
  page.evaluate(async () => {
    const names = (await indexedDB.databases()).map(d => d.name);
    if (!names.includes('md2pdf')) return null;
    return new Promise(resolve => {
      const open = indexedDB.open('md2pdf');
      open.onsuccess = () => {
        const request = open.result.transaction('images').objectStore('images').getAllKeys();
        request.onsuccess = () => {
          open.result.close();
          resolve(request.result);
        };
      };
    });
  });
const waitSaved = () =>
  page.waitForFunction(() => document.getElementById('save-state')?.dataset.state === 'saved', null, {
    timeout: 5000,
  });
async function load() {
  await page.waitForSelector('#paper h1', { timeout: 10000 });
  await page.waitForSelector('.cm-content', { timeout: 30000 });
}

// 1. Looking is not editing.
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await load();
const sampleHeading = await heading();
await page.waitForTimeout(1200);
check((await draft()) === null, 'untouched sample is not saved');
check((await storedImages()) === null, 'untouched sample opens no database');
check(await page.locator('#save-state').isHidden(), 'no save state shown for the sample');

// 2. Text and a setting survive a reload.
await setDocument(page, '# 草稿标题\n\n自动保存的正文。');
await page.click('#settings-toggle');
await page.selectOption('#opt-paper', 'a5');
await waitSaved();
check((await page.locator('#save-state').textContent()) === '已保存到本地浏览器', 'status bar says saved');
await page.screenshot({ path: `${OUT}/md2pdf-autosave.png` });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#paper h1', { timeout: 10000 });
check((await heading()) === '草稿标题', 'draft is what first paints after reload', await heading());
await load();
check((await editorText()) === '# 草稿标题\n\n自动保存的正文。', 'draft survives the CodeMirror upgrade');
check((await page.inputValue('#opt-paper')) === 'a5', 'layout setting restored');
check(
  (await page.evaluate(() => document.getElementById('paper-hint')?.textContent ?? '')).startsWith('A5'),
  'restored setting applied to the preview',
);
check((await page.locator('#save-state').textContent()) === '已恢复本地草稿', 'status bar says restored');

// 3. Closing mid-typing loses nothing: reload inside the debounce window.
await setDocument(page, '# 立即关闭\n\n没等防抖。');
// Proves the debounce had not fired yet, so only the flush can save it.
check(!(await draft())?.includes('立即关闭'), 'edit still pending before reload');
await page.reload({ waitUntil: 'domcontentloaded' });
await load();
check((await heading()) === '立即关闭', 'pending edit flushed on pagehide', await heading());

// 4. A dropped image is kept in IndexedDB, restored, and pruned once unused.
await page.evaluate(base64 => {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const data = new DataTransfer();
  data.items.add(new File([bytes], 'dot.png', { type: 'image/png' }));
  document.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }));
}, PNG);
await page.waitForFunction(() => document.querySelector('#paper img')?.getAttribute('src')?.startsWith('blob:'));
await waitSaved();
await page.waitForFunction(
  () => new Promise(r => { const o = indexedDB.open('md2pdf'); o.onsuccess = () => { const q = o.result.transaction('images').objectStore('images').count(); q.onsuccess = () => { o.result.close(); r(q.result === 1); }; }; }),
  null,
  { timeout: 5000 },
);
await page.reload({ waitUntil: 'domcontentloaded' });
await load();
await page.waitForFunction(
  () => {
    const img = document.querySelector('#paper img');
    return img?.getAttribute('src')?.startsWith('blob:') && img.complete && img.naturalWidth === 1;
  },
  null,
  { timeout: 5000 },
).then(() => check(true, 'dropped image restored from IndexedDB'), () => check(false, 'dropped image restored from IndexedDB'));
await setDocument(page, '# 没有图片了');
await waitSaved();
await page.waitForTimeout(300);
check(JSON.stringify(await storedImages()) === '[]', 'unreferenced image pruned', JSON.stringify(await storedImages()));

// 5. "新建" clears, "撤销" brings it back, and a cleared draft stays cleared.
await page.click('#new-doc');
check((await editorText()) === '', 'new document empties the editor');
check((await draft()) === null, 'new document deletes the draft');
check(await page.locator('.warnings-action', { hasText: '撤销' }).isVisible(), 'undo offered in-page');
await page.click('.warnings-action');
check((await editorText()) === '# 没有图片了', 'undo restores the text');
check((await draft()) !== null, 'undo saves the draft again');
await page.click('#new-doc');
await page.reload({ waitUntil: 'domcontentloaded' });
await load();
check((await heading()) === sampleHeading, 'after 新建 a reload shows the sample', await heading());
check((await draft()) === null, 'nothing saved after 新建 and reload');
check(JSON.stringify(await storedImages() ?? []) === '[]', 'no images left after 新建');
check((await page.inputValue('#opt-paper')) === 'a4', 'settings back to defaults after 新建 and reload');

// 6. Two tabs: an idle tab follows the other; a tab with its own unsaved edit is asked, not overwritten.
{
  const other = await context.newPage();
  other.on('pageerror', e => problems.push('pageerror (tab 2): ' + e.message));
  await other.goto(URL, { waitUntil: 'domcontentloaded' });
  await other.waitForSelector('.cm-content', { timeout: 30000 });
  const otherText = () =>
    other.evaluate(() => [...document.querySelectorAll('.cm-content .cm-line')].map(l => l.textContent).join('\n'));

  await setDocument(page, '# 第一个标签页');
  await waitSaved();
  await other
    .waitForFunction(() => document.querySelector('#paper h1')?.textContent === '第一个标签页', null, { timeout: 5000 })
    .then(() => check(true, 'idle tab follows a save in another tab'), () => check(false, 'idle tab follows a save in another tab'));
  check((await otherText()) === '# 第一个标签页', 'idle tab editor shows the newer text', await otherText());

  // Tab 2 has an unsaved edit (inside its debounce) when a newer version from
  // tab 1 lands in storage. Writing it directly keeps the ordering exact.
  await other.locator('.cm-content').fill('# 第二个标签页正在写');
  await page.evaluate(
    key => localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)), text: '# 第一个标签页又改了', savedAt: Date.now() })),
    KEY,
  );
  const asked = await other
    .locator('.warnings-action', { hasText: '载入最新' })
    .waitFor({ timeout: 3000 })
    .then(() => true, () => false);
  check(asked, 'a tab with an unsaved edit is offered the latest version');
  check(
    (await otherText()) === '# 第二个标签页正在写',
    'and is not overwritten in the meantime',
    await otherText(),
  );
  if (asked) {
    await other.click('.warnings-action');
    check((await otherText()) === '# 第一个标签页又改了', 'loading the latest version adopts it', await otherText());
  }
  await other.close();
}

const errors = problems.filter(p => p.startsWith('pageerror') || p.startsWith('console'));
console.log(errors.length ? 'PROBLEMS:\n' + errors.join('\n') : 'no console/page errors');
await browser.close();
process.exit(problems.length ? 1 : 0);
