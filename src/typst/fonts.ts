/**
 * Font set resolution: which faces a document needs, decided before any of
 * them is downloaded.
 *
 * Noto Sans (Latin, Greek, Cyrillic, Vietnamese) and the mono face are always
 * loaded. Every other script has its own family, fetched only when the text
 * uses it. The four CJK families ship twice, as a subset built from the
 * national standard character set and as the full face, and the subset is used
 * whenever it covers the text. The coverage of every face is known up front
 * from two small run-length files (`coverage-*.bin`, see
 * `scripts/prepare_fonts.py`), which are themselves only fetched when the text
 * goes beyond Latin-1.
 *
 * Han characters are the one case where coverage is not enough: the same
 * codepoint has different glyph forms for Japanese, Simplified and Traditional
 * Chinese and Korean, and every CJK face covers most of them. The document
 * language (`../convert/lang.ts`) decides which CJK family comes first.
 */
import {
  detectLanguage,
  hasHanVariantSets,
  inRanges,
  setHanVariantSets,
  type HanVariant,
  type LangSetting,
  type LanguageInfo,
} from '../convert/lang';

export type FamilyId = 'latin' | 'arabic' | 'hebrew' | 'devanagari' | 'thai' | HanVariant;

interface FamilyDef {
  id: FamilyId;
  /** Family name as Typst and CSS know it. */
  family: string;
  /** Regular and bold, subset first when there is one. */
  subset?: string[];
  full: string[];
  /** Approximate brotli transfer size of `subset` / `full`, in bytes. */
  bytes: { subset?: number; full: number };
  cjk: boolean;
}

const LATIN_FILES = [
  'NotoSans-Regular.ttf',
  'NotoSans-Bold.ttf',
  'NotoSans-Italic.ttf',
  'NotoSans-BoldItalic.ttf',
  'DejaVuSansMono.ttf',
];
const LATIN_BYTES = 530_000;

/**
 * Serif templates (src/layout/templates.ts) add Noto Serif, and for CJK text
 * the regular weight of the region's Noto Serif CJK subset. Bold CJK stays in
 * the sans face, which is also the convention (黑体/ゴシック for emphasis and
 * headings in 宋体/明朝 text), so a serif CJK document downloads about what a
 * sans one does. None of this is fetched unless a serif template is used.
 */
const SERIF_FILES = ['NotoSerif-Regular.ttf', 'NotoSerif-Bold.ttf', 'NotoSerif-Italic.ttf', 'NotoSerif-BoldItalic.ttf'];
const SERIF_BYTES = 480_000;
const CJK_SERIF: Record<HanVariant, { family: string; file: string; bytes: number }> = {
  sc: { family: 'Noto Serif SC', file: 'NotoSerifSC-Regular.subset.otf', bytes: 1_510_000 },
  tc: { family: 'Noto Serif TC', file: 'NotoSerifTC-Regular.subset.otf', bytes: 1_310_000 },
  jp: { family: 'Noto Serif JP', file: 'NotoSerifJP-Regular.subset.otf', bytes: 1_620_000 },
  kr: { family: 'Noto Serif KR', file: 'NotoSerifKR-Regular.subset.otf', bytes: 640_000 },
};

export interface FontOptions {
  /** Serif body text: Noto Serif, and Noto Serif CJK for CJK text. */
  serif?: boolean;
}

const pair = (stem: string, suffix = '.ttf') => [`${stem}-Regular${suffix}`, `${stem}-Bold${suffix}`];

const CJK_FAMILIES: Record<HanVariant, FamilyDef> = {
  sc: {
    id: 'sc', family: 'Noto Sans SC', cjk: true,
    subset: pair('NotoSansSC', '.subset.otf'), full: pair('NotoSansSC', '.full.otf'),
    bytes: { subset: 2_350_000, full: 9_300_000 },
  },
  tc: {
    id: 'tc', family: 'Noto Sans TC', cjk: true,
    subset: pair('NotoSansTC', '.subset.otf'), full: pair('NotoSansTC', '.full.otf'),
    bytes: { subset: 2_000_000, full: 6_440_000 },
  },
  jp: {
    id: 'jp', family: 'Noto Sans JP', cjk: true,
    subset: pair('NotoSansJP', '.subset.otf'), full: pair('NotoSansJP', '.full.otf'),
    bytes: { subset: 2_510_000, full: 5_180_000 },
  },
  kr: {
    id: 'kr', family: 'Noto Sans KR', cjk: true,
    subset: pair('NotoSansKR', '.subset.otf'), full: pair('NotoSansKR', '.full.otf'),
    bytes: { subset: 730_000, full: 4_460_000 },
  },
};

