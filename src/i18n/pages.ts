/**
 * Build-time rendering of the localised pages, the sitemap and the language
 * redirect. Pure string functions, used by the plugin in vite.config.ts; none
 * of this ships to the browser.
 *
 * `index.html` is the one template. It holds the markup, with
 *   {{lang}}              the page's <html lang>
 *   {{page.key}}          a string from the dictionary's `page` section
 *   {{ui.key}}            a string from the dictionary's `ui` section
 *   {{paperHint}}         the initial paper hint (A4)
 *   {{homePath}}          the locale's home page, for the brand link
 *   {{brand}}, {{brandLead}}, {{brandName}}   BRAND (constants.ts), whole and split for the wordmark
 *   {{privacyItems}}      page.privacyBadge as <li>s, one per " · " phrase, each with its icon
 * and blocks the renderer fills in whole:
 *   <!--i18n:redirect-->  the language redirect script (default home page only)
 *   <!--i18n:head-->      title, description, canonical, hreflang, OG, JSON-LD
 *   <!--i18n:switcher-->  the language menu (a <details> over the same links as the footer)
 *   <!--i18n:intro-->     the title band: the page's one <h1> and its lead
 *   <!--i18n:about-->     the descriptive section and FAQ
 *   <!--i18n:data-->      the runtime strings and sample, as a JSON data block
 * Text is HTML-escaped where it lands; `about` strings are trusted HTML.
 *
 * Every page is a `PageRef`: a locale's home page (`slug: null`) or one of its
 * landing pages (see landing.ts). Alternates, the sitemap and the footer's
 * language links are all derived from the same list of pages.
 */
import { DEFAULT_LOCALE, LOCALES, localePath } from './index';
import { BRAND, LANG_PREF_KEY, LOCALE_DATA_ID } from './constants';
import { LANDINGS, type LandingCopy, type LandingSlug, type LocaleCode } from './landing';
import { LANDING_COPY } from './landing/index';
import type { AboutSection, FaqEntry, Messages, PageMessages, RuntimeLocale, UiMessages } from './types';

export const REDIRECT_MARKER = '<!--i18n:redirect-->';

export { BRAND };

/** The sprite symbols in index.html for each privacy claim, in order (see PageMessages.privacyBadge). */
const PRIVACY_ICONS = ['i-local', 'i-no-upload', 'i-no-signup', 'i-no-watermark', 'i-offline'];

/** Approximate SERP width: East Asian wide characters count double. */
function displayWidth(text: string): number {
  let width = 0;
  for (const ch of text) width += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/u.test(ch) ? 2 : 1;
  return width;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** For the structured data, which wants plain text. */
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** JSON that is safe inside a <script> element: nothing can close it early. */
function scriptJson(value: unknown, indent?: number): string {
  return JSON.stringify(value, null, indent).replace(/</g, '\\u003c');
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);
}

/* ---------- pages ---------- */

export interface PageRef {
  messages: Messages;
  /** null for the locale's home page. */
  slug: LandingSlug | null;
}

const codeOf = (messages: Messages) => messages.locale.code as LocaleCode;

function landingCopy(ref: PageRef): LandingCopy | null {
  if (!ref.slug) return null;
  const pages = LANDING_COPY[codeOf(ref.messages)].pages as Partial<Record<LandingSlug, LandingCopy>>;
  const copy = pages[ref.slug];
  if (!copy) throw new Error(`no ${codeOf(ref.messages)} copy for landing page ${ref.slug}`);
  return copy;
}

function hasLanding(messages: Messages, slug: LandingSlug): boolean {
  const entry = LANDINGS.find(l => l.slug === slug);
  return Boolean(entry && (entry.locales as readonly string[]).includes(messages.locale.code));
}

/** `/`, `/ja/`, `/chatgpt-to-pdf/`, `/ja/chatgpt-to-pdf/`. */
export function pagePath(ref: PageRef): string {
  return ref.slug ? `${localePath(ref.messages)}${ref.slug}/` : localePath(ref.messages);
}

