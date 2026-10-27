/** Contract preset: party/code rows and the actual PDF's table colours. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CHROMIUM, setDocument } from './app-helpers.mjs';
const text = `---
template: contract
lang: zh-CN
---

::: center
# 开发合同
:::

:::: columns
::: column
甲方：客户有限公司${'  '}
乙方：南昌观夏科技有限公司
:::
::: column
社会信用代码：91330109MACJ8H2U4K${'  '}
社会信用代码：91360125MABUL9T91M
:::
::::

合同正文。

### 一、开发内容

测试条款。

| 商品名称 | 说明 | 费用（含税价） |
| :--- | :--- | :---: |
| 功能开发 | 具体功能见附件 | 18,000.00 元 |
`;
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : { channel: 'chromium' });
const out = await mkdtemp(path.join(os.tmpdir(), 'md2pdf-contract-'));
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.goto(process.env.APP_URL ?? 'http://localhost:5200/');
 await page.locator('.cm-content').waitFor();
 await setDocument(page, text);
 await page.waitForFunction(() => document.querySelector('#paper')?.dataset.template === 'contract');
 const preview = await page.locator('#paper').evaluate(root => {
   const th = root.querySelector('th'), td = root.querySelector('td');
   const row = root.querySelector('.md-columns');
   const cols = [...row.children].map(c => ({ text: c.textContent, x: c.getBoundingClientRect().x, y: c.getBoundingClientRect().y }));
   return { serif: root.hasAttribute('data-serif'), th: getComputedStyle(th).backgroundColor, white: getComputedStyle(th).color, td: getComputedStyle(td).backgroundColor, cols, tableWidth: root.querySelector('table').getBoundingClientRect().width, rowWidth: row.getBoundingClientRect().width };
 });
 assert.equal(preview.serif, true);
 assert.equal(preview.th, 'rgb(64, 64, 64)');
 assert.equal(preview.white, 'rgb(255, 255, 255)');
 assert.equal(preview.td, 'rgb(235, 235, 235)');
 assert.ok(Math.abs(preview.tableWidth - preview.rowWidth) < 2);
 assert.match(preview.cols[0].text, /甲方.*乙方/s);
 assert.equal((preview.cols[1].text.match(/社会信用代码/g) ?? []).length, 2);
 assert.ok(preview.cols[1].x > preview.cols[0].x);
 assert.ok(Math.abs(preview.cols[1].y - preview.cols[0].y) < 1);
 const downloadPromise = page.waitForEvent('download', { timeout: 180000 });
 await page.click('#download');
 const download = await downloadPromise;
 const pdf = path.join(out, 'contract.pdf');
 await download.saveAs(pdf);
 const result = execFileSync('python3', ['-c', `
import fitz,sys
p=fitz.open(sys.argv[1])[0]
spans=[s for b in p.get_text('dict')['blocks'] for l in b.get('lines',[]) for s in l['spans']]
def get(text): return next(s for s in spans if text in s['text'])
a,b=get('甲方：'),get('乙方：')
codes=[s for s in spans if '社会信用代码：' in s['text']]
assert len(codes)==2
assert abs(a['bbox'][1]-codes[0]['bbox'][1])<1
assert abs(b['bbox'][1]-codes[1]['bbox'][1])<1
assert a['bbox'][1]<b['bbox'][1]
assert a['bbox'][0]<codes[0]['bbox'][0]
assert 'Serif' in a['font']
title=get('开发合同')
assert a['bbox'][1]-title['bbox'][3]>15, 'title must leave room above party info'
assert get('测试条款。')['bbox'][1]-get('一、开发内容')['bbox'][1]>16, 'clause heading must not overlap its body'
header=get('商品名称')
assert header['color']==0xffffff
fills=[d['fill'] for d in p.get_drawings() if d.get('fill')]
assert any(all(abs(x-64/255)<0.01 for x in f) for f in fills)
assert any(all(abs(x-235/255)<0.01 for x in f) for f in fills)
print('PDF: aligned party/code rows, serif body, title clearance, white header text, dark/grey fills')
`, pdf], { encoding: 'utf8' });
 console.log(result.trim());
 // The contract's colours must not leak into ordinary Markdown documents.
 await setDocument(page, '# Default\n\n| A | B |\n|---|---|\n| C | D |');
 await page.waitForFunction(() => document.querySelector('#paper')?.dataset.template === 'default');
 assert.notEqual(await page.locator('#paper th').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(64, 64, 64)');
 assert.deepEqual(errors, []);
 console.log('ok contract preset and default style isolation');
} finally { await browser.close(); await rm(out, { recursive: true, force: true }); }
