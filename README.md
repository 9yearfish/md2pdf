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

## What a visit actually costs

Opening the page downloads **56 KB**. Everything else arrives only when it is
needed:

| Payload | Size (brotli) | When |
| --- | --- | --- |
| Page, styles, app | 56 KB | on load |
| Editor (CodeMirror) | 171 KB | after first paint, in the background |
| Typesetting engine | ~6.9 MB | when you first touch the editor, or on the first conversion |
| pdf.js | ~150 KB | with the first preview |
| Mermaid | ~180 KB | only if a document contains a diagram |
| Chinese fonts | 2.6-9 MB | only if a document contains Chinese |

The engine is the one big item and there is no way around it: it is a real
typesetting system compiled to WebAssembly. `wasm-opt -Oz` was tried and makes
it worse — 27.0 MB shrinks to 25.4 MB uncompressed but compresses to 6.91 MB
instead of 6.88 MB. So it is handled rather than shrunk: the download does not
start until someone touches the editor, it is skipped entirely on metered or
slow connections until they ask for a conversion, it reports byte-level
progress while it runs, and it is kept in Cache Storage so it never happens
twice.

## Known constraints
- Raw HTML in Markdown is not supported beyond `<br>`; Typst has no equivalent.
- Italic Chinese renders upright: Noto Sans SC has no italic face and Typst
  does not synthesise one.
- Remote images are not fetched. Drag a file onto the page or paste it instead.
- Maths is not in this version.

## SEO

The page carries its description, feature notes and FAQ as real HTML below the
tool, so there is something to index without executing JavaScript, plus
`WebApplication` and `FAQPage` structured data. `VITE_SITE_URL` in `.env` sets
the canonical origin and is baked into the canonical link, the Open Graph tags,
`robots.txt` and `sitemap.xml` at build time. **Change it to the real domain
before deploying**; a canonical pointing at the wrong origin is worse than none.

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

After the first deploy, check that the engine is served compressed:

```
curl -sI -H 'Accept-Encoding: br' https://<your-domain>/assets/*.wasm | grep -i content-encoding
```

It should report `br`. Without compression that request is 27 MB rather than
7 MB, which is the difference between a slow first conversion and an unusable
one.

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
- Typst needs two string-to-function escapes that would otherwise force
  `unsafe-eval` into the CSP. Both are dead code here and are replaced at build
  time; see `vite.config.ts`.

## Licence

Bundled fonts keep their own licences; see `public/fonts/README.md`.
