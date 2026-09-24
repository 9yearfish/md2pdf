/**
 * Formulas in the live preview, as MathML.
 *
 * Temml turns LaTeX into MathML, which every current browser lays out
 * natively, so no layout script or font set has to ship: this chunk is about
 * 40 KB compressed, against well over 100 KB for KaTeX with its CSS and fonts.
 * It is imported only when a document contains maths.
 */
import temml from 'temml';
import './math.css';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

/**
 * MathML for one formula. A formula Temml cannot parse is shown as its source,
 * marked as an error, so one typo never blanks the rest of the preview.
 */
export function renderFormula(tex: string, display: boolean, describe: (detail: string) => string): string {
  try {
    return temml.renderToString(tex, {
      displayMode: display,
      throwOnError: true,
      // No \href, \class, \style and friends: document text never becomes markup.
      trust: false,
    });
  } catch (error) {
    const detail = String((error as { message?: unknown })?.message ?? error).replace(/^Temml parse error:\s*/i, '');
    return `<span class="math-error" title="${escapeHtml(describe(detail))}">${escapeHtml(tex)}</span>`;
  }
}
