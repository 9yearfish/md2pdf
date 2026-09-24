/**
 * The maths font, added to whatever font tier the text needs, and only when
 * the document has formulas.
 *
 * Typst needs an OpenType font with a MATH table to typeset formulas. Noto
 * Sans Math matches the Noto Sans body text, so formulas and prose look like
 * one family; unhinted, it is 657 KB (about 290 KB compressed). The preview
 * uses the same file (see src/preview/math.css), so it is fetched once.
 *
 * Root-relative and versioned like every other font (`fontUrl`, with
 * `?v=FONT_REVISION`): pages also live at /zh/, /ja/ and so on, and the
 * service worker keeps versioned font files cached. src/preview/math.css
 * carries the same `?v=`; bump both together.
 */
import { fontUrl, type FontSet } from './fonts';

export const MATH_FONT_FILES = ['NotoSansMath-Regular.ttf'];

export function mathFontUrls(): string[] {
  return MATH_FONT_FILES.map(fontUrl);
}

/** Set once a document in this tab has had maths. */
let sticky = false;

/**
 * The font set, plus the maths font when the document needs it.
 *
 * Once loaded it stays for the rest of the session: deleting the last formula
 * would otherwise switch the compiler to another font set and rebuild it,
 * and Typst only embeds the fonts a document actually uses anyway.
 */
export function withMathFonts(set: FontSet, hasMath = false): FontSet {
  sticky ||= hasMath;
  return sticky ? { ...set, math: true, urls: [...set.urls, ...mathFontUrls()] } : set;
}
