/**
 * Checks the font tiering from the outside: which font files a document
 * actually causes to be downloaded.
 */
import { chromium } from 'playwright';
import { CHROMIUM, setDocument, downloadPdf } from './app-helpers.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const CJK_FACES = ['NotoSansSC', 'NotoSansTC', 'NotoSansJP', 'NotoSansKR'];
const SCRIPT_FACES = ['NotoSansArabic', 'NotoSansHebrew', 'NotoSansThai', 'NotoSansDevanagari'];
const except = (list, ...keep) => list.filter(f => !keep.includes(f));

/**
 * `expect`: substrings of font files that must be fetched; `reject`: must not.
 * Every case rejects every family it does not name, so a tier that pulls in
 * something extra fails.
 */
const CASES = [
  { name: 'latin only', md: '# Hello\n\nPlain English text, no CJK at all.', expect: ['NotoSans-Regular.ttf'], reject: [...CJK_FACES, ...SCRIPT_FACES] },
  { name: 'common chinese', md: '# 标题\n\n常用汉字组成的段落，全部落在子集覆盖范围内。', expect: ['NotoSansSC-Regular.subset'], reject: ['.full.', ...except(CJK_FACES, 'NotoSansSC')] },
  // 龘 and 齉 are outside GB2312, so the subset cannot render them.
  { name: 'rare chinese', md: '# 标题\n\n生僻字测试：龘齉。', expect: ['NotoSansSC-Regular.full'], reject: ['.subset.', ...except(CJK_FACES, 'NotoSansSC')] },
  { name: 'japanese', md: '# 見出し\n\n日本語の文章です。ひらがな、カタカナ、漢字が混ざっています。', expect: ['NotoSansJP-Regular.subset'], reject: ['.full.', ...except(CJK_FACES, 'NotoSansJP')] },
  { name: 'korean common', md: '# 제목\n\n한국어 문장입니다. 자주 쓰는 한글만 있습니다.', expect: ['NotoSansKR-Regular.subset'], reject: ['.full.', ...except(CJK_FACES, 'NotoSansKR')] },
  // 똠 and 햏 are outside KS X 1001's 2,350 syllables.
  { name: 'korean rare', md: '# 제목\n\n완성형에 없는 글자: 똠방각하, 햏자.', expect: ['NotoSansKR-Regular.full'], reject: ['.subset.', ...except(CJK_FACES, 'NotoSansKR')] },
  { name: 'traditional chinese', md: '# 標題\n\n這是一個繁體中文的段落，我們說國語。', expect: ['NotoSansTC-Regular.subset'], reject: ['.full.', ...except(CJK_FACES, 'NotoSansTC')] },
  { name: 'russian', md: '# Заголовок\n\nЭто русский текст без иероглифов.', expect: ['NotoSans-Regular.ttf'], reject: [...CJK_FACES, ...SCRIPT_FACES] },
  { name: 'vietnamese', md: '# Tiêu đề\n\nTiếng Việt có nhiều dấu: ắ ặ ề ổ ợ ự.', expect: ['NotoSans-Regular.ttf'], reject: [...CJK_FACES, ...SCRIPT_FACES] },
  { name: 'german', md: '# Überschrift\n\nDie Straßenverkehrsordnung gilt für alle Verkehrsteilnehmer.', expect: ['NotoSans-Regular.ttf'], reject: [...CJK_FACES, ...SCRIPT_FACES] },
  { name: 'arabic', md: '# عنوان\n\nهذا نص عربي.', expect: ['NotoSansArabic-Regular.ttf'], reject: [...CJK_FACES, ...except(SCRIPT_FACES, 'NotoSansArabic')] },
  {
    name: 'mixed',
    md: '# Mixed\n\nEnglish with Русский, 日本語のかな, 한국어 and مرحبا.',
    expect: ['NotoSansJP-Regular.subset', 'NotoSansKR-Regular.subset', 'NotoSansArabic-Regular.ttf'],
    reject: ['.full.', 'NotoSansSC', 'NotoSansTC', 'NotoSansHebrew', 'NotoSansThai', 'NotoSansDevanagari'],
  },
];

let failures = 0;
for (const testCase of CASES) {
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
  });
  const page = await browser.newPage();
  // Data-saver mode turns off the background warm-up, which would otherwise
  // fetch fonts for the sample document before the test's own text is in.
  // This also exercises the path where nothing is fetched ahead of time.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  const fonts = new Set();
  page.on('request', r => {
    const url = r.url();
    if (url.includes('/fonts/')) fonts.add(url.split('/fonts/')[1].split('?')[0]);
  });

  await page.goto(URL, { waitUntil: 'load' });
  await setDocument(page, testCase.md);
  const pdf = await downloadPdf(page, 180000);
  if (pdf.error || pdf.header !== '%PDF-') {
    console.log(`FAIL  ${testCase.name} — no PDF: ${pdf.error ?? pdf.header}`);
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
  console.log(`      fonts: ${[...fonts].filter(f => /\.(ttf|otf)$/.test(f)).join(', ') || '(none)'}`);
  if (missing.length) console.log(`      missing: ${missing.join(', ')}`);
  if (unwanted.length) console.log(`      should not have loaded: ${unwanted.join(', ')}`);

  await browser.close();
}
console.log(failures ? `${failures} case(s) failed` : 'all font tier cases passed');
process.exit(failures ? 1 : 0);
