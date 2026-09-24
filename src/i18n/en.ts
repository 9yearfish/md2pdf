import type { Messages } from './types';
import { BRAND } from './constants';

const en: Messages = {
  locale: {
    code: 'en',
    lang: 'en',
    hreflang: 'en',
    ogLocale: 'en_US',
    nativeName: 'English',
  },

  meta: {
    title: 'Convert Markdown to PDF Online · Free, Mermaid, No Upload',
    description:
      'Free Markdown to PDF converter that runs in your browser. Mermaid diagrams stay vector with selectable text. Nothing is uploaded, no signup, no watermark.',
    ogTitle: 'Markdown to PDF, in your browser · Mermaid diagrams as vectors',
    ogDescription:
      'Turn Markdown into a properly typeset PDF without uploading it. Mermaid diagrams stay vector, text stays searchable. Free, no signup, no watermark.',
    appDescription:
      'Converts Markdown to PDF locally in the browser, with Mermaid diagrams as vector graphics and correct typesetting for many scripts. Documents are never uploaded.',
    operatingSystem: 'Any modern browser with WebAssembly',
    featureList: [
      'Mermaid diagrams embedded as vector graphics with selectable text',
      'Typesetting for Latin, Chinese, Japanese, Korean, Cyrillic and Vietnamese text',
      'Syntax-highlighted code blocks',
      'Table of contents, page numbers and PDF bookmarks',
      'Live preview and automatic draft saving in the browser',
      'Runs locally; documents are never uploaded',
    ],
  },

  page: {
    privacyBadge: 'Runs locally · no upload · no signup · no watermark · works offline',
    privacyTitle:
      'Parsing, typesetting and PDF generation all happen in this tab. Your document never leaves your device.',
    newDoc: 'New',
    newDocTitle: 'New blank document (also clears the saved draft)',
    open: 'Open',
    openTitle: 'Open a .md file',
    layout: 'Layout',
    layoutTitle: 'Page layout',
    downloadTitle: 'Download PDF (⌘/Ctrl + S)',
    printTitle: 'Print the typeset PDF (⌘/Ctrl + P)',
    language: 'Language',
    paper: 'Paper',
    margin: 'Margins',
    fontSize: 'Font size',
    lineHeight: 'Line spacing',
    pageNumbers: 'Page numbers',
    toc: 'Contents',
    justify: 'Justify',
    docLanguage: 'Document language',
    template: 'Template',
    templateDefault: 'Default',
    templateReport: 'Report',
    templateAcademic: 'Academic',
    templateResume: 'Résumé',
    templateLetter: 'Letter',
    cover: 'Cover page',
    h1NewPage: 'New page per H1',
    header: 'Header',
    footer: 'Footer',
    bandTitle: 'Tokens: {title} {page} {pages} {date} {author}. Use | to split left | centre | right. Empty uses the template’s; none hides it.',
    editorHint: 'Drop a .md file or images here',
    editorLabel: 'Markdown source',
    editorPlaceholder: 'Type or paste Markdown here, or drop a .md file…',
    preview: 'Preview',
    dropHint: 'Drop to import',
    source: 'Source',
    proof: 'Proof',
    live: 'Live',
    viewSwitch: 'Show',
    fullscreen: 'Full-screen editing',
    heroTitle: 'Markdown to PDF',
    heroTagline: ': typeset in your browser.',
    heroLead: 'Paste or drop in Markdown and download a properly typeset PDF, with Mermaid diagrams kept as vectors. Your document never leaves the browser.',
    aboutToggle: `About ${BRAND}`,
    emptyTitle: 'Paste Markdown, drop a .md file, or open one',
    paste: 'Paste',
    pasteTitle: 'Paste Markdown from the clipboard',
  },

  about: {
    heading: 'Convert Markdown to PDF in your browser',
    intro: [
      'Paste or drop in a Markdown file, watch the preview update as you type, and press <strong>Download PDF</strong> to get a properly typeset file. The preview is instant; the PDF comes from a real typesetting engine, with page breaks, page numbers and an optional table of contents.',
      'No server is involved at any point. Parsing, diagram rendering, typesetting and PDF generation all run in this tab. There is no signup, no watermark and no usage limit. What you write is saved automatically in your own browser, so closing the tab loses nothing; it is never uploaded, and <strong>New</strong> or clearing this site’s data deletes it.',
    ],
    sections: [
      {
        heading: 'Mermaid diagrams as vectors, not screenshots',
        body: [
          '<code>```mermaid</code> blocks are rendered to SVG and embedded in the PDF as native vector graphics. They stay sharp at any zoom, the text inside them can be selected, copied and searched, and fills, strokes and line widths set with <code>classDef</code> come through intact. Many online converters don’t render Mermaid at all and print the source instead; some turn the whole page into an image, so nothing in it can be selected.',
        ],
      },
      {
        heading: 'Typesetting that respects your script',
        body: [
          'Text is embedded as real, selectable and searchable text, and fonts are subsetted automatically to keep files small. Besides Latin scripts, Chinese (Simplified and Traditional), Japanese, Korean, Cyrillic and Vietnamese are typeset with fonts designed for them, and mixed-language paragraphs break lines correctly. If a document uses rare characters beyond the compact font subset, the full font is loaded automatically instead of printing empty boxes.',
        ],
      },
      {
        heading: 'A real typesetting engine',
        body: [
          'Under the hood is Typst, a modern typesetting system compiled to WebAssembly so it runs in the browser. It handles pagination, widows and orphans, the table of contents, page numbers, footnotes and PDF bookmarks, and highlights code with its built-in highlighter. The engine is about 7 MB: it loads silently in the background while you write, is cached on your device, and works offline after that.',
        ],
      },
      {
        heading: 'Supported Markdown',
        body: [
          'Headings, paragraphs, bold, italic, strikethrough, inline code, links, images, ordered and unordered lists, nested lists, task lists, block quotes, tables with column alignment, definition lists, footnotes, horizontal rules, fenced code blocks with syntax highlighting, and Mermaid diagrams. Images can be dragged in or pasted from the clipboard. Math formulas in LaTeX syntax work too: inline <code>$...$</code>, display <code>$$...$$</code> and <code>```math</code> blocks.',
        ],
      },
    ],
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        question: 'Is my document uploaded to a server?',
        answer: [
          'No. Parsing, typesetting and PDF generation all happen in your browser. The site’s Content Security Policy forbids network requests to anywhere but the site itself, so “nothing is uploaded” is not a promise but a restriction your browser enforces.',
        ],
      },
      {
        question: 'Is my work still there after I close the page?',
        answer: [
          'Yes. Once you edit a document, the text, the layout settings and any images you dropped in are saved automatically in your browser’s local storage and restored on your next visit. The draft lives only in this browser on this device; it is never uploaded or synced. Press <strong>New</strong> or clear this site’s data to delete it.',
        ],
      },
      {
        question: 'Does it support Mermaid diagrams?',
        answer: [
          'Yes. Diagrams are embedded in the PDF as vector graphics, so they stay sharp when zoomed, the text in them remains selectable and searchable, and custom <code>classDef</code> colours are preserved.',
        ],
      },
      {
        question: 'Does it handle Chinese, Japanese, Korean or Cyrillic text?',
        answer: [
          'Yes. Chinese (Simplified and Traditional), Japanese, Korean, Cyrillic and Vietnamese are typeset with proper fonts and embedded as real text you can select, copy and search. Fonts for these scripts are only downloaded when a document actually uses them, and rare characters switch to the full font automatically rather than showing empty boxes.',
        ],
      },
      {
        question: 'Why does the preview look slightly different from the PDF?',
        answer: [
          'The preview is HTML rendered directly by your browser, so it can keep up with every keystroke. The PDF is typeset by the Typst engine, and page breaks, line breaks and spacing follow the downloaded file. Content, structure and styling are the same in both.',
        ],
      },
      {
        question: 'How long does the first PDF take?',
        answer: [
          'The page itself is only a few dozen kilobytes and opens instantly. The typesetting engine is about 7 MB and downloads quietly in the background after the page loads, usually before you have finished writing; the status bar at the bottom shows where it is. On data-saver mode or a slow connection it is not fetched in advance but when you first download. It is cached on your device, so later conversions work offline too.',
        ],
      },
      {
        question: 'Do I need to sign up or pay? Is there a watermark?',
        answer: [
          'None of these. The tool is a static web page with no accounts and no backend, and the PDF carries no watermark.',
        ],
      },
      {
        question: 'Does it support math formulas?',
        answer: [
          'Yes. Write <code>$...$</code> for inline formulas and <code>$$...$$</code> (or a <code>```math</code> block) for display equations, in LaTeX syntax. Typst typesets them natively, so the PDF contains real, searchable maths rather than images, and a formula with a mistake is flagged on its own without affecting the rest of the document.',
        ],
      },
      {
        question: 'Can I use HTML tags?',
        answer: [
          'Only <code>&lt;br&gt;</code>. The typesetting engine has no equivalent for HTML, so rather than produce something that only looks right, other tags are skipped with a notice.',
        ],
      },
    ],
    footer:
      `<strong>${BRAND}</strong> · Markdown to PDF in your browser, with Mermaid diagrams as vectors. Nothing is uploaded.`,
    languagesHeading: 'Languages',
  },

  ui: {
    words: { one: '{n} word', other: '{n} words' },
    lines: { one: '{n} line', other: '{n} lines' },
    paperHint: '{paper} · page breaks follow the downloaded PDF',

    engineIdle: 'PDF engine on standby',
    engineWillLoad: 'PDF engine will load in the background (about 7 MB)',
    engineCached: 'PDF engine cached',
    engineDownloading: 'Loading PDF engine in the background {pct}%',
    engineStarting: 'Starting PDF engine…',
    engineFonts: 'Loading fonts…',
    engineReady: 'PDF engine ready · works offline',
    engineSaveData: 'Data saver: the PDF engine loads when you download',
    engineFailed: 'PDF engine failed to load; it will retry on download',

    download: 'Download PDF',
    downloadGenerating: 'Generating…',
    downloadEngine: 'Loading engine {pct}%',
    downloadStarting: 'Starting engine…',
    downloadFonts: 'Loading fonts…',
    downloadTypesetting: 'Typesetting…',
    print: 'Print',
    printInTab: 'The PDF is open in a new tab. Print it from there.',
    printBlocked: 'Your browser blocked the new tab. Open the PDF and print it from there.',
    printOpen: 'Open PDF',

    missingGlyphs: 'These characters are not covered by the fonts and may not display: {chars}',
    pdfFailed: 'PDF generation failed: {detail}',
    pdfFailedShort: 'PDF generation failed',
    initFailed: 'The page failed to start: {detail}',

    close: 'Close',
    undo: 'Undo',
    cleared: 'Cleared; the saved draft was deleted',
    langAuto: 'Auto · {detected}',
    aiCleaned: 'Tidied the formatting of pasted AI output',
    draftNotSample: 'Showing your saved draft, not this page’s example',
    loadExample: 'Load example',
    exampleLoaded: 'Example loaded; your draft is kept until you edit',
    otherTab: 'This document was changed in another tab',
    loadLatest: 'Load latest',
    syncedFromTab: 'Synced from another tab',
    syncedFromTabTitle: 'Another tab saved a newer version; this tab now shows it',
    saved: 'Saved in this browser',
    savedTitle: 'Saved at {time} · the draft stays in this browser and is never uploaded',
    restored: 'Draft restored',
    restoredTitle: 'The draft stays in this browser and is never uploaded; press New to clear it',
    quotaState: 'Browser storage full; draft not saved',
    quotaNotice:
      'Your browser’s local storage is full, so the draft can’t be saved for now. The page still works; download the PDF or save the Markdown to keep your work.',
    storageOff: 'Local storage unavailable; the draft won’t be saved',
    imageBudget:
      'Images add up to more than 50 MB. The rest won’t be saved locally and will need to be dropped in again next time.',
    imageQuota:
      'Your browser’s local storage is full, so some images weren’t saved and will need to be dropped in again next time.',
    imageEmbedded: 'Embedded image {name}',
    fileLoaded: 'Loaded {name}',
    pasteBlocked: 'The browser didn’t allow reading the clipboard. Press ⌘/Ctrl + V in the editor instead.',
    /** {name} */
    downloaded: 'Saved {name}',
    unsupportedFile: 'Unsupported file type: {name}',

    diagramPending: 'Rendering diagram…',
    diagramError: 'The diagram could not be rendered: {detail}',
    mathError: 'The formula could not be typeset: {detail}',
    diagramErrorAt: 'Diagram error on line {line}',
    diagramErrorTitle: 'Diagram error',
    diagramUnknown: 'Unknown diagram type “{name}”',
    diagramStale: 'Showing the last version that rendered',
    diagramCopySvg: 'Copy SVG',
    diagramCopied: 'SVG copied to the clipboard',
    diagramCopyFailed: 'The clipboard is not available here; download the SVG instead',
    diagramDownloadSvg: 'Download SVG',
    diagramDownloadPng: 'Download PNG',
    diagramActions: 'Diagram export',
    remoteImage: 'Remote images are not loaded: {name}',
    missingImage: 'Image not found; drop the file onto the page: {name}',
    tocTitle: 'Contents',
    pageBreak: 'Page break',
    fromDocument: '(from document)',
    fromDocumentTitle: 'Set by the front matter at the top of the document; change it there',
    frontMatterSyntax: 'Front matter, line {line}: this line could not be read and was ignored.',
    frontMatterValue: 'Front matter, line {line}: “{value}” is not a valid {key} and was ignored.',
    frontMatterUnclosed: 'The front matter at the top has no closing --- line, so it is treated as ordinary text.',
  },

  sample: `# ${BRAND} sample document

This Markdown to PDF converter **runs entirely in your browser**. Your document is never uploaded to a server: the typesetting engine, the fonts and the conversion itself all live in this tab.

Edit on the left and the preview on the right follows as you type. Press **Download PDF** at the top right for the real file, typeset with page breaks, page numbers and bookmarks.

## Diagrams

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Parse with markdown-it]
  B --> C{Any diagrams?}
  C -- yes --> D[Render SVG with Mermaid]
  C -- no --> E[Generate Typst source]
  D --> E
  E --> F[(PDF)]
\`\`\`

Diagrams are embedded as **vectors**: they stay sharp when you zoom in, and the text inside them can be selected and searched.

## Text

*Italic*, **bold**, ***bold italic***, ~~strikethrough~~, \`inline code\` and [links](https://example.com) all work. Typography follows the language: “curly quotes”, en dashes in ranges like 1990–2024, and an em dash — like this one.

> A block quote sets a passage apart.
>
> It can span several paragraphs.

## Lists

1. An ordered list
2. The second item
   - A nested bullet list
   - Another item
3. The third item

- [x] A finished task
- [ ] Something still to do
- [ ] One more to-do

## Code

\`\`\`python
def fibonacci(n: int) -> int:
    """Highlighting comes from Typst's built-in syntect."""
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

## Tables

| Feature | Notes | Status |
|:--------|:-----:|-------:|
| Typesetting | Real, searchable text | Supported |
| Diagrams | Native vector graphics | Supported |
| Math | Native, searchable | Supported |

## Math

Formulas are typeset natively, so they stay sharp and searchable: Euler’s identity $e^{i\\pi} + 1 = 0$ fits in a sentence, and larger equations get a line of their own.

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Footnotes

The typesetting engine is Typst[^1], which handles pagination, the table of contents, page numbers and bookmarks.

[^1]: A modern typesetting system that runs in the browser once compiled to WebAssembly.

---

The last line.
`,
};

export default en;