/** Every page the site builds: each locale's home page, then its landing pages. */
export const PAGES: readonly PageRef[] = LOCALES.flatMap(messages => [
  { messages, slug: null },
  ...LANDINGS.filter(l => hasLanding(messages, l.slug)).map(l => ({ messages, slug: l.slug as LandingSlug })),
]);

/** The page being built, from its path: `/ja/index.html`, `/ja/chatgpt-to-pdf/index.html`, `/ja/`. */
export function pageForPath(pathname: string): PageRef {
  const path = pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const page = PAGES.find(p => pagePath(p) === path);
  if (!page) throw new Error(`no page is built at ${pathname}`);
  return page;
}

/** The same page in every locale that has it, in locale order (itself included). */
export function alternatesOf(ref: PageRef): PageRef[] {
  return PAGES.filter(p => p.slug === ref.slug);
}

/** Where the language switcher and footer link to: the same page if it exists there, else that home page. */
function counterpart(ref: PageRef, messages: Messages): PageRef {
  return ref.slug && hasLanding(messages, ref.slug) ? { messages, slug: ref.slug } : { messages, slug: null };
}

/** x-default is the English page, and only when there is one. */
function xDefault(ref: PageRef): PageRef | undefined {
  return alternatesOf(ref).find(p => p.messages === DEFAULT_LOCALE);
}

function url(origin: string, ref: PageRef): string {
  return origin + pagePath(ref);
}

function faqJson(lang: string, faq: FaqEntry[]) {
  return {
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faq.map(entry => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer.map(toPlainText).join('\n\n'),
      },
    })),
  };
}

/** The share image for a page, rendered by scripts/og.mjs into public/og/. */
export function ogImagePath(ref: PageRef): string {
  return `/og/${codeOf(ref.messages)}${ref.slug ? `-${ref.slug}` : ''}.png`;
}

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** The page's <h1>: its title and the locale's muted continuation. */
export function pageHeading(ref: PageRef): { title: string; tagline: string } {
  const { page } = ref.messages;
  return { title: landingCopy(ref)?.h1 ?? page.heroTitle, tagline: page.heroTagline };
}

function head(ref: PageRef, origin: string): string {
  const { messages } = ref;
  const { meta, locale, about } = messages;
  const copy = landingCopy(ref);
  const self = url(origin, ref);
  // The brand closes the title where it fits in the ~70 characters a result shows.
  const bare = copy?.title ?? meta.title;
  // Google shows roughly 600px of a title, about 60 Latin characters; CJK
  // glyphs are about twice as wide. The brand only goes on when it fits, so
  // the part that gets truncated is never the page's own keywords.
  const branded = `${bare} · ${BRAND}`;
  const title = displayWidth(branded) <= 62 ? branded : bare;
  const description = copy?.description ?? meta.description;
  const alternates = alternatesOf(ref);
  const fallback = xDefault(ref);
  const { title: h1, tagline } = pageHeading(ref);
  const heading = h1 + tagline;
  const lines: string[] = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${self}" />`,
    ...alternates.map(
      p => `<link rel="alternate" hreflang="${p.messages.locale.hreflang}" href="${url(origin, p)}" />`,
    ),
    ...(fallback ? [`<link rel="alternate" hreflang="x-default" href="${url(origin, fallback)}" />`] : []),
    '',
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:url" content="${self}" />`,
    `<meta property="og:title" content="${escapeHtml(copy?.title ?? meta.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(copy?.description ?? meta.ogDescription)}" />`,
    `<meta property="og:locale" content="${locale.ogLocale}" />`,
    ...alternates
      .filter(p => p.messages !== messages)
      .map(p => `<meta property="og:locale:alternate" content="${p.messages.locale.ogLocale}" />`),
    `<meta property="og:image" content="${origin}${ogImagePath(ref)}" />`,
    '<meta property="og:image:type" content="image/png" />',
    `<meta property="og:image:width" content="${OG_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_HEIGHT}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(heading)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    // X falls back to og:title/og:description, but some clients and card
    // checkers read only the twitter: names.
    `<meta name="twitter:title" content="${escapeHtml(copy?.title ?? meta.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(copy?.description ?? meta.ogDescription)}" />`,
    `<meta name="twitter:image" content="${origin}${ogImagePath(ref)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(heading)}" />`,
  ];

  const graph: object[] = [
    {
      '@type': 'WebApplication',
      name: BRAND,
      url: self,
      inLanguage: locale.lang,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: meta.operatingSystem,
      description: copy?.description ?? meta.appDescription,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: meta.featureList,
    },
    faqJson(locale.lang, copy?.faq ?? about.faq),
  ];
  // Google shows the site name above the title from the home page's WebSite
  // entry, so the brand reaches search results even when a long title can't
  // carry it.
  if (!copy) {
    graph.unshift({
      '@type': 'WebSite',
      name: BRAND,
      alternateName: new URL(origin).hostname,
      url: `${origin}/`,
      inLanguage: locale.lang,
    });
  }
  if (copy?.howTo) {
    graph.push({
      '@type': 'HowTo',
      inLanguage: locale.lang,
      name: copy.howTo.heading,
      tool: { '@type': 'HowToTool', name: BRAND },
      step: copy.howTo.steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.name,
        text: step.text,
        url: `${self}#step-${i + 1}`,
      })),
    });
  }
  const structured = { '@context': 'https://schema.org', '@graph': graph };
  lines.push('', `<script type="application/ld+json">\n${scriptJson(structured, 2)}\n</script>`);
  return lines.join('\n    ');
}

