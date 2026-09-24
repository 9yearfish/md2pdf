/**
 * Typesets one document per script through the real app and inspects the PDF:
 *
 * - the text round-trips (extraction finds it, and nothing is drawn with
 *   .notdef, which extraction alone cannot see);
 * - the embedded fonts are the expected faces (NotoSansJP for Japanese, ...);
 * - Mermaid labels are in the PDF as text, not paths.
 *
 * Every PDF, its pages as PNG (when pdftoppm is installed) and a screenshot of
 * the preview are written to SCRIPTS_OUT for looking at.
 *
 *   PORT=5300 npm run preview
 *   APP_URL=http://localhost:5300/ node scripts/scripts-render.mjs [case ...]
 */
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHROMIUM } from './app-helpers.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const OUT = process.env.SCRIPTS_OUT ?? path.join(os.tmpdir(), 'md2pdf-scripts');
const CHECKER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pdf-check.py');
mkdirSync(OUT, { recursive: true });

const diagram = (a, b, c) => `\n\n\`\`\`mermaid\nflowchart LR\n  A[${a}] --> B[${b}]\n  B --> C(${c})\n\`\`\`\n`;

/**
 * `texts` must survive extraction; `labels` are the diagram's; `fonts` must be
 * embedded and `reject` must not be. `lang` sets DocumentOptions.lang through
 * a saved draft, which is how the option reaches the app without a UI control.
 */