/** Small enough that there is no point in subsetting them further. */
const SCRIPT_FAMILIES: FamilyDef[] = [
  { id: 'arabic', family: 'Noto Sans Arabic', cjk: false, full: pair('NotoSansArabic'), bytes: { full: 140_000 } },
  { id: 'hebrew', family: 'Noto Sans Hebrew', cjk: false, full: pair('NotoSansHebrew'), bytes: { full: 60_000 } },
  { id: 'devanagari', family: 'Noto Sans Devanagari', cjk: false, full: pair('NotoSansDevanagari'), bytes: { full: 150_000 } },
  { id: 'thai', family: 'Noto Sans Thai', cjk: false, full: pair('NotoSansThai'), bytes: { full: 60_000 } },
];

/** Han fallback order after the document's own variant. */
const HAN_ORDER: HanVariant[] = ['sc', 'tc', 'jp', 'kr'];

export function cjkOrder(primary: HanVariant): FamilyDef[] {
  return [primary, ...HAN_ORDER.filter(v => v !== primary)].map(v => CJK_FAMILIES[v]);
}

/* ---------- coverage ---------- */

/**
 * Font files are served as immutable, and some keep their names across
 * rebuilds (NotoSans-Regular.ttf gained Vietnamese in revision 2), so the
 * revision is part of every URL. Bump it whenever `npm run fonts` changes a
 * file in place, together with the `?v=` in src/fonts.css.
 */
export const FONT_REVISION = '2';

/**
 * Root-relative on purpose: localized pages live under /zh/, /ja/ and so on,
 * and a document-relative URL would resolve to /ja/fonts/.
 */
export const fontUrl = (name: string) => new URL(`/fonts/${name}?v=${FONT_REVISION}`, location.origin).href;

type Coverage = Map<string, Uint32Array>;

function decodeCoverage(buffer: ArrayBuffer): Coverage {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (String.fromCharCode(...bytes.slice(0, 4)) !== 'MDCV' || bytes[4] !== 1) {
    throw new Error('unrecognised font coverage data');
  }
  const entries: Coverage = new Map();
  let at = 6;
  for (let n = bytes[5]; n > 0; n--) {
    const tagLength = bytes[at++];
    const tag = String.fromCharCode(...bytes.slice(at, at + tagLength));
    at += tagLength;
    const length = view.getUint32(at, true);
    at += 4;
    const end = at + length;
    const ranges: number[] = [];
    let position = 0;
    let present = false;
    while (at < end) {
      let value = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = bytes[at++];
        value += (byte & 0x7f) * 2 ** shift;
        shift += 7;
      } while (byte & 0x80);
      if (present) ranges.push(position, position + value);
      position += value;
      present = !present;
    }
    entries.set(tag, Uint32Array.from(ranges));
  }
  return entries;
}

const coverageFiles = new Map<string, Promise<Coverage>>();

function loadCoverage(name: 'coverage-scripts.bin' | 'coverage-cjk.bin'): Promise<Coverage> {
  let pending = coverageFiles.get(name);
  if (!pending) {
    pending = fetch(fontUrl(name))
      .then(res => {
        if (!res.ok) throw new Error(`failed to load font coverage data (${res.status})`);
        return res.arrayBuffer();
      })
      .then(decodeCoverage);
    pending.catch(() => coverageFiles.delete(name));
    coverageFiles.set(name, pending);
  }
  return pending;
}

