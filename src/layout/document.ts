/**
 * The document as it will be laid out: front matter read and applied over the
 * panel's settings, the template resolved, the title found.
 *
 * Shared by the PDF (pipeline.ts, via typst.ts) and the preview (preview.ts),
 * so both agree on every decision.
 */
import type { Token } from 'markdown-it';
import {
  TEMPLATE_IDS,
  type DocumentOptions,
  type PaperSize,
  type TemplateId,
} from '../convert/preamble';
import { normalizeLang, type LangSetting } from '../convert/lang';
import type { FontOptions } from '../typst/fonts';
import { parseFrontMatter, stripFrontMatterLines, type FrontMatterIssue, type FrontMatterValue } from './frontmatter';
import { TEMPLATES, type TemplateDef } from './templates';

export interface DocumentMeta {
  /** The title: front matter, else the panel's, else the first level-1 heading. */
  title: string;
  /** Whether the title came from the first heading (which a cover or title block then replaces). */
  titleFromHeading: boolean;
  subtitle: string;
  authors: string[];
  /** As written; formatted per language by `formatDate`. `today` is today. */
  date: string;
  /** Markdown. */
  abstract: string;
  keywords: string[];
  /** Heading numbering, when the front matter says; otherwise the template decides. */
  numbering: boolean | null;
  /** Letter template: sender's address, recipient, subject, closing, signature. */
  letter: { from: string; to: string; subject: string; closing: string; signature: string };
}

export interface ResolvedDocument {
  /** The Markdown with the front matter blanked out (line numbers unchanged). */
  body: string;
  /** Effective options: the panel's, then the template's presets, then the front matter. */
  options: DocumentOptions;
  /** Options the front matter decided, to show as such in the panel. */
  overridden: (keyof DocumentOptions)[];
  meta: DocumentMeta;
  template: TemplateDef;
  issues: FrontMatterIssue[];
  /** Everything typeset outside the body, for font and language resolution. */
  extraText: string;
  fontOptions: FontOptions;
  /** Whether a cover page, and whether a title block, precede the body. */
  cover: boolean;
  titleBlock: boolean;
  numbered: boolean;
}

const PAPERS: Record<string, PaperSize> = {
  a4: 'a4', letter: 'us-letter', 'us-letter': 'us-letter', usletter: 'us-letter', 'letter-paper': 'us-letter',
  a5: 'a5', b5: 'iso-b5', 'iso-b5': 'iso-b5', 'jis-b5': 'iso-b5',
};

const UNIT_MM: Record<string, number> = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72 };

/** `25`, `25mm`, `2.5cm`, `1in`; returns millimetres. */
function toMillimetres(value: FrontMatterValue): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const m = /^\s*(\d+(?:\.\d+)?|\.\d+)\s*(mm|cm|in|pt)?\s*$/i.exec(value);
  return m ? Number(m[1]) * UNIT_MM[(m[2] ?? 'mm').toLowerCase()] : null;
}

/** BCP 47 as people write it (`zh-CN`, `pt-BR`, `ja_JP`) to one of ours. */
export function languageFromTag(value: string): LangSetting | null {
  const tag = value.trim().replace(/_/g, '-');
  if (!tag) return null;
  const direct = normalizeLang(tag);
  if (direct !== 'auto' || tag === 'auto') return direct;
  const lower = tag.toLowerCase();
  if (/^zh(?:-(?:hant|tw|hk|mo)\b|-hant)/.test(lower)) return 'zh-Hant';
  if (lower === 'zh' || lower.startsWith('zh-')) return 'zh-Hans';
  const primary = normalizeLang(lower.split('-')[0]);
  return primary === 'auto' ? null : primary;
}

const text = (value: FrontMatterValue | undefined): string | null =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : null;

const list = (value: FrontMatterValue | undefined): string[] =>
  (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value])
    .map(v => text(v as FrontMatterValue))
    .filter((v): v is string => !!v && v.trim() !== '')
    .map(v => v.trim());

const bool = (value: FrontMatterValue | undefined): boolean | null =>
  typeof value === 'boolean' ? value : null;

/** First level-1 heading, ATX or setext, outside code. */
function firstHeading(body: string): string {
  const lines = body.split('\n', 4000);
  let fence: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const f = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const atx = /^\s{0,3}#[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
    if (atx) return atx[1].trim();
    if (/^\s{0,3}=+\s*$/.test(line) && i > 0 && lines[i - 1].trim() && !/^\s{0,3}[#>*+-]/.test(lines[i - 1])) {
      return lines[i - 1].trim();
    }
  }
  return '';
}

