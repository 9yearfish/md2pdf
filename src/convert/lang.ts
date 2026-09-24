/**
 * Document language: detected from the text unless the user picks one.
 *
 * The language decides more than hyphenation. It picks the glyph forms for Han
 * characters (the same codepoint is drawn differently for Japanese, Simplified
 * and Traditional Chinese and Korean readers), the line-breaking and
 * punctuation rules, the quote marks, the text direction and the title of the
 * table of contents. Getting it wrong is visible, so detection is conservative
 * and falls back to English for Latin text it cannot place.
 */

export type LangCode =
  | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'it' | 'nl' | 'pl' | 'vi'
  | 'ru' | 'uk' | 'el'
  | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko'
  | 'ar' | 'he' | 'th' | 'hi';

export type LangSetting = 'auto' | LangCode;

/** Which regional Han glyph forms a document wants. */
export type HanVariant = 'sc' | 'tc' | 'jp' | 'kr';

export interface LanguageInfo {
  code: LangCode;
  /** Whether it was detected (`auto`) or chosen. */
  detected: boolean;
  /** Typst's `text(lang:)` and `text(region:)`. */
  typstLang: string;
  region: string | null;
  /** BCP 47 tag for the HTML preview. */
  html: string;
  dir: 'ltr' | 'rtl';
  /** Han glyph forms, used even when the language itself is not CJK. */
  han: HanVariant;
  /** Chinese or Japanese: full-width punctuation belongs to the CJK face. */
  cjkPunctuation: boolean;
  tocTitle: string;
}

interface LangDef {
  name: string; // native name, for a language picker
  english: string;
  typst: string;
  region?: string;
  dir?: 'rtl';
  han?: HanVariant;
  toc: string;
}

const LANGS: Record<LangCode, LangDef> = {
  en: { name: 'English', english: 'English', typst: 'en', toc: 'Contents' },
  de: { name: 'Deutsch', english: 'German', typst: 'de', toc: 'Inhaltsverzeichnis' },
  fr: { name: 'Français', english: 'French', typst: 'fr', toc: 'Table des matières' },
  es: { name: 'Español', english: 'Spanish', typst: 'es', toc: 'Índice' },
  pt: { name: 'Português', english: 'Portuguese', typst: 'pt', toc: 'Sumário' },
  it: { name: 'Italiano', english: 'Italian', typst: 'it', toc: 'Indice' },
  nl: { name: 'Nederlands', english: 'Dutch', typst: 'nl', toc: 'Inhoud' },
  pl: { name: 'Polski', english: 'Polish', typst: 'pl', toc: 'Spis treści' },
  vi: { name: 'Tiếng Việt', english: 'Vietnamese', typst: 'vi', toc: 'Mục lục' },
  ru: { name: 'Русский', english: 'Russian', typst: 'ru', toc: 'Содержание' },
  uk: { name: 'Українська', english: 'Ukrainian', typst: 'uk', toc: 'Зміст' },
  el: { name: 'Ελληνικά', english: 'Greek', typst: 'el', toc: 'Περιεχόμενα' },
  'zh-Hans': { name: '简体中文', english: 'Chinese (Simplified)', typst: 'zh', region: 'CN', han: 'sc', toc: '目录' },
  'zh-Hant': { name: '繁體中文', english: 'Chinese (Traditional)', typst: 'zh', region: 'TW', han: 'tc', toc: '目錄' },
  ja: { name: '日本語', english: 'Japanese', typst: 'ja', region: 'JP', han: 'jp', toc: '目次' },
  ko: { name: '한국어', english: 'Korean', typst: 'ko', region: 'KR', han: 'kr', toc: '목차' },
  ar: { name: 'العربية', english: 'Arabic', typst: 'ar', dir: 'rtl', toc: 'المحتويات' },
  he: { name: 'עברית', english: 'Hebrew', typst: 'he', dir: 'rtl', toc: 'תוכן העניינים' },
  th: { name: 'ไทย', english: 'Thai', typst: 'th', toc: 'สารบัญ' },
  hi: { name: 'हिन्दी', english: 'Hindi', typst: 'hi', toc: 'विषय सूची' },
};

/**
 * Every value `DocumentOptions.lang` accepts, with the name to show for it.
 * `auto` comes first and is the default.
 */
