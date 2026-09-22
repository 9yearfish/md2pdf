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
