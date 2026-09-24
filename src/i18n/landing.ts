/**
 * Feature landing pages: the registry and the shape of their copy.
 *
 * A landing page is the same app on the same template as a locale's home page,
 * with its own title, description, hero, about section, FAQ and sample
 * document, served at `/<slug>/` (English) or `/<code>/<slug>/`.
 *
 * To add one:
 *   1. Add an entry to LANDINGS below: its slug and the locales it exists in.
 *   2. Write its copy in `src/i18n/landing/<code>.ts` for each of those
 *      locales. `LandingDictionary<code>` makes a missing page a type error,
 *      and `validateLandings()` (run by the build) fails on it too.
 * Paths, hreflang, sitemap, footer links and the language switcher follow.
 *
 * Build-time only, like the dictionaries: nothing here ships to the browser.
 */
import type { AboutSection, FaqEntry } from './types';

export const LOCALE_CODES = ['en', 'zh', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'ru'] as const;
export type LocaleCode = (typeof LOCALE_CODES)[number];

const ALL = LOCALE_CODES;

/**
 * Order is the order of the links in the about section and the footer.
 * `locales` lists where a page exists, chosen from what each market searches
 * for (autocomplete and competitor research, 2026-09; see README): e.g.
 * DeepSeek has real demand in zh, ru, es and pt but next to none in ja, ko,
 * fr or de; README to PDF has native autocomplete only in zh, es and pt; the
 * CLAUDE.md and "print Markdown" searches are English-only (native "print"
 * terms are near zero in Trends, 2026-09). A page that only makes sense in
 * one market (a script-specific font problem) lists just that locale; its
 * hreflang set then contains only the versions that exist.
 */
export const LANDINGS = [
  { slug: 'chatgpt-to-pdf', locales: ALL },
  { slug: 'deepseek-to-pdf', locales: ['en', 'zh', 'es', 'pt', 'ru'] },
  { slug: 'doubao-to-pdf', locales: ['zh'] },
  { slug: 'claude-to-pdf', locales: ['en', 'zh', 'ja', 'ko', 'de'] },
  { slug: 'gemini-to-pdf', locales: ['en', 'zh', 'ja', 'ko', 'es', 'pt', 'fr', 'de'] },
  { slug: 'mermaid-to-pdf', locales: ALL },
  { slug: 'readme-to-pdf', locales: ['en', 'zh', 'es', 'pt'] },
  { slug: 'claude-md-to-pdf', locales: ['en'] },
  { slug: 'print-markdown', locales: ['en'] },
  { slug: 'markdown-pdf-chinese', locales: ['zh'] },
  { slug: 'markdown-pdf-japanese', locales: ['ja'] },
  { slug: 'markdown-pdf-korean', locales: ['ko'] },
] as const satisfies readonly { slug: string; locales: readonly LocaleCode[] }[];

type Landing = (typeof LANDINGS)[number];
export type LandingSlug = Landing['slug'];

/** The slugs that exist in locale `L`. */
export type SlugsFor<L extends LocaleCode> = Landing extends infer D
  ? D extends { slug: infer S; locales: readonly (infer C)[] }
    ? L extends C
      ? S
      : never
    : never
  : never;

export interface HowToStep {
  name: string;
  /** Plain text. */
  text: string;
}

export interface LandingCopy {
  /** <title>, under ~60 characters, in the phrasing people search with. */
  title: string;
  /** Meta description, ~150 characters (CJK: ~80 characters). */
  description: string;
  /** The page's <h1>, shown above the tool. */
  h1: string;
  /** One or two plain-text sentences under the <h1>. */
  lead: string;
  /** Link text in the home page's about section and every footer. */
  navLabel: string;
  /** One plain-text line describing the page, next to the link on the home page. */
  navBlurb: string;
  /** About-section paragraphs below the tool, trusted HTML. */
  intro: string[];
  sections: AboutSection[];
  /** Steps rendered as an ordered list and as HowTo structured data. */
  howTo?: { heading: string; steps: HowToStep[] };
  faq: FaqEntry[];
  /** The document the editor starts with on this page (unless a draft exists). */
  sample: string;
}

export interface LandingDictionary<L extends LocaleCode> {
  /** Heading of the list of landing pages in the home page's about section. */
  hubHeading: string;
  /** Link text back to the locale's home page, in the footer of every page. */
  homeLink: string;
  pages: { [S in SlugsFor<L>]: LandingCopy };
}

export function landingLocales(slug: LandingSlug): readonly LocaleCode[] {
  return LANDINGS.find(l => l.slug === slug)!.locales;
}
