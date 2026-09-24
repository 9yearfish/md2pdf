/**
 * Mermaid diagrams, end to end, through the real app: every diagram type in
 * `scripts/fixtures/mermaid/` must render in the preview and in the PDF.
 *
 * Preview: an SVG, no <foreignObject>, no filter, nothing drawn outside its
 * viewBox (it would be clipped), no request to another origin and no ELK.
 * PDF: no Mermaid source kept as a fallback, every label extractable as text,
 * no raster image anywhere, nothing past the page's edge, classDef colours.
 * Then: syntax errors (inline box in both, localised, rest of the document
 * intact, last good render kept while editing), the copy / download actions,
 * and that Mermaid stays lazy.
 *
 *   PORT=5330 npm run preview
 *   APP_URL=http://localhost:5330/ node scripts/mermaid.mjs
 *
 * PDFs and page PNGs (with pdftoppm) go to $MERMAID_OUT for looking at.
 */
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHROMIUM, setDocument } from './app-helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const OUT = process.env.MERMAID_OUT ?? path.join(os.tmpdir(), 'md2pdf-mermaid');
const FIXTURES = path.join(HERE, 'fixtures', 'mermaid');
mkdirSync(OUT, { recursive: true });

/**
 * Per fixture: labels that must come out of the PDF as text, and `raw`, a
 * piece of the source that only a raw-source fallback would print.
 */
const EXPECT = {
  architecture: { raw: 'architecture-beta', labels: ['Public API', 'Gateway', 'Application', 'Database', 'File store', 'Lambda worker'] },
  block: { raw: 'block-beta', labels: ['Frontend', 'Backend', 'Object storage', 'Calls'] },
  c4: { raw: 'C4Context', labels: ['System context for the invoicing service', 'Accountant', 'Invoicing service', 'Mail provider', 'Sends mail through'] },
  class: { raw: 'classDiagram', labels: ['Invoice', 'LineItem', 'Customer', '+String number', 'contains', 'receives'] },
  er: { raw: 'erDiagram', labels: ['CUSTOMER', 'ORDERLINE', 'PRODUCT', 'places', 'appears in', 'fullName'] },
  flowchart: { raw: 'classDef warm', labels: ['Receive order', 'Stock available?', 'Pack the parcel', 'print the', 'backorder', 'Shipping', 'Delivered', 'yes'] },
  'flowchart-cjk': { raw: 'flowchart LR', labels: ['开始处理', '数据校验', '完成'] },
  gantt: { raw: 'dateFormat', labels: ['Product launch plan', 'Market survey', 'Beta programme', 'General availability', 'Feb 2026', 'Jul 2026'] },
  gitgraph: { raw: 'checkout feature', labels: ['main', 'feature', 'add parser', 'merge parser', 'v1.0'] },
  journey: { raw: 'Find product: 5', labels: ['Checkout experience', 'Find product', 'Confirm payment', 'Shopper', 'Browse'] },
  kanban: { raw: 'task1[', labels: ['To do', 'In progress', 'Write specification', 'Implement exporter', 'Set up repository'] },
  mindmap: { raw: 'root((', labels: ['Release planning', 'Scope', 'Bug fixes', 'Milestones', 'Engineers'] },
  packet: { raw: 'packet-beta', labels: ['UDP header', 'Source port', 'Destination port', 'Checksum'] },
  pie: { raw: 'showData', labels: ['Traffic sources', 'Organic search', 'Social media'] },
  quadrant: { raw: 'quadrantChart', labels: ['Feature prioritisation', 'Quick wins', 'Dark mode', 'Offline sync', 'High effort'] },
  radar: { raw: 'radar-beta', labels: ['Team skills', 'Design', 'Operations', 'Alice', 'Bob'] },
  requirement: { raw: 'requirementDiagram', labels: ['export_requirement', 'Documents export to PDF', 'exporter', 'satisfies'] },
  sankey: { raw: 'sankey-beta', labels: ['Salaries', 'Budget', 'Research', 'Outreach'] },
  sequence: { raw: 'autonumber', labels: ['Upload draft', 'Draft accepted', 'Validates the', 'document schema', 'Leave comments', 'Review complete'] },
  state: { raw: 'stateDiagram-v2', labels: ['Drafting', 'Reviewing', 'Published', 'Archived', 'Two approvals', 'request changes'] },
  timeline: { raw: '2021 :', labels: ['History of the project', 'Prototype built', 'First customers', 'Seed funding'] },
  treemap: { raw: 'treemap-beta', labels: ['Company budget', 'Engineering', 'Salaries', 'Campaigns', 'Events'] },
  xychart: { raw: 'xychart-beta', labels: ['Monthly revenue', 'January', 'May', 'Revenue in thousands'] },
};

