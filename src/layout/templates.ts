/**
 * Document templates: what each one changes, as data. The Typst for each is in
 * `typst.ts`, the preview's approximation in `layout.css`.
 */
import type { DocumentOptions, TemplateId } from '../convert/preamble';

export interface TemplateDef {
  id: TemplateId;
  /** Body text in Noto Serif (a lazily loaded font tier, see src/typst/fonts.ts). */
  serif: boolean;
  /** Settings the template brings, applied when it is picked. */
  presets: Partial<DocumentOptions>;
  /** Header and footer used when the setting is left empty. */
  header: string;
  footer: string;
  /** Numbered headings, 1 / 1.1 / 1.1.1. */
  numbered: boolean;
  /**
   * A title block at the top of the first page (when there is no cover):
   * `always` when there is a title, `frontmatter` only when the front matter
   * gives one, `never` for templates whose first heading is the title.
   */
  titleBlock: 'always' | 'frontmatter' | 'never';
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  default: {
    id: 'default',
    serif: false,
    presets: { margin: 20, fontSize: 11, lineHeight: 1.6, justify: true, cover: false, pageNumbers: true },
    header: '',
    footer: '{page} / {pages}',
    numbered: false,
    titleBlock: 'frontmatter',
  },
  report: {
    id: 'report',
    serif: false,
    presets: { margin: 22, fontSize: 11, lineHeight: 1.55, justify: true, cover: true, pageNumbers: true },
    header: '{title} | {date}',
    footer: '{author} | {page} / {pages}',
    numbered: true,
    titleBlock: 'frontmatter',
  },
  academic: {
    id: 'academic',
    serif: true,
    presets: { margin: 25, fontSize: 11, lineHeight: 1.5, justify: true, cover: false, pageNumbers: true },
    header: '',
    footer: '{page}',
    numbered: true,
    titleBlock: 'always',
  },
  resume: {
    id: 'resume',
    serif: false,
    presets: { margin: 14, fontSize: 10, lineHeight: 1.4, justify: false, cover: false, pageNumbers: false },
    header: '',
    footer: '{page} / {pages}',
    numbered: false,
    titleBlock: 'never',
  },
  letter: {
    id: 'letter',
    serif: true,
    presets: { margin: 25, fontSize: 11, lineHeight: 1.5, justify: false, cover: false, pageNumbers: false },
    header: '',
    footer: '{page} / {pages}',
    numbered: false,
    titleBlock: 'never',
  },
};

/** The panel's options once a template is picked there: its presets applied. */
export function applyTemplate(options: DocumentOptions, id: TemplateId): DocumentOptions {
  return { ...options, ...TEMPLATES[id].presets, template: id };
}

/** "Abstract" in the document's language. */
export const ABSTRACT: Record<string, string> = {
  en: 'Abstract', de: 'Zusammenfassung', fr: 'Résumé', es: 'Resumen', pt: 'Resumo', it: 'Sommario',
  nl: 'Samenvatting', pl: 'Streszczenie', vi: 'Tóm tắt', ru: 'Аннотация', uk: 'Анотація', el: 'Περίληψη',
  'zh-Hans': '摘要', 'zh-Hant': '摘要', ja: '要旨', ko: '초록', ar: 'الملخص', he: 'תקציר', th: 'บทคัดย่อ',
  hi: 'सारांश',
};
