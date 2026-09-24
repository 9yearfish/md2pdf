/**
 * Print prints the typeset PDF, never the page.
 *
 *  (a) In a browser with a built-in PDF viewer (Chromium with its viewer),
 *      clicking Print loads the PDF as a Blob URL into a hidden same-origin
 *      <iframe> and calls that frame's print(); the page's own print() is
 *      never called. The frame's print is stubbed, so no dialog opens.
 *  (b) Ctrl+P does the same while the page has focus.
 *  (c) Where frames cannot print a PDF (here: a Firefox user agent, and a
 *      browser without a PDF viewer), the PDF opens in a new tab instead,
 *      with a notice, and nothing is framed or printed in place.
 *  (d) The button shows progress while the PDF is built, and the print code
 *      is a separate chunk, not part of the first load.
 *  (e) The CSP allows the frame: no violation is reported.
 */
import { chromium } from 'playwright';
import { CHROMIUM, setDocument } from './app-helpers.mjs';

const URL = process.env.APP_URL ?? 'http://localhost:5200/';
const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

/**
 * Record, never perform: the frame's print, the page's print and window.open.
 * The frame's window is reached through the contentWindow getter, so the stub
 * is put on it the moment the app asks for it.
 */
function instrument({ viewer }) {
  window.__print = { frames: [], page: 0, opened: [], violations: [] };
  document.addEventListener('securitypolicyviolation', e =>
    window.__print.violations.push(`${e.violatedDirective} ${e.blockedURI}`),
  );
  if (viewer !== undefined) Object.defineProperty(Navigator.prototype, 'pdfViewerEnabled', { get: () => viewer });
  window.print = () => { window.__print.page++; };
  const getter = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow').get;
  Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
    get() {
      const view = getter.call(this);
      if (view && this.src.startsWith('blob:')) {
        const src = this.src;
        view.print = () => { window.__print.frames.push(src); };
      }
      return view;
    },
  });
  window.open = (url = '', target) => {
    const tab = {
      closed: false,
      document: { title: '', body: { textContent: '' } },
      location: { set href(value) { window.__print.opened.push(value); }, get href() { return ''; } },
      close() { this.closed = true; },
    };
    window.__print.opened.push(url || '(blank)');
    return tab;
  };
}

async function pdfAt(page, url) {
  return page.evaluate(async src => {
    const bytes = new Uint8Array(await (await fetch(src)).arrayBuffer());
    return { size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) };
  }, url);
}

const errorsOf = page => {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return errors;
};

// The full Chromium build (new headless) has the PDF viewer; the headless
// shell has none. The pinned sandbox browser is used as it is.
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : { channel: 'chromium' });

