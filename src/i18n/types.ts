/**
 * The shape every locale dictionary must fill in.
 *
 * Each `src/i18n/<code>.ts` exports one `Messages` object; a missing or
 * misspelt key is a type error, and the build plugin double-checks that every
 * dictionary has exactly the keys English has.
 *
 * Strings in `about` are trusted HTML (they are written by us, not users) and
 * may use <code>, <strong>, <em> and <a>. Everything else is plain text and is
 * escaped where it lands. Runtime strings use `{name}` placeholders.
 */

/** Intl.PluralRules categories; `other` is the only one every language has. */
export type PluralForms = { other: string } & Partial<
  Record<'zero' | 'one' | 'two' | 'few' | 'many', string>
>;

export interface LocaleMeta {
  /** Path segment and dictionary id: `/ja/` is `ja`. The default locale lives at `/`. */
  code: string;
  /** `<html lang>`, also used for number and time formatting. */
  lang: string;
  /** The hreflang value, in both <link rel=alternate> and the sitemap. */
  hreflang: string;
  /** Open Graph locale, e.g. `ja_JP`. */
  ogLocale: string;
  /** The language's name in itself, for the switcher. */
  nativeName: string;
}

export interface MetaMessages {
  /** <title>, under ~60 characters, built around what people search for. */
  title: string;
  /** Meta description, ~150 characters. */
  description: string;
  ogTitle: string;
  ogDescription: string;
  /** WebApplication.description in the structured data. */
  appDescription: string;
  /** WebApplication.operatingSystem. */
  operatingSystem: string;
  /** WebApplication.featureList. */
  featureList: string[];
}

/** Strings that only appear in the prerendered HTML. */
export interface PageMessages {
  /** Short claims joined by " · ", each shown with its own icon, in this order:
   *  local processing, no upload, no signup, no watermark, works offline. */
  privacyBadge: string;
  privacyTitle: string;
  newDoc: string;
  newDocTitle: string;
  open: string;
  openTitle: string;
  layout: string;
  layoutTitle: string;
  downloadTitle: string;
  /** Tooltip on Print: it prints the typeset PDF, not this page. */
  printTitle: string;
  language: string;
  paper: string;
  margin: string;
  fontSize: string;
  lineHeight: string;
  pageNumbers: string;
  toc: string;
  justify: string;
  docLanguage: string;
  template: string;
  templateDefault: string;
  templateReport: string;
  templateAcademic: string;
  templateResume: string;
  templateLetter: string;
  cover: string;
  h1NewPage: string;
  header: string;
  footer: string;
  /** Tooltip on the header and footer fields: the tokens and the | syntax. */
  bandTitle: string;
  editorHint: string;
  editorLabel: string;
  editorPlaceholder: string;
  preview: string;
  dropHint: string;
  /** Pane labels, set in small capitals: the Markdown, and the page it becomes. */
  source: string;
  proof: string;
  /** Marks the preview as following the text as it is typed. */
  live: string;
  /** Accessible name of the Source / Proof switch on phones. */
  viewSwitch: string;
  /** The toggle that lets the tool fill the window. */
  fullscreen: string;
  /** The intro above the tool: title, its muted continuation, one sentence. */
  heroTitle: string;
  heroTagline: string;
  heroLead: string;
  /** The disclosure row at the foot of the page that opens the about section and FAQ. */
  aboutToggle: string;
  /** The empty source pane (after New): what can be done, as one line. */
  emptyTitle: string;
  /** The empty state's button that reads the clipboard (shown where the browser allows it). */
  paste: string;
  pasteTitle: string;
}

/** Strings the running app writes into the page. */
export interface UiMessages {
  words: PluralForms;
  lines: PluralForms;
  /** {paper} */
  paperHint: string;

  engineIdle: string;
  engineWillLoad: string;
  engineCached: string;
  /** {pct} */
  engineDownloading: string;
  engineStarting: string;
  engineFonts: string;
  engineReady: string;
  engineFailed: string;
  networkFailed: string;
  reloadPage: string;
  chunkFailed: string;

