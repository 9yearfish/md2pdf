/** Shared by the build (pages.ts) and the browser (runtime.ts). */

/** The id of each page's JSON block with its runtime strings. */
export const LOCALE_DATA_ID = 'md2pdf-locale';
/** Set by the language switcher; read by the redirect on `/`. */
export const LANG_PREF_KEY = 'md2pdf:lang';

/**
 * The product's name as people read it, everywhere: the header, titles, Open
 * Graph, structured data, the manifest, llms.txt, the share images, the
 * footer, the about text and the samples. Change it here and rebuild (and
 * run `npm run og`). Internal identifiers (storage keys, cache names, CSS
 * classes) keep `md2pdf`, so a rename never costs anyone their draft or cache.
 * The domain, freemd2pdf.com, is lowercase in URLs.
 */
export const BRAND = 'Free MD2PDF';
