/**
 * Checks the AI-paste cleaner (src/convert/ai-paste.ts).
 *
 *  (a) unit tests over scripts/fixtures/ai/: every `<name>.in.md` is cleaned
 *      and compared with `<name>.out.md`; a fixture without an `.out.md` is
 *      ordinary Markdown and must come back byte for byte. Cleaning is also
 *      idempotent: cleaning the output again changes nothing.
 *  (b) in the browser: pasting an AI answer into the editor tidies it, shows
 *      the notice, and Undo puts back exactly what was pasted; pasting plain
 *      Markdown changes nothing. Needs the app served (APP_URL).
 *
 * Node runs the TypeScript module directly (type stripping), so the test
 * exercises the same file the app ships.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanAiPaste, signals } from '../src/convert/ai-paste.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures', 'ai');

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

/** First differing line, for a readable failure. */
function firstDiff(a, b) {
  const x = a.split('\n');
  const y = b.split('\n');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] !== y[i]) return `line ${i + 1}: got ${JSON.stringify(x[i])}, want ${JSON.stringify(y[i])}`;
  }
  return '';
}

/* ---------- (a) fixtures ---------- */

const inputs = readdirSync(FIXTURES).filter(f => f.endsWith('.in.md')).sort();
check(inputs.length >= 25, 'fixture set is present', `${inputs.length} inputs`);
for (const file of inputs) {
  const name = file.replace(/\.in\.md$/, '');
  const input = readFileSync(join(FIXTURES, file), 'utf8');
  const expectedFile = join(FIXTURES, `${name}.out.md`);
  const expected = existsSync(expectedFile) ? readFileSync(expectedFile, 'utf8') : input;
  const result = cleanAiPaste(input);
  const same = result.text === expected;
  const unchanged = !existsSync(expectedFile);
  check(
    same && result.changed === !unchanged,
    `${name}: ${unchanged ? 'left unchanged' : `cleaned (${result.fixes.join(', ')})`}`,
    same ? (unchanged ? '' : signals(input).join(', ')) : firstDiff(result.text, expected),
  );
  if (!unchanged) {
    const again = cleanAiPaste(result.text);
    check(again.text === result.text, `${name}: cleaning again changes nothing`, firstDiff(again.text, result.text));
  }
}

/* ---------- (b) the browser ---------- */

if (process.env.APP_URL || process.argv.includes('--browser')) {
  const { chromium } = await import('playwright');
  const { CHROMIUM } = await import('./app-helpers.mjs');
  const BASE = new URL('/', process.env.APP_URL ?? 'http://localhost:5200/').href.replace(/\/$/, '');
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1280, height: 800 } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(BASE + '/zh/');
  await page.waitForSelector('.cm-content', { timeout: 30000 });
  // CodeMirror keeps only the lines in view in the DOM; read its state instead.
  const text = () =>
    page.evaluate(() => {
      const content = document.querySelector('.cm-content');
      const view = content?.cmTile?.view ?? content?.cmView?.view;
      return view ? view.state.doc.toString() : [...content.querySelectorAll('.cm-line')].map(l => l.textContent).join('\n');
    });

  /** A real paste: the clipboard event goes through CodeMirror's own handler. */
  async function paste(content) {
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.evaluate(value => {
      const data = new DataTransfer();
      data.setData('text/plain', value);
      const target = document.querySelector('.cm-content');
      target.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
    }, content);
    await page.waitForTimeout(400);
  }

  const answer = readFileSync(join(FIXTURES, 'chatgpt-math-citations.in.md'), 'utf8');
  const cleaned = readFileSync(join(FIXTURES, 'chatgpt-math-citations.out.md'), 'utf8');
  await paste(answer);
  check((await text()) === cleaned, 'pasting a ChatGPT answer tidies it in the editor', firstDiff(await text(), cleaned));
  const notice = page.locator('#warnings');
  check(await notice.isVisible() && (await notice.innerText()).includes('已整理 AI 输出的格式'), 'the notice says so', await notice.innerText().catch(() => ''));
  check(await page.locator('.warnings-action', { hasText: '撤销' }).isVisible(), 'and offers 撤销');
  await page.waitForTimeout(300);
  check(!(await page.locator('#paper').innerText()).includes('【'), 'the preview has no citation markers');
  await page.click('.warnings-action');
  await page.waitForTimeout(200);
  check((await text()) === answer, 'undo restores exactly what was pasted', firstDiff(await text(), answer));

  const plain = readFileSync(join(FIXTURES, 'plain-markdown-escapes.in.md'), 'utf8');
  await paste(plain);
  check((await text()) === plain, 'plain Markdown pastes unchanged', firstDiff(await text(), plain));
  check(!(await page.locator('#warnings').innerText().catch(() => '')).includes('已整理'), 'and shows no notice');

  // The cleaner is not part of the first load.
  const early = await (await browser.newContext()).newPage();
  const scripts = [];
  early.on('request', r => { if (r.resourceType() === 'script') scripts.push(new URL(r.url()).pathname); });
  await early.goto(BASE + '/');
  await early.waitForSelector('.cm-content', { timeout: 30000 });
  check(!scripts.some(p => /ai-paste/.test(p)), 'the cleaner loads only on paste', scripts.filter(p => /ai-paste/.test(p)).join(' '));

  await browser.close();
  check(!errors.length, 'no console or page errors', errors.slice(0, 3).join(' | '));
}

process.exit(problems.length ? 1 : 0);
