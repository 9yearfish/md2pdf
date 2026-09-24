/**
 * YAML front matter, read by a deliberately small parser.
 *
 * Front matter is a handful of `key: value` lines, so a full YAML library
 * (tens of KB, with tags, anchors and type coercions nobody writing a title
 * page needs) is not worth shipping. This reads the part of YAML people
 * actually put there:
 *
 *   key: plain value            # comments are ignored
 *   key: "double quoted\n"      # JSON-style escapes
 *   key: 'single quoted'        # '' is a quote
 *   key: [a, "b", c]            # flow lists
 *   key:                        # block lists; `- name: X` items give X
 *     - item
 *   key: |                      # literal block, newlines kept
 *     ...
 *   key: >                      # folded block, single newlines become spaces
 *     ...
 *
 * plus `true/false/yes/no/on/off`, numbers, and plain values continued on
 * more-indented lines. Nothing is ever evaluated. A line it cannot read is
 * reported by number and skipped; the rest of the block still applies.
 */

export type FrontMatterValue = string | number | boolean | null | FrontMatterValue[];

export interface FrontMatterIssue {
  /** 1-based line in the document. */
  line: number;
  kind: 'syntax' | 'value' | 'unclosed';
  key?: string;
  value?: string;
}

export interface FrontMatter {
  data: Map<string, FrontMatterValue>;
  /** The key each value was given under, as written (for messages). */
  lines: Map<string, number>;
  issues: FrontMatterIssue[];
  /** Number of lines the block takes, fences included. */
  length: number;
}

const OPEN = /^﻿?---[ \t]*$/;
const CLOSE = /^(?:---|\.\.\.)[ \t]*$/;
const KEY_LINE = /^([A-Za-z_][\w.-]*)[ \t]*:(?:[ \t]+(.*)|[ \t]*)$/;
/** Front matter longer than this is not front matter but a document with a rule in it. */
const MAX_LINES = 500;

const indentOf = (line: string) => /^[ \t]*/.exec(line)![0].replace(/\t/g, '  ').length;
const isBlank = (line: string) => /^\s*(?:#.*)?$/.test(line);

/**
 * Where the block ends: -1 if there is none, -2 if it opens like front matter
 * but never closes. A document that merely starts with a horizontal rule is
 * not front matter: the first content line must be a key.
 */
function findBlock(lines: string[]): number {
  if (!OPEN.test(lines[0] ?? '')) return -1;
  let firstContent = -1;
  for (let i = 1; i < Math.min(lines.length, MAX_LINES); i++) {
    if (CLOSE.test(lines[i])) return firstContent === -1 ? -1 : i;
    if (firstContent === -1 && !isBlank(lines[i])) {
      if (!KEY_LINE.test(lines[i].trim())) return -1;
      firstContent = i;
    }
  }
  return firstContent === -1 ? -1 : -2;
}

/** Quick test, without parsing: does the text open with a front matter block? */
export function hasFrontMatter(source: string): boolean {
  return findBlock(source.slice(0, 40_000).split('\n', MAX_LINES).map(l => l.replace(/\r$/, ''))) > 0;
}

/** Strip a trailing ` # comment` from a plain scalar. */
function stripComment(text: string): string {
  const at = text.search(/(^|[ \t])#/);
  return (at === -1 ? text : text.slice(0, at)).trim();
}

function unescapeDouble(body: string): string {
  return body.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_m, e: string) => {
    if (e.length > 1) return String.fromCharCode(parseInt(e.slice(1), 16));
    return ({ n: '\n', t: '\t', r: '', '0': '', '"': '"', '\\': '\\', '/': '/', ' ': ' ' } as Record<string, string>)[e] ?? e;
  });
}

/** A quoted scalar at the start of `text`: its value and what follows it. */
function readQuoted(text: string): { value: string; rest: string } | null {
  const quote = text[0];
  if (quote === '"') {
    const m = /^"((?:[^"\\]|\\.)*)"/.exec(text);
    return m ? { value: unescapeDouble(m[1]), rest: text.slice(m[0].length) } : null;
  }
  if (quote === "'") {
    const m = /^'((?:[^']|'')*)'/.exec(text);
    return m ? { value: m[1].replace(/''/g, "'"), rest: text.slice(m[0].length) } : null;
  }
  return null;
}

function plainScalar(text: string): FrontMatterValue {
  const value = text.trim();
  if (value === '' || value === '~' || /^null$/i.test(value)) return null;
  if (/^(?:true|yes|on)$/i.test(value)) return true;
  if (/^(?:false|no|off)$/i.test(value)) return false;
  if (/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value)) return Number(value);
  return value;
}

/** A single-line value: quoted, flow list or plain. `null` result means unreadable. */
function inlineValue(text: string): { value: FrontMatterValue } | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
    const quoted = readQuoted(trimmed);
    if (!quoted || stripComment(quoted.rest) !== '') return null;
    return { value: quoted.value };
  }
  if (trimmed.startsWith('[')) {
    const items: FrontMatterValue[] = [];
    let rest = trimmed.slice(1).trim();
    while (rest && !rest.startsWith(']')) {
      let item: FrontMatterValue;
      if (rest.startsWith('"') || rest.startsWith("'")) {
        const quoted = readQuoted(rest);
        if (!quoted) return null;
        item = quoted.value;
        rest = quoted.rest.trim();
      } else {
        const m = /^[^,\]]*/.exec(rest)!;
        item = plainScalar(m[0]);
        rest = rest.slice(m[0].length).trim();
      }
      items.push(item);
      if (rest.startsWith(',')) rest = rest.slice(1).trim();
      else if (!rest.startsWith(']')) return null;
    }
    if (!rest.startsWith(']') || stripComment(rest.slice(1)) !== '') return null;
    return { value: items };
  }
  if (trimmed.startsWith('{')) return null; // flow maps: not something front matter here needs
  return { value: plainScalar(stripComment(trimmed)) };
}

