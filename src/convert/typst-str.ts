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
    else if (ch === '\n') out += ' ';
    else if (ch === '\r') continue;
    else if (ch === '\t') out += ' ';
    else if (cp < 0x20 || cp === 0x7f) out += `\\u{${cp.toString(16)}}`;
    else out += ch;
  }
  return out + '"';
}

/** A Typst length literal from a number of points, guarding against NaN. */
export function pt(value: number, fallback: number): string {
  return `${Number.isFinite(value) ? value : fallback}pt`;
}
