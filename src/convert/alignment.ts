/**
 * Safe block alignment shared by the HTML preview and Typst output.
 *
 * There is no CommonMark alignment syntax, so accept the two families people
 * actually paste into Markdown documents:
 *
 *   ::: {.center}                  Pandoc / Quarto fenced div
 *   ::: center                     Pandoc's single-class shorthand
 *   <p align="center">...</p>      GitHub-style raw HTML
 *   <div style="text-align:right"> ordinary HTML copied from elsewhere
 *
 * Raw HTML remains disabled. We recognise only alignment containers, discard
 * their attributes, parse their contents as Markdown, and pass one of three
 * fixed values to CSS and Typst.
 */
import type { MarkdownIt, StateBlock } from 'markdown-it';

export type BlockAlignment = 'left' | 'center' | 'right';

interface BlockStart {
  align: BlockAlignment;
  close: RegExp;
  markup: string;
}

const ALIGNS = new Set<BlockAlignment>(['left', 'center', 'right']);

function asAlignment(value: string): BlockAlignment | null {
  const normalized = value.toLowerCase();
  return ALIGNS.has(normalized as BlockAlignment) ? (normalized as BlockAlignment) : null;
}

function classAlignment(value: string): BlockAlignment | null {
  for (const name of value.split(/\s+/)) {
    const normalized = name.replace(/^\./, '').toLowerCase();
    const direct = asAlignment(normalized);
    if (direct) return direct;
    const utility = /^(?:text|align)-(left|center|right)$/.exec(normalized);
    if (utility) return utility[1] as BlockAlignment;
    if (normalized === 'centered') return 'center';
  }
  return null;
}

/** Read only a fixed alignment value; every other attribute is discarded. */
function alignmentFromSpec(raw: string): BlockAlignment | null {
  let spec = raw.trim();
  if (spec.startsWith('{') && spec.endsWith('}')) spec = spec.slice(1, -1).trim();
  const direct = classAlignment(spec);
  if (direct) return direct;

  const align = /\balign\s*=\s*(?:"(left|center|right)"|'(left|center|right)'|(left|center|right)\b)/i.exec(spec);
  if (align) return asAlignment(align[1] || align[2] || align[3]);

  const style = /\btext-align\s*:\s*(left|center|right)\b/i.exec(spec);
  if (style) return asAlignment(style[1]);

  const classes = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(spec);
  return classes ? classAlignment(classes[1] || classes[2]) : null;
}

function lineAt(state: StateBlock, line: number): string {
  return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

function blockStart(line: string): BlockStart | null {
  const fence = /^(:{3,})\s*(.*?)\s*$/.exec(line);
  if (fence && fence[2]) {
    const align = alignmentFromSpec(fence[2]);
    if (align) return { align, close: /^:{3,}\s*$/, markup: fence[1] };
  }

  if (/^<center\s*>$/i.test(line)) return { align: 'center', close: /^<\/center\s*>$/i, markup: '<center>' };

  const html = /^<(div|p)\b([^>]*)>\s*$/i.exec(line);
  if (!html) return null;
  const align = alignmentFromSpec(html[2]);
  if (!align) return null;
  return { align, close: new RegExp(`^<\\/${html[1]}\\s*>$`, 'i'), markup: `<${html[1]}>` };
}

function pushAlignOpen(state: StateBlock, align: BlockAlignment, startLine: number, endLine: number, markup: string): void {
  const open = state.push('align_open', 'div', 1);
  open.block = true;
  open.markup = markup;
  open.map = [startLine, endLine];
  open.meta = { align };
  open.attrSet('class', `md-align md-align-${align}`);
}

function pushAlignClose(state: StateBlock, markup: string): void {
  const close = state.push('align_close', 'div', -1);
  close.block = true;
  close.markup = markup;
}

function pushInlineBlock(state: StateBlock, tag: string, content: string, line: number): void {
  const heading = /^h[1-6]$/.test(tag);
  const type = heading ? 'heading' : 'paragraph';
  const open = state.push(`${type}_open`, heading ? tag : 'p', 1);
  open.block = true;
  open.map = [line, line + 1];

  const inline = state.push('inline', '', 0);
  inline.content = content.trim();
  inline.map = [line, line + 1];
  inline.children = [];

  const close = state.push(`${type}_close`, heading ? tag : 'p', -1);
  close.block = true;
}

/** One-line GitHub forms such as `<h1 align="center">Title</h1>`. */
function inlineHtml(state: StateBlock, line: number, silent: boolean): boolean {
  const source = lineAt(state, line);
  const center = /^<center\s*>(.*?)<\/center\s*>\s*$/i.exec(source);
  const html = /^<(div|p|h[1-6])\b([^>]*)>(.*?)<\/\1\s*>\s*$/i.exec(source);
  const align = center ? 'center' : html ? alignmentFromSpec(html[2]) : null;
  if (!align) return false;
  if (silent) return true;

  const tag = center ? 'p' : html![1].toLowerCase();
  const content = center ? center[1] : html![3];
  pushAlignOpen(state, align, line, line + 1, center ? '<center>' : `<${tag}>`);
  pushInlineBlock(state, tag, content, line);
  pushAlignClose(state, center ? '</center>' : `</${tag}>`);
  state.line = line + 1;
  return true;
}

function alignmentBlock(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  if (inlineHtml(state, startLine, silent)) return true;

  const start = blockStart(lineAt(state, startLine));
  if (!start) return false;
  let closeLine = startLine + 1;
  for (; closeLine < endLine; closeLine++) {
    if (state.sCount[closeLine] < state.blkIndent) return false;
    if (state.sCount[closeLine] - state.blkIndent < 4 && start.close.test(lineAt(state, closeLine))) break;
  }
  if (closeLine >= endLine) return false;
  if (silent) return true;

  pushAlignOpen(state, start.align, startLine, closeLine + 1, start.markup);
  const oldParent = state.parentType;
  const oldLineMax = state.lineMax;
  try {
    state.parentType = 'alignment';
    state.lineMax = closeLine;
    state.md.block.tokenize(state, startLine + 1, closeLine);
  } finally {
    state.parentType = oldParent;
    state.lineMax = oldLineMax;
  }
  pushAlignClose(state, lineAt(state, closeLine).trim());
  state.line = closeLine + 1;
  return true;
}

export function alignmentBlocks(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'alignment_block', alignmentBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
}
