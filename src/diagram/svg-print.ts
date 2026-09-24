/**
 * Makes Mermaid's SVG safe to hand to resvg/svg2pdf (inside Typst), and keeps
 * the preview identical to what the PDF will show. Loaded with Mermaid, not
 * with the page; see `mermaid.ts`.
 *
 * Every repair here fixes something that was visibly wrong in a PDF:
 *
 * - Filters (Mermaid 12's "neo" look gives nodes, notes and actors a drop
 *   shadow) are rasterised by svg2pdf, so the shapes came out as blurry
 *   bitmaps and the text inside them was no longer text. A filter reference
 *   that does not resolve (`url(#drop-shadow)` on sequence notes) makes resvg
 *   drop the element altogether: notes lost their boxes.
 * - `<foreignObject>` (journey tasks, anything that insists on HTML labels)
 *   is blank in a PDF. `<switch>` fallbacks are resolved to their SVG branch;
 *   any other foreignObject becomes plain SVG text.
 * - Some diagrams draw outside their own viewBox (radar axis labels, curves),
 *   which the browser clips and the PDF clips too, and some leave wide empty
 *   margins. The viewBox is fitted to the measured bounds of the drawing.
 * - Mindmap circles centre their label with a transform that assumes
 *   `text-anchor: middle`, which nothing sets for them; journey tasks' SVG
 *   labels are white on a pale fill.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Remove every filter: attributes, CSS declarations and the definitions. */
export function stripFilters(doc: Document): void {
  for (const el of [...doc.querySelectorAll('[filter]')]) el.removeAttribute('filter');
  for (const el of [...doc.querySelectorAll('[style*="filter"]')]) {
    const style = el.getAttribute('style') ?? '';
    el.setAttribute('style', style.replace(/(^|;)\s*filter\s*:[^;]*/gi, '$1'));
  }
  for (const style of [...doc.getElementsByTagName('style')]) {
    // `filter:` inside any rule, up to the end of its declaration.
    style.textContent = (style.textContent ?? '').replace(/(^|[;{\s])filter\s*:[^;}]*;?/gi, '$1');
  }
  for (const filter of [...doc.getElementsByTagName('filter')]) filter.remove();
}

/**
 * `<switch>` holding a foreignObject and an SVG fallback: keep the fallback.
 * Any other foreignObject: replace it with SVG text in the same box.
 */
export function replaceForeignObjects(doc: Document): void {
  for (const sw of [...doc.getElementsByTagName('switch')]) {
    const fallback = [...sw.children].filter(c => c.localName !== 'foreignObject');
    if (fallback.length === 0) continue;
    const group = doc.createElementNS(SVG_NS, 'g');
    for (const attr of [...sw.attributes]) group.setAttribute(attr.name, attr.value);
    for (const child of fallback) group.appendChild(child);
    sw.replaceWith(group);
  }
  for (const fo of [...doc.getElementsByTagName('foreignObject')]) {
    const lines = textLines(fo);
    const x = Number(fo.getAttribute('x') ?? 0);
    const y = Number(fo.getAttribute('y') ?? 0);
    const width = Number(fo.getAttribute('width') ?? 0);
    const height = Number(fo.getAttribute('height') ?? 0);
    const text = doc.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x + width / 2));
    text.setAttribute('y', String(y + height / 2));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    lines.forEach((line, i) => {
      const span = doc.createElementNS(SVG_NS, 'tspan');
      span.setAttribute('x', String(x + width / 2));
      // Centre the block of lines on the box.
      span.setAttribute('dy', i === 0 ? `${-(lines.length - 1) * 0.6}em` : '1.2em');
      span.textContent = line;
      text.appendChild(span);
    });
    if (lines.length) fo.replaceWith(text);
    else fo.remove();
  }
}

