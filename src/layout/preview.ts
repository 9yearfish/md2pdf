/**
 * The preview's approximation of a layout: the template's look (layout.css),
 * a cover or title block, the header and footer as faint bands, heading
 * numbers and the page-break markers. The preview is one continuous sheet, so
 * `{page}` shows as 1 and `{pages}` as N.
 */
import type { Token } from 'markdown-it';
import type { LanguageInfo, HanVariant } from '../convert/lang';
import { cjkOrder } from '../typst/fonts';
import type { PreviewLayout } from '../preview/html';
import { bands, formatDate, joinNames, prepareTokens, type ResolvedDocument } from './document';
import { bandCells } from './typst';
import { ABSTRACT } from './templates';
import './layout.css';

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const multiline = (text: string) => text.split('\n').map(l => escapeHtml(l.trim())).filter(Boolean).join('<br>');

const SYSTEM_SERIF: Record<HanVariant, string[]> = {
  sc: ['Songti SC', 'STSong', 'SimSun'],
  tc: ['Songti TC', 'PMingLiU', 'MingLiU'],
  jp: ['Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho'],
  kr: ['AppleMyungjo', 'Batang'],
};
const SYSTEM_SANS: Record<HanVariant, string[]> = {
  sc: ['PingFang SC', 'Microsoft YaHei'],
  tc: ['PingFang TC', 'Microsoft JhengHei'],
  jp: ['Hiragino Sans', 'Yu Gothic'],
  kr: ['Apple SD Gothic Neo', 'Malgun Gothic'],
};
const SCRIPTS = ['Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans Devanagari', 'Noto Sans Thai'];

/** The serif template's stacks, in the PDF's order: regular text, then bold text. */
function serifStacks(lang: LanguageInfo): { regular: string; bold: string } {
  const cjk = cjkOrder(lang.han);
  const latin = lang.cjkPunctuation ? ['md2pdf Serif Latin in CJK', 'md2pdf Latin in CJK'] : ['Noto Serif', 'Noto Sans'];
  const serifCjk = cjk.map(f => f.family.replace('Sans', 'Serif'));
  const list = (names: string[]) => names.map(n => `"${n}"`).concat('serif').join(', ');
  return {
    regular: list([...latin, ...serifCjk, ...cjk.flatMap(f => SYSTEM_SERIF[f.id as HanVariant]), ...cjk.map(f => f.family), ...SCRIPTS]),
    bold: list([...latin, ...cjk.map(f => f.family), ...cjk.flatMap(f => SYSTEM_SANS[f.id as HanVariant]), ...SCRIPTS]),
  };
}

function band(spec: string, kind: 'header' | 'footer', values: Record<string, string>): string {
  const cells = bandCells(spec);
  if (!cells) return '';
  const fill = (cell: string) =>
    escapeHtml(cell.replace(/\{(title|page|pages|date|author)\}/gi, (_m, k: string) => values[k.toLowerCase()]));
  return `<div class="page-band page-${kind}" aria-hidden="true"><div>${cells.map(c => `<span>${fill(c)}</span>`).join('')}</div></div>`;
}

const pageBreak = '<div class="page-break" role="separator"></div>';