const CASES = [
  {
    name: 'en',
    md: '# English document\n\nTypesetting "quoted text" isn\'t hard; internationalization considerations notwithstanding, extraordinarily long words get hyphenated when the paragraph is justified.' + diagram('Start here', 'Middle step', 'Finish line'),
    texts: ['English document', 'quoted text', '“quoted text”', 'isn’t'],
    labels: ['Start here', 'Middle step', 'Finish line'],
    fonts: ['NotoSans-Regular', 'NotoSans-Bold'],
    reject: ['NotoSansSC', 'NotoSansJP', 'NotoSansKR', 'NotoSansTC', 'Arabic'],
  },
  {
    name: 'de',
    md: '# Deutsches Dokument\n\nDie Donaudampfschifffahrtsgesellschaft veröffentlichte die Rechtsschutzversicherungsgesellschaften und ihre Arbeitsunfähigkeitsbescheinigungen, "damit" die Straßenverkehrsordnung für alle Verkehrsteilnehmer verständlich ist und nicht nur für die Fachleute, die sich damit beschäftigen.' + diagram('Anfang', 'Größenordnung', 'Schluss'),
    texts: ['Deutsches Dokument', '„damit“', 'Straßenverkehrsordnung'],
    labels: ['Anfang', 'Größenordnung', 'Schluss'],
    fonts: ['NotoSans-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP'],
    hyphenated: true,
  },
  {
    name: 'fr',
    md: '# Document français\n\nLes caractéristiques exceptionnellement remarquables de l’internationalisation sont "très importantes" pour les développeurs et les utilisateurs qui travaillent dans des environnements multilingues avec des caractères accentués.' + diagram('Début', 'Étape intermédiaire', 'Fin'),
    texts: ['Document français', '«', 'très importantes', 'caractéristiques'],
    labels: ['Début', 'Étape intermédiaire', 'Fin'],
    fonts: ['NotoSans-Regular'],
    reject: ['NotoSansSC'],
  },
  {
    name: 'ru',
    md: '# Русский документ\n\nДостопримечательности электрификации высокопроизводительного оборудования и "кавычки" для проверки переносов в выровненном по ширине тексте, который должен выглядеть аккуратно и читаться легко.\n\nКод: `переменная = 1`.' + diagram('Начало', 'Обработка данных', 'Конец'),
    texts: ['Русский документ', '«кавычки»', 'Достопримечательности', 'переменная=1'],
    labels: ['Начало', 'Обработка данных', 'Конец'],
    fonts: ['NotoSans-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP'],
    hyphenated: true,
  },
  {
    name: 'vi',
    md: '# Tài liệu tiếng Việt\n\nTiếng Việt là ngôn ngữ chính thức của Việt Nam, được viết bằng chữ Quốc ngữ với nhiều dấu thanh: ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ ế ề ể ễ ệ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ứ ừ ử ữ ự.' + diagram('Bắt đầu', 'Xử lý dữ liệu', 'Kết thúc'),
    texts: ['Tài liệu tiếng Việt', 'ắ ằ ẳ ẵ ặ', 'ớ ờ ở ỡ ợ ứ ừ ử ữ ự'],
    labels: ['Bắt đầu', 'Xử lý dữ liệu', 'Kết thúc'],
    fonts: ['NotoSans-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP', 'NotoSansKR'],
  },
  {
    name: 'el',
    md: '# Ελληνικό έγγραφο\n\nΗ ελληνική γλώσσα γράφεται με το ελληνικό αλφάβητο. Πολυτονικό: ἀρχὴ ἥμισυ παντός.' + diagram('Αρχή', 'Επεξεργασία', 'Τέλος'),
    texts: ['Ελληνικό έγγραφο', 'ἀρχὴ ἥμισυ παντός'],
    labels: ['Αρχή', 'Επεξεργασία', 'Τέλος'],
    fonts: ['NotoSans-Regular'],
    reject: ['NotoSansSC'],
  },
  {
    name: 'zh-Hans',
    md: '# 简体中文文档\n\n这是一个用来测试排版的段落，其中有“引号”、（括号）和混排的 English 单词以及数字 123。标点符号应该正确地压缩，行首不应出现句号。\n\n' +
      '行首禁则：句号、逗号，“引号”和（括号）都不应该出现在行首。'.repeat(8) +
      '\n\n```python\nprint("你好，世界")  # 注释\n```\n' + diagram('开始', '处理 Markdown 数据', '结束'),
    texts: ['简体中文文档', '“引号”', '（括号）', 'English', 'print("你好，世界")#注释'],
    noLineStart: '、。，．”）',
    labels: ['开始', '处理', 'Markdown', '结束'],
    fonts: ['NotoSansSC-Regular', 'NotoSansSC-Bold'],
    reject: ['NotoSansJP', 'NotoSansTC', 'NotoSansKR'],
  },
  {
    name: 'zh-Hant',
    md: '# 繁體中文文件\n\n這是一個用來測試排版的段落，我們說「國語」，也會寫“引號”與（括號）。這個檔案裡的漢字應該使用台灣的字形，例如：說、為、們、這、個、國、學、體。' + diagram('開始', '處理資料', '結束'),
    texts: ['繁體中文文件', '這是一個用來測試排版的段落', '「國語」'],
    labels: ['開始', '處理資料', '結束'],
    fonts: ['NotoSansTC-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP', 'NotoSansKR'],
  },
  {
    name: 'ja',
    md: '# 日本語の文書\n\nこれは組版を確かめるための段落です。「かぎ括弧」や全角の句読点、そして Typst や PDF といった欧文を交えた和欧混植も、余計な空白なしに自然に組まれます。直・骨・角・化・述は日本の字形で表示されるべきです。\n\n' +
      '句読点が行頭に来てはいけません、。「括弧」、（丸括弧）、ッャュョ、「引用」。'.repeat(8) +
      '\n\n```js\nconst 名前 = "テスト"; // コメント\n```\n' + diagram('開始', 'Markdown を解析', '終了'),
    texts: ['日本語の文書', '「かぎ括弧」', '直・骨・角', 'const名前=「テスト」;//コメント'.replace('「テスト」', '"テスト"')],
    noLineStart: '、。，．」』）',
    labels: ['開始', 'Markdown', 'を解析', '終了'],
    fonts: ['NotoSansJP-Regular', 'NotoSansJP-Bold'],
    reject: ['NotoSansSC', 'NotoSansTC', 'NotoSansKR'],
  },
  {
    name: 'ko',
    md: '# 한국어 문서\n\n이것은 조판을 확인하기 위한 문단입니다. 한글과 English 가 섞인 문장도 자연스럽게 조판되어야 합니다. 띄어쓰기로 줄을 나눕니다.\n\n```\nlet 이름 = "값"; // 주석\n```\n' + diagram('시작', '데이터 처리', '끝'),
    texts: ['한국어 문서', '이것은 조판을 확인하기 위한 문단입니다', 'let이름="값";//주석'],
    labels: ['시작', '데이터 처리', '끝'],
    fonts: ['NotoSansKR-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP', 'NotoSansTC'],
  },
  {
    name: 'ko-rare',
    // 똠, 햏 and 뷁 are outside KS X 1001's 2,350 syllables.
    md: '# 드문 한글\n\n완성형에 없는 글자: 똠방각하, 햏자, 뷁.' + diagram('똠', '햏', '뷁'),
    texts: ['드문 한글', '똠방각하', '햏자', '뷁'],
    labels: ['똠', '햏', '뷁'],
    fonts: ['NotoSansKR-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP'],
  },
  {
    name: 'ar',
    md: '# مستند عربي\n\nاللغة العربية تكتب من اليمين إلى اليسار، وفيها كلمات English وأرقام 123 داخل النص.' + diagram('البداية', 'معالجة البيانات', 'النهاية'),
    texts: ['English', '123'],
    words: ['مستند', 'العربية', 'اليمين', 'اليسار'],
    labels: ['البداية', 'النهاية'],
    clusters: true,
    fonts: ['NotoSansArabic-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP'],
  },
  {
    name: 'he',
    md: '# מסמך עברי\n\nעברית נכתבת מימין לשמאל, עם מילים English באמצע המשפט.' + diagram('התחלה', 'עיבוד', 'סוף'),
    texts: ['English'],
    words: ['מסמך', 'עברית', 'נכתבת', 'מימין'],
    labels: ['התחלה', 'עיבוד', 'סוף'],
    fonts: ['NotoSansHebrew-Regular'],
    reject: ['NotoSansSC'],
  },
  {
    name: 'th',
    md: '# เอกสารภาษาไทย\n\nภาษาไทยเป็นภาษาที่ไม่มีการเว้นวรรคระหว่างคำ การตัดคำจึงต้องใช้พจนานุกรมเพื่อหาขอบเขตของคำอย่างถูกต้อง และข้อความนี้ยาวพอที่จะต้องขึ้นบรรทัดใหม่หลายครั้ง' + diagram('เริ่มต้น', 'ประมวลผล', 'สิ้นสุด'),
    texts: ['เอกสารภาษาไทย'],
    labels: ['เริ่มต้น', 'ประมวลผล', 'สิ้นสุด'],
    clusters: true,
    fonts: ['NotoSansThai-Regular'],
    reject: ['NotoSansSC'],
  },
  {
    name: 'hi',
    md: '# हिन्दी दस्तावेज़\n\nहिन्दी भाषा देवनागरी लिपि में लिखी जाती है। संयुक्ताक्षर जैसे क्ष, त्र, ज्ञ और श्र सही ढंग से बनने चाहिए।' + diagram('शुरुआत', 'डेटा प्रसंस्करण', 'किताब समाप्त'),
    texts: ['हिन्दी', 'देवनागरी', 'संयुक्ताक्षर'],
    labels: ['शुरुआत', 'डेटा प्रसंस्करण', 'किताब समाप्त'],
    fonts: ['NotoSansDevanagari-Regular'],
    reject: ['NotoSansSC'],
  },
  {
    name: 'mixed',
    md: '# Mixed scripts\n\nEnglish prose with a Russian word (привет), Greek (αβγ), Chinese 中文, Japanese かな, Korean 한국어 and Arabic مرحبا, all in one paragraph.' + diagram('English', 'Русский', 'かな 한국어'),
    texts: ['Mixed scripts', 'привет', 'αβγ', '中文', 'かな', '한국어'],
    words: ['مرحبا'],
    labels: ['English', 'Русский', 'かな', '한국어'],
    clusters: true,
    fonts: ['NotoSans-Regular', 'NotoSansJP-Regular', 'NotoSansKR-Regular', 'NotoSansArabic-Regular'],
    reject: ['NotoSansSC', 'NotoSansTC', '.full'],
  },
  {
    name: 'unsupported',
    // Bengali has no bundled face: it may render as boxes, but never silently.
    md: '# Unsupported script\n\nBengali: বাংলা ভাষা.',
    texts: ['Unsupported script'],
    labels: [],
    fonts: ['NotoSans-Regular'],
    reject: ['NotoSansSC', 'NotoSansJP', 'NotoSansDevanagari'],
    tofu: 'বাংলাভষ',
  },
  {
    name: 'override-ja',
    // Kanji only, which alone reads as Chinese; the option says Japanese.
    lang: 'ja',
    md: '# 漢字\n\n東京都庁、直角、骨格、変化。',
    texts: ['東京都庁', '直角'],
    labels: [],
    fonts: ['NotoSansJP-Regular'],
    reject: ['NotoSansSC', 'NotoSansTC'],
  },
];

