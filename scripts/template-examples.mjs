/** Every template example follows the active template and UI locale. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { CHROMIUM, setDocument } from './app-helpers.mjs';
const base=process.env.APP_URL ?? 'http://localhost:5200/';
const locales=['en','zh','ja','ko','es','pt','fr','de','ru'];
const templates=['default','contract','resume','report','academic','letter'];
const out=await mkdtemp(path.join(os.tmpdir(),'md2pdf-examples-'));
const browser=await chromium.launch(CHROMIUM?{executablePath:CHROMIUM}:{channel:'chromium'});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Analytics is not part of an example's behavior; keep external requests out
// of this test and preserve all first-party CSP and error checking.
await context.route(/https:\/\/(?:www\.googletagmanager\.com|static\.cloudflareinsights\.com)\//,route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
const errors=[];
async function saved(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null'));}
try {
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 for(const locale of locales){
  await page.goto(new URL(locale==='en'?'/':`/${locale}/`,base).href);
  await page.locator('.cm-content').waitFor();
  const data=await page.locator('#md2pdf-locale').textContent().then(JSON.parse);
  assert.equal(data.code,locale);
  assert.deepEqual(Object.keys(data.examples).sort(),templates.filter(t=>t!=='default').sort());
  if(await page.locator('#settings').isHidden())await page.click('#settings-toggle');
  for(const template of templates){
   // Current example front matter must not disable choosing another template.
   // A restored draft may contain someone else's explicit template: New first.
   await page.click('#new-doc');
   await page.locator('#opt-template').selectOption(template);
   await page.waitForFunction(t=>document.querySelector('#empty-example').dataset.template===t,template);
   assert.equal(await page.locator('#opt-template').isEnabled(),true);
   await page.click('#empty-example');
   const expected=template==='default'?data.sample:data.examples[template];
   await page.waitForFunction(text=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text===text,expected);
   assert.equal((await saved(page)).options.template,template);
   assert.equal(await page.locator('#opt-template').isEnabled(),true);
   await page.waitForFunction(t=>document.querySelector('#paper').dataset.template===t,template);
   if(template==='contract'){
    assert.equal(await page.locator('#paper .md-columns').count(),2);
    assert.equal(await page.locator('#paper th').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(64, 64, 64)');
    assert.ok(!expected.includes('君月汇')&&!expected.includes('91330109MACJ8H2U4K'));
   }
   // Real PDF, not just the HTML preview: all 54 locale/template pairs.
   const downloading=page.waitForEvent('download',{timeout:180000});
   await page.click('#download');
   const download=await downloading;
   const file=path.join(out,`${locale}-${template}.pdf`);
   await download.saveAs(file);
   const info=JSON.parse(execFileSync('python3',['scripts/pdf-check.py',file],{encoding:'utf8'}));
   assert.ok(info.text.trim().length>20,`${locale}/${template}: PDF has text`);
   assert.deepEqual(info.notdef,[],`${locale}/${template}: missing glyphs`);
   assert.deepEqual(info.outside,[],`${locale}/${template}: content outside the page`);
   // Undo from a loaded example restores both text and chosen layout.
   if(template==='resume'){
    const before=await saved(page);
    const priorId=before.id;
    await setDocument(page,'# Keep my draft\n\nContent that must survive loading an example.');
    await page.waitForTimeout(200);
    await page.click('#template-example');
    await page.waitForFunction(text=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text===text,expected);
    assert.notEqual((await saved(page)).id,priorId);
    await page.locator('#warnings .warnings-action').click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text.startsWith('# Keep my draft'));
    assert.equal((await saved(page)).options.template,'resume');
    // Choosing a style does not replace the text. The visible settings
    // button loads the new template even with an existing document.
    await page.locator('#opt-template').selectOption('contract');
    await page.waitForFunction(()=>document.querySelector('#template-example').dataset.template==='contract');
    assert.ok((await saved(page)).text.startsWith('# Keep my draft'));
    await page.click('#template-example');
    await page.waitForFunction(text=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text===text,data.examples.contract);
   }
  }
  console.log(`ok ${locale}: all 6 templates, PDF text/glyphs, switch without replacement, load and Undo`);
 }
 // Cross-language navigation preserves a draft; explicit loading replaces
 // it with a sample in the new UI's language and retains the chosen template.
 await page.goto(new URL('/zh/',base).href);
 await page.locator('.cm-content').waitFor();
 if(await page.locator('#settings').isHidden())await page.click('#settings-toggle');
 await page.click('#new-doc');
 await page.locator('#opt-template').selectOption('contract');
 await page.click('#template-example');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text.includes('软件开发合同'));
 await page.goto(new URL('/fr/',base).href);
 await page.locator('.cm-content').waitFor();
 assert.ok((await saved(page)).text.includes('软件开发合同'));
 if(await page.locator('#settings').isHidden())await page.click('#settings-toggle');
 await page.click('#template-example');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text.includes('Contrat de développement'));
 assert.equal((await saved(page)).options.template,'contract');
 await setDocument(page,'---\ntemplate: letter\nlang: fr\n---\n\nKeep this original letter.');
 await page.waitForFunction(()=>document.querySelector('#opt-template').disabled);
 await page.click('#template-example');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.options.template==='letter');
 assert.equal(await page.locator('#opt-template').isEnabled(),true);
 await page.locator('#warnings .warnings-action').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text.endsWith('Keep this original letter.'));
 assert.equal(await page.locator('#opt-template').inputValue(),'letter');
 assert.equal(await page.locator('#opt-template').isEnabled(),false);
 await page.setViewportSize({width:390,height:900});
 await page.click('#new-doc');
 await page.locator('#opt-template').selectOption('resume');
 await page.click('#template-example');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('md2pdf:draft:v1')??'null')?.text.includes('Camille Martin'));
 assert.equal((await saved(page)).options.template,'resume');
 assert.deepEqual(errors,[]);
 console.log('ok language switch, document overrides, full Undo and mobile example button');
} finally {await browser.close();await rm(out,{recursive:true,force:true});}
