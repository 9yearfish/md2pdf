import type { PdfDocument } from './pdfjs';

export interface OutlineEntry {
  title: string;
  depth: number;
  /** Resolved 1-based page number, or null when the destination is unusable. */
  page: number | null;
}

interface RawOutline {
  title: string;
  dest: string | unknown[] | null;
  items: RawOutline[];
}

/**
 * Typst emits PDF bookmarks for headings, so the outline comes for free and
 * always matches the document being viewed.
 */
export async function extractOutline(doc: PdfDocument): Promise<OutlineEntry[]> {
  const raw = (await doc.getOutline()) as RawOutline[] | null;
  if (!raw?.length) return [];

  const entries: OutlineEntry[] = [];
  const visit = async (items: RawOutline[], depth: number) => {
    for (const item of items) {
      entries.push({ title: item.title, depth, page: await resolvePage(doc, item.dest) });
      if (item.items?.length) await visit(item.items, depth + 1);
    }
  };
  await visit(raw, 0);
  return entries;
}

async function resolvePage(doc: PdfDocument, dest: RawOutline['dest']): Promise<number | null> {
  try {
    const resolved = typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    const ref = Array.isArray(resolved) ? resolved[0] : null;
    if (!ref) return null;
    return (await doc.getPageIndex(ref as never)) + 1;
  } catch {
    // A malformed destination should not take the whole sidebar down.
    return null;
  }
}
