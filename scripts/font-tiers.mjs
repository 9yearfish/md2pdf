/**
 * Checks the font tiering from the outside: which font files a document
 * actually causes to be downloaded.
 */
import { chromium } from 'playwright';
import { CHROMIUM, setDocument, waitForConversion } from './app-helpers.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const CASES = [
  { name: 'latin only', md: '# Hello\n\nPlain English text, no CJK at all.', expect: ['NotoSans-'], reject: ['NotoSansSC'] },
  { name: 'common chinese', md: '# 标题\n\n常用汉字组成的段落，全部落在子集覆盖范围内。', expect: ['NotoSansSC-Regular.subset'], reject: ['.full.ttf'] },
  // 龘 and 齉 are outside GB2312, so the subset cannot render them.
  { name: 'rare chinese', md: '# 标题\n\n生僻字测试：龘齉。', expect: ['NotoSansSC-Regular.full'], reject: ['.subset.ttf'] },
];

let failures = 0;
for (const testCase of CASES) {
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  const fonts = new Set();
  page.on('request', r => {
    const url = r.url();
    if (url.includes('/fonts/')) fonts.add(url.split('/fonts/')[1]);
  });

  await page.goto(URL, { waitUntil: 'load' });
  await setDocument(page, testCase.md);
  await page.click('#convert');
  try {
    await waitForConversion(page, 180000);
  } catch {
    console.log(`FAIL  ${testCase.name} — conversion never finished`);
    console.log('      overlay:', await page.textContent('#overlay-title'));
    console.log('      detail:', (await page.textContent('#overlay-detail'))?.slice(0, 300));
    if (errors.length) console.log('      errors:', errors.slice(0, 3).join(' | '));
    failures++;
    await browser.close();
    continue;
  }

  const loaded = [...fonts].join(' ');
  const missing = testCase.expect.filter(f => !loaded.includes(f));
  const unwanted = testCase.reject.filter(f => loaded.includes(f));
  const ok = !missing.length && !unwanted.length;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${testCase.name}`);
  console.log(`      fonts: ${[...fonts].filter(f => f.endsWith('.ttf')).join(', ') || '(none)'}`);
  if (missing.length) console.log(`      missing: ${missing.join(', ')}`);
  if (unwanted.length) console.log(`      should not have loaded: ${unwanted.join(', ')}`);

  await browser.close();
}
console.log(failures ? `${failures} case(s) failed` : 'all font tier cases passed');
process.exit(failures ? 1 : 0);
