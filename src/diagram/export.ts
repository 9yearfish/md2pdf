/**
 * The per-diagram actions in the preview: copy the SVG, download it, or
 * download a PNG. Loaded on the first click, never with the page.
 *
 * The SVG is the one the PDF embeds (filters stripped, labels as text). The
 * PNG is drawn from it on a canvas at twice its size on white; a same-origin
 * blob image does not taint the canvas. Web fonts do not reach an SVG drawn as
 * an image (nor an SVG opened elsewhere), so every font list gets the system
 * sans-serif as a last resort instead of the default serif.
 */
import { t } from '../i18n/runtime';

const SVG_TYPE = 'image/svg+xml';

const GENERIC = /\b(sans-serif|serif|monospace|system-ui)\s*$/;
const withFallback = (css: string) =>
  css.replace(/font-family\s*:\s*([^;}]+)/g, (all, list: string) =>
    GENERIC.test(list.trim()) ? all : `font-family: ${list.trim()}, system-ui, sans-serif`,
  );

function standalone(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  for (const style of doc.querySelectorAll('style')) style.textContent = withFallback(style.textContent ?? '');
  for (const el of doc.querySelectorAll('[style*="font-family"]')) el.setAttribute('style', withFallback(el.getAttribute('style')!));
  for (const el of doc.querySelectorAll('[font-family]')) {
    const list = el.getAttribute('font-family')!;
    if (!GENERIC.test(list)) el.setAttribute('font-family', `${list}, system-ui, sans-serif`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(doc)}`;
}

function save(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function png(svg: string): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: SVG_TYPE }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(image.naturalWidth * scale);
    canvas.height = Math.ceil(image.naturalHeight * scale);
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('canvas is empty'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Briefly mark the button done (or failed) and say so to assistive technology. */
function acknowledge(button: HTMLButtonElement, ok: boolean, message?: string): void {
  button.dataset.done = ok ? 'ok' : 'failed';
  const label = button.getAttribute('aria-label') ?? '';
  if (message) {
    button.setAttribute('aria-label', message);
    button.title = message;
  }
  setTimeout(() => {
    delete button.dataset.done;
    button.setAttribute('aria-label', label);
    button.title = label;
  }, 1800);
}

export async function exportDiagram(button: HTMLButtonElement, svg: string, name: string): Promise<void> {
  const file = standalone(svg);
  try {
    switch (button.dataset.diagramAction) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(file);
          acknowledge(button, true, t('diagramCopied'));
        } catch {
          acknowledge(button, false, t('diagramCopyFailed'));
        }
        return;
      case 'svg':
        save(new Blob([file], { type: SVG_TYPE }), `${name}.svg`);
        break;
      case 'png':
        save(await png(file), `${name}.png`);
        break;
    }
    acknowledge(button, true);
  } catch {
    acknowledge(button, false);
  }
}