/**
 * One link per locale, to the same page there if it exists, else that
 * locale's home page. Shared by the language menu and the footer, so the two
 * can never disagree; plain links, so both work without JavaScript.
 */
function languageLinks(ref: PageRef, indent: string): string[] {
  return LOCALES.map(m => {
    const target = counterpart(ref, m);
    return (
      `${indent}<a href="${pagePath(target)}" hreflang="${m.locale.hreflang}" lang="${m.locale.lang}" data-locale="${m.locale.code}"` +
      `${m === ref.messages ? ' aria-current="page"' : ''}>${escapeHtml(m.locale.nativeName)}</a>`
    );
  });
}

/**
 * The language menu in the header: a disclosure (`<details>`) over the same
 * links as the footer, drawn in the page's own style rather than as a native
 * <select>. It opens and works without JavaScript; main.ts adds closing on an
 * outside click or Escape and remembers the choice.
 */
function switcher(ref: PageRef): string {
  const { messages } = ref;
  const label = escapeHtml(messages.page.language);
  return [
    '<details class="lang" id="lang-menu">',
    `  <summary title="${label}" aria-label="${label}: ${escapeHtml(messages.locale.nativeName)}">`,
    '    <svg class="icon" aria-hidden="true"><use href="#i-globe" /></svg>',
    `    <span class="lang-current">${escapeHtml(messages.locale.nativeName)}</span>`,
    '    <svg class="icon lang-chevron" aria-hidden="true"><use href="#i-chevron" /></svg>',
    '  </summary>',
    `  <nav class="lang-list" aria-label="${label}">`,
    ...languageLinks(ref, '    '),
    '  </nav>',
    '</details>',
  ].join('\n        ');
}

const paragraphs = (list: string[], indent = '\n      ') => list.map(p => `<p>${p}</p>`).join(indent);

/** The feature grid, shared by the home page and every landing page. */
function sectionsHtml(sections: AboutSection[]): string[] {
  return [
    '<div class="features">',
    ...sections.map(
      s => `  <div class="feature">\n        <h3>${escapeHtml(s.heading)}</h3>\n        ${paragraphs(s.body)}\n      </div>`,
    ),
    '</div>',
  ];
}