export const SUPPORTED_LANGUAGES: ReadonlyArray<{ value: LangSetting; name: string; english: string }> = [
  { value: 'auto', name: 'Auto', english: 'Detect from the text' },
  ...(Object.keys(LANGS) as LangCode[]).map(code => ({
    value: code,
    name: LANGS[code].name,
    english: LANGS[code].english,
  })),
];

export function isLangSetting(value: unknown): value is LangSetting {
  return value === 'auto' || (typeof value === 'string' && Object.hasOwn(LANGS, value));
}

/** Anything unknown (an old draft, a typo) counts as `auto`. */
export function normalizeLang(value: unknown): LangSetting {
  return isLangSetting(value) ? value : 'auto';
}

/* ---------- Simplified versus Traditional ---------- */

/**
 * The common characters only one of the two standards has (GB2312 level 1
 * minus Big5 level 1, and the reverse), as sorted codepoint ranges. Loaded
 * from `coverage-cjk.bin` along with the font coverage; see `fonts.ts`.
 */
export interface HanVariantSets {
  hansOnly: Uint32Array;
  hantOnly: Uint32Array;
}

let variantSets: HanVariantSets | null = null;

export function setHanVariantSets(sets: HanVariantSets): void {
  variantSets = sets;
}

export function hasHanVariantSets(): boolean {
  return variantSets !== null;
}

/** Binary search in `[start, end)` pairs. */
export function inRanges(ranges: Uint32Array, cp: number): boolean {
  let lo = 0;
  let hi = ranges.length / 2 - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cp < ranges[mid * 2]) hi = mid - 1;
    else if (cp >= ranges[mid * 2 + 1]) lo = mid + 1;
    else return true;
  }
  return false;
}

/**
 * Before the sets have loaded: the most frequent characters that differ, so a
 * first guess is usually already right.
 */
const HANS_HINTS = new Set('们这个国来说时为会对发后学过还没经进动现开问关长头实点体应当从两电样于与业东车门书见边机无气话让听买钱认识语读写页标题图数据库网络线设计软务处统员质产报华历万区种类级变组织结构术节总众权条项选办联单简汉');
const HANT_HINTS = new Set('們這個國來說時為會對發後學過還沒經進動現開問關長頭實點體應當從兩電樣於與業東車門書見邊機無氣話讓聽買錢認識語讀寫頁標題圖數據庫網絡線設計軟務處統員質產報華歷萬區種類級變組織結構術節總眾權條項選辦聯單簡漢');

/* ---------- detection ---------- */

interface Counts {
  latin: number;
  cyrillic: number;
  ukrainian: number;
  greek: number;
  arabic: number;
  hebrew: number;
  thai: number;
  devanagari: number;
  kana: number;
  hangul: number;
  han: number;
  hans: number;
  hant: number;
  vietnamese: number;
}

const isKana = (cp: number) =>
  (cp >= 0x3040 && cp <= 0x30ff) || (cp >= 0x31f0 && cp <= 0x31ff) || (cp >= 0xff66 && cp <= 0xff9f);
const isHangul = (cp: number) =>
  (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0x1100 && cp <= 0x11ff) ||
  (cp >= 0x3130 && cp <= 0x318f) || (cp >= 0xa960 && cp <= 0xa97f) || (cp >= 0xd7b0 && cp <= 0xd7ff);
export const isHan = (cp: number) =>
  (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff) ||
  (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x20000 && cp <= 0x3ffff);

/** Code, formulas and URLs say nothing about the language of the prose around them. */
function prose(text: string): string {
  return text
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, m => (/^(```|~~~)\s*mermaid/.test(m) ? m : ' '))
    .replace(/`[^`\n]*`/g, ' ')
    // Formulas (see math-syntax.ts): single letters such as "i" or "a" in
    // them would otherwise count as Polish, Spanish or Portuguese words.
    .replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g, ' ')
    .replace(/(^|[^\\$])\$(?=\S)(?:\\.|[^$\n])*?[^\s\\]\$(?!\d)|(^|[^\\$])\$[^\s$\\]\$(?!\d)/g, '$1$2 ')
    .replace(/\b(?:https?|ftp):\/\/\S+/g, ' ')
    .replace(/\]\([^)]*\)/g, '] ');
}

