/**
 * Tidies text pasted from an AI chat (ChatGPT, Claude, Gemini, DeepSeek,
 * Copilot, Perplexity) into plain Markdown.
 *
 * Pure and dependency-free: main.ts loads it on the first paste, and
 * scripts/ai-paste.mjs runs it over the fixtures in scripts/fixtures/ai/,
 * which are built from real pasted text (see sources.json there).
 *
 * Conservative by design. Nothing is changed unless the text carries at least
 * one artifact that only AI chat output produces (see `signals`); ordinary
 * Markdown, including `\[`-escaped brackets, `[1]` reference links, bullets
 * and no-break spaces, comes back byte for byte. Inside fenced code only the
 * fence itself is ever repaired (a language label or button caption that
 * leaked into it); the code is not touched.
 */

export type Fix = 'citations' | 'chrome' | 'math' | 'invisible' | 'lists' | 'footnotes';

export interface CleanResult {
  text: string;
  changed: boolean;
  /** What was done, for tests and diagnostics. */
  fixes: Fix[];
}

export type Signal =
  | 'openai-citation'
  | 'bracket-citation'
  | 'gemini-citation'
  | 'bracket-tag-citation'
  | 'tracking-param'
  | 'chrome-line'
  | 'code-chrome'
  | 'display-math'
  | 'inline-math'
  | 'source-list'
  | 'copilot-sources';

/* ---------- vocabulary ---------- */

/** Language labels that AI chats print above a code block. Lower case. */
const LANGUAGES = new Set(
  (
    'bash sh shell zsh fish powershell ps1 pwsh cmd bat batch console terminal text plaintext txt code output ' +
    'python py python3 javascript js jsx mjs typescript ts tsx json jsonc json5 yaml yml toml ini xml html css scss sass less ' +
    'java kotlin kt swift c cpp c++ csharp cs c# go golang rust rs ruby rb php perl lua r scala dart groovy ' +
    'sql mysql pgsql postgresql plsql sqlite graphql markdown md latex tex mermaid diff dockerfile docker makefile make ' +
    'nginx apache vim haskell elixir erlang clojure ocaml fsharp f# matlab mathematica julia vb vba vbnet objectivec objective-c ' +
    'solidity astro svelte vue http env csv regex proto protobuf hcl terraform nix zig nim assembly asm wasm arduino'
  ).split(' '),
);
const LANGUAGE = String.raw`[A-Za-z][A-Za-z0-9_+#.-]{0,19}`;
const isLanguage = (word: string) => LANGUAGES.has(word.trim().toLowerCase());

/** Code-block buttons, glued to a label ("bashCopy code") or on lines of their own. */
const BUTTONS_GLUED = String.raw`(?:Copy code|CopyEdit|CopyDownload|Copy|复制代码|复制编辑|复制)`;
const BUTTON_LINE = /^(?:Copy code|Copy|复制代码|复制|コピー|코드 복사|복사|Copier le code|Code kopieren|Copiar código|Копировать код)$/;
const BUTTON_TAIL = /^(?:Edit|Download|编辑|下载)$/;
const COMBINED_BUTTONS = /^(?:CopyEdit|CopyDownload|复制编辑|复制下载)$/;

/**
 * Whole lines that are chat chrome, never content: reasoning timers, footers
 * under code blocks, disclaimers, page furniture captured by "select all".
 */
const CHROME_LINE = new RegExp(
  '^(?:' +
    [
      String.raw`Thought for (?:\d+m )?\d+(?:\.\d+)?\s?(?:s|seconds?|m|minutes?)`,
      String.raw`Thought for a (?:few|couple of) seconds`,
      String.raw`Worked for \d+ (?:seconds?|minutes?)`,
      String.raw`已深度思考\s*（用时\s*[\d.]+\s*秒）`,
      String.raw`已思考\s*（用时\s*[\d.]+\s*秒）`,
      String.raw`(?:content_copy\s*)?Use code with caution\.?`,
      'content_copy',
      String.raw`ChatGPT can make mistakes\..*`,
      String.raw`Claude can make mistakes\..*`,
      'Skip to content',
      'Chat history',
      'Updated saved memory',
      'Always show details',
      'Analysis errored',
      'Stopped creating image',
      'Presented file',
    ].join('|') +
    ')$',
);