/** The visible lines of an HTML label: `<br>` and block boundaries break. */
function textLines(root: Element): string[] {
  const lines: string[] = [''];
  const walk = (node: Node) => {
    if (node.nodeType === 3) lines[lines.length - 1] += node.textContent ?? '';
    else if (node.nodeType === 1) {
      const el = node as Element;
      if (el.localName === 'br') lines.push('');
      const block = /^(div|p|li|tr|h\d)$/.test(el.localName);
      if (block && lines[lines.length - 1].trim()) lines.push('');
      el.childNodes.forEach(walk);
      if (block && lines[lines.length - 1].trim()) lines.push('');
    }
  };
  walk(root);
  return lines.map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/**
 * Journey tasks' SVG text is white (the HTML labels it stands in for are
 * dark), which is invisible on the pale section colours.
 */
export function darkenJourneyText(doc: Document): void {
  if (doc.documentElement.getAttribute('aria-roledescription') !== 'journey') return;
  for (const text of [...doc.querySelectorAll('text.task')]) {
    if (/^(#fff(fff)?|white)$/i.test(text.getAttribute('fill') ?? '')) text.setAttribute('fill', '#333333');
  }
}

/** Mindmap circle labels sit at x = 0 and need to be centred on it. */
export function centreMindmapLabels(doc: Document): void {
  for (const label of [...doc.querySelectorAll('g.mindmap-node > g.label')]) {
    if (!/^translate\(\s*0\s*[, ]/.test(label.getAttribute('transform') ?? '')) continue;
    for (const text of [...label.getElementsByTagName('text')]) {
      if (!text.hasAttribute('text-anchor')) text.setAttribute('text-anchor', 'middle');
    }
  }
}

/**
 * Fit the viewBox to what is actually drawn, measured by the browser: grown
 * where the drawing spills over (so nothing is cut off at the diagram's edge)
 * and trimmed where Mermaid leaves a wide empty margin (C4, journey, sequence
 * and timeline add up to 150px, which only makes the diagram smaller once it
 * is fitted to the page). Returns the new size in SVG pixels.
 */
export function fitViewBox(doc: Document): { width: number; height: number } {
  const root = doc.documentElement as unknown as SVGSVGElement;
  const box = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  let [x, y, width, height] = box.length === 4 && box.every(Number.isFinite) ? box : [0, 0, 0, 0];
  if (!width || !height) {
    width = Number(root.getAttribute('width')) || 600;
    height = Number(root.getAttribute('height')) || 400;
  }
  // Gantt's "today" line is drawn even when today is outside the chart,
  // where the viewBox used to hide it.
  for (const line of [...doc.querySelectorAll('line.today')]) {
    const at = Number(line.getAttribute('x1'));
    if (!(at >= x && at <= x + width)) line.remove();
  }
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-100000px;top:0;visibility:hidden;pointer-events:none';
  const live = document.importNode(root, true) as unknown as SVGSVGElement;
  host.appendChild(live);
  document.body.appendChild(host);
  try {
    const b = live.getBBox();
    if (b.width > 0 && b.height > 0) {
      // Keep Mermaid's margin up to MAX; strokes and markers are outside
      // getBBox, so an overflowing side gets a little room instead.
      const MAX = 16;
      const OVERFLOW = 4;
      const margin = (m: number) => (m < 0 ? OVERFLOW : Math.min(m, MAX));
      const left = b.x - margin(b.x - x);
      const top = b.y - margin(b.y - y);
      const right = b.x + b.width + margin(x + width - (b.x + b.width));
      const bottom = b.y + b.height + margin(y + height - (b.y + b.height));
      [x, y, width, height] = [left, top, right - left, bottom - top];
    }
  } catch {
    // Not rendered (display: none somewhere): keep Mermaid's box.
  } finally {
    host.remove();
  }
  const round = (n: number) => Number(n.toFixed(3));
  root.setAttribute('viewBox', `${round(x)} ${round(y)} ${round(width)} ${round(height)}`);
  return { width: round(width), height: round(height) };
}

/** All of the above, in order. */
export function prepareForPrint(doc: Document): { width: number; height: number } {
  stripFilters(doc);
  replaceForeignObjects(doc);
  darkenJourneyText(doc);
  centreMindmapLabels(doc);
  return fitViewBox(doc);
}

/**
 * Mermaid's errors come in two shapes: jison parsers ("Parse error on line
 * 3:\n...excerpt\n---^\nExpecting 'X', got 'Y'") and Langium ones ("Parsing
 * failed: Parse error on line 3, column 7: Expecting ..."). Both are reduced to
 * the message, the line and the offending source line, so the preview and the
 * PDF can say the same thing in the reader's language.
 */
export function describeError(error: unknown, code: string): Error & {
  line?: number;
  unknownType?: string;
  excerpt?: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const lines = code.replace(/\n$/, '').split('\n');
  const failure: Error & { line?: number; unknownType?: string; excerpt?: string } = new Error(raw);
  failure.name = 'DiagramError';

  if ((error as { name?: string })?.name === 'UnknownDiagramError' || /No diagram type detected/.test(raw)) {
    const first = lines.findIndex(l => l.trim() && !l.trim().startsWith('%%'));
    if (first >= 0) {
      failure.unknownType = lines[first].trim().split(/\s+/)[0];
      failure.line = first + 1;
      failure.message = '';
    } else {
      failure.message = 'No diagram type detected: the diagram is empty.';
    }
  } else {
    const where = /\bline (\d+)(?:, column (\d+))?/i.exec(raw);
    // Jison reports an unexpected end of input one line past the end.
    if (where) failure.line = Math.max(1, Math.min(Number(where[1]), lines.length));
    const column = where?.[2] ? Number(where[2]) : undefined;
    let message = raw.replace(/^Parsing failed:\s*/i, '');
    // Jison: the text after its own excerpt and caret line.
    const jison = /^Parse error on line \d+:\n[^\n]*\n-*\^\n?([\s\S]*)$/.exec(message);
    if (jison) message = jison[1];
    // Langium: drop the lexer noise and the position, which the title gives.
    message = message
      .replace(/Lexer error on line \d+, column \d+:[^.]*\.[^.]*\.\s*/gi, '')
      .replace(/^\s*Parse error on line [\d?]+, column [\d?]+:\s*/i, '')
      // Jison lists every token it would have accepted; four make the point.
      .replace(/^(Expecting (?:'[^']*', ){4})(?:'[^']*', )+/, '$1…, ')
      .trim();
    failure.message = message.length > 300 ? `${message.slice(0, 297)}…` : message;
    if (failure.line && lines[failure.line - 1] !== undefined) {
      const gutter = `${failure.line} | `;
      const source = lines[failure.line - 1];
      failure.excerpt = gutter + source;
      if (column && column <= source.length + 1) failure.excerpt += `\n${' '.repeat(gutter.length + column - 1)}^`;
    }
  }
  return failure;
}