  download: string;
  downloadGenerating: string;
  /** {pct} */
  downloadEngine: string;
  downloadStarting: string;
  downloadFonts: string;
  downloadTypesetting: string;

  /** The Print button; its progress reuses the download* strings. */
  print: string;
  /** Where the PDF could not be printed in place and was opened in a tab instead. */
  printInTab: string;
  /** The same, when the browser blocked that tab; offered with printOpen. */
  printBlocked: string;
  printOpen: string;

  /** {chars} */
  missingGlyphs: string;
  /** {detail} */
  pdfFailed: string;
  /** The same, as a notice's headline; the diagnostics go underneath. */
  pdfFailedShort: string;
  /** {detail} */
  initFailed: string;

  close: string;
  undo: string;
  cleared: string;
  /** {detected} */
  langAuto: string;
  /** Pasted text looked like an AI chat answer and was tidied; offered with undo. */
  aiCleaned: string;
  /** On a landing page, a returning visitor sees their draft rather than the page's example. */
  draftNotSample: string;
  loadExample: string;
  exampleLoaded: string;
  otherTab: string;
  loadLatest: string;
  syncedFromTab: string;
  syncedFromTabTitle: string;
  saved: string;
  /** {time} */
  savedTitle: string;
  restored: string;
  restoredTitle: string;
  quotaState: string;
  quotaNotice: string;
  storageOff: string;
  imageBudget: string;
  imageQuota: string;
  /** {name} */
  imageEmbedded: string;
  /** {name} */
  fileLoaded: string;
  /** {name} */
  unsupportedFile: string;
  /** The Paste button could not read the clipboard (permission refused). */
  pasteBlocked: string;
  /** {name}: the PDF was handed to the browser to save. */
  downloaded: string;

  diagramPending: string;
  /** {detail} */
  diagramError: string;
  /** {detail}: the formula and why it failed, shown in the preview and after a download. */
  mathError: string;
  /** {line}: 1-based line within the diagram's source. */
  diagramErrorAt: string;
  diagramErrorTitle: string;
  /** {name} */
  diagramUnknown: string;
  /** Badge on the last good render while the current source has an error. */
  diagramStale: string;
  diagramCopySvg: string;
  diagramCopied: string;
  diagramCopyFailed: string;
  diagramDownloadSvg: string;
  diagramDownloadPng: string;
  /** Accessible name of the per-diagram export toolbar. */
  diagramActions: string;
  /** {name} */
  remoteImage: string;
  /** {name} */
  missingImage: string;
  tocTitle: string;
  /** Label on the preview's page-break markers. */
  pageBreak: string;
  /** Next to a setting the document's front matter decides. */
  fromDocument: string;
  fromDocumentTitle: string;
  /** {line} */
  frontMatterSyntax: string;
  /** {line} {key} {value} */
  frontMatterValue: string;
  frontMatterUnclosed: string;
}

export interface AboutSection {
  heading: string;
  /** Paragraphs, trusted HTML. */
  body: string[];
}

export interface FaqEntry {
  question: string;
  /** Paragraphs, trusted HTML. The structured data gets the same text, tags stripped. */
  answer: string[];
}

export interface AboutMessages {
  heading: string;
  intro: string[];
  sections: AboutSection[];
  faqHeading: string;
  faq: FaqEntry[];
  /** Trusted HTML. */
  footer: string;
  languagesHeading: string;
}

export interface Messages {
  locale: LocaleMeta;
  meta: MetaMessages;
  page: PageMessages;
  about: AboutMessages;
  ui: UiMessages;
  /** The document shown on a first visit, written in this language. */
  sample: string;
}

/** What each page carries for the app at runtime: only its own locale. */
export interface RuntimeLocale {
  code: string;
  lang: string;
  ui: UiMessages;
  sample: string;
  /** Set on a landing page: its slug. `sample` is then that page's example. */
  landing?: string;
}
