/**
 * Mermaid diagrams are rendered to SVG in the page and handed to Typst as
 * vector art, so diagram text stays selectable and sharp in the PDF.
 *
 * Fonts need care here, because the label boxes are sized by the browser while
 * the glyphs in the PDF are drawn by Typst's SVG renderer (resvg), and the two
 * pick fonts differently:
 *
 * - The browser falls back character by character through the font-family
 *   list. resvg takes the first family it has, and when that lacks a
 *   character it looks for one fallback face that covers the *whole* label
 *   and, if it finds one, sets every glyph of the label in it. A label such as
 *   "Mermaid 渲染" therefore comes out entirely in the CJK face in the PDF,
 *   Latin included.
 * - So a diagram that contains CJK lists the CJK faces first, and the browser
 *   then measures its Latin with the same CJK face too. Diagrams without CJK
 *   keep Noto Sans first. The other script faces carry a copy of basic Latin
 *   (see prepare_fonts.py), so a mixed Arabic/Latin label shapes as one run.
 * - The faces must be loaded before Mermaid measures, or it measures with
 *   whatever the system substitutes. A render made before they were there is
 *   marked provisional and redone once they are, and a PDF never uses one.
 */
import { loadFaces } from '../preview/fonts';

import type { TextOverlay } from './svg-fixes';

export type { TextOverlay } from './svg-fixes';

type Mermaid = typeof import('mermaid').default;
type SvgFixes = typeof import('./svg-fixes') & typeof import('./svg-print');

let mermaidReady: Promise<{ mermaid: Mermaid; fixes: SvgFixes }> | null = null;

/** Diagram labels should use the same faces as the surrounding prose. */
export const DEFAULT_DIAGRAM_FONT = '"Noto Sans"';

const BASE_CONFIG = {
  startOnLoad: false,
  // User Markdown is untrusted input.
  securityLevel: 'strict',
  // Mermaid 12 otherwise lays flowcharts out with ELK and fetches its 1.4 MB
  // chunk for every diagram.
  layout: 'dagre',
  // Must be top level: nesting this under `flowchart` is silently ignored
  // and labels come out as <foreignObject>, which renders as blank space
  // in a PDF.
  htmlLabels: false,
  // Greys, like the rest of the page and the default PDF; a diagram's own
  // classDef and style colours still apply over it. The page is white
  // whatever the OS theme: never follow dark mode.
  theme: 'neutral',
  darkMode: false,
  flowchart: { htmlLabels: false, useMaxWidth: false },
  sequence: { useMaxWidth: false },
  // Gantt charts otherwise take the width of the sandbox element, i.e. the
  // window, and come out at a third of their size once fitted to the page.
  gantt: { useMaxWidth: false, useWidth: 720 },
  class: { useMaxWidth: false },
  // Their default puts every label in a <foreignObject>.
  journey: { useMaxWidth: false, textPlacement: 'tspan' },
  timeline: { useMaxWidth: false, textPlacement: 'tspan' },
} as const;

function loadMermaid() {
  if (!mermaidReady) {
    // The SVG repairs are only needed once there is a diagram, so they load
    // with Mermaid rather than with the page.
    // The preview's figure markup and styles come along, fetched in parallel.
    void import('./figure');
    mermaidReady = Promise.all([import('mermaid'), import('./svg-fixes'), import('./svg-print')]).then(
      ([{ default: mermaid }, fixes, print]) => {
        mermaid.initialize({ ...BASE_CONFIG, fontFamily: DEFAULT_DIAGRAM_FONT });
        return { mermaid, fixes: { ...fixes, ...print } };
      },
    );
  }
  return mermaidReady;
}

export interface RenderedDiagram {
  svg: string;
  /** Intrinsic size in points. */
  width: number;
  height: number;
  /** Measured before the right faces were available; redo before printing. */
  provisional: boolean;
  /**
   * For the PDF: the SVG without the labels resvg cannot shape, and those
   * labels, measured by the browser, to be set by Typst on top of it.
   */
  pdfSvg: string;
  overlays: TextOverlay[];
}