const names = readdirSync(FIXTURES).filter(f => f.endsWith('.mmd')).map(f => f.slice(0, -4)).sort();
const only = new Set(process.argv.slice(2));
const selected = names.filter(n => !only.size || only.has(n));

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};
for (const name of names) if (!EXPECT[name]) check(false, `fixture ${name} has expectations in scripts/mermaid.mjs`);

const fence = code => '```mermaid\n' + code.replace(/\n?$/, '\n') + '```\n';
const squash = text => text.replace(/\u00ad\s*/g, '').replace(/-\n/g, '').replace(/\s+/g, '');
const hasPdftoppm = spawnSync('pdftoppm', ['-v']).error === undefined;

const browser = await chromium.launch({ executablePath: CHROMIUM });

async function openApp(markdown, { path: at = '', permissions = [] } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  if (permissions.length) await context.grantPermissions(permissions, { origin: new globalThis.URL(URL).origin });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', r => requests.push(r.url()));
  page.on('pageerror', e => errors.push(`page error: ${e.message.slice(0, 200)}`));
  if (markdown !== null) {
    await page.addInitScript(text => {
      localStorage.setItem('md2pdf:draft:v1', JSON.stringify({ text, options: {}, savedAt: Date.now() }));
    }, markdown);
  }
  await page.goto(new globalThis.URL(at, URL).href, { waitUntil: 'load' });
  return { context, page, requests, errors };
}

/** Scroll the preview through, so every lazily rendered diagram comes into view. */
async function renderAll(page, count) {
  for (let i = 0; i < 80; i++) {
    const done = await page.evaluate(n => {
      const scroller = document.querySelector('.scroller');
      scroller.scrollTop += 700;
      const figures = [...document.querySelectorAll('#paper figure.diagram')];
      return figures.length >= n && figures.every(f => f.querySelector(':scope > svg, .diagram-error'));
    }, count);
    if (done) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

/** Click "Download PDF" and return its bytes and the notices shown. */
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
    const href = await Promise.race([window.__md2pdfDownload, new Promise(r => setTimeout(() => r(null), timeout))]);
    const warnings = document.getElementById('warnings')?.textContent ?? '';
    if (!href) return { error: warnings || 'no download triggered' };
    const bytes = new Uint8Array(await (await fetch(href)).arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { base64: btoa(binary), warnings };
  }, timeout);
}

function inspect(result, name) {
  const file = path.join(OUT, `${name}.pdf`);
  writeFileSync(file, Buffer.from(result.base64, 'base64'));
  if (hasPdftoppm) execFileSync('pdftoppm', ['-r', '80', '-png', file, path.join(OUT, name)]);
  return JSON.parse(execFileSync('python3', [path.join(HERE, 'pdf-check.py'), file], { encoding: 'utf8', maxBuffer: 64 << 20 }));
}