function faqHtml(heading: string, faq: FaqEntry[]): string[] {
  return [
    `<h3>${escapeHtml(heading)}</h3>`,
    ...faq.map(
      entry =>
        `<details>\n        <summary>${escapeHtml(entry.question)}</summary>\n        ` +
        paragraphs(entry.answer, '\n        ') +
        '\n      </details>',
    ),
  ];
}

/** This locale's landing pages, for the lists of links. */
function landingsOf(messages: Messages): PageRef[] {
  return PAGES.filter(p => p.messages === messages && p.slug !== null);
}

/** The list of landing pages with a line each, in the about section. */
function guideList(ref: PageRef): string[] {
  const others = landingsOf(ref.messages).filter(p => p.slug !== ref.slug);
  if (!others.length) return [];
  const dictionary = LANDING_COPY[codeOf(ref.messages)];
  return [
    `<h3>${escapeHtml(dictionary.hubHeading)}</h3>`,
    '<div class="features guides">',
    ...others.map(p => {
      const copy = landingCopy(p)!;
      return (
        `  <div class="feature">\n        <h4><a href="${pagePath(p)}">${escapeHtml(copy.navLabel)}</a></h4>\n        ` +
        `<p>${escapeHtml(copy.navBlurb)}</p>\n      </div>`
      );
    }),
    '</div>',
  ];
}

