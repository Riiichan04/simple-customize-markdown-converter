import { FootnoteResolver } from "../core/resolver"
import { ConvertExtension, HTMLConvertExtension } from "../types/extension"
import { Node, TableRow } from "../types/node"
import { MarkdownDefaultOptions } from "../types/options"
import { RenderElements, RenderOption } from "../types/options/renderOptions"

export default class DefaultRenderer {
    options: MarkdownDefaultOptions

    footNoteResolver: FootnoteResolver

    extensionMap: Map<string, HTMLConvertExtension>

    constructor(options: MarkdownDefaultOptions, footNoteResolver: FootnoteResolver, listExtension: HTMLConvertExtension[] = []) {
        this.options = options
        this.footNoteResolver = footNoteResolver
        this.extensionMap = new Map(listExtension.map(ext => [ext.name, ext]))
    }

    /**
     * Render a Node (AST) to a HTML string according renderer options
     * 
     * @param node - The abstract syntax tree (AST) from the Parser
     * @returns The rendered HTML string.
     */
    render<K extends Node["type"]>(node: Extract<Node, { type: K }>): string {
        //Get proper handler type
        const handler = this.handleRender(node.type)
        //If node have children, recursive to handle all node's children
        const children = "children" in node ? node.children.map((ele) => this.render(ele)) : []
        return handler(node, children)
    }

    /**
     * Select the appropriate rendering handler for a specific node type
     * @param type - The type of AST Note
     * @returns A function take a node and its children to procude a string.
     */
    private handleRender<K extends Node["type"]>(type: K): NonNullable<RenderElements[K]> {
        const extension = this.extensionMap.get(type)
        if (extension && "render" in extension) {
            return extension.render
        }

        const defaultRender: RenderElements = {
            //Base structural nodes
            Document: (_node, children) => children.join("") + this.renderFootnotes(),
            Paragraph: (_node, children) => `<p>${children.join("")}</p>`,

            //Container nodes
            CodeBlock: (node) => `<pre><code class="lang-${node.lang}">${this.escapeHtml(node.content)}</code></pre>`,
            Header: (node, children) => `<h${node.level}${node.level <= 2 ? ' style="border-bottom: 1px solid #d1d9e0b3"' : ''}>${children.join("")}</h${node.level}>`,
            Quote: (_node, children) => `<blockquote style="margin:0; padding:0 1em; color:#59636e; border-left:.25em solid #d1d9e0;">${children.join("")}</blockquote>`,

            //For list nodes
            List: (node, children) => node.ordered ? `<ol>${children.join("")}</ol>` : `<ul>${children.join("")}</ul>`,
            ListItem: (_node, children) => `<li>${children.join("")}</li>`,
            TaskItem: (node, children) => `<li><input type="checkbox" disabled ${node.checked ? "checked" : ""}>${children.join("")}</li>`,

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

            //For table nodes
            Table: (node, children) => this.renderTable(node, children),

            //For HTML
            HTMLBlock: (node) => this.options.converterOptions?.allowDangerousHtml
                ? node.value
                : this.escapeHtml(node.value),

            HTMLInline: (node) => this.options.converterOptions?.allowDangerousHtml
                ? node.value
                : this.escapeHtml(node.value),

            //For footnote
            FootnoteRef: (node) => {
                const idx = this.footNoteResolver.getUsedRefById(node.id)
                return `<sup id="fnref:${idx}"><a href="#fn:${idx}" class="footnote-ref">[${idx}]</a></sup>`
            }
        }

        return (this.options.renderOptions?.elements?.[type] ?? defaultRender[type])!
    }

    private renderTable(node: Node, children: string[]) {
        if (node.type === "Table") {
            const header = node.rows.filter(row => row.isHeader)
            const body = node.rows.filter(row => !row.isHeader)

            const renderRows = (row: TableRow) => {
                const tag = row.isHeader ? "th" : "td"
                const cells = row.cells.map(cell => {
                    const align = `style="text-align:${cell.align}"`
                    return `<${tag} ${align}>${cell.children.map(c => this.render(c)).join("")}</${tag}>`
                }).join("")

                return `<tr>${cells}</tr>`
            }

            const tHead = header.length ? `<thead>${header.map(renderRows).join("")}</thead>` : ""
            const tBody = body.length ? `<tbody>${body.map(renderRows).join("")}</tbody>` : ""

            return `<table>${tHead}${tBody}</table>`
        }
        else return `<p>${children.join("\n")}</p>`
    }

    private escapeHtml(str: string) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }

    private renderFootnotes(): string {
        if (this.footNoteResolver.isResolverValid()) {
            const used = this.footNoteResolver.getUsedRef()
            if (used.length === 0) return ""

            const items = used.map((id, i) => {
                const def = this.footNoteResolver.getDef(id) ?? ""
                const idx = i + 1
                return `<li id="fn:${idx}"><p>${def} <a href="#fnref:${idx}" class="footnote-backref">↩</a></p></li>`
            })

            return `<section class="footnotes"><ol>${items.join("")}</ol></section>`
        }
        else return ""
    }
}