/* 1. Every type, in the preview and in one PDF. */
{
  const markdown =
    '# Mermaid coverage\n\n' + selected.map(n => `## ${n}\n\n${fence(readFileSync(path.join(FIXTURES, `${n}.mmd`), 'utf8'))}`).join('\n');
  const { context, page, requests, errors } = await openApp(markdown);
  const rendered = await renderAll(page, selected.length);
  check(rendered, 'every diagram rendered in the preview');
  const figures = await page.evaluate(() =>
    [...document.querySelectorAll('#paper figure.diagram')].map(figure => {
      const svg = figure.querySelector(':scope > svg');
      if (!svg) return { error: figure.querySelector('.diagram-error')?.textContent ?? 'no svg' };
      const box = svg.viewBox.baseVal;
      const b = svg.getBBox();
      const clipped = b.x < box.x - 1 || b.y < box.y - 1 || b.x + b.width > box.x + box.width + 1 || b.y + b.height > box.y + box.height + 1;
      return {
        foreignObject: svg.querySelectorAll('foreignObject').length,
        filters: svg.querySelectorAll('filter, [filter]').length,
        clipped,
        actions: figure.querySelectorAll('.diagram-actions button').length,
      };
    }),
  );
  const rows = {};
  selected.forEach((name, i) => {
    const f = figures[i] ?? { error: 'missing' };
    const notes = f.error ? [f.error] : [];
    if (!f.error) {
      if (f.foreignObject) notes.push(`${f.foreignObject} foreignObject`);
      if (f.filters) notes.push(`${f.filters} filters`);
      if (f.clipped) notes.push('drawing outside its viewBox');
      if (f.actions !== 3) notes.push('no export actions');
    }
    rows[name] = { preview: notes.length === 0, notes };
  });
  const foreign = requests.filter(u => !u.startsWith(new globalThis.URL(URL).origin));
  check(foreign.length === 0, 'no request leaves the origin (icons, fonts)', foreign.slice(0, 3).join(' '));
  check(!requests.some(u => /\/elk[-.]/.test(u)), 'the ELK layout chunk is never fetched');

  const result = await pdfBytes(page);
  if (result.error) {
    check(false, 'coverage PDF downloads', result.error);
  } else {
    const report = inspect(result, 'coverage');
    const text = squash(report.text);
    check(!/could not be rendered/i.test(result.warnings), 'no diagram reported as failed', result.warnings.slice(0, 200));
    if (report.images !== undefined && report.images !== null) {
      check(report.images === 0, 'no raster image in the PDF (diagrams are vectors)', `${report.images} image(s)`);
      check(report.outside.length === 0, 'nothing outside the page box', report.outside.slice(0, 3).join('; '));
      check(report.fills.includes('#ffe8cc') && report.strokes.includes('#d9480f'), 'classDef fill and stroke colours survive');
    }
    check(report.fonts.some(f => f.includes('NotoSansSC')), 'CJK labels are set in the CJK face', report.fonts.join(', '));
    for (const name of selected) {
      const { raw, labels } = EXPECT[name] ?? { raw: '\u0000', labels: [] };
      const missing = labels.filter(l => !text.includes(squash(l)));
      rows[name].text = missing.length === 0;
      rows[name].raw = text.includes(squash(raw));
      if (missing.length) rows[name].notes.push(`not text: ${missing.join(', ')}`);
      if (rows[name].raw) rows[name].notes.push('raw source in the PDF');
    }
    console.log(`      ${Array.isArray(report.pages) ? report.pages.length : report.pages} pages; PDF and PNGs in ${OUT}`);
  }
  console.log('\n      type            preview  pdf  text  notes');
  for (const name of selected) {
    const r = rows[name];
    const pdf = r.text !== undefined && !r.raw;
    console.log(`      ${name.padEnd(15)} ${r.preview ? 'ok  ' : 'FAIL'}     ${pdf ? 'ok ' : 'FAIL'}  ${r.text ? 'ok  ' : 'FAIL'}  ${r.notes.join('; ')}`);
    if (!r.preview || !pdf || !r.text) problems.push(`type ${name}`);
  }
  console.log('');
  for (const e of errors) check(false, e);
  await context.close();
}

