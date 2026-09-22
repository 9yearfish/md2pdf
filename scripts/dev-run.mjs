import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = '/tmp/claude-0/-home-user-md2pdf/145ae161-a9f8-50b2-82c8-be6dc82893f1/scratchpad';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto('http://localhost:5199/dev.html', { waitUntil: 'load' });
await p.waitForFunction('window.__done === true', null, { timeout: 240000 }).catch(() => console.log('TIMEOUT'));
console.log(await p.textContent('#out'));
const typ = await p.evaluate('window.__typst || null');
if (typ) fs.writeFileSync(`${OUT}/out.typ`, typ);
const pdf = await p.evaluate('window.__pdf || null');
if (pdf) { fs.writeFileSync(`${OUT}/out.pdf`, Buffer.from(pdf)); console.log('wrote out.pdf'); }
const pages = await p.evaluate('window.__pages || null');
if (pages) pages.forEach((d, i) => fs.writeFileSync(`${OUT}/page-${i + 1}.png`, Buffer.from(d.split(',')[1], 'base64')));
await b.close();
