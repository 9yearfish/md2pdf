# md2pdf

Markdown to PDF in the browser, including Mermaid diagrams and Chinese
typesetting. No server, no database, no account: the document, the fonts and the
typesetting engine all live in the tab, and nothing is ever uploaded.

Left pane edits, right pane is the PDF. What you download is the file you are
looking at.

## How it works

```
Markdown
  -> markdown-it tokens
  -> ```mermaid blocks rendered to SVG, fonts rewritten, size normalised
  -> Typst source
  -> typst.ts (WASM) compiles to PDF bytes
       |-> pdf.js renders those bytes to canvas  = preview
       '-> Blob download of the same bytes       = the file you get
```

Preview and download share one `Uint8Array`, so they cannot drift apart. That
is the reason the preview is a real PDF viewer rather than styled HTML: an HTML
preview only ever approximates the printed result.

## What works

- **Chinese** embeds as real text: selectable, searchable, automatically
  subsetted into the PDF.
- **Mermaid diagrams** land as native vector art, not bitmaps. Text inside a
  diagram stays selectable, and find-in-page highlights it like any other text.
  `classDef` colours, stroke widths and CSS survive intact.
- **Code blocks** are highlighted by Typst's built-in syntect, so no JavaScript
  highlighter ships at all.
- **Viewer**: virtualised page rendering, outline sidebar built from the PDF's
  own bookmarks, find-in-page, zoom, keyboard paging.
- **Markdown**: headings, lists, nested lists, task lists, tables with
  alignment, block quotes, definition lists, footnotes, inline styling, links,
  images, horizontal rules.

## Fonts

Noto Sans and Noto Sans SC are the same type family, so Latin and Chinese share
weights and proportions instead of clashing. Fonts load in tiers, and which tier
a document needs is decided before anything is downloaded, from a bitmap of the
subset's coverage:

| Tier | Downloaded | When |
| --- | --- | --- |
| Latin | ~0.9 MB | always |
| Chinese subset | +4.7 MB | the document contains CJK |
| Chinese full | +20 MB | the document uses characters outside GB2312 |

The subset covers 7,696 codepoints, which is everything GB2312 has plus
punctuation, and handles the overwhelming majority of Chinese text. Documents
that reach beyond it upgrade automatically, so rare characters never render as
tofu.

Regenerate the bundled binaries with `npm run fonts` (see
`scripts/prepare_fonts.py`); they are committed so that neither the build nor
the deploy needs network access or Python.

## Privacy

The Content-Security-Policy has no `connect-src` beyond `'self'`, which is what
makes "nothing is uploaded" an enforced property rather than a promise. The
service worker caches only the application's own immutable assets; no part of a
document is ever stored.

## Known constraints

- First load is roughly 11-12 MB, 7.8 MB of it the Typst WASM compiler. It is
  fetched in the background while you type and cached by a service worker
  afterwards. That is the price of a real typesetting engine in the browser.
- Raw HTML in Markdown is not supported beyond `<br>`; Typst has no equivalent.
- Italic Chinese renders upright: Noto Sans SC has no italic face and Typst
  does not synthesise one.
- Remote images are not fetched. Drag a file onto the page or paste it instead.
- Maths is not in this version.

## Development

```
npm install
npm run dev        # dev server
npm run typecheck
npm run build
npm run preview    # serves dist/ with the production _headers applied
npm test           # end-to-end, against whatever `preview` is serving
```

`npm run preview` exists because Vite's own preview server ignores `_headers`,
which would let a broken Content-Security-Policy reach production unnoticed.
`npm test` drives the real app in headless Chromium: it converts the sample
document, checks the viewer, outline and search, verifies the downloaded bytes,
and confirms each font tier downloads exactly the faces it should.

## Deployment

Cloudflare Pages, as a plain static site. Build command `npm run build`, output
directory `dist`. No Workers, no KV, no R2, no D1. `public/_headers` carries the
caching and security headers.

## Gotchas worth remembering

These cost real debugging time and are easy to hit again:

- Mermaid's `htmlLabels: false` only takes effect at the **top level** of the
  config. Nested under `flowchart` it is silently ignored and labels come out as
  `foreignObject`, which renders as blank space in a PDF.
- Typst cannot compare a length with a ratio, so `calc.min(300pt, 100%)` is an
  error rather than a safeguard. Image widths are clamped in JavaScript against
  the real text width instead.
- pdf.js's default build calls `Map.prototype.getOrInsertComputed`, which only
  very recent browsers have. Use the `legacy` build.
- pdf.js detaches the buffer it is given. The viewer always gets a copy, or the
  bytes queued for download would be emptied out from under it.
- User text reaches Typst as quoted string literals, never as markup. Typst
  markup has a large set of special characters and a subtly wrong escape table
  would corrupt documents; string literals need two escapes, which makes this
  safe by construction and closes off injection. Markup position needs the `#`
  prefix, or the text is typeset as literal quoted text and picked up by smart
  quotes.
- Typst needs two string-to-function escapes that would otherwise force
  `unsafe-eval` into the CSP. Both are dead code here and are replaced at build
  time; see `vite.config.ts`.

## Licence

Bundled fonts keep their own licences; see `public/fonts/README.md`.
