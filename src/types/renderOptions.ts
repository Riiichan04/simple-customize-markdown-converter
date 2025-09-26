import { Node } from "./node"

/**
 * Function type for rendering an AST node to HTML.
 * 
 * @template T - A subtype of `Node` corresponding to the render node
 * @param node - The AST node to render
 * @param children - Rendered HTML strings of the node's children
 * @returns A HTML string representation of the node
 */
type NodeRenderer<T extends Node = Node> = (node: T, children: string[]) => string

/**
 * A mapping of AST node types to custom render functions.
 * 
 * - The key is a `Node["type"]` string literal (e.g. `"Header"`, `"Paragraph"`)
 * - The value is a function `(node, children) => string`:
 *      - `node` is a `Node` with its attribute depending on its `type`.
 *      (e.g. `"Header"` nodes include `level`, `"CodeBlock"` nodes include `lang` and `content`, etc)
 *      - `children` is the array of rendered strings of its children.
 */
export type RenderElements = {
    [K in Node["type"]]?: NodeRenderer<Extract<Node, { type: K }>>
}

/**
 * Options to customize how AST nodes are renderes into HTML
 * 
 * @property elements - Optional custom rendered for one or more node types
 * 
 * @example
 * ```ts
 * const renderOptions: RenderOption = {
 *   elements: {
 *     Paragraph: (_node, children) => `<div class="paragraph">${children.join("")}</div>`,
 *     Bold: (_node, children) => `<b class="bold-text">${children.join("")}</b>`,
 *   }
 * }
 * ```
 * 
 */
export type RenderOption = {
    elements?: RenderElements
}