/** Build-time only. A page embeds the five examples in its own language. */
import type { TemplateId } from '../../convert/preamble';
import type { ExampleCopy } from './types';
import en from './en';
import zh from './zh';
import ja from './ja';
import ko from './ko';
import de from './de';
import fr from './fr';
import es from './es';
import pt from './pt';
import ru from './ru';

export type TemplateExamples = Record<Exclude<TemplateId, 'default'>, string>;
const COPIES: Record<string, ExampleCopy> = { en, zh, ja, ko, de, fr, es, pt, ru };
const quoted = (value: string) => JSON.stringify(value);
const section = ([title, body]: [string, string]) => `## ${title}\n\n${body}`;
const column = (body: string) => `::: column\n${body}\n:::`;
const row = (left: string, right: string, kind = 'columns') =>
  `:::: ${kind}\n${column(left)}\n${column(right)}\n::::`;

export function templateExamples(code: string, lang: string): TemplateExamples {
  const copy = COPIES[code];
  if (!copy) throw new Error(`Missing template examples for locale ${code}`);
  // Template stays in the user's layout settings so loading a sample never
  // disables the selector. The document language follows the current UI.
  const doc = (body: string, meta: Record<string, string> = {}) =>
    `---\nlang: ${lang}\n${Object.entries(meta).map(([key, value]) => `${key}: ${quoted(value)}\n`).join('')}---\n\n${body}\n`;
  const c = copy.contract;
  const [a, b] = c.parties;
  const [client, supplier] = c.names;
  const signature = (label: string, name: string) =>
    `**${label}: ${name}**\n\n${c.signature}:  \n&nbsp;  \n&nbsp;  \n&nbsp;\n\n${c.date}: ____ / ____ / ______`;
  const r = copy.resume;
  const report = copy.report;
  const paper = copy.academic;
  const letter = copy.letter;
  return {
    contract: doc([
      `::: center\n# ${c.title}\n:::`,
      row(`${a}: ${client}  \n${b}: ${supplier}`, `${c.code}: __________  \n${c.code}: __________`),
      c.note,
      section(c.scope),
      `| ${c.headers.join(' | ')} |\n| :--- | :--- | :---: |\n| ${c.item.join(' | ')} |`,
      section(c.payment), section(c.delivery), section(c.acceptance),
      row(signature(a, client), signature(b, supplier), 'signatures'),
    ].join('\n\n')),
    resume: doc([
      `# ${r.name}\n\n${r.role} · ${r.contact}`,
      section(r.profile),
      `## ${r.experience[0]}\n\n### ${r.experience[1]} | ${r.experience[2]}\n\n- ${r.experience[3]}\n- ${r.experience[4]}`,
      section(r.education), section(r.skills),
    ].join('\n\n')),
    report: doc([
      section(report.summary),
      `## ${report.results[0]}\n\n| ${report.results.slice(1, 4).join(' | ')} |\n| --- | --- | --- |\n| ${report.results.slice(4).join(' | ')} |`,
      section(report.next),
    ].join('\n\n'), { title: report.title, author: r.name, date: '2026-10-01' }),
    academic: doc(paper.sections.map(section).join('\n\n'), {
      title: paper.title, author: paper.author, abstract: paper.abstract, keywords: paper.keywords,
    }),
    letter: doc([letter.greeting, ...letter.paragraphs].join('\n\n'), {
      title: letter.subject, author: letter.signature, from: letter.from, to: letter.to, date: '2026-10-01',
      subject: letter.subject, closing: letter.closing, signature: letter.signature,
    }),
  };
}
