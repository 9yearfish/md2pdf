/**
 * Images the user supplies by drag-and-drop or paste. They are kept in memory
 * and handed to Typst through its shadow filesystem; nothing is uploaded.
 */
export interface LocalImage {
  /** The name the Markdown refers to, e.g. `diagram.png`. */
  name: string;
  bytes: Uint8Array;
  mime: string;
}

const SUPPORTED = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']);

export function isSupportedImage(mime: string): boolean {
  return SUPPORTED.has(mime);
}

export async function readImageFile(file: File): Promise<LocalImage> {
  return {
    name: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
    mime: file.type,
  };
}

/**
 * The dropped image a Markdown `src` refers to: by the exact name, without a
 * leading `./`, or else by its file name alone, so `docs/img/logo.png` in a
 * README finds a dropped `logo.png`. Web addresses are never matched.
 */
export function findImage(images: ReadonlyMap<string, LocalImage>, src: string): LocalImage | undefined {
  const exact = images.get(src) ?? images.get(src.replace(/^\.?\//, ''));
  if (exact || /^[a-z][a-z0-9+.-]*:/i.test(src)) return exact;
  const file = src.replace(/[?#].*$/, '').split('/').pop() ?? '';
  try {
    return images.get(decodeURIComponent(file)) ?? images.get(file);
  } catch {
    return images.get(file);
  }
}

const DATA_URI = /^data:([^;,]+)(;base64)?,(.*)$/s;

/** Decode a `data:` URI that the Markdown embeds directly. */
export function decodeDataUri(src: string): LocalImage | null {
  const match = DATA_URI.exec(src);
  if (!match) return null;
  const [, mime, base64, payload] = match;
  if (!isSupportedImage(mime)) return null;
  try {
    const bytes = base64
      ? Uint8Array.from(atob(payload), c => c.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(payload));
    return { name: 'inline', bytes, mime };
  } catch {
    return null;
  }
}

export function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/png': return 'png';
    case 'image/jpeg': return 'jpg';
    case 'image/gif': return 'gif';
    case 'image/svg+xml': return 'svg';
    case 'image/webp': return 'webp';
    default: return 'bin';
  }
}
