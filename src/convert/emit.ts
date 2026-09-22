import type { Token } from 'markdown-it';
import { tstr, tmarkup } from './typst-str';
import { toTree, type Node } from './tree';

/** An asset resolved ahead of emission (diagram, formula or image). */
export interface ResolvedAsset {
  path: string;
  /** Intrinsic size in points, when known. */
  width?: number;
  height?: number;
  /** Baseline shift in points, for inline formulas. */
  baseline?: number;
}

export interface EmitInput {
  tokens: Token[];
  /** Keyed by `${kind}:${content}`; see `collect.ts`. */
  assets: Map<string, ResolvedAsset>;
  footnotes: Map<string, Node[]>;
  warn: (message: string) => void;
}

const CJK = /[⺀-鿿　-ヿ豈-﫿＀-￯]/;

export function assetKey(kind: string, content: string): string {
  return `${kind}:${content}`;
}

class Emitter {
  constructor(private readonly input: EmitInput) {}

  /** Render a list of block-level nodes, separated by blank lines. */
  blocks(nodes: Node[]): string {
    const out: string[] = [];
    for (const node of nodes) {
      const piece = this.block(node);
      if (piece.trim() !== '') out.push(piece);
    }
    return out.join('\n\n');
  }

  private block(node: Node): string {
    const t = node.token;
    switch (t.type) {
      case 'heading_open': {
        const level = Number(t.tag.slice(1)) || 1;
        return `#heading(level: ${level})[${this.inlineOf(node)}]`;
      }
      case 'paragraph_open':
        return this.paragraph(node);
      case 'blockquote_open':
        return `#md-quote[\n${indent(this.blocks(node.children))}\n]`;
      case 'bullet_list_open':
      case 'ordered_list_open':
        return this.list(node);
      case 'table_open':
        return this.table(node);
      case 'dl_open':
        return this.definitionList(node);
      case 'fence':
      case 'code_block':
        return this.code(t);
      case 'hr':
        return '#md-rule()';
      case 'html_block':
        this.input.warn('Raw HTML blocks are not supported and were skipped.');
        return '';
      case 'inline':
        return this.inlineOf({ token: t, children: toTree(t.children ?? []) });
      case 'footnote_block_open':
        return ''; // definitions are inlined at their reference sites
      default:
        return this.blocks(node.children);
    }
  }

  private paragraph(node: Node): string {
    const inline = node.children.find(c => c.token.type === 'inline');
    if (!inline) return '';
    const children = toTree(inline.token.children ?? []);

    // A paragraph holding nothing but an image becomes a captioned figure.
    const meaningful = children.filter(
      c => !(c.token.type === 'text' && c.token.content.trim() === ''),
    );
    if (meaningful.length === 1 && meaningful[0].token.type === 'image') {
      return this.image(meaningful[0].token, true);
    }
    const body = this.inline(children);
    if (body.trim() === '') return '';
    return node.token.hidden ? body : body;
  }

  private list(node: Node): string {
    const ordered = node.token.type === 'ordered_list_open';
    const items = node.children.filter(c => c.token.type === 'list_item_open');
    const tight = !items.some(item =>
      item.children.some(c => c.token.type === 'paragraph_open' && !c.token.hidden),
    );

    const rendered: string[] = [];
    let allTasks = items.length > 0;
    for (const item of items) {
      const task = this.extractTask(item);
      if (!task.isTask) allTasks = false;
      const body = this.blocks(item.children);
      rendered.push(`[${task.prefix}${body.includes('\n') ? '\n' + indent(body) + '\n' : body}]`);
    }

    const args = [`tight: ${tight}`];
    if (ordered) {
      const start = Number(node.token.attrGet('start') ?? 1);
      if (start !== 1) args.push(`start: ${start}`);
    } else if (allTasks) {
      args.push('marker: []');
    }
    const fn = ordered ? 'enum' : 'list';
    return `#${fn}(${args.join(', ')},\n${indent(rendered.join(',\n'))}\n)`;
  }

