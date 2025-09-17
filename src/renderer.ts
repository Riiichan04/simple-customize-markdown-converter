import { Node } from "./types/node"
import { RenderOption } from "./types/renderOptions"

export default class Renderer {
    option: RenderOption

    constructor(option: RenderOption) {
        this.option = option
    }

    /**
     * Render a Node (AST) to a HTML string according renderer options
     * 
     * @param node - The abstract syntax tree (AST) from the Parser
     * @returns The rendered HTML string.
     */
    render(node: Node): string {
        //Get proper handler type
        const handler = this.handleRender(node.type)
        //If node have children, recursive to handle all node's children
        const children = "children" in node ? node.children.map((ele) => this.render(ele)) : []
        return handler(node, children)
    }

    private handleRender(type: Node["type"]): (node: any, children: string[]) => string {
        const defaultRender: Record<Node["type"], (node: any, children: string[]) => string> = {
            Document: (_node, children) => children.join(""),
            Paragraph: (_node, children) => `<p>${children.join("")}</p>`,
            Header: (node, children) => `<h${node.level}>${children.join("")}</h${node.level}>`,
            InlineCode: (node) => `<code>${this.escapeHtml(node.content)}</code>`,
            CodeBlock: (node) => `<pre><code class="lang-${node.lang}">${this.escapeHtml(node.content)}</code></pre>`,
            Bold: (_node, children) => `<strong>${children.join("")}</strong>`,
            Italic: (_node, children) => `<em>${children.join("")}</em>`,
            Quote: (_node, children) => `<blockquote>${children.join("")}</blockquote>`,
            Link: (node) => `<a href="${node.href}">${node.text}</a>`,
            Image: (node) => `<img src="${node.src}" alt="${node.alt}"/>`,
            Text: (node) => node.value,
        }

        return this.option.elements?.[type] ?? defaultRender[type]
    }

    private escapeHtml(str: string) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
}