function count(text: string): Counts {
  const c: Counts = {
    latin: 0, cyrillic: 0, ukrainian: 0, greek: 0, arabic: 0, hebrew: 0, thai: 0,
    devanagari: 0, kana: 0, hangul: 0, han: 0, hans: 0, hant: 0, vietnamese: 0,
  };
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80) {
      if ((cp | 0x20) >= 0x61 && (cp | 0x20) <= 0x7a) c.latin++;
    } else if ((cp >= 0xc0 && cp <= 0x24f && cp !== 0xd7 && cp !== 0xf7) || (cp >= 0x1e00 && cp <= 0x1eff)) {
      c.latin++;
      if ((cp >= 0x1ea0 && cp <= 0x1ef9) || 'ơưăđƠƯĂĐ'.includes(ch)) c.vietnamese++;
    } else if (cp >= 0x400 && cp <= 0x52f) {
      c.cyrillic++;
      if ('іїєґІЇЄҐ'.includes(ch)) c.ukrainian++;
    } else if ((cp >= 0x370 && cp <= 0x3ff) || (cp >= 0x1f00 && cp <= 0x1fff)) c.greek++;
    else if ((cp >= 0x600 && cp <= 0x6ff) || (cp >= 0x750 && cp <= 0x77f) || (cp >= 0x8a0 && cp <= 0x8ff) ||
      (cp >= 0xfb50 && cp <= 0xfdff) || (cp >= 0xfe70 && cp <= 0xfeff)) c.arabic++;
    else if ((cp >= 0x590 && cp <= 0x5ff) || (cp >= 0xfb1d && cp <= 0xfb4f)) c.hebrew++;
    else if (cp >= 0xe00 && cp <= 0xe7f) c.thai++;
    else if ((cp >= 0x900 && cp <= 0x97f) || (cp >= 0xa8e0 && cp <= 0xa8ff)) c.devanagari++;
    else if (isKana(cp)) c.kana++;
    else if (isHangul(cp)) c.hangul++;
    else if (isHan(cp)) {
      c.han++;
      if (variantSets) {
        if (inRanges(variantSets.hansOnly, cp)) c.hans++;
        else if (inRanges(variantSets.hantOnly, cp)) c.hant++;
      } else if (HANS_HINTS.has(ch)) c.hans++;
      else if (HANT_HINTS.has(ch)) c.hant++;
    }
  }
  return c;
}

/**
 * Han glyph forms from content: a text that is mostly Hangul (and has at most
 * half as much kana) is Korean, noticeable kana means Japanese, more traditional-only than simplified-only characters
 * means Traditional Chinese, and anything else is Simplified Chinese.
 */
function hanVariant(c: Counts): HanVariant {
  const cjk = c.kana + c.hangul + c.han;
  if (cjk === 0) return 'sc';
  if (c.hangul >= 2 * c.kana && c.hangul >= 0.3 * cjk) return 'kr';
  if (c.kana > 0 && c.kana >= 0.1 * (c.kana + c.han)) return 'jp';
  if (c.hant > c.hans) return 'tc';
  return 'sc';
}

/** Words frequent in one language and rare as words in the others. */
const STOPWORDS: Partial<Record<LangCode, string[]>> = {
  en: ['the', 'and', 'of', 'to', 'is', 'that', 'with', 'for', 'this', 'are', 'be', 'it', 'you', 'not', 'have', 'from', 'which', 'can'],
  de: ['der', 'die', 'und', 'das', 'ist', 'nicht', 'mit', 'sich', 'auf', 'ein', 'eine', 'für', 'dem', 'den', 'zu', 'von', 'auch', 'wird', 'sind', 'oder'],
  fr: ['le', 'les', 'et', 'des', 'est', 'une', 'pour', 'dans', 'du', 'qui', 'pas', 'sur', 'au', 'avec', 'ce', 'sont', 'nous', 'vous', 'aux', 'cette'],
  es: ['el', 'los', 'las', 'y', 'por', 'para', 'del', 'se', 'al', 'lo', 'como', 'más', 'pero', 'está', 'es', 'su', 'muy', 'también'],
  pt: ['os', 'em', 'um', 'uma', 'não', 'do', 'da', 'dos', 'das', 'na', 'é', 'são', 'ao', 'mais', 'pelo', 'pela', 'também', 'você'],
  it: ['il', 'gli', 'di', 'è', 'per', 'non', 'della', 'sono', 'anche', 'nel', 'alla', 'che', 'delle', 'questo', 'molto'],
  nl: ['het', 'een', 'van', 'dat', 'niet', 'op', 'zijn', 'voor', 'met', 'ook', 'maar', 'wordt', 'deze', 'bij', 'naar'],
  pl: ['i', 'w', 'na', 'się', 'nie', 'jest', 'że', 'jak', 'od', 'dla', 'są', 'oraz', 'przez', 'czy', 'po'],
};

