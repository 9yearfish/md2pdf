/**
 * Explicit page breaks, as a block rule: a line holding nothing but
 *
 *   \pagebreak   \newpage   \clearpage   <!-- pagebreak -->
 *   <div style="page-break-after: always"></div>   (or -before, or break-after: page)
 *
 * becomes a `page_break` token. Raw HTML is off in the parser, so the HTML
 * spellings are recognised here as text, never passed through. Being a block
 * rule, a marker inside a fenced or indented code block stays code, and one
 * can end a paragraph without a blank line. Only top-level markers count:
 * Typst cannot break a page inside a list or quote.
 */
import type { MarkdownIt } from 'markdown-it';

const MARKER =
  /^(?:\\(?:pagebreak|newpage|clearpage)|<!--\s*(?:pagebreak|page-break|newpage)\s*-->|<div\s+style\s*=\s*(["'])\s*(?:page-)?break-(?:after|before)\s*:\s*(?:always|page)\s*;?\s*\1\s*(?:\/>|>\s*<\/div>))$/i;

export function isPageBreak(line: string): boolean {
  return MARKER.test(line.trim());
}

export function pageBreaks(md: MarkdownIt): void {
  md.block.ruler.before(
    'paragraph',
    'page_break',
    (state, startLine, _endLine, silent) => {
      if (state.level > 0 || state.sCount[startLine] - state.blkIndent >= 4) return false;
      const line = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]);
      if (!isPageBreak(line)) return false;
      if (silent) return true;
      const token = state.push('page_break', 'div', 0);
      token.map = [startLine, startLine + 1];
      token.markup = line.trim();
      token.block = true;
      state.line = startLine + 1;
      return true;
    },
    { alt: ['paragraph'] },
  );
  md.renderer.rules.page_break = (tokens, idx, _options, _env, self) =>
    `<div class="page-break" role="separator"${self.renderAttrs(tokens[idx])}></div>\n`;
}
