/** Regression for concurrent font-tier warm-ups and exports. Run against Vite
 * (`APP_URL=http://localhost:5173 node scripts/engine-concurrency.mjs`).
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import { chromium } from 'playwright';
import { CHROMIUM } from './app-helpers.mjs';
const browser=await chromium.launch(CHROMIUM ? {executablePath:CHROMIUM} : {channel:'chromium'});
try {
 const page=await browser.newPage();
 await page.goto(process.env.APP_URL ?? 'http://localhost:5173/');
 const outcomes=await page.evaluate(async()=>{
  const [{prepare,compileToPdf},{convert},{DEFAULT_OPTIONS}]=await Promise.all([
   import('/src/typst/engine.ts'),import('/src/convert/pipeline.ts'),import('/src/convert/preamble.ts'),
  ]);
  // Start initialization of different font tiers at the same time. Export
  // two different documents while those warm-ups are still in flight.
  const warm=[prepare('English warm-up',()=>{},'en'),prepare('合同预加载',()=>{},'zh-Hans',{serif:true})];
  const jobs=['English export','合同导出'].map(async(text,index)=>{
   const source=index?'---\ntemplate: contract\nlang: zh-CN\n---\n\n# '+text:'# '+text;
   const req=await convert(source,DEFAULT_OPTIONS,new Map());
   const result=await compileToPdf(req);
   return {header:String.fromCharCode(...result.pdf.slice(0,5)),size:result.pdf.length,serif:result.fonts.serif,bytes:Array.from(result.pdf)};
  });
  await Promise.all(warm);
  return Promise.all(jobs);
 });
 assert.equal(outcomes.length,2);
 for(const result of outcomes){assert.equal(result.header,'%PDF-');assert.ok(result.size>1000);}
 assert.equal(outcomes[0].serif,false);assert.equal(outcomes[1].serif,true);
 execFileSync('python3',['-c',`import json,sys,fitz
r=json.load(sys.stdin)
for i,text in enumerate(['English export','合同导出']):
 d=fitz.open(stream=bytes(r[i]['bytes']),filetype='pdf')
 assert text in ''.join(p.get_text() for p in d)
`],{input:JSON.stringify(outcomes)});
 console.log('ok concurrent cold font-tier initialization: both exports retain their own text');
} finally {await browser.close();}
