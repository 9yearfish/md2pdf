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
  focus(): void;
  /** The element that currently owns keyboard focus handling. */
  contains(node: Node | null): boolean;
}

export interface EditorHost {
  onChange(): void;
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

  focus(): void {
    this.node.focus();
  }

  contains(node: Node | null): boolean {
    return node === this.node;
  }
}

/** Swaps the textarea for CodeMirror once it has loaded. */
export async function createEditor(
  textarea: HTMLTextAreaElement,
  host: EditorHost,
): Promise<Editor> {
  const fallback = new TextareaEditor(textarea);
  textarea.addEventListener('input', () => host.onChange());

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
    { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection, crosshairCursor },
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
  // the same light and dark palette as the rest of the page.
  const style = HighlightStyle.define([
    { tag: tags.heading, color: 'var(--syntax-heading)', fontWeight: '600' },
    { tag: tags.strong, color: 'var(--syntax-strong)', fontWeight: '600' },
    { tag: tags.emphasis, color: 'var(--syntax-emphasis)', fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.link, color: 'var(--syntax-link)' },
    { tag: tags.url, color: 'var(--syntax-link)' },
    { tag: tags.monospace, color: 'var(--syntax-code)' },
    { tag: tags.quote, color: 'var(--syntax-quote)', fontStyle: 'italic' },
    { tag: tags.list, color: 'var(--syntax-marker)' },
    { tag: tags.processingInstruction, color: 'var(--syntax-marker)' },
    { tag: tags.contentSeparator, color: 'var(--syntax-marker)' },
  ]);

  const theme = EditorView.theme({
    '&': { height: '100%', fontSize: '13px', backgroundColor: 'var(--bg)', color: 'var(--text)' },
    '.cm-scroller': {
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "PingFang SC", monospace',
      lineHeight: '1.7',
      padding: '12px 0',
    },
    '.cm-content': { caretColor: 'var(--accent)' },
    '.cm-gutters': {
      backgroundColor: 'var(--bg)',
      color: 'var(--text-faint)',
      border: 'none',
      paddingRight: '4px',
    },
    '.cm-activeLine': { backgroundColor: 'var(--bg-sunken)' },
    '.cm-activeLineGutter': { backgroundColor: 'var(--bg-sunken)', color: 'var(--text-muted)' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--selection)',
    },
    '&.cm-focused': { outline: 'none' },
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: textarea.value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
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
    focus: () => view.focus(),
    contains: (node: Node | null) => Boolean(node && view.dom.contains(node)),
  };
}
