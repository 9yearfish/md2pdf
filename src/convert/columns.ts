/** Explicit two-column blocks, using Pandoc-style nested fenced divs.
 * Four colons enclose the row; three enclose each column. Fences in code
 * remain literal, and raw HTML / attributes are never evaluated.
 */
import type { MarkdownIt, StateBlock } from 'markdown-it';

export function columnBlocks(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'column_block', (state: StateBlock, start, end, silent) => {
    if (state.sCount[start] - state.blkIndent >= 4) return false;
    const line = (n: number) => state.src.slice(state.bMarks[n] + state.tShift[n], state.eMarks[n]);
    const opening = /^(::::)\s+(columns|signatures)\s*$|^(:::)\s+column\s*$/.exec(line(start));
    if (!opening) return false;
    const column = !!opening[3];
    if (column && state.parentType !== 'columns') return false;
    if (!column && state.level !== 0) return false;
    const marker = column ? ':::' : '::::';
    let close = start + 1;
    let code: { char: string; length: number } | undefined;
    for (; close < end; close++) {
      if (state.sCount[close] < state.blkIndent) return false;
      const text = line(close);
      const fence = /^(`{3,}|~{3,})(.*)$/.exec(text);
      if (code) {
        if (fence && fence[1][0] === code.char && fence[1].length >= code.length && !fence[2].trim()) code = undefined;
        continue;
      }
      if (fence) { code = { char: fence[1][0], length: fence[1].length }; continue; }
      if (state.sCount[close] - state.blkIndent < 4 && text.trim() === marker) break;
    }
    if (close === end) return false;
    if (silent) return true;
    const type = column ? 'column' : 'columns';
    const token = state.push(`${type}_open`, 'div', 1);
    token.block = true;
    token.map = [start, close + 1];
    token.attrSet('class', column ? 'md-column' : `md-columns${opening[2] === 'signatures' ? ' md-signatures' : ''}`);
    const parent = state.parentType;
    const lineMax = state.lineMax;
    try {
      state.parentType = type;
      state.lineMax = close;
      state.md.block.tokenize(state, start + 1, close);
    } finally {
      state.parentType = parent;
      state.lineMax = lineMax;
    }
    state.push(`${type}_close`, 'div', -1).block = true;
    state.line = close + 1;
    return true;
  }, { alt: ['paragraph', 'reference'] });
}
