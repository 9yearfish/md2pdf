/**
 * Mermaid diagrams are rendered to SVG in the page and handed to Typst as
 * vector art, so diagram text stays selectable and sharp in the PDF.
 */
let mermaidReady: Promise<typeof import('mermaid').default> | null = null;

/** Diagram labels should use the same faces as the surrounding prose. */
const DIAGRAM_FONT = 'Noto Sans, Noto Sans SC';

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        // User Markdown is untrusted input.
        securityLevel: 'strict',
        // Must be top level: nesting this under `flowchart` is silently ignored
        // and labels come out as <foreignObject>, which renders as blank space
        // in a PDF.
        htmlLabels: false,
        flowchart: { htmlLabels: false, useMaxWidth: false },
        sequence: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
        class: { useMaxWidth: false },
        fontFamily: DIAGRAM_FONT,
      });
      return mermaid;
    });
  }
  return mermaidReady;
}

export interface RenderedDiagram {
  svg: string;
  /** Intrinsic size in points. */
  width: number;
  height: number;
}

const PX_TO_PT = 0.75;
let counter = 0;

/**
 * Mermaid sizes its output in pixels and leans on a `style` attribute for
 * scaling; Typst needs an explicit intrinsic size instead.
 */
function normalize(svg: string): RenderedDiagram {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName === 'parsererror') throw new Error('mermaid produced invalid SVG');

  const viewBox = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  const width = viewBox[2] || Number(root.getAttribute('width')) || 600;
  const height = viewBox[3] || Number(root.getAttribute('height')) || 400;

  root.setAttribute('width', String(width));
  root.setAttribute('height', String(height));
  // `style="max-width:..."` would otherwise fight the width Typst assigns.
  root.removeAttribute('style');

  return {
    svg: new XMLSerializer().serializeToString(doc),
    width: width * PX_TO_PT,
    height: height * PX_TO_PT,
  };
}

export async function renderDiagram(code: string): Promise<RenderedDiagram> {
  const mermaid = await loadMermaid();
  const id = `md2pdf-diagram-${counter++}`;
  const { svg } = await mermaid.render(id, code);
  return normalize(svg);
}

/** Mermaid leaves its measuring sandbox behind on failure. */
export function cleanupMermaidArtifacts(): void {
  for (const node of document.querySelectorAll('[id^="dmd2pdf-diagram-"]')) node.remove();
}
