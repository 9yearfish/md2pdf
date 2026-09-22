import MarkdownItCtor, { type MarkdownIt } from 'markdown-it';
import footnote from 'markdown-it-footnote';
import deflist from 'markdown-it-deflist';

export function createParser(): MarkdownIt {
  const md = new MarkdownItCtor({
    html: false, // raw HTML has no meaningful mapping onto Typst
    linkify: true,
    typographer: false, // Typst does its own smart quotes
    breaks: false,
  });
  md.use(footnote);
  md.use(deflist);
  return md;
}

export interface ParsedDocument {
  tokens: any[];
  env: any;
}

export function parse(md: MarkdownIt, source: string): ParsedDocument {
  const env: any = {};
  const tokens = md.parse(source, env);
  return { tokens, env };
}