const STOPWORD_INDEX = (() => {
  const index = new Map<string, LangCode[]>();
  for (const [lang, words] of Object.entries(STOPWORDS) as [LangCode, string[]][]) {
    for (const word of words) index.set(word, [...(index.get(word) ?? []), lang]);
  }
  return index;
})();

/** Letters that give a language away. Weighted like one stopword each. */
const LETTER_HINTS: [RegExp, LangCode][] = [
  [/[ßäöü]/gi, 'de'],
  [/[ñ¿¡]/gi, 'es'],
  [/[ãõ]/gi, 'pt'],
  [/[œçêèëîïûù]/gi, 'fr'],
  [/[ąęłśźżń]/gi, 'pl'],
];

function latinLanguage(text: string, c: Counts): LangCode {
  if (c.vietnamese >= 3 && c.vietnamese >= 0.02 * c.latin) return 'vi';
  const scores = new Map<LangCode, number>();
  const add = (lang: LangCode, n: number) => scores.set(lang, (scores.get(lang) ?? 0) + n);
  for (const word of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
    for (const lang of STOPWORD_INDEX.get(word) ?? []) add(lang, 1);
  }
  for (const [pattern, lang] of LETTER_HINTS) {
    const hits = text.match(pattern)?.length ?? 0;
    if (hits) add(lang, Math.min(hits, 20) * 0.5);
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [best, second] = ranked;
  if (!best || best[1] < 3) return 'en';
  // A clear winner only; a wrong guess would hyphenate with the wrong rules.
  if (second && best[1] < second[1] * 1.3) return ranked.some(r => r[0] === 'en') ? 'en' : best[0];
  return best[0];
}

/** Language of the text by script first, then by vocabulary. */
function detect(text: string, c: Counts): LangCode {
  // A Han character carries roughly a word; a Latin letter a fifth of one.
  const cjk = (c.kana + c.hangul + c.han) * 3;
  const scripts: [number, () => LangCode][] = [
    [cjk, () => ({ sc: 'zh-Hans', tc: 'zh-Hant', jp: 'ja', kr: 'ko' } as const)[hanVariant(c)]],
    [c.arabic, () => 'ar'],
    [c.hebrew, () => 'he'],
    [c.thai, () => 'th'],
    [c.devanagari, () => 'hi'],
    [c.cyrillic, () => (c.ukrainian >= 2 && c.ukrainian >= 0.01 * c.cyrillic ? 'uk' : 'ru')],
    [c.greek, () => 'el'],
    [c.latin, () => latinLanguage(text, c)],
  ];
  let best: [number, () => LangCode] = [0, () => 'en'];
  for (const entry of scripts) if (entry[0] > best[0]) best = entry;
  return best[1]();
}

export function languageInfo(code: LangCode, detected: boolean, han: HanVariant): LanguageInfo {
  const def = LANGS[code];
  return {
    code,
    detected,
    typstLang: def.typst,
    region: def.region ?? null,
    html: code,
    dir: def.dir ?? 'ltr',
    han: def.han ?? han,
    cjkPunctuation: code === 'zh-Hans' || code === 'zh-Hant' || code === 'ja',
    tocTitle: def.toc,
  };
}

/**
 * The language to typeset `text` in. `setting` is the user's choice; `auto`
 * detects. The Han variant always comes from the content unless the chosen
 * language fixes it, so an English document quoting Japanese still gets
 * Japanese glyph forms.
 */
export function detectLanguage(text: string, setting: unknown = 'auto'): LanguageInfo {
  const chosen = normalizeLang(setting);
  const body = prose(text);
  const counts = count(body);
  const han = hanVariant(counts);
  if (chosen !== 'auto') return languageInfo(chosen, false, han);
  return languageInfo(detect(body, counts), true, han);
}
