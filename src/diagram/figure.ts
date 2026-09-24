/**
 * Markup for the preview's diagram figures, beyond the SVG itself: the error
 * box and the export actions. Loaded with Mermaid, like its stylesheet.
 */
import type { DiagramFailure } from './mermaid';
import { t } from '../i18n/runtime';
import './figure.css';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

/** Title, Mermaid's message and the offending line, as the PDF shows them too. */
export function errorBox(failure: DiagramFailure): string {
  const title =
    failure.unknownType !== undefined
      ? t('diagramUnknown', { name: failure.unknownType })
      : failure.line
        ? t('diagramErrorAt', { line: failure.line })
        : t('diagramErrorTitle');
  const message = failure.message ? `<span>${escapeHtml(failure.message)}</span>` : '';
  const excerpt = failure.excerpt ? `<pre>${escapeHtml(failure.excerpt)}</pre>` : '';
  return `<div class="diagram-error" role="note"><strong>${escapeHtml(title)}</strong>${message}${excerpt}</div>`;
}

/** Copy / download buttons; their visible text is CSS, so find-in-page and copying skip it. */
export function diagramActions(): string {
  const button = (action: string, key: 'diagramCopySvg' | 'diagramDownloadSvg' | 'diagramDownloadPng') =>
    `<button type="button" data-diagram-action="${action}" aria-label="${escapeHtml(t(key))}" title="${escapeHtml(t(key))}"></button>`;
  return (
    `<div class="diagram-actions" role="toolbar" aria-label="${escapeHtml(t('diagramActions'))}">` +
    button('copy', 'diagramCopySvg') +
    button('svg', 'diagramDownloadSvg') +
    button('png', 'diagramDownloadPng') +
    '</div>'
  );
}
