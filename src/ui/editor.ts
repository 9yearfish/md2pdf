/**
 * The Markdown editor.
 *
 * It starts as the plain textarea in the HTML, which means the page is usable
 * the instant it paints and works without JavaScript at all. CodeMirror is
 * fetched afterwards and takes over in place, carrying the text and cursor
 * with it. Nobody waits on an editor bundle to start typing.
 */

export interface Editor {
  getValue(): string;
  setValue(value: string): void;
  insert(text: string): void;
  /** Replace `from`..`to` (UTF-16 offsets) as one undoable edit, leaving the cursor after it. */
  replaceRange(from: number, to: number, text: string): void;
  focus(): void;
  /** The element that currently owns keyboard focus handling. */
  contains(node: Node | null): boolean;
  /** Zero-based source line at the top of the viewport, fractional part included. */
  topLine(): number;
}

export interface EditorHost {
  onChange(): void;
  onScroll(): void;
}

class TextareaEditor implements Editor {
  constructor(private readonly node: HTMLTextAreaElement) {}

  getValue(): string {
    return this.node.value;
  }

  setValue(value: string): void {
    this.node.value = value;
  }

  insert(text: string): void {
    const at = this.node.selectionStart;
    this.node.value =
      this.node.value.slice(0, at) + text + this.node.value.slice(this.node.selectionEnd);
    this.node.selectionStart = this.node.selectionEnd = at + text.length;
  }

  replaceRange(from: number, to: number, text: string): void {
    this.node.setRangeText(text, from, to, 'end');
    // setRangeText is silent; this is an edit like any other.
    this.node.dispatchEvent(new Event('input'));
  }

  focus(): void {
    this.node.focus();
  }

  contains(node: Node | null): boolean {
    return node === this.node;
  }

  /** Ignores wrapping, which is close enough to steer the preview. */
  topLine(): number {
    const lineHeight = parseFloat(getComputedStyle(this.node).lineHeight) || 20;
    return this.node.scrollTop / lineHeight;
  }
}

/** Swaps the textarea for CodeMirror once it has loaded. */
export async function createEditor(
  textarea: HTMLTextAreaElement,
  host: EditorHost,
): Promise<Editor> {
  const fallback = new TextareaEditor(textarea);
  textarea.addEventListener('input', () => host.onChange());
  textarea.addEventListener('scroll', () => host.onScroll(), { passive: true });

  try {
    const editor = await buildCodeMirror(textarea, host);
    return editor ?? fallback;
  } catch {
    // A styled textarea is a perfectly good editor; losing the upgrade is not
    // worth failing the page over.
    return fallback;
  }
}

async function buildCodeMirror(
  textarea: HTMLTextAreaElement,
  host: EditorHost,
): Promise<Editor | null> {
  const [
    { EditorState },
    { EditorView, keymap, drawSelection, rectangularSelection, crosshairCursor },
    { defaultKeymap, history, historyKeymap, indentWithTab },
    { syntaxHighlighting, HighlightStyle, bracketMatching, indentUnit },
    { markdown },
    { tags },
  ] = await Promise.all([
    import('@codemirror/state'),
    import('@codemirror/view'),
    import('@codemirror/commands'),
    import('@codemirror/language'),
    import('@codemirror/lang-markdown'),
    import('@lezer/highlight'),
  ]);

  const container = textarea.parentElement;
  if (!container) return null;

  // Colours come from the stylesheet's custom properties so the editor follows
  // the same light and dark palette as the rest of the page. Near-monochrome
  // on purpose: structure shows as weight and shade, and only links get the
  // accent. The markup characters recede so the words read first.
  const style = HighlightStyle.define([
    { tag: tags.heading, color: 'var(--syntax-heading)', fontWeight: '600' },
    { tag: tags.strong, color: 'var(--syntax-strong)', fontWeight: '600' },
    { tag: tags.emphasis, color: 'var(--syntax-emphasis)', fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.link, color: 'var(--syntax-link)' },
    { tag: tags.url, color: 'var(--syntax-marker)' },
    { tag: tags.monospace, color: 'var(--syntax-code)' },
    { tag: tags.quote, color: 'var(--syntax-quote)' },
    { tag: tags.list, color: 'var(--syntax-marker)' },
    { tag: tags.processingInstruction, color: 'var(--syntax-marker)' },
    { tag: tags.contentSeparator, color: 'var(--syntax-marker)' },
  ]);

  // Matches the textarea it replaces (#editor in styles.css) line for line,
  // so the upgrade moves nothing on screen.
  const theme = EditorView.theme({
    '&': { height: '100%', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--ink, var(--text))' },
    '.cm-scroller': {
      // Follows the page language, so Japanese kanji do not get Chinese glyphs.
      fontFamily: 'var(--mono)',
      lineHeight: '24px',
    },
    '.cm-content': { caretColor: 'var(--ink, var(--text))', padding: '20px 0' },
    '.cm-line': { padding: '0 20px' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--selection)',
    },
    '&.cm-focused': { outline: 'none' },
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: textarea.value,
      extensions: [
        // The textarea's accessible name carries over to the editing surface.
        EditorView.contentAttributes.of({ 'aria-label': textarea.getAttribute('aria-label') ?? 'Markdown' }),
        drawSelection(),
        rectangularSelection(),
        crosshairCursor(),
        history(),
        bracketMatching(),
        indentUnit.of('  '),
        markdown(),
        syntaxHighlighting(style),
        // Long Markdown lines should wrap, not scroll sideways.
        EditorView.lineWrapping,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) host.onChange();
        }),
        theme,
      ],
    }),
  });

  textarea.remove();
  container.append(view.dom);
  view.scrollDOM.addEventListener('scroll', () => host.onScroll(), { passive: true });

  return {
    getValue: () => view.state.doc.toString(),
    setValue(value: string) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    },
    insert(text: string) {
      const at = view.state.selection.main;
      view.dispatch({
        changes: { from: at.from, to: at.to, insert: text },
        selection: { anchor: at.from + text.length },
      });
    },
    replaceRange(from: number, to: number, text: string) {
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
        userEvent: 'input.paste',
      });
    },
    focus: () => view.focus(),
    contains: (node: Node | null) => Boolean(node && view.dom.contains(node)),
    topLine() {
      // How far the document has scrolled past the top of the pane (documentTop
      // is in viewport coordinates and moves as the scroller scrolls).
      const height = view.scrollDOM.getBoundingClientRect().top - view.documentTop;
      const block = view.lineBlockAtHeight(Math.max(0, height));
      const line = view.state.doc.lineAt(block.from).number - 1;
      // A wrapped line is one block several rows tall; count how far into it we are.
      return line + Math.min(1, Math.max(0, (height - block.top) / Math.max(1, block.height)));
    },
  };
}
