/** Shared helpers for the browser tests. */

import { existsSync } from 'node:fs';

// Pinned browser in the sandbox this was built in; elsewhere, Playwright's own.
const PINNED = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const CHROMIUM = existsSync(PINNED) ? PINNED : undefined;

/**
 * Replace the document text.
 *
 * The page starts with a textarea and swaps in CodeMirror once it loads, so a
 * test has to wait for that to settle or it races the upgrade.
 */
export async function setDocument(page, markdown) {
  await page.waitForSelector('.cm-content, #editor', { timeout: 30000 });
  const codeMirror = await page.locator('.cm-content').count();
  if (codeMirror) {
    await page.locator('.cm-content').fill(markdown);
  } else {
    await page.fill('#editor', markdown);
  }
}

/**
 * Click "download PDF" and return what the page handed over.
 *
 * The anchor click is intercepted rather than letting a real download happen,
 * so the bytes can be inspected from inside the page.
 */
export async function downloadPdf(page, timeout = 240000) {
  await page.evaluate(() => {
    window.__md2pdfDownload = new Promise(resolve => {
      const original = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        HTMLAnchorElement.prototype.click = original;
        resolve({ href: this.href, name: this.download });
      };
    });
  });
  await page.click('#download');
  return page.evaluate(
    async timeout => {
      const result = await Promise.race([
        window.__md2pdfDownload,
        new Promise(resolve => setTimeout(() => resolve(null), timeout)),
      ]);
      if (!result) {
        return { error: document.getElementById('warnings')?.textContent || 'no download triggered' };
      }
      const bytes = new Uint8Array(await (await fetch(result.href)).arrayBuffer());
      return { name: result.name, size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) };
    },
    timeout,
  );
}

/** Pick a language from the header menu (a <details> of links, not a <select>). */
export async function chooseLanguage(page, code) {
  await page.click('#lang-menu > summary');
  await page.click(`#lang-menu a[data-locale="${code}"]`);
}
