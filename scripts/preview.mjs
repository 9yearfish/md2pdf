/** Demo loading and a distraction-free preview of the actual exported PDF. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { CHROMIUM, setDocument } from './app-helpers.mjs';

const base = process.env.APP_URL ?? 'http://localhost:5200/';
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : { channel: 'chromium' });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'zh-CN', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) console.warn(`${response.status()} ${response.url()}`);
    });
    await page.goto(new URL('/zh/', base).href);
    await page.waitForSelector('.cm-content');
    await page.click('#new-doc');
    assert.equal(await page.locator('#empty-example').count(), 1, 'empty documents offer a demo');
    await page.click('#empty-example');
    // CodeMirror virtualizes long documents; verify the whole saved source.
    await page.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem('md2pdf:draft:v1') ?? 'null');
      const locale = JSON.parse(document.getElementById('md2pdf-locale').textContent);
      return saved?.text === locale.sample;
    });
    assert.equal(await page.locator('#empty-state').isVisible(), false);

    if (width < 760) await page.click('#show-source');
    await setDocument(page, '# PDF preview\n\nThis is the user’s document.\n\n---\n\nSecond section.');
    await page.click('#fullscreen-toggle');
    await page.click('#pdf-preview-toggle');
    await page.waitForSelector('#pdf-preview iframe', { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const dialog = document.getElementById('pdf-preview');
      const frame = dialog.querySelector('iframe');
      const bytes = new Uint8Array(await (await fetch(frame.src)).arrayBuffer());
      window.__previewBytes = Array.from(bytes);
      const rect = dialog.getBoundingClientRect();
      return { header: String.fromCharCode(...bytes.slice(0, 5)), width: rect.width, height: rect.height, w: innerWidth, h: innerHeight, open: dialog.open };
    });
    assert.equal(result.header, '%PDF-', 'preview displays a compiled PDF');
    assert.equal(result.open, true);
    assert.equal(result.width, result.w);
    assert.equal(result.height, result.h);
    if (process.env.PREVIEW_SCREENSHOTS) {
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `/tmp/md2pdf-preview-${width}.png` });
    }
    // Escape closes only the preview, preserving the previous editing mode.
    await page.focus('#pdf-preview-close');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#pdf-preview').isVisible(), false);
    assert.equal(await page.locator('#fullscreen-toggle').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'pdf-preview-toggle');
    assert.match(await page.locator('.cm-content').innerText(), /user’s document/);

    // The preview must be the exact bytes the Download button hands over.
    await page.evaluate(() => {
      const original = HTMLAnchorElement.prototype.click;
      window.__downloadBytes = new Promise(resolve => {
        HTMLAnchorElement.prototype.click = function () {
          HTMLAnchorElement.prototype.click = original;
          fetch(this.href).then(r => r.arrayBuffer()).then(b => resolve(Array.from(new Uint8Array(b))));
        };
      });
    });
    await page.click('#download');
    assert.equal(await page.evaluate(async () => JSON.stringify(await window.__downloadBytes) === JSON.stringify(window.__previewBytes)), true);
    await page.click('#pdf-preview-toggle');
    await page.waitForSelector('#pdf-preview iframe');
    await page.click('#pdf-preview-close');
    await page.waitForSelector('#pdf-preview iframe', { state: 'detached' });
    assert.equal(await page.locator('#pdf-preview iframe').count(), 0, 'closing removes the PDF frame');
    assert.deepEqual(errors, []);
    console.log(`ok ${width}: demo, real PDF, full viewport, Escape, focus, download parity, close`);
    await context.close();
  }
  // A first-time engine load is cancellable; finishing cannot reopen the proof.
  {
    const context = await browser.newContext({ locale: 'en-US', serviceWorkers: 'block' });
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await context.route(/\.wasm(?:\?|$)/, async route => { await held; await route.continue(); });
    const page = await context.newPage();
    await page.goto(base);
    await page.waitForSelector('.cm-content');
    await setDocument(page, '# Cancel preview\n\nKeep this document.');
    await page.click('#pdf-preview-toggle');
    await page.waitForSelector('#pdf-preview[open]');
    await page.click('#pdf-preview-close');
    release();
    await page.waitForSelector('#pdf-preview-toggle:not(:disabled)', { timeout: 120000 });
    assert.equal(await page.locator('#pdf-preview').isVisible(), false);
    assert.equal(await page.locator('#pdf-preview iframe').count(), 0);
    await page.click('#pdf-preview-toggle');
    await page.waitForSelector('#pdf-preview iframe');
    await page.locator('#pdf-preview iframe').click({ position: { x: 200, y: 200 } });
    // CDP key presses cannot invoke browser chrome shortcuts while the PDF
    // plugin has focus. Exercise the fullscreen-exit event Escape causes.
    assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), true);
    await page.evaluate(() => document.exitFullscreen());
    await page.waitForSelector('#pdf-preview', { state: 'hidden' });
    console.log('ok: closing during loading stays closed; exiting browser fullscreen closes the proof');
    await context.close();
  }

  // A failed build returns to the actionable error instead of a blank modal.
  {
    const context = await browser.newContext({ locale: 'en-US', serviceWorkers: 'block' });
    await context.route(/\.wasm(?:\?|$)/, route => route.abort());
    const page = await context.newPage();
    await page.goto(base);
    await page.waitForSelector('.cm-content');
    await setDocument(page, '# Failed preview');
    await page.click('#pdf-preview-toggle');
    await page.waitForSelector('#warnings[data-kind="error"]:not([hidden])', { timeout: 60000 });
    assert.equal(await page.locator('#pdf-preview').isVisible(), false);
    assert.equal(await page.locator('#pdf-preview-toggle').isEnabled(), true);
    await context.unroute(/\.wasm(?:\?|$)/);
    await page.click('#pdf-preview-toggle');
    await page.waitForSelector('#pdf-preview iframe', { timeout: 120000 });
    console.log('ok: engine failure closes the modal and retry succeeds');
    await context.close();
  }
} finally {
  await browser.close();
}
