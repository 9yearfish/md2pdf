# Free MD2PDF

Markdown to PDF in the browser, including Mermaid diagrams, LaTeX maths and
correct typesetting for every major script. No server, no backend database, no
account: the document, the fonts and the typesetting engine all live in your
browser, and nothing is ever uploaded.

Left pane edits, right pane previews as you type. "Download PDF" typesets the
real file; "Print" sends that same file to the printer.

## How it works

```
Markdown -> markdown-it tokens
  |-> HTML, styled as the page               = preview (instant, every keystroke)
  |     formulas -> MathML via Temml (lazy)
  '-> ```mermaid blocks rendered to SVG
      formulas -> Typst maths via mitex (lazy)
      -> Typst source
      -> typst.ts (WASM) compiles to PDF     = the file you download
```

The preview is HTML so it never waits on the 7 MB engine. It uses the same
parser, the same page width, margins, font size and leading as the PDF, and
the same rendered diagrams (they are cached and shared), but pagination and
exact line breaks are the PDF's alone. That trade is deliberate: the preview is
for content, the PDF for layout.

The engine is built in the background once the page has loaded and typing
pauses, for the font tier the current text needs, so a download normally only
has to typeset (about 100 ms for a short document).

## What works

- **Every major script** embeds as real text: selectable, searchable,
  automatically subsetted into the PDF. Latin (including Vietnamese), Greek,
  Cyrillic, Simplified and Traditional Chinese, Japanese, Korean, Arabic,
  Hebrew, Devanagari and Thai each get a matching Noto face, loaded only when
  the document uses that script. See [Fonts and languages](#fonts-and-languages).
- **The right glyphs for the language.** Han characters come in Japanese,
  Simplified Chinese, Traditional Chinese or Korean forms depending on the
  document; hyphenation, line breaking, quote marks («…», „…“, 「…」),
  text direction and the table of contents title follow the language too.
- **Mermaid diagrams** land as native vector art, not bitmaps. Text inside a
  diagram stays selectable, and find-in-page highlights it like any other text.
  `classDef` colours, stroke widths and CSS survive intact. Labels are measured
  with the same faces the PDF draws them in, in every supported script. Every
  type Mermaid 12 has that belongs in a document renders in both the preview
  and the PDF: flowchart, sequence, class, state, ER, gantt, pie, journey,
  mindmap, timeline, gitGraph, quadrant, xychart, sankey, block, requirement,
  C4, kanban, architecture, packet, radar and treemap (one fixture each in
  `scripts/fixtures/mermaid/`). Architecture icons outside the built-in set
  are drawn as a "?" box; no icon pack is ever fetched.
- **Diagrams fit the page.** Each is scaled to the width of whatever holds it
  (the text block, a list item, a quote) and never enlarged; one taller than a
  page is scaled to fit a page. One that does not fit in what is left of the
  current page is shrunk to fit, by up to 30%, rather than leaving a gap
  behind it; beyond that it moves to the next page. See
  `src/convert/diagram-typst.ts`.
- **A broken diagram never breaks the document.** The preview and the PDF
  show a box with Mermaid's message, the line number and the offending line,
  in the page's language; everything else renders. While you type, the last
  version that rendered stays on screen (dimmed, with the error over it once
  you pause) instead of flickering to a placeholder.
- **Diagram export**: hover a diagram in the preview (or tab to it) to copy
  its SVG, or download it as SVG or as a 2x PNG. The SVG is the one the PDF
  embeds.
- **Maths** in LaTeX syntax: inline `$...$` (and `\(...\)`), display
  `$$...$$` (and `\[...\]`) and ```` ```math ```` blocks. Formulas are typeset
  as native Typst maths in Noto Sans Math, so they are real, searchable text
  in the PDF; the preview shows them as MathML. Currency such as "$5 and $10"
  stays text (the opening `$` must be followed by a non-space, the closing
  one preceded by a non-space and not followed by a digit), and `\$` is a
  dollar. A formula with a mistake is shown as its source with the error, in
  place, and the rest of the document is unaffected. Nothing maths-related
  is downloaded for a document without formulas.
- **Code blocks** are highlighted by Typst's built-in syntect, so no JavaScript
  highlighter ships at all. Non-Latin text in code falls back to the
  document's own face for that script.
- **Print** prints the typeset PDF, never the web page, so the paper matches
  the downloaded file on any machine (fonts travel with it). It builds or
  reuses the PDF exactly as Download does, loads it as a Blob URL into a
  hidden same-origin `<iframe>` and calls that frame's `print()`. Safari and
  every iOS browser, Firefox, Android and any browser without a built-in PDF
  viewer (`navigator.pdfViewerEnabled === false`) get the PDF in a new tab
  instead, with a notice to print from there: the tab is opened on the click
  itself so it is not taken for a pop-up, and if it is blocked anyway the
  notice offers "Open PDF". A frame that never loads (15 s) or whose
  `print()` throws falls back the same way. `window.print()` of the page is
  never used. Ctrl/⌘+P runs Print while the page has focus. The code is a
  separate chunk (`src/ui/print.ts`), fetched on the first print; the CSP
  allows it with `frame-src 'self' blob:`.
- **Preview**: live HTML with scroll sync to the editor; the browser's own
  find-in-page works on it. It uses the PDF's faces where practical.
- **Markdown**: headings, lists, nested lists, task lists, tables with
  alignment, block quotes, definition lists, footnotes, inline styling, links,
  images, horizontal rules.

## Pages, front matter and templates

**Page breaks.** Any of these, on a line of its own, starts a new page:

```
\pagebreak      \newpage      \clearpage      <!-- pagebreak -->
<div style="page-break-after: always"></div>   (also page-break-before, break-after: page)
```

Raw HTML is off in the parser, so the HTML spellings are recognised as text by
a block rule (`src/convert/breaks.ts`), never passed through. Inside code they
stay code; inside a list or quote they stay text (Typst cannot break a page
there). Breaks are weak: two in a row, or one before a heading that starts a
page anyway, never leave an empty page. The preview shows each as a dashed
"Page break" line. "New page per H1" in the panel (or `h1-newpage: true`)
starts every level-1 heading after the first on a new page.

**Front matter.** A YAML block at the very top sets things for this document
only, over the panel's settings; each control it decides shows the document's
value, is disabled and says "(from document)":

