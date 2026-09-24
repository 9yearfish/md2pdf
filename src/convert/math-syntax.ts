/**
 * Maths syntax for markdown-it, shared by the preview and the PDF.
 *
 *  - inline `$...$`, and `$$...$$` inside a paragraph (typeset as display);
 *  - display `$$...$$` as a block, on one line or several;
 *  - LaTeX-style `\(...\)` inline and `\[...\]` display, as pasted from chat
 *    assistants;
 *  - ```math fenced blocks are ordinary fences and are handled where fences are.
 *
 * Only the syntax is recognised here. Rendering is lazy on both sides, so a
 * document without maths never loads anything maths-related.
 *
 * Currency must not turn into maths, so single dollars follow the rules
 * Pandoc and markdown-it-dollarmath use: the opening `$` is followed by a
 * non-space, the closing `$` is preceded by a non-space and not followed by a
 * digit. "$5 and $10" stays text. `\$` is an ordinary escaped dollar.
 */
import type { MarkdownIt, StateBlock, StateInline } from 'markdown-it';

const SPACE = /\s/;
const DIGIT = /\d/;

/** Index of `close` at or after `from`, skipping backslash escapes; -1 if none. */
function findClose(src: string, from: number, close: string, max: number): number {
  for (let i = from; i < max; i++) {
    if (src.startsWith(close, i)) return i;
    if (src[i] === '\\') i++;
  }
  return -1;
}

function inlineMath(state: StateInline, silent: boolean): boolean {
  const { src, pos, posMax } = state;
  const ch = src[pos];
  let open: string;
  let close: string;
  let display: boolean;
  if (ch === '$') {
    display = src[pos + 1] === '$';
    open = close = display ? '$$' : '$';
  } else if (ch === '\\' && (src[pos + 1] === '(' || src[pos + 1] === '[')) {
    display = src[pos + 1] === '[';
    open = src.slice(pos, pos + 2);
    close = display ? '\\]' : '\\)';
  } else {
    return false;
  }

  const start = pos + open.length;
  if (open === '$' && (start >= posMax || SPACE.test(src[start]))) return false;
  let end = start;
  for (;;) {
    end = findClose(src, end, close, posMax);
    if (end < 0) return false;
    if (open !== '$' || (!SPACE.test(src[end - 1]) && !DIGIT.test(src[end + 1] ?? ''))) break;
    end++;
  }
  const content = src.slice(start, end);
  if (!content.trim()) return false;

  if (!silent) {
    const token = state.push('math_inline', 'math', 0);
    token.content = content.trim();
    token.markup = open;
    token.meta = { display };
  }
  state.pos = end + close.length;
  return true;
}

function blockMath(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  const lineStart = state.bMarks[startLine] + state.tShift[startLine];
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const src = state.src;
  const first = src.slice(lineStart, state.eMarks[startLine]);
  const open = first.startsWith('$$') ? '$$' : first.startsWith('\\[') ? '\\[' : null;
  if (!open) return false;
  const close = open === '$$' ? '$$' : '\\]';

  // The closing marker must end a line: the opening one's, or a later one's.
  // Text after a closing marker on the first line (`$$a$$ is...`) or a blank
  // line before any closing marker means this is not a display block.
  let line = startLine;
  let text = first.slice(open.length);
  const parts: string[] = [];
  for (;;) {
    const trimmed = text.trimEnd();
    if (trimmed.endsWith(close)) {
      parts.push(trimmed.slice(0, -close.length));
      break;
    }
    if (line === startLine && text.includes(close)) return false;
    parts.push(text);
    if (++line >= endLine || state.isEmpty(line) || state.sCount[line] < state.blkIndent) return false;
    text = src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
  }
  const content = parts.join('\n').trim();
  if (!content) return false;
  if (silent) return true;

  const token = state.push('math_block', 'math', 0);
  token.block = true;
  token.content = content;
  token.markup = open;
  token.map = [startLine, line + 1];
  state.line = line + 1;
  return true;
}

export function mathPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('escape', 'math_inline', inlineMath);
  md.block.ruler.before('fence', 'math_block', blockMath, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
}

/** A ```math fence. */
export const isMathFence = (info: string): boolean => info.trim().split(/\s+/)[0] === 'math';