/** Compact links in the footer of every page: home plus every landing page. */
function footerNav(ref: PageRef): string[] {
  const dictionary = LANDING_COPY[codeOf(ref.messages)];
  const home: PageRef = { messages: ref.messages, slug: null };
  const link = (p: PageRef, label: string) =>
    `    <a href="${pagePath(p)}"${p.slug === ref.slug ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
  return [
    `  <nav class="guides-nav" aria-label="${escapeHtml(dictionary.hubHeading)}">`,
    link(home, dictionary.homeLink),
    ...landingsOf(ref.messages).map(p => link(p, landingCopy(p)!.navLabel)),
    '  </nav>',
  ];
}

function aboutSection(ref: PageRef): string {
  const { messages } = ref;
  const { about } = messages;
  const copy = landingCopy(ref);
  const body = copy
    ? [
        `<h2>${escapeHtml(copy.navLabel)}</h2>`,
        paragraphs(copy.intro),
        ...(copy.howTo
          ? [
              `<h3>${escapeHtml(copy.howTo.heading)}</h3>`,
              '<ol class="steps">',
              ...copy.howTo.steps.map(
                (step, i) =>
                  `  <li id="step-${i + 1}"><strong>${escapeHtml(step.name)}</strong> ${escapeHtml(step.text)}</li>`,
              ),
              '</ol>',
            ]
          : []),
        ...sectionsHtml(copy.sections),
        ...faqHtml(about.faqHeading, copy.faq),
        ...guideList(ref),
      ]
    : [
        `<h2>${escapeHtml(about.heading)}</h2>`,
        // On the same two-column grid as the features below, so the edges and
        // the gutter line up instead of the lead sitting in half the width.
        `<div class="about-lead">${paragraphs(about.intro)}</div>`,
        ...sectionsHtml(about.sections),
        ...guideList(ref),
        ...faqHtml(about.faqHeading, about.faq),
      ];
  // Collapsed, not hidden: a native <details> the reader opens, with every
  // word of it in the HTML. The footer stays outside it, always visible.
  const parts = [
    '<details class="about-more" id="about">',
    `  <summary>${escapeHtml(messages.page.aboutToggle)}</summary>`,
    ...body.map(line => `  ${line}`),
    '</details>',
    '<footer>',
    ...footerNav(ref),
    `  <nav class="languages" aria-label="${escapeHtml(about.languagesHeading)}">`,
    ...languageLinks(ref, '    '),
    '  </nav>',
    // The brand line closes the page, like a colophon.
    '  <p class="colophon">' +
      '<img src="/logo-48.png" srcset="/logo-48.png 1x, /logo-96.png 2x" width="24" height="24" alt="" loading="lazy" />' +
      `<span>${about.footer}</span></p>`,
    '</footer>',
  ];
  return parts.join('\n      ');
}

/**
 * The title band above the tool, holding the page's one <h1>. The same
 * component on every page: the home page's heroTitle, or a landing page's own
 * title and lead, each followed by the locale's muted tagline. The brand in
 * the header is a link home, never a heading.
 */
function intro(ref: PageRef): string {
  const { page } = ref.messages;
  const copy = landingCopy(ref);
  const { title, tagline } = pageHeading(ref);
  return (
    `<h1 class="intro-title">${escapeHtml(title)}<span>${escapeHtml(tagline)}</span></h1>\n        ` +
    `<p class="intro-lead">${escapeHtml(copy?.lead ?? page.heroLead)}</p>`
  );
}

function runtimeData(ref: PageRef): string {
  const { messages } = ref;
  const copy = landingCopy(ref);
  const data: RuntimeLocale = {
    code: messages.locale.code,
    lang: messages.locale.lang,
    ui: messages.ui,
    sample: copy?.sample ?? messages.sample,
    ...(ref.slug ? { landing: ref.slug } : {}),
  };
  return `<script type="application/json" id="${LOCALE_DATA_ID}">${scriptJson(data)}</script>`;
}

/** Render `index.html` as one page. Throws on any placeholder it cannot fill. */
export function renderPage(template: string, ref: PageRef, origin: string, redirectTag: string): string {
  const { messages } = ref;
  const blocks: Record<string, string> = {
    '<!--i18n:head-->': head(ref, origin),
    '<!--i18n:switcher-->': switcher(ref),
    '<!--i18n:intro-->': intro(ref),
    '<!--i18n:about-->': aboutSection(ref),
    '<!--i18n:data-->': runtimeData(ref),
  };
  let html = template;
  for (const [marker, content] of Object.entries(blocks)) {
    if (!html.includes(marker)) throw new Error(`index.html is missing ${marker}`);
    html = html.replace(marker, () => content);
  }
  // Only `/` picks a language; every other page is already the one asked for.
  const home = ref.slug === null && messages === DEFAULT_LOCALE;
  html = html.replace(REDIRECT_MARKER, () => (home ? redirectTag : ''));

  html = html.replace(/\{\{([\w.]+)\}\}/g, (_match, key: string) => {
    if (key === 'lang') return messages.locale.lang;
    if (key === 'homePath') return localePath(messages);
    if (key === 'brand') return escapeHtml(BRAND);
    // The wordmark: the first word lighter, the rest in full ink.
    if (key === 'brandLead') return escapeHtml(BRAND.split(' ')[0]);
    if (key === 'brandName') return escapeHtml(BRAND.split(' ').slice(1).join(' '));
    if (key === 'paperHint') return escapeHtml(fill(messages.ui.paperHint, { paper: 'A4' }));
    if (key === 'privacyItems') {
      const items = messages.page.privacyBadge.split(' · ');
      const li = (item: string, i: number, extra = '') =>
        `<li${extra}><svg class="icon" aria-hidden="true"><use href="#${PRIVACY_ICONS[i] ?? 'i-check'}"/></svg>${escapeHtml(item)}</li>`;
      // A second, hidden-from-assistive-tech copy lets the phone layout run the
      // line as a seamless loop; it is display:none everywhere else.
      return items.map((item, i) => li(item, i)).join('') + items.map((item, i) => li(item, i, ' class="dup" aria-hidden="true"')).join('');
    }
    const [section, name] = key.split('.');
    const table =
      section === 'page' ? (messages.page as unknown as Record<string, unknown>)
      : section === 'ui' ? (messages.ui as unknown as Record<string, unknown>)
      : null;
    const value = table?.[name];
    if (typeof value !== 'string') {
      throw new Error(`index.html uses {{${key}}}, which ${messages.locale.code} does not define`);
    }
    return escapeHtml(value);
  });
  return html;
}

/**
 * The redirect on `/`. A classic script, loaded synchronously before anything
 * paints, because the CSP forbids inline scripts. It sends a first-time
 * visitor to the locale their browser asks for, unless they have chosen a
 * language before or the URL carries `?lang=`.
 */
export function redirectScript(): string {
  const targets: Record<string, string> = {};
  for (const m of LOCALES) if (m !== DEFAULT_LOCALE) targets[m.locale.code] = localePath(m);
  return `/* md2pdf: pick the visitor's language on first visit to /. Generated by vite.config.ts. */
(function () {
  try {
    var path = location.pathname;
    if (path !== '/' && path !== '/index.html') return;
    if (/[?&]lang=/.test(location.search)) return;
    var targets = ${JSON.stringify(targets)};
    // An explicit choice beats the browser's language: someone who picked
    // Japanese and comes back to / should land on Japanese again.
    var stored = null;
    try {
      stored = localStorage.getItem(${JSON.stringify(LANG_PREF_KEY)});
    } catch (e) {}
    if (stored) {
      if (Object.prototype.hasOwnProperty.call(targets, stored)) {
        location.replace(targets[stored] + location.search + location.hash);
      }
      return;
    }
    var wanted = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < wanted.length; i++) {
      var primary = String(wanted[i]).toLowerCase().split('-')[0];
      if (primary === ${JSON.stringify(DEFAULT_LOCALE.locale.code)}) return;
      if (Object.prototype.hasOwnProperty.call(targets, primary)) {
        location.replace(targets[primary] + location.search + location.hash);
        return;
      }
    }
  } catch (e) {}
})();
`;
}

export function sitemap(origin: string): string {
  const entries = PAGES.map(ref => {
    const fallback = xDefault(ref);
    const alternates = [
      ...alternatesOf(ref).map(
        p => `    <xhtml:link rel="alternate" hreflang="${p.messages.locale.hreflang}" href="${url(origin, p)}"/>`,
      ),
      ...(fallback ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(origin, fallback)}"/>`] : []),
    ].join('\n');
    return `  <url>\n    <loc>${url(origin, ref)}</loc>\n${alternates}\n    <changefreq>monthly</changefreq>\n  </url>`;
  }).join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    entries +
    '\n</urlset>\n'
  );
}