  /**
   * GitHub task list items arrive as ordinary text starting with `[ ]`/`[x]`.
   * Strip the marker off the token so it is not rendered twice.
   */
  private extractTask(item: Node): { isTask: boolean; prefix: string } {
    const para = item.children.find(
      c => c.token.type === 'paragraph_open' || c.token.type === 'inline',
    );
    const inline =
      para?.token.type === 'inline'
        ? para.token
        : para?.children.find(c => c.token.type === 'inline')?.token;
    const first = inline?.children?.[0];
    if (!first || first.type !== 'text') return { isTask: false, prefix: '' };

    const match = /^\[([ xX])\]\s+/.exec(first.content);
    if (!match) return { isTask: false, prefix: '' };
    first.content = first.content.slice(match[0].length);
    return { isTask: true, prefix: `#md-task(${match[1] !== ' '}) ` };
  }

  private table(node: Node): string {
    const rows: { cells: Node[]; header: boolean }[] = [];
    const walk = (nodes: Node[], header: boolean) => {
      for (const n of nodes) {
        if (n.token.type === 'thead_open') walk(n.children, true);
        else if (n.token.type === 'tbody_open') walk(n.children, false);
        else if (n.token.type === 'tr_open') {
          rows.push({
            cells: n.children.filter(
              c => c.token.type === 'th_open' || c.token.type === 'td_open',
            ),
            header,
          });
        }
      }
    };
    walk(node.children, false);
    if (rows.length === 0) return '';

    const columns = Math.max(...rows.map(r => r.cells.length));
    const aligns = (rows[0]?.cells ?? []).map(cell => {
      const style = String(cell.token.attrGet('style') ?? '');
      if (style.includes('center')) return 'center';
      if (style.includes('right')) return 'right';
      return 'left';
    });
    while (aligns.length < columns) aligns.push('left');

    const cellContent = (cell: Node | undefined) =>
      cell ? `[${this.inlineOf(cell)}]` : '[]';

    const body: string[] = [];
    for (const row of rows) {
      const cells = Array.from({ length: columns }, (_, i) => cellContent(row.cells[i]));
      body.push(row.header ? `table.header(${cells.join(', ')})` : cells.join(', '));
    }
    return `#table(\n  columns: ${columns},\n  align: (${aligns.join(', ')}),\n${indent(body.join(',\n'), 2)},\n)`;
  }

  private definitionList(node: Node): string {
    const entries: string[] = [];
    let term: string | null = null;
    for (const child of node.children) {
      if (child.token.type === 'dt_open') term = this.inlineOf(child);
      else if (child.token.type === 'dd_open') {
        entries.push(`terms.item([${term ?? ''}], [${this.blocks(child.children)}])`);
        term = null;
      }
    }
    if (entries.length === 0) return '';
    return `#terms(\n${indent(entries.join(',\n'))}\n)`;
  }

  private code(token: Token): string {
    const info = (token.info || '').trim().split(/\s+/)[0].toLowerCase();
    if (info === 'mermaid') {
      const asset = this.input.assets.get(assetKey('mermaid', token.content));
      if (asset) return this.figureImage(asset, null);
      this.input.warn('A mermaid diagram could not be rendered and was kept as source.');
    }
    const lang = info && info !== 'mermaid' ? `, lang: ${tstr(info)}` : '';
    return `#raw(${tstr(token.content.replace(/\n$/, ''))}, block: true${lang})`;
  }


  private figureImage(asset: ResolvedAsset, caption: string | null): string {
    const image = this.imageCall(asset);
    return caption
      ? `#md-figure(${image}, [${caption}])`
      : `#align(center, ${image})`;
  }