/** OpenAI's citation delimiters: U+E200 opens, U+E202 separates, U+E201 closes. U+EA01..EA02 wrap a short form. */
const PUA_CITATION = /[ \t]?\uE200(?:[^\uE200\uE201\n]{0,300})\uE201|\uEA01\d{1,3}\uEA02/g;
const PUA_DOWNLOAD = /\uE200Download ([^\uE200-\uE202\n]{1,200})\uE201/g;
/** The same markers once the private-use characters are lost, and the other ChatGPT forms. */
const BARE_CITATION = /[ \t]?\b(?:file)?cite(?:turn\d+(?:search|news|image|file|view|fetch|video|ref)\d+)+(?:L\d+-L?\d+)?/g;
const CONTENT_REFERENCE = /\u200B?:contentReference\[oaicite:\d+\]\{index=\d+\}\u200B?/g;
const OAI_CITATION = /[ \t]?\(?\[oai_citation:\d+‡[^\]\n]*\]\([^)\s]*\)\)?/g;
/** ChatGPT browsing and file search, and DeepSeek derivatives: 【4†source】, 【12:3†report.pdf】, 【85†L261-269】. */
const BRACKET_CITATION = /[ \t]?【\d+(?::\d+)?†[^【】\n]{0,60}】/g;
/** Gemini: [cite: 17], [cite: 19, 20], an orphan [cite_start], [span_2](start_span). */
const GEMINI_CITATION = /[ \t]?\[cite:\s?\d+(?:,\s?\d+)*\]|\[cite_start\]|\[span_\d+\]\((?:start|end)_span\)/g;
/** DeepSeek's [citation:3], Perplexity's [web:1] and [attached_file:1]. */
const TAG_CITATION = /[ \t]?\[(?:citation|web|attached_file):\d+\]/g;
const TRACKING = /([?&])utm_source=(?:chatgpt\.com|openai|copilot\.com)(&?)/g;

/* ---------- fenced code ---------- */

const FENCE = /^([ \t]*(?:>[ \t]?)*)(`{3,}|~{3,})([^`]*)$/;

interface Fence {
  char: string;
  length: number;
}

function opening(line: string): (Fence & { info: string; indent: string }) | null {
  const m = FENCE.exec(line);
  return m ? { char: m[2][0], length: m[2].length, info: m[3].trim(), indent: m[1] } : null;
}

function closes(line: string, fence: Fence): boolean {
  const m = FENCE.exec(line);
  return Boolean(m && m[2][0] === fence.char && m[2].length >= fence.length && !m[3].trim());
}

interface Segment {
  code: boolean;
  lines: string[];
}

/**
 * Lines grouped into fenced code (fence lines included) and everything else.
 * Any indentation counts as a fence, including inside list items: protecting
 * too much only means something is left untidied.
 */
function segments(lines: string[]): Segment[] {
  const out: Segment[] = [];
  let current: Segment = { code: false, lines: [] };
  let fence: Fence | null = null;
  const start = (code: boolean) => {
    if (current.lines.length) out.push(current);
    current = { code, lines: [] };
  };
  /** Inside an indented code block: four spaces after a blank line that does not continue a list. */
  let indented = false;
  let lastText = '';
  let blankBefore = true;
  for (const line of lines) {
    if (!fence) {
      const isIndented = /^(?: {4}|\t)/.test(line) && line.trim() !== '';
      if (isIndented && (indented || (blankBefore && !/^\s*(?:[-*+•]|\d{1,3}[.)])\s/.test(lastText) && !/^(?: {2,}|\t)/.test(lastText)))) {
        if (!indented) start(true);
        indented = true;
        current.lines.push(line);
        continue;
      }
      if (indented && line.trim()) {
        indented = false;
        start(false);
      }
      if (line.trim()) lastText = line;
      blankBefore = !line.trim();
      const open = opening(line);
      if (open) {
        start(true);
        fence = open;
      }
      current.lines.push(line);
    } else {
      current.lines.push(line);
      if (closes(line, fence)) {
        fence = null;
        start(false);
      }
    }
  }
  if (current.lines.length) out.push(current);
  return out;
}

