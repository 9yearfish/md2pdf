/** Shared helpers for the browser tests. */

export const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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

export async function waitForConversion(page, timeout = 240000) {
  await page.waitForFunction(
    () => document.getElementById('overlay')?.hidden === true,
    null,
    { timeout },
  );
}