```yaml
---
title: Quarterly Review          # PDF title, cover, {title}
subtitle: Q3 2026
author: [Ada Lovelace, Alan Turing]   # or a single name; `- name: X` lists work too
date: 2026-09-30                 # ISO dates and `today` are written the document language's way
lang: ja-JP                      # any BCP 47 tag; normalised to a supported language
template: report                 # default | report | academic | resume | letter
cover: true
toc: true                        # toc-title: overrides the heading
papersize: a5                    # a4 | letter | a5 | b5
margin: 2.5cm                    # mm (bare numbers), cm, in or pt; also pandoc's geometry: margin=...
fontsize: 11pt
header: "{title} | {date}"
footer: "{page} / {pages}"       # false or none: no footer
h1-newpage: true                 # or pagebreak: h1
numbering: true                  # numbered headings, whatever the template says
abstract: |                      # Markdown; shown under the title
  ...
keywords: [typesetting, pdf]     # PDF metadata
---
```

It is read by a small parser (`src/layout/frontmatter.ts`: plain, quoted and
block scalars, flow and block lists, comments; nothing is evaluated). A line
it cannot read, or a value that makes no sense (`papersize: tabloid`), is
skipped with a notice naming the line; the rest still applies and the
document still renders. A block that opens but never closes is treated as
ordinary Markdown, with a notice. Unknown keys are ignored silently, so
front matter written for other tools does no harm.

**Headers and footers.** Tokens `{title}`, `{page}`, `{pages}` (the total),
`{date}` and `{author}`; `|` splits the text into left | centre | right (one
part is centred, two go left and right, `\|` is a literal bar). An empty
setting uses the template's; `none` removes it. By default the footer is
`{page} / {pages}`, centred, when page numbers are on. The title comes from
the front matter, else the first level-1 heading. All of it reaches Typst as
string literals joined to fixed expressions (`src/layout/typst.ts`), never as
markup.

**Cover.** "Cover page" (or `cover: true`) puts the title, subtitle, author and
date on a page of its own, without header or footer and not counted: the next
page is page 1, and `{pages}` excludes it. The table of contents follows it. If
there is no front matter title, the first level-1 heading becomes the title
and leaves the body. The date and the author list are formatted for the
document's language ("March 5, 2024" / "2024年3月5日", "A and B" / "A和B").

**Templates** (the panel's Template select, or `template:`). Picking one in the
panel applies its margins, sizes and cover setting, which stay editable.

| Template | Look |
| --- | --- |
| Default | The current look; a title block when the front matter has a title |
| Report | Cover with a navy band, numbered headings 1 / 1.1 / 1.1.1, ruled chapter headings, header with the title and date, footer with the author and page / pages, tinted table headers |
| Academic | Noto Serif, 2.5 cm margins, centred title block, abstract, numbered headings, indented paragraphs (two characters for Chinese and Japanese), booktabs tables, small footnotes with a short rule |
| Résumé | Tight one-page layout: the first heading is the name, the paragraph under it the contact line, small-caps section headings with a rule, `### Role, Company \| 2020 – 2024` puts the dates flush right |
| Letter | Serif; sender (`author`, `from`), recipient (`to`), date, `subject`, then the body, `closing` and `signature` |

Numbering starts at the shallowest heading level present, so a document whose
sections are `##` is numbered 1, 2, 3. The preview follows the template: the
same faces where loaded, the numbers, the cover, and the header and footer as
faint bands (`{page}` shows as 1 and `{pages}` as N; it is one continuous
sheet). Samples of every template in English, Chinese and Japanese come from
`npm run test:pages` (`scripts/pages-samples.mjs`).

The layout code is a separate chunk (`src/layout/`, 9.8 KB JS + 1.8 KB CSS
brotli), fetched right after first paint; the first page load carries only
the loader, the page-break rule and the panel controls.

## Fonts and languages

Every face is a Noto face (SIL OFL, official releases; see
`public/fonts/README.md`), so scripts share weights and proportions instead of
clashing. Fonts load in tiers, and which tiers a document needs is decided
before anything is downloaded, from run-length coverage maps of every face
(`coverage-scripts.bin`, 0.3 KB, and `coverage-cjk.bin`, 21 KB, themselves
fetched only when the text goes beyond Latin-1):

| Tier | Faces (regular + bold) | Raw | Brotli | Loaded when |
| --- | --- | ---: | ---: | --- |
| Latin | Noto Sans ×4 styles + DejaVu Sans Mono | 1.28 MB | 0.53 MB | always |
| Simplified Chinese subset | Noto Sans SC, GB2312 (6,763 hanzi) | 3.54 MB | 2.35 MB | Chinese text |
| Simplified Chinese full | Noto Sans SC, all 30,890 codepoints | 14.98 MB | 9.30 MB | characters outside GB2312 |
| Traditional Chinese subset | Noto Sans TC, Big5 level 1 (5,401 hanzi) + bopomofo | 2.91 MB | 2.00 MB | Traditional text |
| Traditional Chinese full | Noto Sans TC, 20,745 codepoints | 10.17 MB | 6.44 MB | characters outside Big5 level 1 |
| Japanese subset | Noto Sans JP, JIS X 0208 levels 1+2 (6,355 kanji) + kana + the 2010 Jōyō additions | 3.99 MB | 2.51 MB | Japanese text |
| Japanese full | Noto Sans JP, 16,732 codepoints | 8.32 MB | 5.18 MB | characters outside the subset |
| Korean subset | Noto Sans KR, KS X 1001's 2,350 Hangul + jamo + symbols | 1.47 MB | 0.72 MB | Hangul |
| Korean full | Noto Sans KR, all 11,172 syllables + 8,138 Hanja | 8.50 MB | 4.46 MB | rarer syllables or any Hanja |
| Arabic | Noto Sans Arabic | 0.33 MB | 0.14 MB | Arabic script |
| Hebrew | Noto Sans Hebrew | 0.11 MB | 0.05 MB | Hebrew |
| Devanagari | Noto Sans Devanagari | 0.42 MB | 0.15 MB | Devanagari |
| Thai | Noto Sans Thai | 0.12 MB | 0.06 MB | Thai |
| Serif (Academic, Letter) | Noto Serif ×4 styles | 1.21 MB | 0.48 MB | a serif template |
| Serif Simplified Chinese | Noto Serif SC regular, GB2312 | 2.53 MB | 1.51 MB | serif template + Chinese |
| Serif Traditional Chinese | Noto Serif TC regular, Big5 level 1 | 2.11 MB | 1.31 MB | serif template + Traditional |
| Serif Japanese | Noto Serif JP regular, JIS X 0208 | 2.85 MB | 1.62 MB | serif template + Japanese |
| Serif Korean | Noto Serif KR regular, KS X 1001 Hangul | 1.91 MB | 0.64 MB | serif template + Hangul |

**Serif CJK.** A serif template sets CJK text in Noto Serif CJK, but only the
regular weight is bundled, subset to the same character sets as the sans
subsets. Bold CJK (headings, `**strong**`, table headers) stays in the sans
face, which is the convention anyway (黑体 / ゴシック for emphasis in 宋体 /
明朝 text), and only its bold file is fetched. So a serif Chinese document
downloads 1.51 + 1.19 MB instead of the sans tier's 2.35 MB, a full
serif tier with bold would have been about 3 MB, and a serif full face (another
10 MB or so per region) is not worth it: characters beyond the subset fall back
to the sans face, never to tofu. The Default template never fetches a serif
file.

A full tier replaces its subset rather than adding to it, and a document only
ever pulls the tiers of the scripts it contains: a Japanese document with a
Korean word loads the Japanese and Korean subsets and nothing else. Characters
no face covers are reported to the user by name, never silently drawn as tofu.

**Language.** `DocumentOptions.lang` is `auto` by default: the language is
detected from the prose (code and URLs are ignored). Script decides first
(a Han character counts about as much as a word); Cyrillic is Russian unless
Ukrainian letters appear; Latin text is Vietnamese if its tone marks are
frequent, otherwise German, French, Spanish, Portuguese, Italian, Dutch or
Polish when their function words clearly win, else English. The choice sets
Typst's `lang`/`region` (hyphenation, line breaking, CJK punctuation, quotes,
direction) and the table of contents title (`DocumentOptions.tocTitle`
overrides it). `SUPPORTED_LANGUAGES` in `src/convert/lang.ts` lists every
value with its native name, for a language picker.

