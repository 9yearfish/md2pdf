/**
 * Font set resolution.
 *
 * Latin + mono fonts are always loaded (~0.9 MB). CJK fonts are only pulled in
 * when the document actually contains CJK text, and we prefer a ~2.3 MB subset
 * covering GB2312 over the ~10 MB full face. `subset-coverage.bin` is a BMP
 * bitmap of the subset's cmap, so we can make that call without downloading
 * either font first.
 */

const LATIN = [
  'NotoSans-Regular.ttf',
  'NotoSans-Bold.ttf',
  'NotoSans-Italic.ttf',
  'NotoSans-BoldItalic.ttf',
  'DejaVuSansMono.ttf',
];
const CJK_SUBSET = ['NotoSansSC-Regular.subset.ttf', 'NotoSansSC-Bold.subset.ttf'];
const CJK_FULL = ['NotoSansSC-Regular.full.ttf', 'NotoSansSC-Bold.full.ttf'];

export type FontTier = 'latin' | 'cjk-subset' | 'cjk-full';

export interface FontSet {
  tier: FontTier;
  urls: string[];
  /** Codepoints no available font can render, if any. */
  missing: string[];
}

const fontUrl = (name: string) => new URL(`fonts/${name}`, document.baseURI).href;

let coverage: Uint8Array | null = null;

async function loadCoverage(): Promise<Uint8Array> {
  if (!coverage) {
    const res = await fetch(fontUrl('subset-coverage.bin'));
    if (!res.ok) throw new Error(`failed to load font coverage data (${res.status})`);
    coverage = new Uint8Array(await res.arrayBuffer());
  }
  return coverage;
}

const covered = (bits: Uint8Array, cp: number) =>
  cp <= 0xffff && (bits[cp >> 3] & (1 << (cp & 7))) !== 0;

/** Anything outside Latin-1 that a CJK face is expected to cover. */
function needsCjk(text: string): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x2e80 && cp <= 0x9fff) || // radicals through CJK unified
      (cp >= 0x3000 && cp <= 0x30ff) || // CJK punctuation, kana
      (cp >= 0xf900 && cp <= 0xfaff) || // compatibility ideographs
      (cp >= 0xff00 && cp <= 0xffef) || // fullwidth forms
      cp >= 0x20000 // extension planes
    ) {
      return true;
    }
  }
  return false;
}

export async function resolveFonts(text: string): Promise<FontSet> {
  if (!needsCjk(text)) {
    return { tier: 'latin', urls: LATIN.map(fontUrl), missing: [] };
  }

  const bits = await loadCoverage();
  const uncovered = new Set<string>();
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80) continue;
    if (!covered(bits, cp)) uncovered.add(ch);
  }

  if (uncovered.size === 0) {
    return { tier: 'cjk-subset', urls: [...LATIN, ...CJK_SUBSET].map(fontUrl), missing: [] };
  }
  // Rare characters present: fall back to the full face, which covers all of
  // Noto Sans SC. Anything still missing there is reported to the user.
  return { tier: 'cjk-full', urls: [...LATIN, ...CJK_FULL].map(fontUrl), missing: [...uncovered] };
}

export function fontSetKey(set: FontSet): string {
  return set.tier;
}

/** Approximate download size of a tier, for progress messaging. */
export const TIER_BYTES: Record<FontTier, number> = {
  latin: 900_000,
  'cjk-subset': 5_700_000,
  'cjk-full': 21_500_000,
};