/** Load the Simplified/Traditional character sets that language detection uses. */
export async function loadHanVariantData(): Promise<void> {
  if (hasHanVariantSets()) return;
  const cjk = await loadCoverage('coverage-cjk.bin');
  setHanVariantSets({ hansOnly: cjk.get('hans-only')!, hantOnly: cjk.get('hant-only')! });
}

/* ---------- text scanning ---------- */

/** Not glyphs: nothing needs to cover them. */
const invisible = (cp: number) =>
  cp < 0x20 ||
  (cp >= 0x7f && cp < 0xa0) ||
  (cp >= 0x200b && cp <= 0x200f) ||
  (cp >= 0x2028 && cp <= 0x202e) ||
  (cp >= 0x2060 && cp <= 0x2069) ||
  (cp >= 0xfe00 && cp <= 0xfe0f) ||
  cp === 0xfeff ||
  (cp >= 0xe0000 && cp <= 0xe01ef);

/** What Noto Sans certainly covers, so pure Latin text needs no coverage data at all. */
const trivially = (cp: number) => cp < 0x250 || (cp >= 0x2000 && cp <= 0x206f && cp !== 0x2028 && cp !== 0x2029);

export const CJK_TEXT =
  /[\u1100-\u11ff\u2e80-\ua4cf\ua960-\ua97f\uac00-\ud7ff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]|[\u{20000}-\u{3ffff}]/u;

/** Distinct codepoints Noto Sans might not cover. */
function interesting(text: string): Set<number> {
  const found = new Set<number>();
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (!trivially(cp) && !invisible(cp)) found.add(cp);
  }
  return found;
}

/* ---------- resolution ---------- */

export type FontTier = string;

export interface FamilyUse {
  id: FamilyId;
  family: string;
  variant: 'subset' | 'full';
  files: string[];
  cjk: boolean;
  /** Only a regular weight (the serif CJK faces); bold text skips it. */
  regularOnly?: boolean;
  /** CSS weight of each file, when not regular then bold. */
  weights?: string[];
}

export interface FontSet {
  /** Identifies the set of files, so compilers can be reused. */
  tier: FontTier;
  urls: string[];
  /** Non-Latin families, in the order Typst should try them. */
  families: FamilyUse[];
  lang: LanguageInfo;
  /** Approximate transfer size of every file in `urls`. */
  bytes: number;
  /** Codepoints no available font can render, if any. */
  missing: string[];
  /** Noto Serif leads the body font list. */
  serif: boolean;
  /** Maths hook: the maths font is included; see ./math-fonts.ts. */
  math?: boolean;
}

/**
 * The families Typst tries, after Noto Sans: the document's own CJK variant,
 * the other CJK families, then the other scripts. CJK comes before the other
 * scripts because those carry a copy of the basic Latin punctuation (see
 * prepare_fonts.py), which must not win over the CJK face for full-width
 * quotes in Chinese and Japanese.
 */
function searchOrder(lang: LanguageInfo): FamilyDef[] {
  return [...cjkOrder(lang.han), ...SCRIPT_FAMILIES];
}

