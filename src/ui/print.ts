/**
 * Printing the typeset PDF itself, never this web page: the point of Print is
 * that the paper matches the downloaded file on any machine.
 *
 * Where the browser's own PDF viewer can run in a frame (Chrome, Edge), the
 * PDF is loaded as a Blob URL into a hidden same-origin <iframe> and that
 * frame's print() opens the print dialog for the PDF. Elsewhere (Safari and
 * every iOS browser, Firefox, Android, or a Chrome set to download PDFs) the
 * PDF opens in a new tab instead, to be printed from there. The page's
 * Content-Security-Policy allows `frame-src 'self' blob:` for this.
 *
 * Loaded on the first print, so none of it is in the first-load path.
 */

let current: { url: string; frame?: HTMLIFrameElement } | null = null;

/** A Blob URL for the PDF. The previous one, and its frame, are released. */
export function pdfUrl(pdf: Uint8Array): string {
  if (current) {
    current.frame?.remove();
    URL.revokeObjectURL(current.url);
  }
  const url = URL.createObjectURL(new Blob([pdf.slice().buffer as ArrayBuffer], { type: 'application/pdf' }));
  current = { url };
  return url;
}

/**
 * Print `url` (from pdfUrl) through a hidden frame. Resolves false if the
 * frame never loaded or its print() could not be called, so the caller can
 * open the PDF in a tab instead.
 */
export function printInFrame(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const frame = document.createElement('iframe');
    // Not display:none or visibility:hidden: the PDF viewer must be laid out
    // for its print() to have pages to print.
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    if (current?.url === url) current.frame = frame;
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    // Without a PDF viewer the frame downloads the file and never loads.
    const timer = window.setTimeout(() => finish(false), 15_000);
    frame.addEventListener(
      'load',
      () => {
        if (settled) return;
        try {
          const view = frame.contentWindow;
          if (!view) return finish(false);
          view.focus();
          view.print();
          finish(true);
        } catch {
          finish(false);
        }
      },
      { once: true },
    );
    frame.src = url;
    document.body.append(frame);
  });
}

/**
 * Show `url` in `tab` (opened earlier, while the click still counted as a user
 * gesture) or in a new tab. False if the browser blocked it.
 */
export function openInTab(url: string, tab: Window | null): boolean {
  if (tab && !tab.closed) {
    tab.location.href = url;
    return true;
  }
  return window.open(url, '_blank') !== null;
}
