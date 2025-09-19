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
            //Base structural nodes
            Document: (_node, children) => children.join(""),
            Paragraph: (_node, children) => `<p>${children.join("")}</p>`,

            //Container nodes
            CodeBlock: (node) => `<pre><code class="lang-${node.lang}">${this.escapeHtml(node.content)}</code></pre>`,
            Header: (node, children) => `<h${node.level}>${children.join("")}</h${node.level}>`,
            Quote: (_node, children) => `<blockquote>${children.join("")}</blockquote>`,
            List: (node, children) => node.ordered ? `<ol>${children.join("")}</ol>` : `<ul>${children.join("")}</ul>`,
            ListItem: (_node, children) => `<li>${children.join("")}</li>`,

            //Styling nodes
            Bold: (_node, children) => `<strong>${children.join("")}</strong>`,
            Italic: (_node, children) => `<em>${children.join("")}</em>`,
            Strikethrough: (_node, children) => `<s>${children.join("")}</s>`,
            InlineCode: (node) => `<code>${this.escapeHtml(node.content)}</code>`,
            
            //Media nodes
            Link: (node) => `<a href="${node.href}">${node.text}</a>`,
            Image: (node) => `<img src="${node.src}" alt="${node.alt}"/>`,
            
            //Leaf nodes
            HorizontalLine: (_node) => `<hr>`,
            Text: (node) => node.value,
        }

        return this.option.elements?.[type] ?? defaultRender[type]
    }

    private escapeHtml(str: string) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
}
