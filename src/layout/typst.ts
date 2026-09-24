/**
 * The Typst side of templates, headers and footers, covers and title blocks.
 *
 * It comes after the base preamble (src/convert/preamble.ts) and only adds
 * rules, relying on later `set`/`show` rules winning. As everywhere else,
 * every piece of user text reaches Typst as a string literal (`tstr`,
 * `tprose`), never as markup: the header "{title} | {page}" is split into
 * literal pieces and a handful of fixed expressions, so nothing the user types
 * can become Typst code.
 */
import { tprose, tstr } from '../convert/typst-str';
import { bodyFonts, buildPreamble } from '../convert/preamble';
import { createParser, parse } from '../convert/markdown';
import { emit } from '../convert/emit';
import type { FontSet } from '../typst/fonts';
import { bands, formatDate, joinNames, type ResolvedDocument } from './document';
import { ABSTRACT, TEMPLATES } from './templates';

const TOKEN_EXPR: Record<string, string> = {
  title: 'md-title',
  author: 'md-author',
  date: 'md-date',
  page: 'str(counter(page).get().first())',
  pages: 'str(counter(page).final().first())',
};
const TOKEN = /\{(title|page|pages|date|author)\}/gi;

/** `left | centre | right`; one part is centred, two go left and right. `\|` is a bar. */
export function bandCells(spec: string): [string, string, string] | null {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < spec.length; i++) {
    if (spec[i] === '\\' && spec[i + 1] === '|') {
      current += '|';
      i++;
    } else if (spec[i] === '|') {
      parts.push(current);
      current = '';
    } else current += spec[i];
  }
  parts.push(current);
  const p = parts.map(s => s.trim());
  if (p.every(s => !s)) return null;
  if (p.length === 1) return ['', p[0], ''];
  if (p.length === 2) return [p[0], '', p[1]];
  return [p[0], p[1], p.slice(2).join(' | ')];
}

/** One cell as a Typst string expression: literals and token expressions joined by `+`. */
function cellExpr(cell: string): string {
  const pieces: string[] = [];
  let last = 0;
  for (const m of cell.matchAll(TOKEN)) {
    if (m.index! > last) pieces.push(tstr(cell.slice(last, m.index)));
    pieces.push(TOKEN_EXPR[m[1].toLowerCase()]);
    last = m.index! + m[0].length;
  }
  if (last < cell.length) pieces.push(tstr(cell.slice(last)));
  return pieces.length ? pieces.join(' + ') : '""';
}

function bandExpr(spec: string, wrap: string): string {
  const cells = bandCells(spec);
  if (!cells) return 'none';
  return `context ${wrap}(md-band(${cells.map(cellExpr).join(', ')}))`;
}

/** Markup for plain user text: smart quotes and all, but only ever literal text. */
const prose = (value: string) => (value ? tprose(value) : '');
const lines = (value: string) =>
  value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(tprose)
    .join('#linebreak()');
const arg = (markup: string) => (markup ? `[${markup}]` : 'none');

function markdownBlock(source: string, warn: (message: string) => void): string {
  const { tokens } = parse(createParser(), source);
  return emit({ tokens, assets: new Map(), footnotes: new Map(), warn });
}

/* ---------- per template ---------- */

const MUTED = 'rgb("#57606a")';
/** The default template is ink and neutral greys, like the interface. */
const GREY = 'rgb("#5c5c5c")';

/**
 * Heading rules shared by the templates that restyle headings. Sizes are
 * absolute (`pt`): an `em` would compound with the base preamble's and
 * Typst's own heading sizes, which still apply as show-set rules.
 */