/** Why a diagram did not render, as far as Mermaid says. */
export interface DiagramFailure extends Error {
  /** 1-based line within the diagram's source, when Mermaid names one. */
  line?: number;
  /** The diagram type Mermaid did not recognise, for an unknown type. */
  unknownType?: string;
  /** The offending source line, numbered, with a caret when the column is known. */
  excerpt?: string;
}

export interface DiagramOptions {
  /** CSS font-family list for the labels. */
  fontFamily?: string;
  /** Reject a provisional render and measure again (for the PDF). */
  final?: boolean;
  /**
   * Whether every web face the labels need is registered. When not, the
   * browser measures with system fonts and the render is provisional.
   */
  facesComplete?: boolean;
}

const PX_TO_PT = 0.75;
let counter = 0;

/**
 * Mermaid sizes its output in pixels and leans on a `style` attribute for
 * scaling; Typst needs an explicit intrinsic size instead.
 */
function normalize(svg: string, provisional: boolean, fixes: SvgFixes): RenderedDiagram {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName === 'parsererror') throw new Error('mermaid produced invalid SVG');

  // Filters, foreignObject and overflowing drawings, before measuring.
  const { width, height } = fixes.prepareForPrint(doc);

  root.setAttribute('width', String(width));
  root.setAttribute('height', String(height));
  // `style="max-width:..."` would otherwise fight the width Typst assigns.
  root.removeAttribute('style');
  fixes.repairComplexLabels(doc);

  const svgText = new XMLSerializer().serializeToString(doc);
  const { pdfSvg, overlays } = fixes.liftIndicLabels(svgText);
  return {
    svg: svgText,
    width: width * PX_TO_PT,
    height: height * PX_TO_PT,
    provisional,
    pdfSvg,
    overlays,
  };
}

/**
 * Mermaid's configuration is global, so renders with different fonts must not
 * interleave.
 */
let queue: Promise<unknown> = Promise.resolve();

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

/**
 * The preview and the PDF render the same diagrams, so each is rendered once
 * per font list. Bounded, because the preview renders every intermediate
 * version as you type.
 */
const rendered = new Map<string, Promise<RenderedDiagram>>();
const CACHE_LIMIT = 32;

export function renderDiagram(code: string, options: DiagramOptions = {}): Promise<RenderedDiagram> {
  const fontFamily = options.fontFamily ?? DEFAULT_DIAGRAM_FONT;
  const key = `${fontFamily}\u0000${code}`;
  const hit = rendered.get(key);
  if (hit && !options.final) return hit;
  const complete = options.facesComplete ?? true;
  if (hit && options.final) {
    return hit.then(diagram => (diagram.provisional ? render(key, code, fontFamily, complete) : diagram));
  }
  return render(key, code, fontFamily, complete);
}

function render(key: string, code: string, fontFamily: string, complete: boolean): Promise<RenderedDiagram> {
  const job = serialized(async () => {
    const { mermaid, fixes } = await loadMermaid();
    const ready = (await loadFaces(fontFamily, labelText(code))) && complete;
    const id = `md2pdf-diagram-${counter++}`;
    try {
      mermaid.initialize({ ...BASE_CONFIG, fontFamily });
      const { svg } = await mermaid.render(id, code);
      return normalize(svg, !ready, fixes);
    } catch (error) {
      cleanupMermaidArtifacts();
      throw fixes.describeError(error, code);
    }
  });
  job.catch(() => rendered.delete(key));
  rendered.delete(key);
  rendered.set(key, job);
  if (rendered.size > CACHE_LIMIT) rendered.delete(rendered.keys().next().value!);
  return job;
}

/** Near enough to the label text for deciding which faces to load. */
function labelText(code: string): string {
  return code.replace(/[-=.>|:;{}()[\]"%]+/g, ' ');
}

/** Mermaid leaves its measuring sandbox behind on failure. */
export function cleanupMermaidArtifacts(): void {
  for (const node of document.querySelectorAll('[id^="dmd2pdf-diagram-"]')) node.remove();
}
