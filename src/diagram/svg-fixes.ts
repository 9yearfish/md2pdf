/**
 * Repairs for Mermaid's SVG before resvg (inside Typst) draws it. Loaded with
 * Mermaid, not with the page; see `mermaid.ts`.
 */

/** A label Typst sets over the diagram. Units are SVG pixels from the top left. */
export interface TextOverlay {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  bold: boolean;
  /** CSS rgb() components, 0-255. */
  fill: [number, number, number];
  lines: string[];
}

const INDIC = /[\u0900-\u0dff]/;

/**
 * resvg cannot shape Indic scripts: vowel signs that are drawn before their
 * consonant land in the wrong place and spaces vanish, even in a label of one
 * word. The browser shapes them correctly and Typst does too, so for the PDF
 * those labels are taken out of the SVG, measured here, and set by Typst in
 * the same boxes (see `emit.ts`). They stay real, selectable text.
 */
export function liftIndicLabels(svg: string): { pdfSvg: string; overlays: TextOverlay[] } {
  if (!INDIC.test(svg)) return { pdfSvg: svg, overlays: [] };
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-100000px;top:0;visibility:hidden;pointer-events:none';
  host.innerHTML = svg;
  document.body.appendChild(host);
  const overlays: TextOverlay[] = [];
  try {
    const root = host.querySelector('svg');
    if (!root) return { pdfSvg: svg, overlays };
    const rootBox = root.getBoundingClientRect();
    const scaleX = rootBox.width ? Number(root.getAttribute('width')) / rootBox.width : 1;
    const scaleY = rootBox.height ? Number(root.getAttribute('height')) / rootBox.height : 1;
    for (const text of [...root.querySelectorAll('text')]) {
      if (!INDIC.test(text.textContent ?? '')) continue;
      const box = text.getBoundingClientRect();
      const style = getComputedStyle(text);
      const rows = [...text.children].filter(c => c.localName === 'tspan');
      const lines = (rows.length ? rows.map(r => r.textContent ?? '') : [text.textContent ?? ''])
        .map(line => line.trim())
        .filter(Boolean);
      const fill = (style.fill.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
      overlays.push({
        x: (box.left - rootBox.left) * scaleX,
        y: (box.top - rootBox.top) * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY,
        fontSize: parseFloat(style.fontSize) || 16,
        bold: Number(style.fontWeight) >= 600 || style.fontWeight === 'bold',
        fill: [fill[0] ?? 0, fill[1] ?? 0, fill[2] ?? 0],
        lines,
      });
      text.remove();
    }
    return { pdfSvg: new XMLSerializer().serializeToString(root), overlays };
  } finally {
    host.remove();
  }
}

const RTL = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/;
const COMPLEX = /[\u0590-\u08ff\u0e00-\u0eff\ufb1d-\ufdff\ufe70-\ufeff]/;

/** `a + b` for two SVG lengths in the same unit, else null. */
function addLengths(a: string | null, b: string | null): string | null {
  const parse = (v: string | null) => /^\s*(-?[\d.]+)(em|px)?\s*$/.exec(v ?? '0');
  const x = parse(a);
  const y = parse(b);
  if (!x || !y) return null;
  const unit = x[2] || y[2] || '';
  if ((x[2] || unit) !== unit || (y[2] || unit) !== unit) return null;
  if (a === null && b === null) return null;
  return `${Number((Number(x[1]) + Number(y[1])).toFixed(4))}${unit}`;
}

/**
 * Work around two resvg bugs with the way Mermaid writes label text:
 *
 * - Each line of a label is a <tspan> positioned with x/y/dy. resvg applies
 *   a `dy` to the logical first character only, which in right-to-left text
 *   is drawn last, so the first letter of every Arabic or Hebrew label lands
 *   on a line of its own. Each line of such a label becomes its own <text>,
 *   with the offset folded into an absolute `y`.
 * - Each word is its own <tspan>. resvg shapes a line once per span and
 *   copies glyphs across by position, which scrambles scripts whose glyphs
 *   join (Arabic). Words with identical styling are merged back into one span.
 * Indic labels are beyond repair in resvg and are set by Typst instead; see
 * `liftIndicLabels`.
 */
export function repairComplexLabels(doc: Document): void {
  for (const text of [...doc.getElementsByTagName('text')]) {
    const content = text.textContent ?? '';
    if (!COMPLEX.test(content)) continue;
    const rows = [...text.children].filter(child => child.localName === 'tspan');
    for (const row of rows) mergeWords(row);
    if (!RTL.test(content)) continue;
    const positioned = rows.filter(row => row.hasAttribute('x') || row.hasAttribute('y') || row.hasAttribute('dy'));
    if (positioned.length === 0) continue;
    for (const row of positioned) {
      const line = text.cloneNode(false) as Element;
      const y = addLengths(row.getAttribute('y') ?? text.getAttribute('y'), row.getAttribute('dy'));
      if (y !== null) {
        line.setAttribute('y', y);
        row.removeAttribute('y');
        row.removeAttribute('dy');
      }
      for (const name of ['x', 'y', 'dx', 'dy', 'text-anchor']) {
        const value = row.getAttribute(name);
        if (value !== null) {
          line.setAttribute(name, value);
          row.removeAttribute(name);
        }
      }
      line.appendChild(row);
      text.parentNode!.insertBefore(line, text);
    }
    if (!(text.textContent ?? '').trim()) text.remove();
  }
}

function mergeWords(row: Element): void {
  const words = [...row.children];
  if (words.length < 2 || words.some(w => w.localName !== 'tspan' || w.children.length > 0)) return;
  const signature = (el: Element) =>
    [...el.attributes].filter(a => a.name !== 'class').map(a => `${a.name}=${a.value}`).sort().join(';');
  const first = signature(words[0]);
  if (words.some(w => signature(w) !== first)) return;
  words[0].textContent = words.map(w => w.textContent ?? '').join('');
  for (const extra of words.slice(1)) row.removeChild(extra);
}