function headingRule(o: {
  sizes: string[];
  above: string[];
  below: string;
  fill: string;
  number: string;
  /** A rule under level-1 headings. */
  rule?: string;
}): string {
  return `#show heading: it => {
  let n = calc.min(it.level, ${o.sizes.length}) - 1
  let size = (${o.sizes.join(', ')},).at(n)
  let above = (${o.above.join(', ')},).at(calc.min(n, ${o.above.length - 1}))
  let fill = (${o.fill},).at(calc.min(n, ${o.fill.split(',').length - 1}))
  block(above: above, below: ${o.below}, sticky: true, width: 100%,${o.rule ? ` stroke: if it.level == 1 { (bottom: ${o.rule}) },
    inset: if it.level == 1 { (bottom: 0.4em) } else { 0pt },` : ''} {
    set par(justify: false, first-line-indent: 0em)
    set text(size: size, weight: if it.level < 4 { "bold" } else { "semibold" }, font: md-bold-font, fill: fill)
    if it.numbering != none { context counter(heading).display(it.numbering); h(${o.number}) }
    it.body
  })
}`;
}

function templateStyles(doc: ResolvedDocument, fonts: FontSet): string {
  const pt = (factor: number) => `${Number((doc.options.fontSize * factor).toFixed(2))}pt`;
  // Chinese and Japanese indent every paragraph by two characters.
  const cjk = fonts.lang.cjkPunctuation;
  switch (doc.template.id) {
    case 'report':
      return `// Report: navy headings, ruled chapter headings, tinted table headers.
#let md-accent = rgb("#1f3a60")
${headingRule({
  sizes: [pt(1.55), pt(1.25), pt(1.08), pt(1)],
  above: [pt(2), pt(1.6), pt(1.3), pt(1.1)],
  below: pt(0.8),
  fill: 'md-accent, md-accent, rgb("#1c2024")',
  number: '0.7em',
  rule: '0.6pt + rgb("#c5cfdc")',
})}
#set table(fill: (_, y) => if y == 0 { rgb("#eef2f8") }, stroke: 0.5pt + rgb("#c5cfdc"))
#show table.cell.where(y: 0): set text(fill: md-accent)
#show link: set text(fill: md-accent)
#set outline.entry(fill: repeat(text(fill: rgb("#9aa5b1"), "."), gap: 0.3em))
#show outline.entry: set block(spacing: 0.75em)
#show outline.entry.where(level: 1): it => { v(0.6em, weak: true); strong(it) }
#let md-quote(body) = block(width: 100%, inset: (x: 12pt, y: 8pt), fill: rgb("#f3f6fa"), stroke: (${fonts.lang.dir === 'rtl' ? 'right' : 'left'}: 3pt + md-accent), text(fill: rgb("#3b4652"), body))
#let md-header(body) = block(width: 100%, inset: (bottom: 5pt), stroke: (bottom: 0.5pt + rgb("#c5cfdc")), text(size: 0.8em, fill: ${MUTED}, body))
#let md-footer(body) = text(size: 0.8em, fill: ${MUTED}, body)
#let md-cover(title, subtitle, author, date) = page(
  header: none, footer: none, numbering: none,
  background: place(top + left, rect(width: 100%, height: 14mm, fill: md-accent)),
)[
  #set par(justify: false)
  #v(24%)
  #block(width: 100%, below: 1.1em, par(leading: 0.35em, text(size: 2.6em, weight: "bold", font: md-bold-font, fill: md-accent, hyphenate: false, title)))
  #if subtitle != none { block(below: 0.8em, text(size: 1.35em, fill: rgb("#3b4652"), subtitle)) }
  #v(1.2em)
  #line(length: 22%, stroke: 2pt + md-accent)
  #v(1fr)
  #line(length: 100%, stroke: 0.5pt + rgb("#c5cfdc"))
  #v(0.4em)
  #grid(columns: (1fr, auto), column-gutter: 1em,
    if author != none { text(size: 1.1em, weight: "bold", font: md-bold-font, author) },
    if date != none { text(size: 1.05em, fill: ${MUTED}, date) })
]`;

    case 'academic':
      return `// Academic: serif text, indented paragraphs, booktabs tables, small footnotes.
#set par(first-line-indent: (amount: ${cjk ? '2em' : '1.5em'}, all: ${cjk}), spacing: ${Math.max(0.2, doc.options.lineHeight - 1).toFixed(3)}em)
${headingRule({
  sizes: [pt(1.22), pt(1.08), pt(1), pt(1)],
  above: [pt(1.9), pt(1.5), pt(1.3)],
  below: pt(0.75),
  fill: 'rgb("#111111")',
  number: '0.8em',
})}
#show link: set text(fill: rgb("#1a4c8b"))
#set underline(stroke: 0pt)
#set table(stroke: (_, y) => if y == 0 { (bottom: 0.5pt + black) }, inset: (x: 6pt, y: 5pt))
#show table: it => block(stroke: (top: 0.9pt + black, bottom: 0.9pt + black), it)
#show table.cell.where(y: 0): set text(weight: "bold", font: md-bold-font)
#set footnote.entry(separator: line(length: 28%, stroke: 0.5pt), clearance: 0.9em, gap: 0.5em)
#show footnote.entry: set text(size: 0.84em)
#show footnote.entry: set par(first-line-indent: 0em, leading: 0.45em)
#show figure.caption: set text(size: 0.9em, fill: rgb("#333333"))
#let md-quote(body) = block(width: 100%, inset: (x: 1.6em, y: 2pt), text(size: 0.95em, body))
#let md-header(body) = text(size: 0.82em, style: "italic", fill: ${MUTED}, body)
#let md-footer(body) = text(size: 0.9em, body)
#let md-title-block(title, subtitle, author, date) = {
  set par(justify: false, first-line-indent: 0em)
  align(center, block(width: 100%, below: 2em, {
    block(width: 88%, par(leading: 0.4em, text(size: 1.7em, weight: "bold", font: md-bold-font, hyphenate: false, title)))
    if subtitle != none { block(above: 0.6em, text(size: 1.2em, subtitle)) }
    if author != none { v(0.7em); block(text(size: 1.08em, author)) }
    if date != none { v(0.25em); block(text(size: 0.95em, fill: ${MUTED}, date)) }
  }))
}
#let md-abstract(label, body) = block(width: 100%, inset: (x: 2.4em), below: 2em, {
  set text(size: 0.92em)
  set par(first-line-indent: 0em, spacing: 0.6em)
  align(center, block(below: 0.7em, text(weight: "bold", font: md-bold-font, smallcaps(label))))
  body
})
#let md-cover(title, subtitle, author, date) = page(header: none, footer: none, numbering: none)[
  #set par(justify: false, first-line-indent: 0em)
  #v(1fr)
  #align(center)[
    #text(size: 2em, weight: "bold", font: md-bold-font, hyphenate: false, title)
    #if subtitle != none { v(0.4em); text(size: 1.3em, subtitle) }
    #v(3em)
    #if author != none { text(size: 1.15em, author) }
    #if date != none { v(0.6em); text(fill: ${MUTED}, date) }
  ]
  #v(1.4fr)
]`;

    case 'resume':
      return `// Résumé: the first heading is the name, the paragraph under it the contact line.
#let md-accent = rgb("#1f3a60")
#set par(justify: false, spacing: 0.7em)
#set list(spacing: 0.45em, indent: 0.15em, body-indent: 0.6em, marker: text(fill: md-accent, size: 0.9em, "•"))
#set enum(spacing: 0.45em)
#set underline(stroke: 0pt)
#show link: set text(fill: rgb("#1c2024"))
#let md-row(body) = {
  let kids = if body.has("children") { body.children } else { (body,) }
  let left = ()
  let right = ()
  let found = false
  for k in kids {
    if found { right.push(k) } else if k.func() == text and k.text.contains(" | ") {
      let parts = k.text.split(" | ")
      left.push(parts.first())
      right.push(parts.slice(1).join(" | "))
      found = true
    } else { left.push(k) }
  }
  if found {
    grid(columns: (1fr, auto), column-gutter: 1em, left.join(), text(weight: "regular", size: 0.95em, fill: ${MUTED}, right.join()))
  } else { body }
}
#show heading: it => {
  set par(justify: false)
  if it.level == 1 {
    align(center, block(below: ${pt(0.7)}, text(size: ${pt(2.3)}, weight: "bold", font: md-bold-font, tracking: 0.01em, hyphenate: false, it.body)))
  } else if it.level == 2 {
    block(above: ${pt(1.2)}, below: ${pt(0.6)}, sticky: true, width: 100%, inset: (bottom: 3pt), stroke: (bottom: 0.6pt + rgb("#98a3b0")),
      text(size: ${pt(1.15)}, weight: "bold", font: md-bold-font, fill: md-accent, tracking: 0.07em, smallcaps(all: true, it.body)))
  } else {
    block(above: ${pt(0.9)}, below: ${pt(0.35)}, sticky: true, width: 100%,
      text(size: if it.level == 3 { ${pt(1.02)} } else { ${pt(1)} }, weight: if it.level == 3 { "bold" } else { "semibold" }, font: md-bold-font, md-row(it.body)))
  }
}
#let md-contact(body) = align(center, block(below: 1.1em, text(size: 0.93em, fill: rgb("#4b5563"), body)))
#let md-header(body) = text(size: 0.8em, fill: ${MUTED}, body)
#let md-footer(body) = text(size: 0.8em, fill: ${MUTED}, body)`;

    case 'letter':
      return `// Letter: sender, recipient, date and subject from the front matter.
#set par(spacing: 1.05em)
#set underline(stroke: 0pt)
#let md-header(body) = text(size: 0.8em, fill: ${MUTED}, body)
#let md-footer(body) = text(size: 0.8em, fill: ${MUTED}, body)
#let md-letterhead(name, from, to, date, subject) = {
  set par(justify: false, first-line-indent: 0em)
  if name != none or from != none {
    align(end, block(below: 2.4em, {
      if name != none { text(size: 1.25em, weight: "bold", font: md-bold-font, name) }
      if from != none { block(above: 0.5em, text(size: 0.9em, fill: ${MUTED}, from)) }
    }))
  }
  if to != none { block(below: 2em, to) }
  if date != none { align(end, block(below: 1.6em, date)) }
  if subject != none { block(below: 1.4em, text(weight: "bold", font: md-bold-font, subject)) }
}
#let md-signoff(closing, signature) = block(above: 1.8em, breakable: false, {
  set par(first-line-indent: 0em)
  if closing != none { closing }
  v(3em)
  if signature != none { signature }
})`;

    default:
      return `#let md-header(body) = text(size: 0.82em, fill: ${GREY}, body)
#let md-footer(body) = text(size: 0.82em, fill: ${GREY}, body)
#let md-title-block(title, subtitle, author, date) = {
  set par(justify: false)
  block(width: 100%, below: 1.8em, {
    text(size: 2em, weight: "bold", font: md-bold-font, hyphenate: false, title)
    if subtitle != none { v(0.2em); block(text(size: 1.25em, fill: ${GREY}, subtitle)) }
    if author != none or date != none {
      block(above: 0.9em, text(fill: ${GREY}, (author, date).filter(x => x != none).join([ · ])))
    }
    v(0.4em)
    line(length: 100%, stroke: 0.5pt + rgb("#d4d4d4"))
  })
}
#let md-cover(title, subtitle, author, date) = page(header: none, footer: none, numbering: none)[
  #set par(justify: false)
  #v(1fr)
  #align(center)[
    #text(size: 2.5em, weight: "bold", font: md-bold-font, hyphenate: false, title)
    #if subtitle != none { v(0.5em); text(size: 1.35em, fill: ${GREY}, subtitle) }
    #v(2.4em)
    #line(length: 3cm, stroke: 0.6pt + rgb("#d4d4d4"))
    #v(1.6em)
    #if author != none { text(size: 1.15em, author) }
    #if date != none { v(0.5em); text(fill: ${GREY}, date) }
  ]
  #v(1.6fr)
]`;
  }
}

