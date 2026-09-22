import { convert } from './convert/pipeline';
import { DEFAULT_OPTIONS } from './convert/preamble';
import { compileToPdf } from './typst/engine';
import { SAMPLE_DOCUMENT } from './sample';

const out = document.getElementById('out')!;
const log = (m: string) => { out.textContent += '\n' + m; };
(async () => {
  try {
    const t0 = performance.now();
    const result = await convert(SAMPLE_DOCUMENT, DEFAULT_OPTIONS, new Map());
    log(`converted in ${Math.round(performance.now() - t0)}ms, assets=${result.assets.length}`);
    if (result.warnings.length) log('warnings: ' + JSON.stringify(result.warnings, null, 1));
    (window as any).__typst = result.source;
    const t1 = performance.now();
    const outcome = await compileToPdf(result, s => log('stage: ' + s));
    log(`compiled in ${Math.round(performance.now() - t1)}ms, tier=${outcome.fonts.tier}, bytes=${outcome.pdf.length}`);
    if (outcome.diagnostics.length) log('diagnostics: ' + JSON.stringify(outcome.diagnostics, null, 1));
    (window as any).__pdf = Array.from(outcome.pdf);

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const worker = (await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const doc = await pdfjs.getDocument({ data: outcome.pdf.slice() }).promise;
    log(`pdf.js: ${doc.numPages} pages`);
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport } as any).promise;
      pages.push(canvas.toDataURL('image/png'));
    }
    (window as any).__pages = pages;
  } catch (e: any) {
    log('ERROR ' + (e?.stack || e?.message || e));
    if (e?.diagnostics) log('diagnostics: ' + JSON.stringify(e.diagnostics, null, 1));
  }
  (window as any).__done = true;
})();