export function previewLayout(doc: ResolvedDocument): PreviewLayout {
  let top = 1;
  return {
    fontOptions: doc.fontOptions,
    extraText: doc.extraText,
    tokens(tokens: Token[]) {
      top = prepareTokens(tokens, doc);
    },
    html(lang, renderMarkdown) {
      const meta = doc.meta;
      const date = formatDate(meta.date, lang.html);
      const author = joinNames(meta.authors, lang.html);
      const { header, footer } = bands(doc);
      const values = { title: meta.title, author, date: formatDate(meta.date, lang.html, true), page: '1', pages: 'N' };
      const parts: string[] = [];
      const line = (cls: string, text: string, tag = 'p') => (text ? `<${tag} class="${cls}">${escapeHtml(text)}</${tag}>` : '');
      if (doc.cover) {
        parts.push(
          `<section class="cover">${line('cover-title', meta.title, 'div')}${line('cover-subtitle', meta.subtitle, 'div')}` +
            `<div class="cover-foot">${line('cover-author', author, 'div')}${line('cover-date', date, 'div')}</div></section>${pageBreak}`,
        );
      }
      parts.push(band(header, 'header', values));
      if (doc.titleBlock) {
        const byline = [author, date].filter(Boolean).map(escapeHtml).join(' · ');
        parts.push(
          `<header class="title-block">${line('title', meta.title, 'div')}${line('subtitle', meta.subtitle, 'div')}` +
            `${doc.template.id === 'academic' ? line('byline', author, 'div') + line('dateline', date, 'div') : byline ? `<div class="byline">${byline}</div>` : ''}</header>`,
        );
      }
      if (doc.template.id === 'letter') {
        const l = meta.letter;
        parts.push(
          `<header class="letterhead"><div class="sender">${line('sender-name', author, 'div')}${l.from ? `<div class="sender-address">${multiline(l.from)}</div>` : ''}</div>` +
            `${l.to ? `<div class="recipient">${multiline(l.to)}</div>` : ''}${line('letter-date', formatDate(meta.date || 'today', lang.html), 'div')}${line('subject', l.subject, 'div')}</header>`,
        );
      }
      if (meta.abstract) {
        parts.push(
          `<section class="abstract"><div class="abstract-label">${escapeHtml(ABSTRACT[lang.code] ?? ABSTRACT.en)}</div>${renderMarkdown(meta.abstract)}</section>`,
        );
      }
      const after: string[] = [];
      if (doc.template.id === 'letter' && (meta.letter.closing || meta.letter.signature)) {
        after.push(`<div class="signoff">${meta.letter.closing ? `<div class="closing">${multiline(meta.letter.closing)}</div>` : ''}${line('signature', meta.letter.signature || author, 'div')}</div>`);
      }
      after.push(band(footer, 'footer', values));
      return { before: parts.join(''), afterToc: doc.options.tableOfContents ? pageBreak : '', after: after.join('') };
    },
    decorate(root: HTMLElement) {
      root.dataset.template = doc.template.id;
      root.toggleAttribute('data-serif', doc.template.serif);
      if (doc.numbered) {
        const counters = [0, 0, 0];
        const numbers: string[] = [];
        for (const h of root.querySelectorAll<HTMLElement>(':scope > :is(h1, h2, h3, h4, h5, h6)')) {
          const depth = Number(h.tagName[1]) - top;
          if (depth < 0 || depth > 2) {
            if (Number(h.tagName[1]) <= 3) numbers.push('');
            continue;
          }
          counters[depth]++;
          counters.fill(0, depth + 1);
          const number = counters.slice(0, depth + 1).join('.');
          const span = document.createElement('span');
          span.className = 'heading-number';
          span.textContent = number;
          h.prepend(span);
          if (Number(h.tagName[1]) <= 3) numbers.push(number);
        }
        // The contents list has the same headings, in the same order.
        root.querySelectorAll<HTMLElement>('.toc li').forEach((li, i) => {
          if (numbers[i]) li.dataset.number = numbers[i];
        });
      }
      if (doc.template.id === 'resume') {
        for (const h of root.querySelectorAll<HTMLElement>(':scope > :is(h3, h4)')) {
          for (const node of h.childNodes) {
            const at = node.nodeType === Node.TEXT_NODE ? node.textContent!.indexOf(' | ') : -1;
            if (at < 0) continue;
            const text = node.textContent!;
            const right = document.createElement('span');
            right.className = 'row-right';
            right.textContent = text.slice(at + 3);
            let next = node.nextSibling;
            while (next) {
              const moving = next;
              next = next.nextSibling;
              right.append(moving);
            }
            node.textContent = text.slice(0, at);
            h.append(right);
            h.classList.add('row');
            break;
          }
        }
      }
    },
    style(root: HTMLElement, lang: LanguageInfo) {
      if (!doc.template.serif) return;
      const stacks = serifStacks(lang);
      root.style.setProperty('--paper-serif-family', stacks.regular);
      root.style.setProperty('--paper-serif-bold-family', stacks.bold);
    },
  };
}