/* (a), (b), (d), (e): the frame. */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  await context.addInitScript(instrument, { viewer: undefined });
  const page = await context.newPage();
  const errors = errorsOf(page);
  const scripts = [];
  page.on('request', r => { if (r.resourceType() === 'script') scripts.push(r.url()); });
  await page.goto(URL, { waitUntil: 'load' });
  const viewer = await page.evaluate(() => navigator.pdfViewerEnabled);
  check(!scripts.some(u => /\/print-[^/]*\.js$/.test(u)), 'print code is not in the first load');
  check(await page.locator('#print').isVisible(), 'Print button is shown next to Download');
  check(
    await page.evaluate(() => document.getElementById('print').nextElementSibling?.id === 'download'),
    'Print sits right before Download',
  );
  await setDocument(page, '# Print me\n\nA paragraph.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n');

  if (!viewer) {
    console.log('skip  frame printing: this Chromium has no PDF viewer (navigator.pdfViewerEnabled is false)');
  } else {
    // Progress: the Print label changes while the PDF is being built.
    const labels = page.evaluate(
      () =>
        new Promise(resolve => {
          const label = document.getElementById('print-label');
          const seen = new Set([label.textContent]);
          const observer = new MutationObserver(() => seen.add(label.textContent));
          observer.observe(label, { childList: true, characterData: true, subtree: true });
          const done = setInterval(() => {
            if (window.__print.frames.length) {
              clearInterval(done);
              observer.disconnect();
              resolve({ seen: [...seen], busy: document.getElementById('print').classList.contains('busy') });
            }
          }, 20);
        }),
    );
    await page.click('#print');
    await page.waitForFunction(() => window.__print.frames.length > 0, null, { timeout: 240000 });
    const state = await page.evaluate(() => window.__print);
    const progress = await labels;
    const frame = await page.evaluate(() => {
      const f = [...document.querySelectorAll('iframe')].find(f => f.src.startsWith('blob:'));
      return f ? { src: f.src, width: f.getBoundingClientRect().width, sameOrigin: new URL(f.src.slice(5)).origin === location.origin } : null;
    });
    check(frame !== null && frame.sameOrigin, 'Print puts the PDF in a same-origin Blob iframe', frame?.src);
    check(frame?.width === 0, 'the frame is hidden (zero size, still laid out)');
    const pdf = frame ? await pdfAt(page, frame.src) : {};
    check(pdf.header === '%PDF-', 'the framed Blob is the PDF', `${pdf.size} bytes`);
    check(state.frames.length === 1 && state.frames[0] === frame?.src, 'the frame’s print() was called once');
    check(state.page === 0, 'the page’s own window.print() was never called');
    check(state.opened.length === 0, 'no tab was opened');
    const steps = progress.seen.filter((text, i, list) => !/\d+%/.test(text) || !/\d+%/.test(list[i + 1] ?? ''));
    check(progress.seen.length > 1, 'the Print button shows progress', steps.join(' → '));
    check(
      await page.evaluate(() => !document.getElementById('print').classList.contains('busy') && document.getElementById('print-label').textContent === 'Print'),
      'the button returns to “Print” afterwards',
    );
    check(scripts.some(u => /\/print-[^/]*\.js$/.test(u)), 'the print chunk loads on the first print');

    // Same text again: the cached PDF is reused, in a fresh frame.
    await page.keyboard.press('Escape');
    await page.locator('#scroller').focus();
    await page.keyboard.press('ControlOrMeta+KeyP');
    await page.waitForFunction(() => window.__print.frames.length > 1, null, { timeout: 30000 });
    const again = await page.evaluate(() => ({
      frames: window.__print.frames.length,
      blobFrames: [...document.querySelectorAll('iframe')].filter(f => f.src.startsWith('blob:')).length,
      page: window.__print.page,
    }));
    check(again.frames === 2 && again.page === 0, 'Ctrl/⌘+P prints the PDF, not the page');
    check(again.blobFrames === 1, 'the previous frame is removed', `${again.blobFrames} Blob frames`);
    const violations = await page.evaluate(() => window.__print.violations);
    check(violations.length === 0, 'no Content-Security-Policy violation', violations.join('; '));
  }
  check(errors.length === 0, 'no console or page errors (frame)', errors.join('; '));
  await context.close();
}

/* (c): the tab fallback, for Firefox and for a browser without a PDF viewer. */
for (const [label, options, viewer] of [
  ['Firefox', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:131.0) Gecko/20100101 Firefox/131.0' }, undefined],
  ['no PDF viewer', {}, false],
]) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US', ...options });
  await context.addInitScript(instrument, { viewer });
  const page = await context.newPage();
  const errors = errorsOf(page);
  await page.goto(URL, { waitUntil: 'load' });
  await setDocument(page, '# Print me in a tab\n\nText.\n');
  check(await page.locator('#print').isVisible(), `${label}: Print button is shown on a phone`);
  await page.click('#print');
  await page.waitForFunction(() => window.__print.opened.length > 1, null, { timeout: 240000 });
  const state = await page.evaluate(() => window.__print);
  check(state.opened[0] === '(blank)', `${label}: a tab is opened at once, while the click counts as a gesture`);
  check(/^blob:/.test(state.opened[1] ?? ''), `${label}: then pointed at the PDF’s Blob URL`, state.opened[1]);
  const pdf = /^blob:/.test(state.opened[1] ?? '') ? await pdfAt(page, state.opened[1]) : {};
  check(pdf.header === '%PDF-', `${label}: the tab gets the PDF`, `${pdf.size} bytes`);
  check(state.frames.length === 0 && state.page === 0, `${label}: nothing printed in place, never the page`);
  const notice = await page.locator('#warnings').textContent();
  check(/new tab/i.test(notice ?? ''), `${label}: a notice says to print from the tab`, notice?.trim());
  check(errors.length === 0, `${label}: no console or page errors`, errors.join('; '));
  await context.close();
}

await browser.close();
if (problems.length) {
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log('\nall print checks passed');
