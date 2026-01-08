import React, { ReactNode } from "react"
import { FootnoteResolver } from "../core/resolver"
import { Node, TableRow } from "../types/node"
import { ReactRenderElements, ReactRenderOption } from "../types/options/reactRenderOptions"
import { MarkdownReactOptions } from "../types/options"
import { ReactConvertExtension } from "../types/extension"

export default class ReactRenderer {
    options: MarkdownReactOptions

    footNoteResolver: FootnoteResolver

    extensionMap: Map<string, ReactConvertExtension>

    constructor(footNoteResolver: FootnoteResolver, options: MarkdownReactOptions, listExtension: ReactConvertExtension[] = []) {
        this.footNoteResolver = footNoteResolver
        this.options = options
        this.extensionMap = new Map(listExtension.map(ext => [ext.name, ext]))
    }

    /**
     * Render a Node (AST) to a ReactNode according renderer options
     * 
     * @param node - The abstract syntax tree (AST) from the Parser
     * @returns The ReactNode representing the rendered Markdown element.
     */
    render<K extends Node["type"]>(node: Extract<Node, { type: K }>): ReactNode {
        //Get proper handler type
        const handler = this.handleRender(node.type)
        //If node have children, recursive to handle all node's children
        const children = "children" in node ? node.children.map((ele) => this.render(ele)) : []
        return handler(node, children)
    }

    /**
     * Select the appropriate rendering handler for a specific node type
     * @param type - The type of AST Note
     * @returns A function take a node and its children to procude a ReactNode.
     */
    private handleRender<K extends Node["type"]>(type: K): NonNullable<ReactRenderElements[K]> {
        const extension = this.extensionMap.get(type)
        if (extension && "render" in extension) {
            return extension.render
        }

        const defaultRender: ReactRenderElements = {
            //Base structural nodes
            Document: (_node, children) => React.createElement(
                React.Fragment,
                null,
                ...children,
                this.renderFootnotes()
            ),
            Paragraph: (_node, children) => React.createElement("p", null, ...children),

            //Container nodes
            CodeBlock: (node) => React.createElement(
                "pre",
                null,
                React.createElement(
                    "code",
                    { className: `lang-${node.lang}` },
                    node.content
                )
            ),

            Header: (node, children) => React.createElement(
                `h${node.level}`,
                { style: { borderBottom: node.level <= 2 ? "1px solid #d1d9e0b3" : undefined } },
                ...children
            ),

            Quote: (_node, children) => React.createElement(
                "blockquote",
                { style: { margin: "0", padding: "0 1em", color: "#59636e", borderLeft: ".25em solid #d1d9e0" } },
                ...children
            ),
            //For list nodes
            List: (node, children) => node.ordered ?
                React.createElement(
                    "ol",
                    null,
                    ...children
                ) :
                React.createElement(
                    "ul",
                    null,
                    ...children
                ),
            ListItem: (_node, children) => React.createElement(
                "li",
                null,
                ...children
            ),
            TaskItem: (node, children) => React.createElement(
                "li",
                null,
                React.createElement(
                    "input",
                    {
                        type: "checkbox",
                        disabled: true,
                        checked: !!node.checked,
                        readOnly: true
                    },
                ),
                ...children
            ),
            //Styling nodes
            Bold: (_node, children) => React.createElement(
                "strong",
                null,
                ...children
            ),
            Italic: (_node, children) => React.createElement(
                "em",
                null,
                ...children
            ),
            Strikethrough: (_node, children) => React.createElement(
                "s",
                null,
                ...children
            ),
            InlineCode: (node) => React.createElement(
                "code",
                null,
                node.content
            ),

            //Media nodes
            Link: (node) => React.createElement(
                "a",
                {
                    href: node.href,
                    //Security reason
                    target: "_blank",
                    rel: "noopener"
                },
                node.text
            ),
            Image: (node) => React.createElement(
                "img",
                {
                    src: node.src,
                    alt: node.alt,
                },
                null
            ),

            //Leaf nodes
            HorizontalLine: (_node) => React.createElement("hr"),
            Text: (node) => node.value || "",

            //For table nodes
            Table: (node, children) => this.renderTable(node, children),

            //For HTML
            HTMLBlock: (node) => this.options.converterOptions?.allowDangerousHtml
                ? React.createElement("div", { dangerouslySetInnerHTML: { __html: node.value } })
                : React.createElement("code", null, node.value),

            HTMLInline: (node) => this.options.converterOptions?.allowDangerousHtml
                ? React.createElement("span", { dangerouslySetInnerHTML: { __html: node.value } })
                : React.createElement("code", null, node.value),

            //For footnote
            FootnoteRef: (node) => {
                const idx = this.footNoteResolver.getUsedRefById(node.id)
                return React.createElement(
                    "sup",
                    { id: `fnref:${idx}` },
                    React.createElement(
                        "a",
                        { href: `#fn:${idx}`, className: "footnote-ref" },
                        `[${idx}]`
                    )
                )
            }
        }

        return (this.options.renderOptions?.elements?.[type] ?? defaultRender[type]) as NonNullable<ReactRenderElements[K]>;
    }

    private renderTable(node: Node, children: ReactNode[]) {
        if (node.type === "Table") {
            const header = node.rows.filter(row => row.isHeader)
            const body = node.rows.filter(row => !row.isHeader)

            const renderRows = (row: TableRow, rowIndex: number) => {
                return React.createElement(
                    "tr",
                    { key: rowIndex },
                    row.cells.map((cell, cellIndex) => {
                        const tag = row.isHeader ? "th" : "td"
                        return React.createElement(
                            tag,
                            { key: cellIndex, style: { textAlign: cell.align as any } },
                            ...cell.children.map(c => this.render(c))
                        )
                    })
                )
            }

            const tHead = header.length
                ? React.createElement(
                    "thead",
                    null,
                    header.map((row, i) => renderRows(row, i))
                )
                : null

            const tBody = body.length
                ? React.createElement(
                    "tbody",
                    null,
                    body.map((row, i) => renderRows(row, i))
                )
                : null

            return React.createElement(
                "table",
                null,
                tHead,
                tBody
            )
        }
        else return React.createElement("p", null, ...children)
    }

    private renderFootnotes(): React.ReactNode {
        if (this.footNoteResolver.isResolverValid()) {
            const used = this.footNoteResolver.getUsedRef()

            if (used.length === 0) return null

            const items = used.map((id, i) => {
                const def = this.footNoteResolver.getDef(id) ?? ""
                const idx = i + 1

                return React.createElement(
                    "li",
                    { id: `fn:${idx}` },
                    React.createElement(
                        "p",
                        null,
                        def + " ",
                        React.createElement(
                            "a",
                            { href: `#fnref:${idx}`, className: "footnote-backref" },
                            "↩"
                        )
                    )
                )
            })

            return React.createElement(
                "section",
                { className: "footnotes" },
                React.createElement(
                    "ol",
                    null,
                    ...items
                )
            )
        }
        else return null
    }
}
