/** Two-column document layout must survive both preview and PDF export. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { CHROMIUM, setDocument, downloadPdf } from './app-helpers.mjs';
const url = process.env.APP_URL ?? 'http://localhost:5200/';
const row = (kind = 'columns') => `:::: ${kind}\n::: column\n**甲方：客户有限公司**  \n统一社会信用代码：91330109MACJ8H2U4K\n:::\n::: column\n**乙方：南昌观夏科技有限公司**  \n统一社会信用代码：91360125MABUL9T91M\n:::\n::::`;
const fixture = `# 双栏合同\n\n${row()}\n\n普通正文。\n\n\\pagebreak\n\n${row('signatures')}`;
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : { channel: 'chromium' });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.locator('.cm-content').waitFor();
    await setDocument(page, fixture);
    await page.waitForFunction(() => document.querySelectorAll('#paper .md-columns').length === 2);
    const rows = await page.locator('#paper .md-columns').evaluateAll(elements => elements.map(row =>
      [...row.children].map(col => { const r = col.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, align: getComputedStyle(col).textAlign }; }),
    ));
    for (const cols of rows) {
      assert.equal(cols.length, 2);
      assert.ok(Math.abs(cols[0].y - cols[1].y) < 1, 'parties start on the same row');
      assert.ok(cols[1].x > cols[0].x + cols[0].width, 'columns have a physical gutter');
      assert.ok(Math.abs(cols[0].width - cols[1].width) < 1, 'equal column widths');
      assert.equal(cols[0].align, 'left');
      assert.equal(cols[1].align, 'left');
    }
    if (width === 1440) {
      const pdf = await downloadPdf(page);
      assert.equal(pdf.header, '%PDF-', JSON.stringify(pdf));
      assert.ok(pdf.size > 10000);
    }
    // Markers inside code stay code. An unclosed row and standalone column
    // stay ordinary source; untrusted attributes are not interpreted.
    for (const source of [
      '```markdown\n' + row() + '\n```',
      ':::: columns\n\nUnclosed',
      '::: column\n\nStandalone\n:::',
      ':::: columns onclick="alert(1)"\nText\n::::',
    ]) {
      await setDocument(page, source);
      await page.waitForFunction(() => !document.querySelector('#paper .md-columns'));
      assert.equal(await page.locator('#paper .md-column').count(), 0);
    }
    // A closing marker inside a fenced code block must not close the row.
    await setDocument(page, ':::: columns\n::: column\n```text\n::::\n::: \n```\n:::\n::: column\nRight\n:::\n::::');
    await page.waitForFunction(() => document.querySelectorAll('#paper .md-column').length === 2);
    assert.match(await page.locator('#paper pre').textContent(), /::::/);
    assert.deepEqual(errors, []);
    console.log(`ok ${width}: side-by-side columns, signatures, literal code, malformed fences, safe attributes`);
    await page.close();
  }
} finally { await browser.close(); }
