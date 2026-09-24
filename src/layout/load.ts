/**
 * The layout code (front matter, templates, headers and footers, covers) is a
 * separate chunk, so the first page load does not carry it. It is fetched
 * right after first paint, and by the PDF pipeline if it is not there yet.
 */
import { importWithRetry } from '../ui/retry-import';

type LayoutModule = typeof import('./index');

let loaded: LayoutModule | null = null;
let pending: Promise<LayoutModule> | null = null;

/** The module, if it has arrived. */
export const layoutModule = (): LayoutModule | null => loaded;

export function loadLayout(): Promise<LayoutModule> {
  if (!pending) {
    pending = importWithRetry(() => import('./index')).then(m => (loaded = m));
    pending.catch(() => (pending = null)); // offline: try again next time
  }
  return pending;
}

/**
 * Until the module is there, a leading front matter block is at least not
 * shown as text. Lines are blanked, not removed, so line numbers still match.
 */
export const hideFrontMatter = (source: string): string =>
  source.replace(/^---[ \t]*\n(?:[\w-]+[ \t]*:.*\n|[ \t#-].*\n|\n)*?(?:---|\.\.\.)[ \t]*(?=\n|$)/, m => m.replace(/[^\n]/g, ''));