const PLACEHOLDER = /\{(\w+)\}/g;
const placeholders = (text: string) => [...text.matchAll(PLACEHOLDER)].map(m => m[1]).sort().join(',');

/**
 * The type system already requires every key; this catches what it cannot:
 * extra keys, missing placeholders, and FAQ or section lists that drifted.
 */
export function validateLocales(): void {
  const base = DEFAULT_LOCALE;
  const problems: string[] = [];
  const codes = new Set<string>();
  for (const m of LOCALES) {
    const code = m.locale.code;
    if (codes.has(code)) problems.push(`duplicate locale ${code}`);
    codes.add(code);
    for (const section of ['page', 'ui', 'meta'] as const) {
      const a = Object.keys(base[section]).sort().join();
      const b = Object.keys(m[section]).sort().join();
      if (a !== b) problems.push(`${code}.${section} keys differ from ${base.locale.code}`);
    }
    for (const key of Object.keys(base.ui) as (keyof UiMessages)[]) {
      const ours = base.ui[key];
      const theirs = m.ui[key];
      if (typeof ours === 'string' && typeof theirs === 'string') {
        if (placeholders(ours) !== placeholders(theirs)) problems.push(`${code}.ui.${key} placeholders differ`);
      } else if (typeof theirs !== 'object' || !theirs.other?.includes('{n}')) {
        problems.push(`${code}.ui.${key} needs an "other" form with {n}`);
      }
    }
    for (const key of Object.keys(base.page) as (keyof PageMessages)[]) {
      if (!m.page[key]?.trim()) problems.push(`${code}.page.${key} is empty`);
    }
    if (m.about.faq.length !== base.about.faq.length) problems.push(`${code}: FAQ has ${m.about.faq.length} entries`);
    if (m.about.sections.length !== base.about.sections.length) problems.push(`${code}: about has ${m.about.sections.length} sections`);
    if (!m.sample.includes('```mermaid')) problems.push(`${code}: sample has no Mermaid diagram`);
  }
  if (problems.length) throw new Error('i18n dictionaries are inconsistent:\n  ' + problems.join('\n  '));
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The type system already requires every landing page's copy in every locale
 * it lists; this catches what it cannot (extra pages, empty strings, a copy
 * file that drifted) so the build fails rather than shipping a half page.
 */
export function validateLandings(): void {
  const problems: string[] = [];
  const slugs = new Set<string>();
  for (const landing of LANDINGS) {
    if (!SLUG.test(landing.slug)) problems.push(`landing slug ${landing.slug} is not URL-safe`);
    if (slugs.has(landing.slug)) problems.push(`duplicate landing slug ${landing.slug}`);
    if (LOCALES.some(m => m.locale.code === landing.slug)) problems.push(`landing slug ${landing.slug} collides with a locale`);
    slugs.add(landing.slug);
  }
  for (const m of LOCALES) {
    const code = codeOf(m);
    const dictionary = LANDING_COPY[code];
    if (!dictionary) {
      problems.push(`${code}: no landing copy file`);
      continue;
    }
    if (!dictionary.hubHeading?.trim() || !dictionary.homeLink?.trim()) problems.push(`${code}: hubHeading/homeLink empty`);
    const pages = dictionary.pages as Record<string, LandingCopy | undefined>;
    const expected = LANDINGS.filter(l => hasLanding(m, l.slug)).map(l => l.slug as string);
    for (const slug of Object.keys(pages)) {
      if (!expected.includes(slug)) problems.push(`${code}: copy for ${slug}, which LANDINGS does not list for ${code}`);
    }
    for (const slug of expected) {
      const copy = pages[slug];
      const where = `${code}/${slug}`;
      if (!copy) {
        problems.push(`${where}: missing copy`);
        continue;
      }
      for (const key of ['title', 'description', 'h1', 'lead', 'navLabel', 'navBlurb', 'sample'] as const) {
        if (typeof copy[key] !== 'string' || !copy[key].trim()) problems.push(`${where}.${key} is empty`);
      }
      if (copy.title.length > 70) problems.push(`${where}.title is ${copy.title.length} characters`);
      if (!copy.intro.length || copy.intro.some(p => !p.trim())) problems.push(`${where}.intro is empty`);
      if (copy.sections.some(s => !s.heading.trim() || !s.body.length)) problems.push(`${where}: empty section`);
      if (copy.faq.length < 3) problems.push(`${where}: FAQ has ${copy.faq.length} entries`);
      if (copy.faq.some(f => !f.question.trim() || !f.answer.length)) problems.push(`${where}: empty FAQ entry`);
      if (copy.howTo && copy.howTo.steps.length < 2) problems.push(`${where}: HowTo needs steps`);
      if (!/^#\s/m.test(copy.sample)) problems.push(`${where}: sample has no # heading`);
      if (slug === 'mermaid-to-pdf' && !copy.sample.includes('```mermaid')) problems.push(`${where}: sample has no Mermaid diagram`);
    }
    const titles = [m.meta.title, ...expected.map(s => pages[s]?.title)];
    if (new Set(titles).size !== titles.length) problems.push(`${code}: two pages share a <title>`);
  }
  if (problems.length) throw new Error('landing pages are inconsistent:\n  ' + problems.join('\n  '));
}

/* ---------- llms.txt ---------- */

/** One Markdown link line per page: its title, and its description. */
function pageLine(origin: string, ref: PageRef): string {
  const copy = landingCopy(ref);
  const { meta } = ref.messages;
  return `- [${copy?.title ?? meta.title}](${url(origin, ref)}): ${copy?.description ?? meta.description}`;
}

/** Trusted about HTML as Markdown-ish plain text: code stays code. */
function toMarkdownText(html: string): string {
  return toPlainText(
    html
      .replace(/<code>([\s\S]*?)<\/code>/g, (_m, code: string) => (code.includes('`') ? `\`\` ${code} \`\`` : `\`${code}\``))
      .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**'),
  );
}

/**
 * /llms.txt (llmstxt.org): what the product is and where every page lives, for
 * AI crawlers and assistants. Built from the same dictionaries as the pages
 * and the sitemap, so it can never list a page that does not exist.
 */
export function llmsTxt(origin: string): string {
  const en = DEFAULT_LOCALE;
  const { meta, about } = en;
  const syntax = about.sections.find(s => /markdown/i.test(s.heading)) ?? about.sections[about.sections.length - 1];
  const privacy = about.faq[0];
  const lines = [
    `# ${BRAND}`,
    '',
    `> ${meta.appDescription}`,
    '',
    toMarkdownText(about.intro[0]),
    '',
    '## Features',
    '',
    ...meta.featureList.map(f => `- ${f}`),
    '',
    `## ${syntax.heading}`,
    '',
    ...syntax.body.map(toMarkdownText),
    '',
    '## Privacy',
    '',
    `${privacy.question} ${privacy.answer.map(toMarkdownText).join(' ')}`,
    '',
    '## Pages',
    '',
    ...PAGES.filter(p => p.messages === en).map(p => pageLine(origin, p)),
    '',
    '## Other languages',
    '',
    ...PAGES.filter(p => p.messages !== en).map(p => pageLine(origin, p)),
    '',
    '## Optional',
    '',
    `- [Full text](${origin}/llms-full.txt): the English pages' descriptions, how-to steps and FAQ in one file`,
    `- [Sitemap](${origin}/sitemap.xml): every page with its hreflang alternates`,
    '',
  ];
  return lines.join('\n');
}

/** /llms-full.txt: the English home page's and landing pages' text, as Markdown. */
export function llmsFullTxt(origin: string): string {
  const en = DEFAULT_LOCALE;
  const faq = (entries: FaqEntry[]) =>
    entries.flatMap(e => [`### ${e.question}`, '', ...e.answer.map(toMarkdownText), '']);
  const out = [
    `# ${BRAND}: full text`,
    '',
    `> ${en.meta.appDescription}`,
    '',
    `Source: ${origin}/`,
    '',
    `## ${en.about.heading}`,
    '',
    ...en.about.intro.flatMap(p => [toMarkdownText(p), '']),
    ...en.about.sections.flatMap(s => [`### ${s.heading}`, '', ...s.body.map(toMarkdownText), '']),
    `## ${en.about.faqHeading}`,
    '',
    ...faq(en.about.faq),
  ];
  for (const ref of PAGES.filter(p => p.messages === en && p.slug)) {
    const copy = landingCopy(ref)!;
    out.push(`## ${copy.h1}`, '', `URL: ${url(origin, ref)}`, '', copy.lead, '', ...copy.intro.flatMap(p => [toMarkdownText(p), '']));
    if (copy.howTo) {
      out.push(`### ${copy.howTo.heading}`, '', ...copy.howTo.steps.map((s, i) => `${i + 1}. **${s.name}** ${s.text}`), '');
    }
    out.push(...copy.sections.flatMap(s => [`### ${s.heading}`, '', ...s.body.map(toMarkdownText), '']), ...faq(copy.faq));
  }
  return out.join('\n');
}

/** robots.txt: everyone may crawl, and the AI crawlers are named so nobody has to guess. */
export function robotsTxt(origin: string): string {
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot', 'Googlebot'];
  return [
    'User-agent: *',
    'Allow: /',
    '',
    ...bots.flatMap(bot => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

/** The web app manifest, named from BRAND. */
export function manifest(): string {
  return JSON.stringify(
    {
      name: `${BRAND}: Markdown to PDF`,
      short_name: BRAND,
      description: 'Markdown to PDF in the browser, with Mermaid diagrams and CJK typesetting. Nothing is uploaded.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#f4f4f4',
      theme_color: '#f4f4f4',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2,
  ) + '\n';
}
