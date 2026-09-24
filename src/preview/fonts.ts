/**
 * Browser faces for the preview and for measuring diagram labels.
 *
 * Latin and the small script faces are plain @font-face rules in
 * `src/fonts.css` (WOFF2, split by unicode-range, so the browser only fetches a
 * face once text in its script is on screen). The CJK faces cannot be done
 * that way: whether a document needs the subset or the full face depends on
 * every character in it, and they are megabytes, so they are registered here,
 * from the same resolved font set the PDF uses, pointing at the very files
 * Typst loads. A preview and a download therefore share one fetch.
 *
 * They are only registered once the page has loaded and the connection is one
 * the engine would warm up on anyway (see `shouldPrefetch`), or when a PDF is
 * being made. Before that, and on metered connections, the preview falls back
 * to the system's CJK fonts.
 */
import { cjkOrder, fontUrl, type FontSet } from '../typst/fonts';
import type { HanVariant, LanguageInfo } from '../convert/lang';

interface Registered {
  files: string;
  faces: FontFace[];
}

const registered = new Map<string, Registered>();
let cjkAllowed = false;
const listeners = new Set<() => void>();

/** Let the preview use the CJK faces from now on; called after page load. */
export function allowCjkFaces(): void {
  if (cjkAllowed) return;
  cjkAllowed = true;
  for (const listener of listeners) listener();
}

export function onCjkFacesAllowed(listener: () => void): void {
  listeners.add(listener);
}

/**
 * Register the CJK faces `set` uses. Returns whether all of them are
 * registered, i.e. whether text measured now will match the PDF.
 */
export function registerFaces(set: FontSet, force = false): boolean {
  if (typeof FontFace === 'undefined' || !document.fonts) return false;
  // A PDF is being made: the files are about to be fetched anyway.
  if (force) allowCjkFaces();
  let complete = true;
  for (const use of set.families) {
    if (!use.cjk) continue;
    const existing = registered.get(use.family);
    const files = use.files.join(',');
    // A full face already there covers whatever the subset would.
    if (existing && (existing.files === files || existing.files.includes('.full.'))) continue;
    if (!cjkAllowed && !force) {
      complete = false;
      continue;
    }
    const faces = use.files.map(
      (file, i) =>
        new FontFace(use.family, `url("${fontUrl(file)}") format("opentype")`, {
          weight: use.weights?.[i] ?? (i === 0 ? '400' : '700'),
          style: 'normal',
          display: 'swap',
        }),
    );
    if (existing) for (const face of existing.faces) document.fonts.delete(face);
    for (const face of faces) document.fonts.add(face);
    registered.set(use.family, { files, faces });
  }
  return complete;
}

/**
 * Wait (briefly) for the faces a piece of text needs, so that measuring it
 * gives the widths the PDF will have. Returns whether they all loaded.
 */
export async function loadFaces(family: string, text: string, timeout = 8000): Promise<boolean> {
  if (!document.fonts?.load) return false;
  const sample = text.slice(0, 2000) || 'a';
  const loads = Promise.all([
    document.fonts.load(`16px ${family}`, sample),
    document.fonts.load(`bold 16px ${family}`, sample),
  ]).then(
    () => true,
    () => false,
  );
  const timer = new Promise<boolean>(resolve => setTimeout(() => resolve(false), timeout));
  const loaded = await Promise.race([loads, timer]);
  return loaded && document.fonts.check(`16px ${family}`, sample);
}

const SYSTEM_CJK: Record<HanVariant, string[]> = {
  sc: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei'],
  tc: ['PingFang TC', 'Microsoft JhengHei'],
  jp: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo'],
  kr: ['Apple SD Gothic Neo', 'Malgun Gothic'],
};

/**
 * The preview's font stack for a language: the PDF's faces in the PDF's
 * order, then the platform's own CJK fonts in the same regional order for when
 * the web faces are not (yet) there.
 */
export function previewFontStack(lang: LanguageInfo): string {
  const cjk = cjkOrder(lang.han);
  return [
    lang.cjkPunctuation ? 'md2pdf Latin in CJK' : 'Noto Sans',
    ...cjk.map(f => f.family),
    'Noto Sans Arabic',
    'Noto Sans Hebrew',
    'Noto Sans Devanagari',
    'Noto Sans Thai',
    ...cjk.flatMap(f => SYSTEM_CJK[f.id as HanVariant]),
  ]
    .map(name => `"${name}"`)
    .concat('sans-serif')
    .join(', ');
}