**Han glyph forms** follow the content, even in an otherwise English document:
mostly Hangul (and at most half as much kana) means Korean forms; kana making
up a tenth or more of the CJK text means Japanese; more characters from the
traditional-only than from the simplified-only common set (Big5 level 1 minus
GB2312 level 1, and the reverse) means Traditional Chinese; anything else is
Simplified Chinese. That face then comes first in every font list, in the PDF
and in the preview, and an explicit `lang` of `ja`, `ko`, `zh-Hant` or
`zh-Hans` overrides it.

**Typesetting per language**, as checked against rendered output:

- Hyphenation follows `lang` when justification is on (de, fr, ru, es, pt,
  en, it, nl, pl, uk and el all have patterns); Vietnamese needs none.
- Chinese and Japanese: full-width quotes, dashes and ellipses come from the
  CJK face (`covers: "latin-in-cjk"`), punctuation is compressed, closing
  punctuation never starts a line, and Typst's CJK/Latin spacing puts a
  quarter-em between Han and Latin. Japanese and Taiwanese documents turn
  straight quotes into 「」/『』, Simplified Chinese into “”.
- Straight quotes become the language's own everywhere else: “…” in English,
  „…“ in German, « … » in French, «…» in Russian, Spanish and Italian.
- Arabic and Hebrew documents are laid out right to left (block quotes,
  tables, list markers), with code kept left to right.
- Thai breaks between words by dictionary; it is not justified, since there
  are no spaces between words to stretch.

**The preview** uses the same faces: Latin and the small scripts as WOFF2 split
by `unicode-range` (`src/fonts.css`), so an English page fetches only the
53 KB Latin core; the CJK faces are registered from JavaScript with the very
OTF files the PDF uses (`src/preview/fonts.ts`), a second after load and only
on connections the engine would warm up on anyway, so previewing and then
downloading fetches them once. Before that, and in data-saver mode, the
preview uses the system's CJK fonts in the same regional order.

**Maths** adds one face, Noto Sans Math (0.66 MB, 0.29 MB brotli, unsubset
because Typst needs its MATH table), fetched only when a document with formulas
is downloaded as a PDF or its formulas are shown in the preview. The
background warm-up never fetches it.

Regenerate the bundled binaries with `npm run fonts` (see
`scripts/prepare_fonts.py`: pinned release URLs and SHA-256 sums, cached in
`.font-cache/`); they are committed so that neither the build nor the deploy
needs network access or Python. The largest file is 7.2 MiB, well under
Cloudflare Pages' 25 MiB limit.

## Privacy

Documents never leave the browser: parsing, typesetting and PDF generation all
run in the tab, and no code in the app sends document text, images or the PDF
anywhere.

The site does use **Cloudflare Web Analytics**, which Cloudflare Pages injects
into every page: a script from `https://static.cloudflareinsights.com` that
sends an anonymous beacon to `https://cloudflareinsights.com`. It sets no
cookies and records page visits (URL, referrer, timing, country); it never sees
document content. The Content-Security-Policy in `public/_headers` allows
exactly those two origins beyond `'self'` (`script-src` and `connect-src`
respectively) and nothing else, so the browser still blocks every other
destination. The site copy says the same: the page connects only to the site
itself and to Cloudflare's cookie-free visit counter.

To remove the analytics, turn off Web Analytics for the Pages project in the
Cloudflare dashboard (otherwise Cloudflare keeps injecting the script, and the
CSP would then block it and report violations), and remove
`https://static.cloudflareinsights.com` from `script-src` and
`https://cloudflareinsights.com` from `connect-src` in `public/_headers`. The
CSP is then back to `connect-src 'self' blob: data:`, and the copy's mention of
the visit counter in `src/i18n/` can go too.

`frame-src 'self' blob:` exists only for Print's hidden PDF frame (without
it, `default-src 'self'` blocks the Blob URL). `X-Frame-Options: DENY` and
`frame-ancestors 'none'` still stop other sites from framing the app; they do
not affect that frame, since a Blob URL carries no response headers
(`scripts/print.mjs` checks that no violation is reported).

