/** The actual exported PDF, in a modal that fills the window. */
export function bindPdfPreview(build: (label: HTMLElement) => Promise<Uint8Array | null>): void {
  const dialog = document.getElementById('pdf-preview') as HTMLDialogElement;
  const trigger = document.getElementById('pdf-preview-toggle') as HTMLButtonElement;
  const close = document.getElementById('pdf-preview-close') as HTMLButtonElement;
  const status = document.getElementById('pdf-preview-status')!;
  const fallback = document.getElementById('pdf-preview-fallback')!;
  const open = document.getElementById('pdf-preview-open') as HTMLAnchorElement;
  let url: string | null = null;
  let generation = 0;
  let ownsFullscreen = false;

  document.addEventListener('fullscreenchange', () => {
    if (ownsFullscreen && !document.fullscreenElement) {
      ownsFullscreen = false;
      if (dialog.open) dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    generation++;
    dialog.querySelector('iframe')?.remove();
    if (url) URL.revokeObjectURL(url);
    url = null;
    open.removeAttribute('href');
    document.documentElement.classList.remove('pdf-preview-open');
    if (ownsFullscreen && document.fullscreenElement) {
      ownsFullscreen = false;
      void document.exitFullscreen().catch(() => {});
    }
    trigger.focus();
  });
  close.addEventListener('click', () => dialog.close());
  trigger.addEventListener('click', async () => {
    const current = ++generation;
    status.hidden = false;
    fallback.hidden = true;
    // Request while the click still carries user activation. Native fullscreen
    // also lets Escape work when the browser's PDF plugin has keyboard focus.
    // Dialogs cannot themselves request fullscreen, so use the document root.
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().then(() => {
        ownsFullscreen = true;
        if (!dialog.open || current !== generation) {
          ownsFullscreen = false;
          void document.exitFullscreen().catch(() => {});
        }
      }).catch(() => {}); // Unsupported or denied: the full-window modal still works.
    }
    document.documentElement.classList.add('pdf-preview-open');
    dialog.showModal();
    const pdf = await build(status);
    // Closing while the engine loads must never reopen the modal later.
    if (!dialog.open || current !== generation) return;
    if (!pdf) {
      dialog.close();
      return; // build() already displays the actionable error outside the modal.
    }
    url = URL.createObjectURL(new Blob([pdf.slice().buffer as ArrayBuffer], { type: 'application/pdf' }));
    status.hidden = true;
    if (navigator.pdfViewerEnabled === false) {
      open.href = url;
      fallback.hidden = false;
      return;
    }
    const frame = document.createElement('iframe');
    frame.title = dialog.getAttribute('aria-label')!;
    // Keep the browser's PDF controls out of the proof where supported.
    frame.src = `${url}#toolbar=0&navpanes=0&view=FitH`;
    dialog.append(frame);
    close.focus();
  });
}
