/**
 * Explicit block alignment, shared by the HTML preview and Typst output:
 *
 *   ::: center
 *   # Contract title
 *   Contract no. 2026-001
 *   :::
 *
 * `left` and `right` are supported as well. Raw HTML stays disabled; the
 * alignment name is a fixed value rather than user-provided CSS or Typst.
 */
import type { MarkdownIt, StateBlock } from 'markdown-it';

export type BlockAlignment = 'left' | 'center' | 'right';

const OPEN = /^:::\s*(left|center|right)\s*$/i;
const CLOSE = /^:::\s*$/;

function lineAt(state: StateBlock, line: number): string {
  return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

function alignmentBlock(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const match = OPEN.exec(lineAt(state, startLine));
  if (!match) return false;

  let closeLine = startLine + 1;
  for (; closeLine < endLine; closeLine++) {
    if (state.sCount[closeLine] < state.blkIndent) return false;
    if (state.sCount[closeLine] - state.blkIndent < 4 && CLOSE.test(lineAt(state, closeLine))) break;
  }
  if (closeLine >= endLine) return false;
  if (silent) return true;

  const align = match[1].toLowerCase() as BlockAlignment;
  const open = state.push('align_open', 'div', 1);
  open.block = true;
  open.markup = ':::';
  open.map = [startLine, closeLine + 1];
  open.meta = { align };
  open.attrSet('class', `md-align md-align-${align}`);

  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = 'alignment';
  state.lineMax = closeLine;
  state.md.block.tokenize(state, startLine + 1, closeLine);
  state.parentType = oldParent;
  state.lineMax = oldLineMax;

  const close = state.push('align_close', 'div', -1);
  close.block = true;
  close.markup = ':::';
  state.line = closeLine + 1;
  return true;
}

export function alignmentBlocks(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'alignment_block', alignmentBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
}