/** Prose lines only, for detection. Inline code spans are blanked. */
function proseOf(text: string): string {
  return segments(text.split('\n'))
    .filter(s => !s.code)
    .map(s => s.lines.join('\n').replace(/(`+)[^`\n]*?\1/g, ' '))
    .join('\n');
}

/**
 * Apply `fn` to prose only: inline code spans are cut out, `fn` runs on what
 * remains, and the spans are put back unchanged.
 */
function onProse(text: string, fn: (prose: string) => string): string {
  const spans: string[] = [];
  const masked = text.replace(/(`+)(?!`)[^\n]*?[^`\n]\1(?!`)|(`+)[^`\n]\2(?!`)/g, span => {
    spans.push(span);
    return `\uE000${spans.length - 1}\uE001`;
  });
  return fn(masked).replace(/\uE000(\d+)\uE001/g, (_m, i: string) => spans[Number(i)]);
}

/* ---------- recognising AI output ---------- */

/** Looks like TeX rather than an escaped bracket: a command, a script, an operator. */
const TEX = /\\[a-zA-Z]+|[\^_=<>]|\d\s*[-+*/]\s*\d|[a-zA-Z]\s*[-+*/]\s*[a-zA-Z0-9]/;
const INLINE_MATH = /\\\(([^\n]{1,300}?)\\\)/g;
const DISPLAY_OPEN = /^([ \t]*(?:>[ \t]?)*)\\\[\s*$/;
const DISPLAY_CLOSE = /^[ \t]*(?:>[ \t]?)*\\\]\s*$/;
const DISPLAY_ONE_LINE = /\\\[([^\n]{1,300}?)\\\]/g;
const looksLikeTex = (body: string) => TEX.test(body) || /^\s*[a-zA-Z]\s*$/.test(body);

const GLUED_CHROME = new RegExp(String.raw`^(\s*(?:\`{3,})?)(${LANGUAGE})${BUTTONS_GLUED}(.*)$`);

/**
 * The artifacts in `text` that only AI chat output produces. Anything here
 * means the paste is cleaned; none means it is left exactly as it is. Bare
 * `[1]` markers, bullets, `---`, curly quotes and no-break spaces are not
 * signals: people write those too.
 */
export function signals(text: string): Signal[] {
  const found = new Set<Signal>();
  const prose = proseOf(text);
  const test = (re: RegExp) => new RegExp(re.source).test(prose);
  if (/[\uE200-\uE202\uEA01\uEA02]/.test(text) || test(BARE_CITATION) || test(CONTENT_REFERENCE) || test(OAI_CITATION)) {
    found.add('openai-citation');
  }
  if (test(BRACKET_CITATION)) found.add('bracket-citation');
  if (test(GEMINI_CITATION)) found.add('gemini-citation');
  if (test(TAG_CITATION)) found.add('bracket-tag-citation');
  if (test(TRACKING)) found.add('tracking-param');

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (CHROME_LINE.test(line)) found.add('chrome-line');
    const glued = GLUED_CHROME.exec(lines[i]);
    if (glued && isLanguage(glued[2])) found.add('code-chrome');
    if (stackedChrome(lines, i)) found.add('code-chrome');
  }

  // One label line above a bare fence could be anyone's; two in one paste is Gemini's layout.
  let labels = 0;
  for (let i = 0; i + 1 < lines.length; i++) {
    const below = opening(lines[i + 1]);
    if (below && !below.info && isLanguage(lines[i]) && !/\s/.test(lines[i].trim())) labels++;
  }
  if (labels >= 2) found.add('code-chrome');

  const proseLines = prose.split('\n');
  for (let i = 0; i < proseLines.length; i++) {
    if (DISPLAY_OPEN.test(proseLines[i]) && displayEnd(proseLines, i) > 0) found.add('display-math');
  }
  for (const m of prose.matchAll(DISPLAY_ONE_LINE)) if (TEX.test(m[1])) found.add('display-math');
  for (const m of prose.matchAll(INLINE_MATH)) if (looksLikeTex(m[1])) found.add('inline-math');
  if (sourceList(lines)) found.add('source-list');
  if (copilotSources(lines)) found.add('copilot-sources');
  return [...found];
}

/**
 * A label and button captions on lines of their own, as select-and-copy
 * leaves them above a code block: "python" / "Copy" / "Edit", or "python" /
 * "复制编辑". Returns the index after the captions, or 0.
 */
function stackedChrome(lines: string[], i: number): number {
  if (!isLanguage(lines[i] ?? '') || /\s/.test(lines[i].trim())) return 0;
  let j = i + 1;
  const skipBlank = () => {
    while (j < lines.length && !lines[j].trim()) j++;
  };
  skipBlank();
  const first = (lines[j] ?? '').trim();
  if (COMBINED_BUTTONS.test(first)) return j + 1;
  if (!BUTTON_LINE.test(first)) return 0;
  j++;
  const after = j;
  skipBlank();
  if (BUTTON_TAIL.test((lines[j] ?? '').trim())) return j + 1;
  return after;
}

function displayEnd(lines: string[], i: number): number {
  for (let j = i + 1; j < Math.min(lines.length, i + 60); j++) {
    if (DISPLAY_CLOSE.test(lines[j])) return lines.slice(i + 1, j).some(l => l.trim()) ? j : -1;
    if (DISPLAY_OPEN.test(lines[j])) return -1;
  }
  return -1;
}

/* ---------- code chrome and chat chrome (line level) ---------- */

/**
 * Button captions and language labels that leaked into or around code
 * blocks, and chrome lines. The label moves into the fence's info string
 * where there is a fence; where there is none (plain-text select-and-copy),
 * the captions are dropped and no fence is invented.
 */
function lineChrome(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let fence: (Fence & { at: number; info: string }) | null = null;
  /** Set right after a fence opens without a language, so a label on the next lines can fill it. */
  let bareFenceAt = -1;

  const setLanguage = (at: number, language: string) => {
    const open = opening(out[at])!;
    out[at] = `${open.indent}${open.char.repeat(open.length)}${language.toLowerCase()}`;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (fence) {
      if (closes(line, fence)) {
        fence = null;
        bareFenceAt = -1;
        out.push(line);
        continue;
      }
      if (fence.info && fence.at === out.length - 1) {
        // ```bash  /  bash  /  复制编辑, or ```css  /  cssCopy codeBatch: a repeat of the label.
        const end = stackedChrome(lines, i);
        if (end && line.trim().toLowerCase() === fence.info.toLowerCase()) {
          i = end - 1;
          while (i + 1 < lines.length && !lines[i + 1].trim()) i++;
          continue;
        }
        const repeat = GLUED_CHROME.exec(line);
        if (repeat && !repeat[1].includes('`') && repeat[2].toLowerCase() === fence.info.toLowerCase()) {
          if (repeat[3].trim()) out.push(repeat[3]);
          continue;
        }
      }
      if (bareFenceAt >= 0) {
        // ```  /  python  /  复制编辑  /  code: the label and captions are chrome.
        const end = stackedChrome(lines, i);
        if (end) {
          setLanguage(bareFenceAt, line.trim());
          bareFenceAt = -1;
          i = end - 1;
          while (i + 1 < lines.length && !lines[i + 1].trim()) i++;
          continue;
        }
        // ```  /  bashCopy codegit clone …: label glued to the first line of code.
        const glued = GLUED_CHROME.exec(line);
        if (glued && !glued[1].includes('`') && isLanguage(glued[2])) {
          setLanguage(bareFenceAt, glued[2]);
          bareFenceAt = -1;
          if (glued[3].trim()) out.push(glued[3]);
          continue;
        }
        if (line.trim()) bareFenceAt = -1;
      }
      out.push(line);
      continue;
    }

    // ```bashCopyEdit, or bashCopyDownload right above a bare fence.
    const glued = GLUED_CHROME.exec(line);
    if (glued && isLanguage(glued[2])) {
      if (glued[1].includes('`')) {
        const open = opening(glued[1].trimEnd() + glued[2])!;
        out.push(`${open.indent}${open.char.repeat(open.length)}${glued[2].toLowerCase()}`);
        fence = { ...open, info: glued[2], at: out.length - 1 };
        if (glued[3].trim()) out.push(glued[3]);
        continue;
      }
      const next = opening(lines[i + 1] ?? '');
      if (next && !next.info && !glued[3].trim()) {
        out.push(`${next.indent}${next.char.repeat(next.length)}${glued[2].toLowerCase()}`);
        fence = { ...next, info: '', at: out.length - 1 };
        i++;
        continue;
      }
      // No fence at all: drop the label and captions, keep what followed them.
      if (glued[3].trim()) out.push(glued[3]);
      continue;
    }

    // "python" / "Copy" / "Edit" on their own lines.
    const end = stackedChrome(lines, i);
    if (end) {
      let j = end;
      while (j < lines.length && !lines[j].trim()) j++;
      const next = opening(lines[j] ?? '');
      if (next && !next.info) {
        out.push(`${next.indent}${next.char.repeat(next.length)}${line.trim().toLowerCase()}`);
        fence = { ...next, info: '', at: out.length - 1 };
        i = j;
      } else {
        i = end - 1;
      }
      continue;
    }

    if (CHROME_LINE.test(line.trim())) {
      // Take a blank line with it, so no double gap is left behind.
      if (!(lines[i + 1] ?? 'x').trim() && (!out.length || !out[out.length - 1].trim())) i++;
      continue;
    }

    // Gemini: "Bash" / "JSON" alone on the line above a bare fence.
    const below = opening(lines[i + 1] ?? '');
    if (below && !below.info && isLanguage(line) && !/\s/.test(line.trim())) {
      out.push(`${below.indent}${below.char.repeat(below.length)}${line.trim().toLowerCase()}`);
      fence = { ...below, info: '', at: out.length - 1 };
      i++;
      continue;
    }

    const open = opening(line);
    if (open) {
      fence = { ...open, at: out.length };
      bareFenceAt = open.info ? -1 : out.length;
      // Kimi: "…the minimal flag:bash" right above a bare fence.
      const previous = out[out.length - 1] ?? '';
      const label = /^(.*[:：])[ \t]*([A-Za-z][\w+#.-]{0,19})[ \t]*$/.exec(previous);
      if (!open.info && label && isLanguage(label[2])) {
        out[out.length - 1] = label[1];
        out.push(`${open.indent}${open.char.repeat(open.length)}${label[2].toLowerCase()}`);
        bareFenceAt = -1;
        continue;
      }
    }
    out.push(line);
  }
  return out.join('\n');
}

/* ---------- sources: numbered lists become footnotes ---------- */

const SOURCES_HEADING =
  /^(?:#{1,6}\s*)?(?:\*\*)?(?:Citations|Sources|References|引用|来源|参考资料|参考来源|出典|参考文献|출처|Quellen|Fuentes|Fontes|Références|Источники)(?:\*\*)?\s*[:：]?\s*$/i;
const SOURCE_LINE = /^\s*\[(\d{1,3})\]\s+(https?:\/\/\S+.*)$/;
const CITE_MARKERS = /(?<=[^\s[\]!(^])((?:\[\d{1,3}\])+)(?![(:[])/g;

/**
 * Perplexity-style answers: inline `[1][2]` markers and, at the end, a
 * "Citations:" (or "Sources", "来源", …) heading over `[1] https://…` lines.
 * Only when the heading is there, every source line is a URL and every
 * marker has its source; a bibliography or reference links never match.
 */
function sourceList(lines: string[]): { start: number; notes: Map<string, string> } | null {
  let end = lines.length;
  while (end > 0 && !lines[end - 1].trim()) end--;
  let start = end;
  while (start > 0 && (SOURCE_LINE.test(lines[start - 1]) || (!lines[start - 1].trim() && SOURCE_LINE.test(lines[start - 2] ?? '')))) start--;
  if (start === end) return null;
  let heading = start - 1;
  while (heading >= 0 && !lines[heading].trim()) heading--;
  if (heading < 0 || !SOURCES_HEADING.test(lines[heading].trim())) return null;
  const notes = new Map<string, string>();
  for (const line of lines.slice(start, end)) {
    const m = SOURCE_LINE.exec(line);
    if (m) notes.set(m[1], m[2].trim());
  }
  const body = proseOf(lines.slice(0, heading).join('\n'));
  const used = [...body.matchAll(CITE_MARKERS)].flatMap(m => [...m[1].matchAll(/\d+/g)].map(n => n[0]));
  if (!used.length || !used.every(n => notes.has(n))) return null;
  return { start: heading, notes };
}

const SUPERSCRIPT: Record<string, string> = { '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const COPILOT_FOOTER = /^Source: Conversation with (?:Copilot|Bing),? .*$/;
const COPILOT_SOURCE = /^\((\d{1,2})\) (.+)$/;

/** Copilot: superscript ¹²³ markers, then "Source: Conversation with Copilot, <date>" over "(1) Title. https://…" lines. */
function copilotSources(lines: string[]): { start: number; notes: Map<string, string> } | null {
  const at = lines.findIndex(l => COPILOT_FOOTER.test(l.trim()));
  if (at < 0) return null;
  const notes = new Map<string, string>();
  for (const line of lines.slice(at + 1)) {
    const m = COPILOT_SOURCE.exec(line.trim());
    if (m) notes.set(m[1], m[2]);
    else if (line.trim()) break;
  }
  return notes.size ? { start: at, notes } : null;
}

function footnotes(text: string): string {
  const lines = text.split('\n');
  const perplexity = sourceList(lines);
  const copilot = perplexity ? null : copilotSources(lines);
  const found = perplexity ?? copilot;
  if (!found) return text;
  const rest = copilot ? lines.slice(found.start + 1).filter(l => !COPILOT_SOURCE.test(l.trim())) : [];
  const body = segments(lines.slice(0, found.start))
    .map(s => {
      const chunk = s.lines.join('\n');
      if (s.code) return chunk;
      return onProse(chunk, prose =>
        perplexity
          ? prose.replace(CITE_MARKERS, m => m.replace(/\[(\d+)\]/g, '[^$1]'))
          : prose.replace(/(?<=\S)[¹²³⁴⁵⁶⁷⁸⁹]+/g, m => [...m].map(d => (found.notes.has(SUPERSCRIPT[d]) ? `[^${SUPERSCRIPT[d]}]` : d)).join('')),
      );
    })
    .join('\n')
    .replace(/\s+$/, '');
  const notes = [...found.notes].map(([n, source]) => `[^${n}]: ${source}`).join('\n');
  const tail = rest.join('\n').trim();
  return `${body}\n\n${notes}\n${tail ? `\n${tail}\n` : ''}`;
}

/* ---------- prose rules ---------- */

function citations(prose: string): string {
  return prose
    .replace(PUA_DOWNLOAD, '$1')
    .replace(PUA_CITATION, '')
    .replace(/\uE200\uE201/g, '')
    .replace(/[\uE200-\uE202\uEA01\uEA02]/g, '')
    .replace(BARE_CITATION, '')
    .replace(CONTENT_REFERENCE, '')
    .replace(OAI_CITATION, '')
    .replace(BRACKET_CITATION, '')
    .replace(GEMINI_CITATION, '')
    .replace(TAG_CITATION, '')
    .replace(TRACKING, (_m, lead: string, more: string) => (more ? lead : ''));
}

/** `\[…\]` to `$$…$$`, `\(…\)` to `$…$`, where the content is recognisably TeX. */
function math(prose: string): string {
  const lines = prose.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!DISPLAY_OPEN.test(lines[i])) continue;
    const end = displayEnd(lines, i);
    if (end < 0) continue;
    lines[i] = lines[i].replace('\\[', '$$$$');
    lines[end] = lines[end].replace('\\]', '$$$$');
    i = end;
  }
  return lines
    .join('\n')
    .replace(DISPLAY_ONE_LINE, (match, body: string) => (TEX.test(body) ? `$$${body.trim()}$$` : match))
    .replace(INLINE_MATH, (match, body: string) => (looksLikeTex(body) ? `$${body.trim()}$` : match));
}

const PICTOGRAPH = /\p{Extended_Pictographic}|\uFE0F/u;

/**
 * Zero-width spaces, word joiners, BOMs and soft hyphens go; a zero-width
 * joiner goes unless it is gluing an emoji sequence; zero-width non-joiners
 * stay (Persian and Indic scripts need them). Non-breaking hyphens become
 * hyphens, so commands copied out of the PDF work. A no-break space becomes a
 * space unless it is doing typographic work: before French punctuation,
 * inside « », or between digits.
 */
function invisible(prose: string): string {
  return prose
    .replace(/[\u200B\u2060\uFEFF\u00AD]/g, '')
    .replace(/\u200D/g, (zwj, at: number, all: string) =>
      PICTOGRAPH.test(all.slice(Math.max(0, at - 2), at)) && PICTOGRAPH.test(all.slice(at + 1, at + 3)) ? zwj : '',
    )
    .replace(/\u2011/g, '-')
    .replace(/[\u00A0\u202F]/g, (nbsp, at: number, all: string) => {
      const before = all[at - 1] ?? '';
      const after = all[at + 1] ?? '';
      if (/[;:!?»›%€]/.test(after) || /[«‹]/.test(before)) return nbsp;
      if (/\d/.test(before) && /\d/.test(after)) return nbsp;
      return ' ';
    });
}

const BULLET = /^([ \t\u3000]*)[•◦▪▫●○■□‣⁃∙]\s+/;

/**
 * Bullets from rendered lists become Markdown list items, and full-width
 * spaces used as indentation become spaces: two per level in a list, none
 * before a paragraph (four would turn it into a code block).
 */
function lists(prose: string): string {
  return prose
    .split('\n')
    .map(line => {
      const bullet = BULLET.exec(line);
      if (bullet) return indent(bullet[1]) + '- ' + line.slice(bullet[0].length);
      const lead = /^[ \t]*\u3000[ \t\u3000]*/.exec(line);
      if (!lead) return line;
      const rest = line.slice(lead[0].length);
      return /^(?:[-*+]|\d{1,3}[.)])\s/.test(rest) ? indent(lead[0]) + rest : rest;
    })
    .join('\n');
}

function indent(whitespace: string): string {
  let width = 0;
  for (const c of whitespace) width += c === '\u3000' ? 2 : c === '\t' ? 4 : 1;
  return ' '.repeat(width);
}

/* ---------- entry point ---------- */

export function cleanAiPaste(input: string): CleanResult {
  if (!signals(input).length) return { text: input, changed: false, fixes: [] };

  const fixes = new Set<Fix>();
  const step = (fix: Fix, before: string, after: string) => {
    if (after !== before) fixes.add(fix);
    return after;
  };

  // Structure first: which lines are code decides where the rest may act.
  let text = step('chrome', input, lineChrome(input));
  text = step('footnotes', text, footnotes(text));

  text = segments(text.split('\n'))
    .map(part => {
      let chunk = part.lines.join('\n');
      if (part.code) return chunk;
      chunk = step('citations', chunk, onProse(chunk, citations));
      chunk = step('math', chunk, onProse(chunk, math));
      chunk = step('invisible', chunk, onProse(chunk, invisible));
      chunk = step('lists', chunk, onProse(chunk, lists));
      return chunk;
    })
    .join('\n');
  // Removing chrome and markers can leave runs of blank lines.
  text = text.replace(/\n{3,}(?=[^\n])/g, '\n\n');
  return { text, changed: text !== input, fixes: [...fixes] };
}