Drafts are kept, but only in the visitor's own browser: once the document has
been edited (typed in, loaded from a file, or its layout changed), the text and
layout options are saved to `localStorage` under `md2pdf:draft:v1` and dropped
or pasted images to IndexedDB (`md2pdf` / `images`, capped at 50 MB), then
restored on the next visit. Someone who only looks at the sample leaves nothing
behind. Nothing is ever uploaded or synced. "New" clears the draft and its
images, as does clearing the site's data in the browser. See `src/ui/draft.ts`.

The service worker caches only the application's own immutable assets; it never
caches any part of a document.

## What a visit actually costs

Opening the page downloads **82 KB** (index.html, the app's JS and CSS, and the
language-redirect script, at brotli 11: about 8.5, 66, 7.7 and 0.5 KB). Everything else arrives only when it is
needed:

| Payload | Size (brotli) | When |
| --- | --- | --- |
| Page, styles, app, Markdown parser | 82 KB | on load |
| Editor (CodeMirror) | 171 KB | after first paint, in the background |
| Layout (front matter, templates, headers and footers) | 12 KB | right after first paint |
| Mermaid | ~180 KB+ | only if a document contains a diagram |
| Maths preview (Temml + CSS) | 43 KB | only if a document contains a formula, once one scrolls near view |
| Maths for the PDF (mitex converter + Typst helpers) | 81 KB | only when a document with formulas is downloaded |
| Maths font (Noto Sans Math) | 294 KB | only if a document contains a formula (shared by preview and PDF) |
| Typesetting engine | ~6.9 MB | in the background after load, or on the first download |
| Latin fonts for the PDF | 0.53 MB | with the engine |
| CJK fonts | 0.7-2.5 MB per script (subset) | only if a document contains that script; see [Fonts](#fonts-and-languages) |
| Preview fonts | 53-220 KB WOFF2 | the Latin core on first paint, other ranges and scripts only when on screen |

The sample document shown on a first visit has formulas, so a visitor who
scrolls to them loads the maths preview (and, through it, the maths font). The
background warm-up never fetches the maths font: the PDF compiler adds it only
when a document with formulas is actually downloaded. A visitor's own document
without maths loads none of it (`scripts/math.mjs` checks the network log).

The engine is the one big item and there is no way around it: it is a real
typesetting system compiled to WebAssembly. `wasm-opt -Oz` was tried and makes
it worse — 27.0 MB shrinks to 25.4 MB uncompressed but compresses to 6.91 MB
instead of 6.88 MB. So it is handled rather than shrunk: nothing waits on it,
because the preview does not need it; it starts downloading at low priority as
soon as the page has painted, whatever the connection or data-saver setting
reports, in two parts fetched in parallel (Cloudflare Pages caps files at 25
MiB; see `splitEngine` in vite.config.ts), with the fonts fetched alongside;
the action row shows a progress line and the status bar a percentage; and it
is kept in Cache Storage so it never happens twice. Over Cloudflare's
on-the-fly brotli it is about 9.8 MB on the wire.

## Known constraints
- Raw HTML in Markdown is not supported beyond `<br>` and the page-break
  markers; Typst has no equivalent.
- Only a cover page has no header and footer; there is no separate "different
  first page" setting.
- Italic CJK, Arabic, Hebrew, Devanagari and Thai render upright: those faces
  have no italic and Typst does not synthesise one.
- Remote images are not fetched. Drag a file onto the page or paste it instead.
  A dropped image matches a reference by its exact path or, failing that, by
  its file name alone, so `docs/img/logo.png` in a README finds a dropped
  `logo.png` (`findImage` in `src/convert/images.ts`). An unresolved image is
  a red "[image unavailable: …]" note in the PDF, which is what a README's
  shields.io badges become.
- Maths covers what mitex (PDF) and Temml (preview) understand: the usual
  LaTeX maths, including fractions, limits, matrices, `cases`, `align` and
  `aligned`, `\text`, maths alphabets, accents, `\left`/`\right` and
  `\operatorname`. There are no macros (`\newcommand` is ignored), no
  equation numbers or `\label`/`\ref`, and text-mode LaTeX (`\section`,
  `\cite`...) inside a formula is rejected. The two converters are separate,
  so an edge case can render in one and not the other.
- Scripts without a bundled face (Bengali, Tamil and the other Indic scripts
  besides Devanagari, Georgian, Armenian, Ethiopic, Khmer, Myanmar, emoji...)
  are typeset with a placeholder box, and the user is told exactly which
  characters are affected. Adding one is a row in `SCRIPTS` in
  `prepare_fonts.py` and one in `SCRIPT_FAMILIES` in `src/typst/fonts.ts`
  (plus a `unicode-range` face in `src/fonts.css`); most Noto script faces are
  50-200 KB. Khmer, Lao and Myanmar would also need Typst to know their word
  boundaries.
- Copying Arabic text out of the PDF, and some Thai clusters, doubles letters
  (مستند comes out as مستتنند): Typst 0.14 maps each glyph of a multi-glyph
  cluster to the whole cluster, and Noto draws Arabic dots as separate glyphs.
  The page itself is right. Naskh has the same issue.
- An exported PNG (and an exported SVG opened elsewhere) draws its labels in
  the system's sans-serif face: web fonts do not reach an SVG drawn as an
  image. The PDF and the preview use the real faces.
- In diagrams, a label that contains CJK is drawn entirely in the CJK face,
  its Latin letters included (the SVG renderer picks one face per label; see
  `src/diagram/mermaid.ts`). The preview measures it the same way, so boxes fit.
- Mono code in CJK falls back to the proportional CJK face, so CJK code does
  not line up in columns. A monospaced CJK face would add megabytes.
- Korean Hanja are only in the full Korean face, so a Korean document with any
  Hanja downloads 4.5 MB instead of 0.7 MB.

## Pasting AI answers

Text pasted from an AI chat (ChatGPT, Claude, Gemini, DeepSeek, Copilot,
Perplexity, Kimi) is tidied into plain Markdown. The rules come from real
pasted text (sources per fixture in `scripts/fixtures/ai/sources.json`):

- `\(…\)` and `\[…\]` (ChatGPT's and DeepSeek's copy button) become `$…$`
  and `$$…$$`, only where the content is recognisably TeX.
- Citation markers go: ChatGPT's private-use `U+E200 cite U+E202 turn0search1
  U+E201` markers and their bare `citeturn0search1` remains,
  `:contentReference[oaicite:0]{index=0}`, `[oai_citation:…]`, `【4†source】`;
  Gemini's `[cite: 17]`, `[cite_start]`, `[span_2](start_span)`; DeepSeek's
  `[citation:3]`; Perplexity's `[web:1]`; `utm_source=chatgpt.com` in links.
- Perplexity `[1]` markers over a "Citations:" list of URLs, and Copilot's
  `¹²` over "Source: Conversation with Copilot", become real footnotes.
- Code-block chrome from select-and-copy: `bashCopy code…`, ```` ```bashCopyEdit ````,
  `bashCopyDownload`, "python / Copy / Edit" or "复制编辑" lines, a bare "Bash"
  label above a fence, Kimi's "…flag:bash". The label moves into the fence;
  where there is no fence, the captions are dropped and no fence is invented.
- Whole chrome lines: "Thought for 10s", "已深度思考（用时 12 秒）", "Use code
  with caution.", "Skip to content", "Updated saved memory", the "can make
  mistakes" disclaimers.
- Zero-width spaces, word joiners, BOMs and soft hyphens go; a zero-width
  joiner stays inside emoji; U+2011 becomes `-`; no-break spaces become spaces
  except before French punctuation, inside « » and between digits.
- `•`/`◦` bullets and full-width-space indentation become Markdown lists.

Fenced and indented code and inline code spans are never touched (only a
fence line itself is repaired). The rules only run when the paste carries one
of these artifacts (`signals()` in `src/convert/ai-paste.ts`); bare `[1]`,
bullets, `---` or no-break spaces alone are not signals, so anything else is
left byte for byte. A cleaned paste is one more undoable edit, and a notice
offers Undo, which puts back exactly what was pasted. The cleaner is a
separate chunk (about 4 KB brotli), fetched on the first paste.

Not handled on purpose: Copilot's flattened citation chips ("Astro
Documentation / +2"), DeepSeek's badge digits glued to words, Qwen's
line-number gutters, and converter escapes like `\*\*` — each is too easy to
confuse with real text.

`scripts/ai-paste.mjs` runs the cleaner over `scripts/fixtures/ai/`
(`<name>.in.md` against `<name>.out.md`; a fixture without an `.out.md` must
come back unchanged; every result must be stable under a second pass), then
pastes into the real editor. Add a fixture for any new artifact before
changing a rule, and one for Markdown it must not touch.

## Languages and SEO

The site is built in nine languages, each a separate static page prerendered at
build time, so crawlers see everything without running JavaScript:

| Path | Language | hreflang |
| --- | --- | --- |
| `/` | English (also `x-default`) | `en` |
| `/zh/` | Simplified Chinese | `zh` |
| `/ja/` | Japanese | `ja` |
| `/ko/` | Korean | `ko` |
| `/es/` | Spanish | `es` |
| `/pt/` | Brazilian Portuguese | `pt` |
| `/fr/` | French | `fr` |
| `/de/` | German | `de` |
| `/ru/` | Russian | `ru` |

Each page has its own `<html lang>`, title, meta description, Open Graph tags
(`og:locale` plus `og:locale:alternate` for the others), a self-referencing
canonical, `<link rel="alternate" hreflang>` for every locale plus
`x-default`, the descriptive section and FAQ, and `WebApplication` and
`FAQPage` structured data with `inLanguage`. `sitemap.xml` lists every locale
with the same `xhtml:link` alternates. Titles and descriptions are written
around what people in each market search for ("Markdown PDF 変換",
"Markdown in PDF umwandeln", "convertir Markdown a PDF", ...), not translated.

`VITE_SITE_URL` in `.env` sets the canonical origin and is baked into every
canonical, alternate and Open Graph link, `robots.txt` and `sitemap.xml`.
**Change it to the real domain before deploying**; a canonical pointing at the
wrong origin is worse than none.

### How the pages are built

`index.html` is the single template: markup with `{{page.key}}` / `{{ui.key}}`
placeholders and a few `<!--i18n:...-->` blocks. The plugin in
`vite.config.ts` registers one Rollup input per locale (`zh/index.html` and so
on are virtual; nothing is generated into the source tree) and renders each
from the template and its dictionary with `src/i18n/pages.ts`. The build fails
on an unknown placeholder or a dictionary whose keys, placeholders or FAQ
length drift from English.

All pages share the same JS and CSS. The strings the app needs at runtime and
the sample document are inlined into each page as a JSON data block
(`<script type="application/json">`, which the CSP allows because it is never
executed) and read by `src/i18n/runtime.ts`, so a page ships only its own
language and needs no extra request.

The about section and FAQ (and, on landing pages, the steps and the list of
guides) sit at the foot of every page inside one native `<details
class="about-more">`, collapsed to a single "About Free MD2PDF" row. That is
collapsed, not hidden: every word is in the HTML, nothing is `display: none`,
`sr-only` or off-screen, the FAQ entries are their own `<details>` inside it,
and a link to anything inside (`#step-2`) opens it. The footer (specimen
line, guide links, languages) stays outside and always visible, and the
landing page's `<h1>` and lead stay in the intro above the tool. The JSON-LD
is unchanged.

The tool has one action row on the panes' own grid: counts, Layout and the
file actions (New, Open) over the source; Print and Download over the proof,
ending flush with the sheet's edge, with full screen last. Download is the
only solid (primary) button. In full screen the row follows the divider
(`--source-width`). Where the source half is too narrow for every label
(French at 1440 px, anything under 1180 px), New and Open drop to icons. On a
desktop (1024 px and wider, 600 px and taller) the tool fills whatever the
first screen leaves under the header and the one-line intro, so both panes,
the row and the whole sheet are in view on arrival. Under 760 px the row is
one line (counts, then New, Open and Layout as titled icons) and Print and
Download move to a bar fixed along the bottom edge (safe-area aware; the page
is padded so it never covers the end), Download taking the width. Opening a
file or pasting a document on a phone switches to the proof. After New, the
empty source says what to do, with Open and (where the browser lets a page
read the clipboard on a click) Paste.

Every page has exactly one `<h1>`: the intro's title (the home page's
"Markdown to PDF: typeset in your browser.", or a landing page's own). The
brand in the header is a link home, not a heading, and there is no
screen-reader-only text.

### Share images and AI crawlers

Every page has an `og:image` in its own language (`public/og/<code>[-<slug>].png`,
1200 x 630, grey, with the page's `<h1>`, the brand and a proof sheet with
crop marks), with `og:image:width`/`height`/`alt` and a
`summary_large_image` Twitter card. They are rendered from the dictionaries
with the bundled Noto faces (CJK included) by `npm run og` and committed; run
it after changing a heading. The build fails if a page's image is missing.

`robots.txt` allows everyone and names the AI and search crawlers (GPTBot,
OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User,
PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Bingbot, Googlebot).
`llms.txt` (llmstxt.org) describes the product, its features, the supported
syntax and the privacy model and links every page in every language;
`llms-full.txt` carries the English pages' text, steps and FAQ. Both are
generated from the dictionaries at build time, like `sitemap.xml`
(`llmsTxt`, `llmsFullTxt` and `robotsTxt` in `src/i18n/pages.ts`).

### Landing pages

Besides each locale's home page, the site builds feature landing pages for
specific searches ("ChatGPT to PDF", "Mermaid to PDF", a Japanese page about
文字化け and Chinese glyph forms, ...), chosen from autocomplete and competitor
research in each market: DeepSeek only where people search for it (en, zh,
ru, es, pt), Claude in en, zh, ja, ko, de, a Doubao page and script-font pages
for zh, ja and ko only. README to PDF exists in en, zh, es and pt (the only
markets whose autocomplete has native phrasings such as "readme转pdf",
"convertir readme a pdf", "converter readme para pdf"); CLAUDE.md to PDF and
Print Markdown are English only, because the native "print Markdown" terms
are close to zero in Trends (ja ~1:1000 against "markdown pdf", de, fr, ru,
pt-BR, zh-TW 0) and the CLAUDE.md searches are English everywhere. Each is the
same app on the same template, at `/<slug>/` for English and `/<code>/<slug>/`
for the others (slugs are English and identical across locales), with its own
title, meta description, its own `<h1>` and lead in the intro above the tool,
an about section with steps and a focused FAQ, and its own sample document in
the editor. Structured data
is `WebApplication` + `FAQPage`, plus `HowTo` where the page has steps.

A page exists only in the locales that list it. hreflang (in the page and in
the sitemap) names exactly the versions that exist, with `x-default` pointing
at the English one only when there is an English one; a page in a single
locale has just its self-reference. The footer's language links and the
switcher go to the same page in the other locale where it exists, otherwise to
that locale's home page. Every page links to its locale's landing pages from
the footer, and the home page also lists them in its about section.

A returning visitor's draft still wins over a landing page's sample: the page
opens with the draft and a notice offers to load the example instead (with
Undo). Loading it does not overwrite the saved draft until the visitor edits.
Only `/` runs the language redirect; landing pages never redirect.

#### Adding a landing page

1. Add `{ slug, locales }` to `LANDINGS` in `src/i18n/landing.ts`. `locales`
   is every locale code, or only the markets where the page makes sense.
2. Write the copy (`LandingCopy`: title, description, h1, lead, link text,
   intro, sections, optional steps, FAQ, sample) under `pages[slug]` in
   `src/i18n/landing/<code>.ts` for each of those locales. The
   `LandingDictionary<code>` type makes a missing page a type error, and
   `validateLandings()` fails the build on missing, extra or empty copy, a
   duplicate title, or a Mermaid page without a diagram.
3. Add the page to the table at the top of `scripts/landing.mjs`.

Paths, canonical, hreflang, sitemap, links and the switcher follow. Write the
copy around what people in that market actually search for, not a
translation of the English page, and keep claims to what the app does today.

### Automatic language selection

`/` loads a tiny synchronous script in `<head>` (external, fingerprinted under
`/assets/`, because the CSP forbids inline scripts). On a first visit it looks
at `navigator.languages` and `location.replace()`s to the first supported
match (`zh-TW`, `zh-HK` go to `/zh/` for now; any `pt-*` to `/pt/`). It does
nothing when:

- the visitor has a stored preference (`localStorage["md2pdf:lang"]`, set by
  the language switcher or the language links in the footer);
- the URL has `?lang=` (the switcher uses `/?lang=en` when storage is
  unavailable, so choosing English still sticks);
- the first matching language is English, or none matches. Crawlers normally
  send `en-US` and so index `/` as English.

Locale paths never redirect. Switching language is a plain navigation; the
draft lives in same-origin storage and comes along.

### Adding a locale

1. Copy `src/i18n/en.ts` to `src/i18n/<code>.ts` and translate it, including
   the sample document. The `Messages` type flags anything missing.
2. Import it in `src/i18n/index.ts` and add it to `LOCALES`.
3. Add it to the table in `scripts/i18n.mjs`, which checks every page.

The path, hreflang, sitemap entry, switcher option, footer link and redirect
target all follow from the list.

## Development

```
npm install
npm run dev        # dev server
npm run typecheck
npm run build
npm run preview    # serves dist/ with the production _headers applied (port 5200)
npm test           # end-to-end, against whatever `preview` is serving
npm run test:scripts  # one PDF per script, inspected with python3 (PyMuPDF, pypdf or poppler)
node scripts/mermaid.mjs [type ...]  # part of npm test: every diagram type, errors, export
npm run test:pages    # the pagination tests plus every template in en/zh/ja, as PDF and PNG ($PAGES_OUT, $PAGES_SAMPLES)
npm run og            # re-render the share images and app icons into public/ (Playwright + Pillow)
```

`npm run preview` exists because Vite's own preview server ignores `_headers`,
which would let a broken Content-Security-Policy reach production unnoticed.
`npm test` drives the real app in headless Chromium: it checks that the preview
paints without the engine, that the engine warms in the background, verifies
the downloaded bytes, confirms each font tier downloads exactly the faces
it should, and (`scripts/i18n.mjs`) checks every locale page's raw HTML, the
redirect, the stored preference, that the switcher keeps the draft, and that
no page is left with another language's strings; `scripts/mermaid.mjs`
renders every diagram type in the preview and in one PDF and checks there is
no raw-source fallback, no `<foreignObject>`, no raster image, nothing past
the page's edge and that every label is extractable text, then the error box
(both sides, localised, mid-edit), the export buttons and that Mermaid and
ELK are not fetched before they are needed. `npm run test:scripts`
typesets a document per script (en, de, fr, ru, vi, el, zh-Hans, zh-Hant, ja,
ko, ar, he, th, hi, a mixed one and an explicit `lang` override) and checks the
extracted text, the embedded font names, that nothing is drawn as `.notdef`,
that diagram labels are text, that German and Russian hyphenate and that no
line starts with closing CJK punctuation. It writes every PDF, its pages as PNG
and a preview screenshot to `$SCRIPTS_OUT` for looking at.

Within `npm test`, `scripts/landing.mjs` does for every landing page what
`scripts/i18n.mjs` does for the home pages (titles, canonical, hreflang sets
including single-locale pages, sitemap, links, no other locale's strings, each
page no heavier than its home page, its sample loading, the draft rule, the
redirect staying on `/`, and what the task pages promise: Print on
/print-markdown/, a dropped `logo.png` filling `docs/img/logo.png` on
/readme-to-pdf/); `scripts/ai-paste.mjs` runs the paste fixtures; and
`scripts/print.mjs` clicks Print and checks that a same-origin Blob iframe
holding the PDF is created and its `print()` called (stubbed, so no dialog
opens), that Ctrl+P does the same, that the page's own `print()` is never
called, that the button shows progress, that the print chunk is not in the
first load, that there is no CSP violation, and that a Firefox user agent
and a browser without a PDF viewer get the PDF in a new tab instead. It uses
Playwright's full Chromium (`channel: 'chromium'`), since the headless shell
has no PDF viewer. Last, `scripts/ux.mjs` checks the look and the files
crawlers read: every key element's computed colours are neutral grey in both
themes (an error notice is the one red), focus is a 2px ink ring, Mermaid
draws in greys, the phone's bottom bar (fixed, thumb-sized, never covering
the page), the empty state in two languages and the Paste button, that
`prefers-reduced-motion: reduce` leaves no animation running, every page's
share image and single `<h1>`, `robots.txt`, `llms.txt` and each page's
Early Hints and cache headers.