/** Markdown inline syntax a heading's source may carry, reduced to its text. */
function plainInline(source: string): string {
  return source
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|~~|`)(.+?)\1/g, '$2')
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1')
    .trim();
}

/** The header / footer setting, `none` or the template's when empty. */
function bandSpec(setting: string, fallback: string): string {
  const value = setting.trim();
  if (/^none$/i.test(value)) return '';
  return value || fallback;
}

export function resolveDocument(source: string, panel: DocumentOptions): ResolvedDocument {
  const fm = parseFrontMatter(source);
  const data = fm?.data ?? new Map<string, FrontMatterValue>();
  const issues = [...(fm?.issues ?? [])];
  const body = fm && fm.length ? stripFrontMatterLines(source, fm.length) : source;
  const bad = (key: string) => {
    const value = data.get(key);
    issues.push({ line: fm?.lines.get(key) ?? 1, kind: 'value', key, value: Array.isArray(value) ? value.join(', ') : String(value) });
  };
  const has = (key: string) => data.has(key) && data.get(key) !== null;

  const set: Partial<DocumentOptions> = {};
  const pick = <K extends keyof DocumentOptions>(key: K, value: DocumentOptions[K] | null, fmKey: string) => {
    if (value === null) bad(fmKey);
    else set[key] = value;
  };
  const first = (...keys: string[]) => keys.find(has);

  // Template first: its presets sit under everything else the front matter says.
  let template = panel.template;
  if (has('template')) {
    const id = String(data.get('template')).trim().toLowerCase() as TemplateId;
    if (TEMPLATE_IDS.includes(id)) template = id;
    else bad('template');
  }
  const def = TEMPLATES[template] ?? TEMPLATES.default;
  const presets = template !== panel.template ? def.presets : {};

  let key: string | undefined;
  if ((key = first('papersize', 'paper', 'paper-size'))) {
    pick('paper', PAPERS[String(data.get(key)).trim().toLowerCase()] ?? null, key);
  }
  if ((key = first('margin', 'margins'))) {
    const mm = toMillimetres(data.get(key)!);
    pick('margin', mm !== null && mm >= 5 && mm <= 50 ? Math.round(mm * 10) / 10 : null, key);
  } else if (has('geometry')) {
    const m = /margin\s*=\s*([\d.]+\s*(?:mm|cm|in|pt)?)/i.exec(String(data.get('geometry')));
    const mm = m ? toMillimetres(m[1]) : null;
    if (mm !== null && mm >= 5 && mm <= 50) set.margin = Math.round(mm * 10) / 10;
  }
  if ((key = first('fontsize', 'font-size'))) {
    const v = data.get(key)!;
    const pt = typeof v === 'number' ? v : /^\s*(\d+(?:\.\d+)?)\s*(?:pt)?\s*$/i.exec(String(v)) ? parseFloat(String(v)) : NaN;
    pick('fontSize', pt >= 8 && pt <= 18 ? pt : null, key);
  }
  if ((key = first('lang', 'language'))) pick('lang', languageFromTag(String(data.get(key))), key);
  if ((key = first('toc', 'table-of-contents'))) pick('tableOfContents', bool(data.get(key)), key);
  if ((key = first('toc-title'))) pick('tocTitle', text(data.get(key)), key);
  if ((key = first('cover', 'titlepage', 'title-page'))) pick('cover', bool(data.get(key)), key);
  if ((key = first('justify'))) pick('justify', bool(data.get(key)), key);
  if ((key = first('pagenumbers', 'page-numbers', 'numberpages'))) pick('pageNumbers', bool(data.get(key)), key);
  if ((key = first('h1-newpage', 'h1-new-page', 'pagebreak'))) {
    const v = data.get(key)!;
    const on = typeof v === 'boolean' ? v : /^h1$/i.test(String(v)) ? true : /^(?:none|off)$/i.test(String(v)) ? false : null;
    pick('h1NewPage', on, key);
  }
  for (const band of ['header', 'footer'] as const) {
    if (!data.has(band)) continue;
    const v = data.get(band);
    // `footer: false` (or `none`) means no footer at all.
    pick(band, v === false || v === null ? 'none' : text(v), band);
  }
  if (template !== panel.template || has('template')) set.template = template;

  const options: DocumentOptions = { ...panel, ...presets, ...set };
  const overridden = [
    ...new Set([...(Object.keys(presets) as (keyof DocumentOptions)[]), ...(Object.keys(set) as (keyof DocumentOptions)[])]),
  ].filter(k => k !== 'title' && k !== 'author');

  const heading = firstHeading(body);
  const fmTitle = text(data.get('title'))?.trim() ?? '';
  const title = fmTitle || panel.title.trim() || plainInline(heading);
  const authors = list(data.get('author') ?? data.get('authors'));
  if (!authors.length && panel.author.trim()) authors.push(panel.author.trim());
  options.title = title;
  options.author = authors.join(', ');

  const numbering = bool(data.get('numbering') ?? data.get('numbersections') ?? data.get('number-sections'));
  const meta: DocumentMeta = {
    title,
    titleFromHeading: !fmTitle && !panel.title.trim() && !!heading,
    subtitle: text(data.get('subtitle'))?.trim() ?? '',
    authors,
    date: text(data.get('date'))?.trim() ?? '',
    abstract: text(data.get('abstract'))?.trim() ?? '',
    keywords: list(data.get('keywords')),
    numbering,
    letter: {
      from: text(data.get('from') ?? data.get('address'))?.trim() ?? '',
      to: text(data.get('to') ?? data.get('recipient'))?.trim() ?? '',
      subject: text(data.get('subject'))?.trim() ?? '',
      closing: text(data.get('closing'))?.trim() ?? '',
      signature: text(data.get('signature'))?.trim() ?? '',
    },
  };

  const cover = options.cover && template !== 'resume' && template !== 'letter' && !!title;
  const titleBlock =
    !cover &&
    !!title &&
    (def.titleBlock === 'always' ? true : def.titleBlock === 'frontmatter' ? !!fmTitle : false);
  const extraText = [
    title, meta.subtitle, authors.join(', '), meta.date, meta.abstract, options.header, options.footer,
    meta.letter.from, meta.letter.to, meta.letter.subject, meta.letter.closing, meta.letter.signature,
  ].join('\n');

  return {
    body,
    options,
    overridden,
    meta,
    template: def,
    issues,
    extraText,
    fontOptions: { serif: def.serif },
    cover,
    titleBlock,
    numbered: numbering ?? def.numbered,
  };
}

/** Header and footer specs after defaults: empty string means none. */
export function bands(doc: ResolvedDocument): { header: string; footer: string } {
  const o = doc.options;
  return {
    header: bandSpec(o.header, doc.template.header),
    footer: o.footer.trim() || o.pageNumbers ? bandSpec(o.footer, doc.template.footer) : '',
  };
}

/** A date as the document's language writes it: ISO dates and `today` are formatted, anything else is kept. */
export function formatDate(value: string, htmlLang: string, fallbackToday = false): string {
  let date: Date | null = null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  else if (/^today$/i.test(value) || (!value && fallbackToday)) date = new Date();
  if (!date || Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(htmlLang, { dateStyle: 'long' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Authors joined the way the language lists names ("A, B and C", "A、B和C"). */
export function joinNames(names: string[], htmlLang: string): string {
  if (names.length < 2) return names[0] ?? '';
  try {
    return new Intl.ListFormat(htmlLang, { type: 'conjunction' }).format(names);
  } catch {
    return names.join(', ');
  }
}

/**
 * Token changes both outputs share: the heading a cover or title block
 * replaces is dropped, every later level-1 heading gets a page break when
 * asked for, and a résumé's contact line (the paragraph under the name) is
 * marked. Returns the shallowest heading level left, for numbering.
 */
export function prepareTokens(tokens: Token[], doc: ResolvedDocument): number {
  const replacesHeading = doc.cover || doc.titleBlock;
  // The first block, ignoring page breaks.
  const firstBlock = tokens.findIndex(t => t.level === 0 && t.nesting !== -1 && t.type !== 'page_break');
  if (replacesHeading && firstBlock >= 0 && tokens[firstBlock].type === 'heading_open' && tokens[firstBlock].tag === 'h1') {
    const inline = tokens[firstBlock + 1];
    const headingText = plainInline(inline?.content ?? '');
    if (doc.meta.titleFromHeading || headingText === doc.meta.title) tokens.splice(firstBlock, 3);
  }

  if (doc.template.id === 'resume') {
    const h1 = tokens.findIndex(t => t.type === 'heading_open' && t.tag === 'h1');
    const next = h1 >= 0 ? tokens[h1 + 3] : undefined;
    if (next?.type === 'paragraph_open' && next.level === 0) {
      next.meta = { ...(next.meta ?? {}), wrap: 'md-contact' };
      next.attrJoin('class', 'contact');
    }
  }

  if (doc.options.h1NewPage) {
    let seenContent = false;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.level !== 0 || t.nesting === -1) continue;
      if (t.type === 'heading_open' && t.tag === 'h1' && seenContent && tokens[i - 1]?.type !== 'page_break') {
        const Ctor = t.constructor as new (type: string, tag: string, nesting: number) => Token;
        const brk = new Ctor('page_break', 'div', 0);
        brk.block = true;
        brk.map = t.map;
        tokens.splice(i, 0, brk);
        i++;
      }
      if (t.type !== 'page_break') seenContent = true;
    }
  }

  let top = 6;
  for (const t of tokens) if (t.type === 'heading_open') top = Math.min(top, Number(t.tag.slice(1)) || 6);
  return top;
}
