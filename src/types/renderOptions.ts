import { Node } from "./node"

/**
 * Option to customize how AST nodes are renderes into HTML
 * 
 * @property elements? - A mapping of AST node types to custom render functions.
 * - The key is the `Node` type (e.g. `"Header"`, `"Text"`).
 * - The value is a function `(node, children) => string` that define how to render HTML string. With `node` is a AST `Node`. `children` is the node's childrens
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
 * @todo Update`node` type in value function from `any` to `Node`
 */
export type RenderOption = {
    elements?: Partial<Record<Node["type"], (node: any, children: string[]) => string>>
}