async function pdfBytes(page, timeout = 240000) {
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
  return page.evaluate(async timeout => {
    const href = await Promise.race([
      window.__md2pdfDownload,
      new Promise(resolve => setTimeout(() => resolve(null), timeout)),
    ]);
    const warnings = document.getElementById('warnings')?.textContent ?? '';
    if (!href) return { error: warnings || 'no download triggered' };
    const bytes = new Uint8Array(await (await fetch(href)).arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { base64: btoa(binary), warnings };
  }, timeout);
}

/** Whitespace and hyphenation are layout, not text. */
const squash = text => text.replace(/\u00ad\s*/g, '').replace(/-\n/g, '').replace(/\s+/g, '');

/**
 * Typst 0.14 maps every glyph of a multi-glyph cluster to the cluster's text,
 * so Arabic letters whose dots are separate glyphs, and Thai stacked marks,
 * extract doubled ("مستتنند"). The page is right; only extraction is off. For
 * those scripts, compare letters with repeats collapsed and marks ignored.
 */
const letters = text => squash(text).replace(/[^\p{L}\p{N}]/gu, '').replace(/(.)\1+/gu, '$1');

const only = new Set(process.argv.slice(2));
const hasPdftoppm = spawnSync('pdftoppm', ['-v']).error === undefined;
let failures = 0;

for (const testCase of CASES) {
  if (only.size && !only.has(testCase.name)) continue;
  const problems = [];
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const fonts = new Set();
  page.on('request', r => {
    const url = r.url();
    if (url.includes('/fonts/')) fonts.add(url.split('/fonts/')[1].split('?')[0]);
  });
  page.on('pageerror', e => problems.push(`page error: ${e.message.slice(0, 200)}`));
  // The document arrives as a saved draft, so it is what first paints and the
  // sample never causes any font requests of its own.
  await page.addInitScript(({ text, lang }) => {
    localStorage.setItem('md2pdf:draft:v1', JSON.stringify({ text, options: { lang }, savedAt: Date.now() }));
  }, { text: testCase.md, lang: testCase.lang ?? 'auto' });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const result = await pdfBytes(page);
  if (result.error) {
    console.log(`FAIL  ${testCase.name} — no PDF: ${result.error}`);
    failures++;
    await browser.close();
    continue;
  }
  const file = path.join(OUT, `${testCase.name}.pdf`);
  writeFileSync(file, Buffer.from(result.base64, 'base64'));
  if (testCase.labels.length) {
    await page.waitForSelector('#paper .diagram svg', { timeout: 30000 }).catch(() => {});
  }
  await page.locator('#paper').screenshot({ path: path.join(OUT, `${testCase.name}-preview.png`) }).catch(() => {});
  if (hasPdftoppm) execFileSync('pdftoppm', ['-r', '110', '-png', file, path.join(OUT, testCase.name)]);

  const report = JSON.parse(execFileSync('python3', [CHECKER, file], { encoding: 'utf8' }));
  const norm = testCase.clusters ? letters : squash;
  const text = norm(report.text);
  for (const expected of [...testCase.texts, ...testCase.labels]) {
    if (!text.includes(norm(expected))) problems.push(`text missing: ${expected}`);
  }
  // Right-to-left runs may come out of extraction in either order.
  for (const word of testCase.words ?? []) {
    const w = norm(word);
    if (!text.includes(w) && !text.includes([...w].reverse().join(''))) problems.push(`word missing: ${word}`);
  }
  if (testCase.tofu) {
    // Expected tofu must be announced, character by character.
    const unannounced = [...testCase.tofu].filter(ch => !result.warnings.includes(ch));
    if (unannounced.length) problems.push(`tofu without a warning: ${unannounced.join(' ')}`);
    if (report.notdef && !report.notdef.length) problems.push('expected .notdef glyphs, found none (checker blind?)');
  } else if (report.notdef?.length) {
    problems.push(`drawn as .notdef (tofu): ${[...new Set(report.notdef)].join(' ')}`);
  }
  for (const expected of testCase.fonts) {
    if (!report.fonts.some(f => f.includes(expected))) problems.push(`font not embedded: ${expected}`);
  }
  for (const unwanted of testCase.reject) {
    const embedded = report.fonts.filter(f => f.includes(unwanted));
    const fetched = [...fonts].filter(f => f.includes(unwanted));
    if (embedded.length) problems.push(`unexpected font embedded: ${embedded.join(', ')}`);
    if (fetched.length) problems.push(`unexpected font fetched: ${fetched.join(', ')}`);
  }
  if (testCase.hyphenated && !/\u00ad|-\n/.test(report.text)) problems.push('no hyphenation found');
  // Line-breaking rules: closing punctuation never starts a line.
  if (testCase.noLineStart) {
    const bad = report.text.split('\n').map(l => l.trim()).filter(l => l && testCase.noLineStart.includes(l[0]));
    if (bad.length) problems.push(`line starts with closing punctuation: ${bad.slice(0, 3).join(' | ')}`);
  }

  const ok = problems.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${testCase.name}`);
  console.log(`      embedded: ${report.fonts.join(', ')}`);
  console.log(`      fetched:  ${[...fonts].filter(f => /\.(ttf|otf|woff2)$/.test(f)).join(', ') || '(none)'}`);
  if (result.warnings) console.log(`      warnings: ${result.warnings.slice(0, 200)}`);
  for (const problem of problems) console.log(`      ${problem}`);
  await browser.close();
}

console.log(`${report_backend()}; output in ${OUT}`);
console.log(failures ? `${failures} case(s) failed` : 'all script cases passed');
process.exit(failures ? 1 : 0);

function report_backend() {
  const probe = spawnSync('python3', ['-c', 'import fitz'], { encoding: 'utf8' });
  return probe.status === 0 ? 'checked with PyMuPDF (text, fonts, .notdef)' : 'checked without PyMuPDF (no .notdef check)';
}
