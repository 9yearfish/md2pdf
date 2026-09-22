import type { Token } from 'markdown-it';

export interface Node {
  token: Token;
  children: Node[];
}

/**
 * markdown-it emits a flat stream with `nesting` markers. A tree is far easier
 * to translate into Typst's nested function calls.
 */
export function toTree(tokens: Token[]): Node[] {
  const root: Node[] = [];
  const stack: Node[][] = [root];

  for (const token of tokens) {
    if (token.nesting === -1) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const node: Node = { token, children: [] };
    stack[stack.length - 1].push(node);
    if (token.nesting === 1) stack.push(node.children);
  }
  return root;
}
