# md2pdf

Markdown to PDF in the browser, including Mermaid diagrams. No server, no
database, nothing uploaded: the document, the fonts and the typesetting engine
all live in the tab.

**Status: design validated, implementation in progress.** The feasibility work
is done and the findings below are measured, not estimated.

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

Preview and download share one `Uint8Array`, so they cannot drift apart.

## Validated

- Chinese text embeds as real, selectable, searchable text with automatic font
  subsetting.
- Mermaid diagrams land in the PDF as native vector art, not bitmaps: text
  inside a diagram is still extractable.
- Mermaid's `classDef` colours, stroke widths and CSS survive the trip; output
  matches what the browser draws.

## Known constraints

- First load is roughly 11-12 MB (7.8 MB of it the Typst WASM compiler), cached
  afterwards. That is the price of a real typesetting engine in the browser.
- Raw HTML in Markdown is not supported beyond `<br>`; Typst has no equivalent.
- Remote images are subject to CORS. Local drag-and-drop and paste always work.
- Maths is not in v1.

## Gotchas worth remembering

- Mermaid's `htmlLabels: false` only takes effect at the **top level** of the
  config. Nested under `flowchart` it is ignored and labels come out as
  `foreignObject`, which renders as blank space in a PDF.
- Typst cannot compare a length with a ratio, so `calc.min(300pt, 100%)` is an
  error. Image widths have to be clamped in JavaScript against the real text
  width.
- pdf.js's default build needs `Map.getOrInsertComputed`, which only very recent
  browsers have. Use the `legacy` build.

## Licence

Bundled fonts keep their own licences; see `public/fonts/README.md`.