/** `|` / `>` block scalars. */
function blockScalar(lines: string[], style: string, parentIndent: number): string {
  const body = lines.map(l => l.replace(/\t/g, '  '));
  const indent = Math.min(...body.filter(l => l.trim()).map(indentOf), Infinity);
  const text = body.map(l => (l.trim() ? l.slice(Number.isFinite(indent) ? indent : parentIndent) : ''));
  const keepTrailing = style.includes('+');
  let out: string;
  if (style.startsWith('|')) out = text.join('\n');
  else {
    // Folded: lines join with a space, blank lines stay paragraph breaks.
    out = '';
    for (const line of text) {
      if (line === '') out += '\n';
      else out += out === '' || out.endsWith('\n') ? line : ` ${line}`;
    }
  }
  return keepTrailing ? out : out.replace(/\s+$/, '');
}

export function parseFrontMatter(source: string): FrontMatter | null {
  const lines = source.slice(0, 200_000).split('\n', MAX_LINES + 1).map(l => l.replace(/\r$/, ''));
  const end = findBlock(lines);
  if (end === -1) return null;
  if (end === -2) {
    // Read as Markdown, as it always was, but say why nothing applied.
    return { data: new Map(), lines: new Map(), issues: [{ line: 1, kind: 'unclosed' }], length: 0 };
  }

  const data = new Map<string, FrontMatterValue>();
  const where = new Map<string, number>();
  const issues: FrontMatterIssue[] = [];
  let i = 1;
  while (i < end) {
    const raw = lines[i];
    if (isBlank(raw)) {
      i++;
      continue;
    }
    const m = indentOf(raw) === 0 ? KEY_LINE.exec(raw.trimEnd()) : null;
    if (!m) {
      issues.push({ line: i + 1, kind: 'syntax' });
      i++;
      // Skip whatever belongs to the unreadable line.
      while (i < end && (isBlank(lines[i]) || indentOf(lines[i]) > 0)) i++;
      continue;
    }
    const key = m[1].toLowerCase();
    const inline = (m[2] ?? '').trim();
    const keyLine = i + 1;
    i++;
    // Everything more indented than the key belongs to it.
    const start = i;
    while (i < end && (lines[i].trim() === '' || indentOf(lines[i]) > 0)) i++;
    let nested = lines.slice(start, i);
    while (nested.length && nested[nested.length - 1].trim() === '') nested.pop();
    i = start + nested.length;

    let value: FrontMatterValue | undefined;
    if (/^[|>][+-]?\d?\s*(?:#.*)?$/.test(inline)) {
      value = blockScalar(nested, inline, 2);
    } else if (inline !== '' && !inline.startsWith('#')) {
      const parsed = inlineValue(inline);
      if (!parsed) {
        issues.push({ line: keyLine, kind: 'syntax', key });
        continue;
      }
      value = parsed.value;
      // A plain scalar may continue on more-indented lines.
      const more = nested.filter(l => l.trim() && !/^\s*#/.test(l));
      if (more.length) {
        if (typeof value === 'string' && !/^["'[]/.test(inline)) value = [value, ...more.map(l => stripComment(l))].join(' ');
        else issues.push({ line: keyLine + 1, kind: 'syntax', key });
      }
    } else {
      const items = nested.filter(l => l.trim() && !/^\s*#/.test(l));
      if (!items.length) value = null;
      else if (items.every(l => /^\s*-(?:\s|$)/.test(l) || !/^\s*-/.test(l))) {
        const list: FrontMatterValue[] = [];
        let bad = false;
        for (const item of items) {
          const listItem = /^\s*-(?:\s+(.*))?$/.exec(item);
          if (!listItem) continue; // a continuation such as `  affiliation: ...` of a map item
          const text = (listItem[1] ?? '').trim();
          // `- name: Ada` (a list of maps): the first value names the item.
          const pair = /^[A-Za-z_][\w.-]*\s*:\s+(.*)$/.exec(text);
          const parsed = inlineValue(pair ? pair[1] : text);
          if (!parsed) bad = true;
          else list.push(parsed.value);
        }
        if (bad) issues.push({ line: keyLine, kind: 'syntax', key });
        value = list;
      } else {
        issues.push({ line: keyLine, kind: 'syntax', key });
        continue;
      }
    }
    data.set(key, value ?? null);
    where.set(key, keyLine);
  }
  return { data, lines: where, issues, length: end + 1 };
}

/**
 * The document without its front matter. The block's lines are blanked
 * rather than removed, so line numbers (scroll sync, `data-line`) still match
 * the editor.
 */
export function stripFrontMatterLines(source: string, length: number): string {
  let at = 0;
  for (let n = 0; n < length; n++) {
    const next = source.indexOf('\n', at);
    if (next === -1) return '\n'.repeat(length - 1);
    at = next + 1;
  }
  return '\n'.repeat(length) + source.slice(at);
}