/* 2. A syntax error: an inline box with the message and line, never a broken PDF. */
{
  const markdown =
    '# Errors\n\nBefore the diagrams.\n\n' +
    fence('flowchart LR\n  A[Good diagram] --> B[Still here]') +
    '\nBetween the diagrams.\n\n' +
    fence('flowchart TD\n  A --> B\n  B --> C{Unclosed\n  C --> D') +
    '\n' + fence('sequenceDiagram\n  Alice->>Bob: hi\n  Bob->>: missing') +
    '\n' + fence('notADiagram\n  x') +
    '\nAfter the diagrams.\n';
  const { context, page, errors } = await openApp(markdown);
  await renderAll(page, 4);
  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll('#paper .diagram-error')].map(e => ({
      title: e.querySelector('strong')?.textContent ?? '',
      message: e.querySelector('span')?.textContent ?? '',
      excerpt: e.querySelector('pre')?.textContent ?? '',
    })),
  );
  check(boxes.length === 3, 'preview shows an error box per broken diagram', `${boxes.length}`);
  check(boxes[0]?.title === 'Diagram error on line 4' && /Expecting/.test(boxes[0]?.message ?? ''), 'jison error: line and message', JSON.stringify(boxes[0]));
  check(/^3 \| /.test(boxes[1]?.excerpt ?? '') && boxes[1]?.title.includes('line 3'), 'error box quotes the offending line', JSON.stringify(boxes[1]));
  check(boxes[2]?.title === 'Unknown diagram type “notADiagram”', 'unknown diagram type is named', JSON.stringify(boxes[2]));
  check((await page.locator('#paper figure.diagram > svg').count()) === 1, 'the good diagram still renders');

  const result = await pdfBytes(page);
  if (result.error) check(false, 'a document with broken diagrams still downloads', result.error);
  else {
    const text = squash(inspect(result, 'errors').text);
    for (const t of ['Before the diagrams.', 'Good diagram', 'Still here', 'Between the diagrams.', 'Diagram error on line 4', 'Diagram error on line 3', 'Unknown diagram type', 'After the diagrams.']) {
      check(text.includes(squash(t)), `PDF: “${t}”`);
    }
    check(!text.includes(squash('Bob->>: missing')) || text.includes(squash('3 | Bob->>: missing')), 'PDF: no raw source, only the quoted line');
  }

  // Mid-edit: the last good render stays, dimmed, with the error over it.
  const good = 'flowchart LR\n  A[Mid edit] --> B[Target]';
  await setDocument(page, '# Edit\n\n' + fence(good));
  await page.waitForFunction(() => document.querySelector('#paper figure.diagram > svg')?.textContent.includes('Target'), null, { timeout: 30000 });
  await setDocument(page, '# Edit\n\n' + fence(good + ' --> C{Half typed'));
  await page.waitForSelector('#paper .diagram-error.badge', { timeout: 30000 }).catch(() => {});
  const stale = await page.evaluate(() => ({
    svg: Boolean(document.querySelector('#paper .diagram-stale svg')),
    badge: document.querySelector('#paper .diagram-error.badge strong')?.textContent ?? '',
  }));
  check(stale.svg && /line 2/.test(stale.badge), 'mid-edit error keeps the last good render with an error badge', JSON.stringify(stale));
  await setDocument(page, '# Edit\n\n' + fence(good + ' --> C{Typed}'));
  await page.waitForFunction(() => {
    const f = document.querySelector('#paper figure.diagram');
    return f?.querySelector(':scope > svg') && !f.querySelector('.diagram-error, .diagram-stale');
  }, null, { timeout: 30000 }).then(() => check(true, 'fixing the source replaces badge and stale render'), () => check(false, 'fixing the source replaces badge and stale render'));
  for (const e of errors) check(false, e);
  await context.close();

  // Localised: the same box on the German page.
  const de = await openApp('# Fehler\n\n' + fence('flowchart TD\n  A --> B\n  B --> C{Offen\n  C --> D'), { path: 'de/' });
  await renderAll(de.page, 1);
  const title = await de.page.evaluate(() => document.querySelector('#paper .diagram-error strong')?.textContent ?? '');
  check(title === 'Fehler im Diagramm in Zeile 4', 'error box is localised (de)', title);
  await de.context.close();
}

