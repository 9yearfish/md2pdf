/**
 * Every piece of user text reaches Typst as a quoted string literal rather than
 * as markup. Typst's markup mode has a large set of special characters (`#`,
 * `$`, `*`, `_`, `@`, backtick, brackets...) and getting an escape table subtly
 * wrong would corrupt documents; string literals only need `\` and `"` escaped,
 * so this is both simpler and safe by construction.
 */
export function tstr(value: string): string {
  let out = '"';
  for (const ch of value) {
    const cp = ch.codePointAt(0)!;
    if (ch === '\\') out += '\\\\';
    else if (ch === '"') out += '\\"';
    else if (ch === '\n') out += '\\n'; // must survive: code blocks rely on it
    else if (ch === '\t') out += '\\t';
    else if (ch === '\r') continue;
    else if (cp < 0x20 || cp === 0x7f) out += `\\u{${cp.toString(16)}}`;
    else out += ch;
  }
  return out + '"';
}

/**
 * The same literal placed in *markup* position, where a bare `"..."` would be
 * read as literal text and picked up by Typst's smart quotes. The leading `#`
 * is what makes Typst evaluate it as a string expression instead.
 */
export function tmarkup(value: string): string {
  return '#' + tstr(value);
}