  /**
   * Widths arrive already clamped to the text block: Typst cannot compare a
   * length with a ratio, so `calc.min(300pt, 100%)` is an error rather than a
   * safeguard. `pipeline.ts` does the clamping where the page geometry is known.
   */
  private imageCall(asset: ResolvedAsset): string {
    const args = [tstr(asset.path)];
    if (asset.width !== undefined) args.push(`width: ${asset.width}pt`);
    if (asset.height !== undefined) args.push(`height: ${asset.height}pt`);
    return `image(${args.join(', ')})`;
  }

  private image(token: Token, block: boolean): string {
    const src = String(token.attrGet('src') ?? '');
    const alt = token.content ?? '';
    const asset = this.input.assets.get(assetKey('image', src));
    if (!asset) {
      this.input.warn(`Image could not be embedded: ${src}`);
      return `#text(fill: rgb("#a00"))[${tmarkup(`[image unavailable: ${src}]`)}]`;
    }
    if (block) return this.figureImage(asset, alt ? tmarkup(alt) : null);
    return `#box(${this.imageCall(asset)})`;
  }

  private inlineOf(node: Node): string {
    const inline = node.children.find(c => c.token.type === 'inline');
    const source = inline ?? node;
    if (source.token.type === 'inline') {
      return this.inline(toTree(source.token.children ?? []));
    }
    return this.inline(source.children);
  }

  private inline(nodes: Node[]): string {
    let out = '';
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const t = node.token;
      switch (t.type) {
        case 'text':
          if (t.content !== '') out += tmarkup(t.content);
          break;
        case 'strong_open':
          out += `#strong[${this.inline(node.children)}]`;
          break;
        case 'em_open':
          out += `#emph[${this.inline(node.children)}]`;
          break;
        case 's_open':
          out += `#strike[${this.inline(node.children)}]`;
          break;
        case 'link_open': {
          const href = String(t.attrGet('href') ?? '');
          out += `#link(${tstr(href)})[${this.inline(node.children)}]`;
          break;
        }
        case 'code_inline':
          out += `#raw(${tstr(t.content)})`;
          break;
        case 'image':
          out += this.image(t, false);
          break;
        case 'softbreak':
          out += this.softbreak(nodes, i);
          break;
        case 'hardbreak':
          out += '#linebreak()';
          break;
        case 'footnote_ref':
          out += this.footnote(t);
          break;
        case 'html_inline':
          if (/^<br\s*\/?>$/i.test(t.content)) out += '#linebreak()';
          else this.input.warn('Inline HTML is not supported and was skipped.');
          break;
        default:
          if (node.children.length) out += this.inline(node.children);
      }
    }
    return out;
  }

  /**
   * A newline between two CJK characters is not a word separator; emitting a
   * space there would show up as a visible gap in the PDF.
   */
  private softbreak(nodes: Node[], index: number): string {
    const before = lastChar(nodes, index);
    const after = firstChar(nodes, index);
    if (before && after && CJK.test(before) && CJK.test(after)) return '';
    return '#" "';
  }


  private footnote(token: Token): string {
    const id = String(token.meta?.id ?? '');
    const body = this.input.footnotes.get(id);
    if (!body) return '';
    return `#footnote[${this.blocks(body)}]`;
  }
}

function lastChar(nodes: Node[], index: number): string | null {
  for (let i = index - 1; i >= 0; i--) {
    const text = plainText(nodes[i]);
    if (text) return text[text.length - 1];
  }
  return null;
}

function firstChar(nodes: Node[], index: number): string | null {
  for (let i = index + 1; i < nodes.length; i++) {
    const text = plainText(nodes[i]);
    if (text) return text[0];
  }
  return null;
}

function plainText(node: Node): string {
  if (node.token.type === 'text' || node.token.type === 'code_inline') return node.token.content;
  return node.children.map(plainText).join('');
}

function indent(text: string, spaces = 2): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map(line => (line === '' ? line : pad + line))
    .join('\n');
}

export function emit(input: EmitInput): string {
  return new Emitter(input).blocks(toTree(input.tokens));
}