/* 3. Copy / download SVG / download PNG, by mouse and keyboard. */
{
  const { context, page, errors } = await openApp('# Export\n\n' + fence('flowchart LR\n  A[Export me] --> B[Done]'), {
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  await page.waitForSelector('#paper figure.diagram > svg', { timeout: 30000 });
  const toolbar = page.locator('#paper .diagram-actions');
  const opacity = () => toolbar.evaluate(el => getComputedStyle(el).opacity);
  check((await opacity()) === '0', 'actions hidden until hover or focus');
  await page.locator('#paper figure.diagram').hover();
  await page.waitForTimeout(250);
  check((await opacity()) === '1', 'actions appear on hover');
  await page.mouse.move(0, 0);
  await page.locator('#paper [data-diagram-action="copy"]').focus();
  await page.waitForTimeout(250);
  check((await opacity()) === '1', 'actions appear on keyboard focus');
  const labels = await page.$$eval('#paper .diagram-actions button', bs => bs.map(b => b.getAttribute('aria-label')));
  check(labels.join('|') === 'Copy SVG|Download SVG|Download PNG', 'actions have accessible names', labels.join('|'));
  const innerText = await page.evaluate(() => document.getElementById('paper').innerText);
  check(!/SVG|PNG/.test(innerText), 'action labels stay out of the preview’s text');

  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(e => `error ${e}`);
  check(clip.startsWith('<?xml') && clip.includes('Export') && clip.includes('xmlns="http://www.w3.org/2000/svg"'), 'copy SVG puts the SVG on the clipboard', clip.slice(0, 60));

  const download = async action => {
    await page.evaluate(() => {
      window.__save = new Promise(resolve => {
        const original = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () {
          HTMLAnchorElement.prototype.click = original;
          resolve({ href: this.href, name: this.download });
        };
      });
    });
    await page.locator(`#paper [data-diagram-action="${action}"]`).focus();
    await page.keyboard.press('Enter');
    return page.evaluate(async () => {
      const { href, name } = await Promise.race([window.__save, new Promise(r => setTimeout(() => r({}), 15000))]);
      if (!href) return { name: null };
      const blob = await (await fetch(href)).blob();
      const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
      return { name, type: blob.type, size: blob.size, head: [...head].map(b => b.toString(16).padStart(2, '0')).join(''), text: blob.type.includes('svg') ? await blob.text() : '' };
    });
  };
  const svg = await download('svg');
  check(svg.name === 'diagram-1.svg' && svg.type === 'image/svg+xml' && svg.text.includes('Export'), 'download SVG', `${svg.name} ${svg.type} ${svg.size} B`);
  const png = await download('png');
  check(png.name === 'diagram-1.png' && png.head === '89504e470d0a1a0a' && png.size > 2000, 'download PNG', `${png.name} ${png.type} ${png.size} B`);
  for (const e of errors) check(false, e);
  await context.close();
}

/* 4. Mermaid stays lazy: nothing is fetched until a diagram nears the viewport. */
{
  const filler = Array.from({ length: 120 }, (_, i) => `Paragraph ${i + 1}. ${'Some filler text to push the diagram far down. '.repeat(4)}`).join('\n\n');
  const { context, page, requests } = await openApp(`# Lazy\n\n${filler}\n\n${fence('flowchart LR\n  A[Far] --> B[Away]')}`);
  await page.waitForTimeout(2500);
  const mermaidChunk = () => requests.some(u => /mermaid\.core|flowDiagram/.test(u));
  check(!mermaidChunk(), 'Mermaid not fetched while its diagram is off screen');
  await page.evaluate(() => { const s = document.querySelector('.scroller'); s.scrollTop = s.scrollHeight; });
  await page.waitForSelector('#paper figure.diagram > svg', { timeout: 30000 }).catch(() => {});
  check(mermaidChunk(), 'Mermaid fetched once the diagram scrolls near');
  check(!requests.some(u => /\/elk[-.]/.test(u)), 'flowchart does not fetch ELK');
  await context.close();
}

await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'all mermaid checks passed');
process.exit(problems.length ? 1 : 0);