## Design

Grey, like print: every colour is a neutral between paper-white and
ink-black, in a light and a dark theme, and the proof sheet stays white in
both because the PDF is. State is carried by shape and tone, never hue: the
engine's dot is hollow, pulsing or solid; news is a solid ink notice, a
warning an outlined slip with a heavy ink edge and a triangle. The one
exception is an error, which is a restrained red. Links are ink and
underlined; focus is a 2px ink outline with an offset. Mermaid uses its
`neutral` theme (a diagram's own `classDef` colours still apply) and the
default template's links and rules are ink and grey in the preview and the
PDF alike; the other templates keep their own colours.

Motion is CSS (and the Web Animations API for one-offs), transform and
opacity only: the intro, the action row and the panes settle in on arrival
from states that are already legible (at most half a second), the crop marks
draw in, the Live marker pulses when the proof is re-set, a print head sweeps
the sheet while a PDF is made and the sheet feeds up a few pixels when it is
done, buttons fill with ink from the left, disclosures open to their height
(`::details-content` and `interpolate-size`, where supported) and notices
slide in and out. The about section rises into view with a scroll-driven
animation where the browser has them. None of it runs under
`prefers-reduced-motion: reduce`, and none of it shifts layout. No animation
library is loaded.

## Deployment

Cloudflare Pages, as a plain static site. Build command `npm run build`, output
directory `dist`. No Workers, no KV, no R2, no D1. `public/_headers` carries the
caching and security headers.

Speed for visitors everywhere comes from three things:

- **103 Early Hints.** The build (`earlyHints` in `vite.config.ts`) appends one
  rule per page to `dist/_headers` with `Link` headers for exactly what that
  page loads first: its stylesheet (`rel=preload; as=style`) and its entry
  module (`rel=modulepreload`), plus the language-redirect script on `/`.
  Pages sends those as a 103 response from the edge while it is still
  fetching the HTML, so they are on the wire before the HTML arrives. Fonts,
  the engine and Mermaid are never hinted. Pages allows 100 rules; the build
  fails before exceeding that.
- **HTML at the edge, revalidated.** The same rules give each page
  `Cache-Control: public, max-age=0, must-revalidate`: the edge serves its
  cached copy, the browser revalidates every time, a deploy is picked up at
  once. Fingerprinted `/assets/*` and `/fonts/*` are immutable for a year;
  share images a day; `robots.txt`, `sitemap.xml` and `llms*.txt` an hour.
- **A small critical path.** The stylesheet stays a separate file (7.7 KB
  brotli) rather than being inlined: it is early-hinted, cached once for all
  55 pages, and inlining it would add those bytes to every navigation. The
  service worker registers after `load`, does nothing at install, keeps pages
  network-first and uses navigation preload, so a returning visit's HTML is
  not held up by it.

After the first deploy, check that the engine is served compressed:

```
curl -sI -H 'Accept-Encoding: br' https://<your-domain>/assets/*.wasm | grep -i content-encoding
```

It should report `br`. Without compression that request is 27 MB rather than
7 MB, which is the difference between a slow first conversion and an unusable
one.

## Gotchas worth remembering

These cost real debugging time and are easy to hit again:

- The product is called **Free MD2PDF** (`BRAND` in `src/i18n/constants.ts`,
  the one place its written form lives; the domain is freemd2pdf.com), but internal identifiers keep `md2pdf`: the
  `md2pdf:draft:v1`, `md2pdf:lang` and `md2pdf:fullscreen` storage keys, the
  `md2pdf` IndexedDB database, the Cache Storage and service-worker cache
  names, CSS classes, module names and the `md-*` Typst helpers. Renaming any
  of them would silently drop visitors' drafts and caches.

- `scripts/serve-dist.mjs` reads `_headers` once, at start-up. After changing
  the CSP (or any header), restart `npm run preview`, or the tests run
  against the old policy. Every build changes the fingerprinted names in the
  generated Early Hints, so restart it after every build too, or the stale
  `Link` headers point at files that no longer exist.

- Mermaid's `htmlLabels: false` only takes effect at the **top level** of the
  config. Nested under `flowchart` it is silently ignored and labels come out as
  `foreignObject`, which renders as blank space in a PDF.
- Typst cannot compare a length with a ratio, so `calc.min(300pt, 100%)` is an
  error rather than a safeguard. Image widths are clamped in JavaScript against
  the real text width instead.
- Do not put `mermaid` in `manualChunks`. Rollup then pulls the dependencies
  it shares with markdown-it, and Vite's preload helper, into that chunk, and
  the whole of Mermaid loads with the first page.
- A class that sets `display` outranks the user-agent rule for `[hidden]`, so
  panels stay on screen despite the attribute. There is one global
  `[hidden] { display: none !important }` rather than a rule per component.
- `Content-Length` is useless for download progress once the server compresses:
  it reports compressed bytes while the stream yields decompressed ones. The
  real size is injected at build time instead.
- User text reaches Typst as quoted string literals, never as markup. Typst
  markup has a large set of special characters and a subtly wrong escape table
  would corrupt documents; string literals need two escapes, which makes this
  safe by construction and closes off injection. Markup position needs the `#`
  prefix, or the text is typeset as literal quoted text and picked up by smart
  quotes.
- Formulas are LaTeX, converted to Typst maths markup by mitex, so its output
  cannot go in as a string literal alone. It is checked (no code-mode `#`
  except mitex's own text helpers), then passed as a string literal to
  `eval(mode: "math")`, which parses it in isolation and resolves only maths
  functions and symbols. mitex runs in JavaScript, not as a Typst plugin, so
  the check happens before Typst sees anything. Typst stops at its first
  error, so a formula that still fails is found from the error's call trace
  (or by bisection when the trace points only into mitex's helpers), replaced
  with its source and the message, and the document compiled again. See
  `src/math/typst-math.ts`.
- The vendored mitex spec (`src/math/mitex/latex/standard.typ`) is patched:
  upstream passes `\hspace`, `\vspace` and `\raisebox` arguments to `eval`,
  which would run formula text as Typst code. Keep the patch when updating.
- Typst's `show heading: set text(size: 1.7em)` still applies when a later
  show rule replaces the heading entirely, and `em` sizes compound with it
  (and with Typst's own heading sizes). Template heading rules therefore use
  absolute `pt` sizes and spacing computed from the body size. The latest show
  rule runs first; one that does not return `it` stops the older function
  rules, but not the older show-set rules.
- `#pagebreak()` inside any container (a block, a list, a quote) is an error,
  which is why breaks are only recognised at the top level and "new page per
  H1" inserts break tokens rather than wrapping the heading.
- Typst picks the closest weight inside a family instead of falling through
  to the next family, so a regular-only serif CJK face would set bold CJK in
  regular. Bold text uses its own font list without it (`md-bold-font`).
- Typst needs two string-to-function escapes that would otherwise force
  `unsafe-eval` into the CSP. Both are dead code here and are replaced at build
  time; see `vite.config.ts`.

- Fonts are served as `immutable`, yet some keep their file name across
  rebuilds. Every font URL therefore carries `?v=FONT_REVISION`
  (`src/typst/fonts.ts`, and the same in `src/fonts.css`); bump it whenever
  `npm run fonts` changes a file in place, or returning visitors keep the old
  bytes. The service worker drops font entries cached without a revision.
- resvg, which draws SVG inside Typst, picks fonts per label, not per
  character: it takes the first family it has and, if that lacks a
  character, one fallback face that covers the *whole* label. Mixed labels
  therefore come out in the CJK face, and the diagram's font list leads with
  it so the browser measures them the same way.
- resvg applies a `dy` to the logical first character only, which in
  right-to-left text is drawn last: every Arabic or Hebrew label lost its
  first letter to a line of its own. It also shapes per `<tspan>`, which
  scrambles joined Arabic across Mermaid's one-span-per-word output, and it
  cannot shape Indic scripts at all. `src/diagram/svg-fixes.ts` rewrites the
  former two; Indic labels are lifted out of the SVG and set by Typst over it.
- The Noto script faces carry a merged copy of basic Latin for the same
  reason: a label mixing Arabic and English then has one face that covers it.
- svg2pdf (inside Typst) **rasterises any SVG filter**. Mermaid 12's default
  "neo" look puts a drop shadow on nodes, notes and actors, so shapes came out
  as blurry bitmaps and their text was no longer text (timeline events, for
  one). A filter reference that does not resolve (`url(#drop-shadow)` on
  sequence notes) makes resvg drop the element entirely: notes lost their
  boxes. `src/diagram/svg-print.ts` strips every filter, in the preview too,
  so both look the same.
- Mermaid 12 gives flowchart, sequence, class, state, ER and requirement
  diagrams their own theme (`redux-color`, look `neo`) whatever the global
  `theme` says. Top-level `htmlLabels: false` still wins for them.
- Journey and timeline default to `textPlacement: 'fo'`: every label in a
  `<foreignObject>` inside a `<switch>`. With `'tspan'` the journey labels are
  white on a pale fill (the HTML labels they replace are dark); svg-print
  darkens them. Any foreignObject that remains becomes plain SVG text.
- Gantt charts take the width of the element Mermaid renders them in, which is
  a sandbox the width of the window, so they came out at a third of their size
  once fitted. `gantt.useWidth` fixes it. Their "today" line is drawn even
  when today is outside the chart, where only the viewBox hid it.
- Some diagrams draw outside their own viewBox (radar axis labels and curves)
  and some leave margins of up to 150px (C4, journey, sequence, timeline). The
  viewBox is refitted to the measured drawing (`getBBox`) with at most 16px
  margin, which also makes those diagrams larger once fitted to the page.
- To decide "shrink or move to the next page", Typst needs where the diagram
  would start. `here()` inside the diagram is useless for that: once it has
  moved, it reports the top of the next page. `md-diagram` places a
  zero-size anchor before it instead, which stays behind. That anchor sits
  above the block spacing when the diagram moved (the spacing is dropped at
  the break) and below it when it did not; the code accounts for both. An
  anchor inside a breakable block moves along with the content.
- A heading keeps with the block after it, so a diagram sized to exactly a
  full page left its heading alone on the previous page. Page-tall diagrams
  leave 5em for one.
- Jison errors say "line 5" for an unexpected end of a four-line diagram; the
  line is clamped to the diagram's last.
- Typst has no `covers` for CSS: the preview's Chinese/Japanese stack starts
  with a second Noto Sans family (`md2pdf Latin in CJK`) whose `unicode-range`
  leaves out exactly what `latin-in-cjk` does.

## Licence

Bundled fonts keep their own licences; see `public/fonts/README.md`. The
vendored mitex files under `src/math/mitex/` are Apache-2.0 (see the LICENSE
there); Temml is MIT.