export interface LayoutSource {
  /** The full preamble: base rules, layout rules, then cover, title block, abstract and contents. */
  head: string;
  /** After the body: a letter's closing. */
  tail: string;
}

/**
 * Typst for everything around the body. `top` is the shallowest heading level
 * in the body (see `prepareTokens`); numbering starts there, so a document
 * whose sections are `##` is numbered 1, 2, 3 rather than 0.1, 0.2.
 */
export function layoutTypst(
  doc: ResolvedDocument,
  fonts: FontSet,
  top: number,
  warn: (message: string) => void,
  /** Extra base rules (the maths support), placed before the contents. */
  extra = '',
): LayoutSource {
  const o = doc.options;
  const lang = fonts.lang;
  const meta = doc.meta;
  const date = formatDate(meta.date, lang.html);
  const author = joinNames(meta.authors, lang.html);
  const { header, footer } = bands(doc);
  const out: string[] = [
    buildPreamble({ ...o, tableOfContents: false }, fonts, extra),
    `// ---- Layout: ${doc.template.id} template${doc.cover ? ', cover' : ''}${o.h1NewPage ? ', level-1 headings start a page' : ''}`,
    `#let md-title = ${tstr(meta.title)}`,
    `#let md-author = ${tstr(author)}`,
    `#let md-date = ${tstr(formatDate(meta.date, lang.html, true))}`,
    `#let md-bold-font = ${bodyFonts(fonts, true)}`,
  ];
  if (fonts.families.some(f => f.regularOnly)) {
    // Serif CJK comes in one weight; bold CJK is set in the sans face.
    out.push('#show strong: set text(font: md-bold-font)', '#show heading: set text(font: md-bold-font)', '#show table.cell.where(y: 0): set text(font: md-bold-font)');
  }
  if (meta.keywords.length) out.push(`#set document(keywords: (${meta.keywords.map(tstr).join(', ')},))`);
  if (doc.numbered) {
    out.push(
      `#set heading(numbering: (..n) => { let k = n.pos().slice(${top - 1}); if k.len() == 0 or k.len() > 3 { none } else { numbering("1.1", ..k) } })`,
    );
  }
  // The default template's helpers first; a template redefines what it changes.
  if (doc.template.id !== 'default') out.push(templateStyles({ ...doc, template: TEMPLATES.default }, fonts));
  out.push(templateStyles(doc, fonts));
  out.push(
    '#let md-band(a, b, c) = grid(columns: (1fr, auto, 1fr), column-gutter: 12pt, align(start, a), align(center, b), align(end, c))',
    `#set page(header: ${bandExpr(header, 'md-header')}, footer: ${bandExpr(footer, 'md-footer')})`,
  );

  const title = arg(prose(meta.title));
  const subtitle = arg(prose(meta.subtitle));
  const who = arg(prose(author));
  const when = arg(prose(date));
  if (doc.cover) {
    out.push(`#md-cover(${title}, ${subtitle}, ${who}, ${when})`, '#counter(page).update(1)');
  } else if (doc.titleBlock) {
    out.push(`#md-title-block(${title}, ${subtitle}, ${who}, ${when})`);
  }
  if (doc.template.id === 'letter') {
    const l = meta.letter;
    const letterDate = formatDate(meta.date || 'today', lang.html);
    out.push(`#md-letterhead(${arg(prose(author))}, ${arg(lines(l.from))}, ${arg(lines(l.to))}, ${arg(prose(letterDate))}, ${arg(prose(l.subject))})`);
  }
  if (meta.abstract) {
    const label = ABSTRACT[lang.code] ?? ABSTRACT.en;
    const body = markdownBlock(meta.abstract, warn);
    out.push(
      doc.template.id === 'academic'
        ? `#md-abstract(${tstr(label)}, [\n${body}\n])`
        : `#block(width: 100%, inset: (x: 1.5em), below: 1.8em)[\n#text(weight: "bold", font: md-bold-font, ${tstr(label)})\n\n#set text(size: 0.94em)\n${body}\n]`,
    );
  }
  if (o.tableOfContents) {
    const tocTitle = o.tocTitle?.trim() || lang.tocTitle;
    out.push(`#outline(title: [#${tstr(tocTitle)}], depth: ${Math.min(6, top + 2)})\n#pagebreak()`);
  }

  let tail = '';
  if (doc.template.id === 'letter' && (meta.letter.closing || meta.letter.signature)) {
    const signature = meta.letter.signature || author;
    tail = `#md-signoff(${arg(lines(meta.letter.closing))}, ${arg(prose(signature))})`;
  }
  return { head: out.join('\n') + '\n', tail };
}