export async function resolveFonts(
  text: string,
  setting: LangSetting = 'auto',
  fontOptions: FontOptions = {},
): Promise<FontSet> {
  const wanted = interesting(text);
  const needsCjk = CJK_TEXT.test(text);
  if (needsCjk) await loadHanVariantData();
  const lang = detectLanguage(text, setting);
  const serif = !!fontOptions.serif;
  const latinFiles = serif ? [...LATIN_FILES, ...SERIF_FILES] : LATIN_FILES;
  const latinBytes = serif ? LATIN_BYTES + SERIF_BYTES : LATIN_BYTES;

  const latin: FontSet = {
    tier: serif ? 'latin+serif' : 'latin',
    urls: latinFiles.map(fontUrl),
    families: [],
    lang,
    bytes: latinBytes,
    missing: [],
    serif,
  };
  if (wanted.size === 0) return latin;

  const scripts = await loadCoverage('coverage-scripts.bin');
  const latinCoverage = scripts.get('latin')!;
  const rest = [...wanted].filter(cp => !inRanges(latinCoverage, cp));
  if (rest.length === 0) return latin;

  const cjk = rest.some(cp => !SCRIPT_FAMILIES.some(f => inRanges(scripts.get(f.id)!, cp)))
    ? await loadCoverage('coverage-cjk.bin')
    : new Map<string, Uint32Array>();
  const coverageOf = (family: FamilyDef, variant: 'subset' | 'full') =>
    family.cjk ? cjk.get(`${family.id}-${variant}`) : scripts.get(family.id);

  const order = searchOrder(lang);
  const used = new Map<FamilyId, 'subset' | 'full'>();
  const missing: string[] = [];
  for (const cp of rest) {
    let found = false;
    for (const family of order) {
      const subset = family.subset ? coverageOf(family, 'subset') : undefined;
      if (subset && inRanges(subset, cp)) {
        if (!used.has(family.id)) used.set(family.id, 'subset');
        found = true;
        break;
      }
      const full = coverageOf(family, 'full');
      if (full && inRanges(full, cp)) {
        used.set(family.id, 'full');
        found = true;
        break;
      }
    }
    if (!found) missing.push(String.fromCodePoint(cp));
  }

  // A Japanese or Chinese document keeps its CJK face even when Noto Sans
  // could set every character, because full-width punctuation such as “” and
  // …… comes from the CJK face there (see `covers` in preamble.ts).
  if (lang.cjkPunctuation && !used.has(lang.han)) used.set(lang.han, 'subset');

  let bytes = latinBytes;
  const families: FamilyUse[] = order
    .filter(f => used.has(f.id))
    .flatMap(f => {
      const variant = f.subset ? used.get(f.id)! : 'full';
      const files = variant === 'subset' ? f.subset! : f.full;
      bytes += variant === 'subset' ? f.bytes.subset! : f.bytes.full;
      const use: FamilyUse = { id: f.id, family: f.family, variant, files, cjk: f.cjk };
      const serifFace = serif && f.cjk ? CJK_SERIF[f.id as HanVariant] : undefined;
      if (!serifFace) return [use];
      // The serif face sets regular text it covers (the same character set
      // as the sans subset); the sans face, bold only when it is the subset,
      // sets bold text and anything rarer.
      bytes += serifFace.bytes - (variant === 'subset' ? f.bytes.subset! / 2 : 0);
      return [
        { id: f.id, family: serifFace.family, variant: 'subset', files: [serifFace.file], cjk: true, regularOnly: true },
        variant === 'subset' ? { ...use, files: [files[1]], weights: ['700'] } : use,
      ];
    });

  return {
    tier: [latin.tier, ...families.map(f => `${f.id}-${f.regularOnly ? 'serif' : f.variant}`)].join('+'),
    urls: [...latinFiles, ...families.flatMap(f => f.files)].map(fontUrl),
    families,
    lang,
    bytes,
    missing,
    serif,
  };
}

export function fontSetKey(set: FontSet): string {
  return set.math ? `${set.tier}+math` : set.tier;
}

/* ---------- family lists ---------- */

const quote = (family: string) => `"${family}"`;

/**
 * The CSS font-family list for a piece of text in this document, in the same
 * order Typst uses. `leadWithCjk` puts the CJK families before Noto Sans, which
 * is what diagram labels need (see `mermaid.ts`).
 */
export function cssFamilies(set: FontSet, leadWithCjk = false): string {
  const cjk = set.families.filter(f => f.cjk).map(f => f.family);
  const scripts = set.families.filter(f => !f.cjk).map(f => f.family);
  const ordered = leadWithCjk && cjk.length
    ? [...cjk, ...scripts, 'Noto Sans']
    : ['Noto Sans', ...cjk, ...scripts];
  return ordered.map(quote).join(', ');
}

/**
 * Label font list for one diagram. A diagram with CJK in it leads with the CJK
 * faces, because the SVG renderer sets a mixed label in one face (see
 * `mermaid.ts`); any other diagram leads with Noto Sans, like the prose.
 */
export function diagramFontFamily(set: FontSet, code: string): string {
  return cssFamilies(set, CJK_TEXT.test(code));
}
