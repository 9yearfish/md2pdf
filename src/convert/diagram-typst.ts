/**
 * Typst for Mermaid diagrams: how they are sized on the page, and the box that
 * stands in for one that failed. Loaded by `pipeline.ts` only when the
 * document has a diagram, so none of it is in the first-load bundle.
 *
 * Sizing happens in Typst, not here, because only Typst knows where on the
 * page a diagram lands and how wide its container really is (a list item or a
 * block quote is narrower than the text block):
 *
 * 1. Fit the container's width; never enlarge a small diagram.
 * 2. Never be taller than a full page (the region's height), less room for
 *    a heading: headings keep with what follows, and one left alone at the
 *    foot of a page because the diagram filled the next would be worse.
 * 3. If that does not fit in what is left of the current page, shrink it to
 *    fit, but by no more than `md-diagram-min-scale`; beyond that it moves to
 *    the next page at its size from step 2. A diagram a little too tall for
 *    the space left then no longer leaves a half-empty page behind it.
 *
 * The result is a vector image scaled with `reflow`, so the layout sees its
 * real size and overlaid labels (see `emit.ts`) scale with it.
 */
import { tstr } from './typst-str';

export const DIAGRAM_DEFS = `// Mermaid diagrams: fit the width, then the page; shrink to fit the rest of a page before moving.
#let md-diagram-min-scale = 0.7
// The page body's top and bottom edge, or none on a page of auto height.
#let md-diagram-body() = {
  let (width, height) = if page.flipped { (page.height, page.width) } else { (page.width, page.height) }
  if height == auto { return none }
  let m = page.margin
  let side(name) = {
    let v = if type(m) == dictionary { m.at(name, default: m.at("y", default: m.at("rest", default: auto))) } else { m }
    if v == auto { v = 2.5 / 21 * calc.min(width, height) }
    if type(v) == ratio { v = v * height }
    if type(v) == relative { v = v.length + v.ratio * height }
    v.to-absolute()
  }
  (side("top"), height - side("bottom"))
}
// The anchor marks where the diagram would start. It stays on this page when
// the diagram itself moves on, which is what makes "shrink or move" decidable.
// (Inside a breakable block it would move along, so it is a sibling.)
#let md-diagram(w, h, body) = {
  [#place(top + left, box(width: 0pt, height: 0pt)) <md-diagram-at>]
  context {
    let at = query(selector(<md-diagram-at>).before(here()))
    let at = if at.len() > 0 { at.last().location().position() } else { here().position() }
    let y = at.y
    // Where the diagram follows its anchor, the spacing above it lies below
    // the anchor; where it moved on, that spacing was dropped at the break.
    let gap = if at.page == here().page() { 0pt } else { par.spacing.to-absolute() }
    let body-edges = md-diagram-body()
    layout(size => {
      let s = calc.min(1, size.width / w)
      if body-edges != none {
        let (top, bottom) = body-edges
        // A full page less room for a heading, which moves along with it.
        s = calc.min(s, (bottom - top - 5em.to-absolute()) / h)
        let room = bottom - y - gap - 1pt
        if h * s > room and room / h >= md-diagram-min-scale * s { s = room / h }
      }
      block(breakable: false, width: 100%, align(center, scale(s * 100%, reflow: true, body)))
    })
  }
}
// Square, a solid red title strip over a pale red body: the app's error style.
#let md-diagram-error(title, message, excerpt) = block(
  width: 100%, breakable: false, fill: rgb("#fdf1ef"), stroke: 0.75pt + rgb("#b3261e"),
  {
    block(width: 100%, fill: rgb("#b3261e"), inset: (x: 10pt, y: 6pt), below: 0pt,
      text(fill: white, weight: "bold", title))
    block(width: 100%, inset: (x: 10pt, top: 7pt, bottom: 9pt), above: 0pt, {
      if message != "" { text(size: 0.9em, message) }
      if excerpt != none { raw(excerpt, block: true) }
    })
  },
)
`;

export interface DiagramErrorText {
  title: string;
  message: string;
  excerpt?: string;
}

/** The error box that replaces a diagram Mermaid could not render. */
export function diagramErrorMarkup(error: DiagramErrorText): string {
  const excerpt = error.excerpt ? tstr(error.excerpt) : 'none';
  return `#md-diagram-error(${tstr(error.title)}, ${tstr(error.message)}, ${excerpt})`;
}
