/**
 * pdf.js loader.
 *
 * The `legacy` build is deliberate: the default build calls
 * `Map.prototype.getOrInsertComputed`, which only very recent browsers have,
 * and this tool is meant to work for whoever opens it.
 */
export type PdfjsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
export type PdfDocument = Awaited<ReturnType<PdfjsModule['getDocument']>['promise']>;
export type PdfPage = Awaited<ReturnType<PdfDocument['getPage']>>;

let modulePromise: Promise<PdfjsModule> | null = null;

export function loadPdfjs(): Promise<PdfjsModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist/legacy/build/pdf.mjs'),
        import('pdfjs-dist/legacy/build/pdf.worker.mjs?url'),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return modulePromise;
}

/**
 * pdf.js takes ownership of the buffer it is handed and detaches it. The bytes
 * we show must stay byte-identical to the bytes we hand over on download, so
 * the document always gets a copy.
 */
export async function openDocument(bytes: Uint8Array): Promise<PdfDocument> {
  const pdfjs = await loadPdfjs();
  return pdfjs.getDocument({ data: bytes.slice() }).promise;
}
