/**
 * Front matter, templates, headers and footers, covers: loaded on demand
 * through `load.ts`, never part of the first page load.
 */
import type { DocumentOptions } from '../convert/preamble';
import { t } from '../i18n/runtime';
import type { ResolvedDocument } from './document';
import type { FrontMatterIssue } from './frontmatter';

export { resolveDocument, prepareTokens } from './document';
export { layoutTypst } from './typst';
export { previewLayout } from './preview';
export { applyTemplate } from './templates';

/** The panel's controls, by the option they show. */
const INPUTS: Partial<Record<keyof DocumentOptions, string>> = {
  template: 'opt-template',
  paper: 'opt-paper',
  margin: 'opt-margin',
  fontSize: 'opt-font-size',
  lineHeight: 'opt-line-height',
  pageNumbers: 'opt-page-numbers',
  tableOfContents: 'opt-toc',
  justify: 'opt-justify',
  lang: 'opt-lang',
  cover: 'opt-cover',
  h1NewPage: 'opt-h1-newpage',
  header: 'opt-header',
  footer: 'opt-footer',
};

/**
 * Show in the panel which settings the document's front matter decides: the
 * control shows the document's value, is disabled, and says so. When the
 * front matter stops setting it, the panel's own value comes back.
 */
export function markOverrides(doc: ResolvedDocument, panel: DocumentOptions): void {
  for (const [key, id] of Object.entries(INPUTS) as [keyof DocumentOptions, string][]) {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) continue;
    const fromDocument = doc.overridden.includes(key);
    if (!fromDocument && input.dataset.fromDocument === undefined) continue;
    const value = (fromDocument ? doc.options : panel)[key];
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = String(value);
    input.disabled = fromDocument;
    const label = input.closest('label');
    let badge = label?.querySelector<HTMLElement>('.from-doc');
    if (fromDocument) {
      input.dataset.fromDocument = '';
      if (label && !badge) {
        badge = document.createElement('small');
        badge.className = 'from-doc';
        badge.textContent = t('fromDocument');
        label.append(badge);
      }
      if (label) {
        label.dataset.ownTitle ??= label.title;
        label.title = t('fromDocumentTitle');
      }
    } else {
      delete input.dataset.fromDocument;
      badge?.remove();
      if (label?.dataset.ownTitle !== undefined) {
        label.title = label.dataset.ownTitle;
        delete label.dataset.ownTitle;
      }
    }
  }
  // Empty fields fall back to the template's own header and footer; show which.
  const header = document.getElementById('opt-header') as HTMLInputElement | null;
  const footer = document.getElementById('opt-footer') as HTMLInputElement | null;
  if (header) header.placeholder = doc.template.header;
  if (footer) footer.placeholder = doc.options.pageNumbers ? doc.template.footer : '';
}

/** Front matter problems, in the page's language. */
export function describeIssues(issues: FrontMatterIssue[]): string[] {
  return issues.map(issue =>
    issue.kind === 'unclosed'
      ? t('frontMatterUnclosed')
      : issue.kind === 'value'
        ? t('frontMatterValue', { line: issue.line, key: issue.key ?? '', value: issue.value ?? '' })
        : t('frontMatterSyntax', { line: issue.line }),
  );
}
