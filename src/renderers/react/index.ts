import React from "react";
import { IRenderer } from "..";
import { MarkdownOptions } from "../../types/options";
import { mergeOptions } from "../../types/options";
import { ASTNode, TableRow } from "../../types/parser";
import { RenderStrategy } from "../../types/renderer";
import { FootnoteResolver } from "../../core/resolver/footnote-resolver";
import * as Handlers from "./handler";
import { getClassName } from "../../utilities/renderer-utils";

export class ReactRenderer implements IRenderer<React.ReactNode> {
    options: MarkdownOptions<React.ReactNode>
    footnoteResolver: FootnoteResolver

    strategies: Map<string, RenderStrategy<React.ReactNode>> = new Map()

    constructor(footnoteResolver: FootnoteResolver, options: MarkdownOptions<React.ReactNode> = {}, plugin: RenderStrategy<React.ReactNode>[] = []) {
        this.footnoteResolver = footnoteResolver;
        this.options = mergeOptions(options);
        this.registerDefaultStrategies();
        if (plugin.length > 0) plugin.forEach(p => this.registerStrategy(p))
    }

    private registerDefaultStrategies() {
        const listDefaultStrategy = [
            Handlers.DocumentHandler,
            Handlers.ParagraphHandler,
            Handlers.HeaderHandler,
            Handlers.CodeBlockHandler,
            Handlers.QuoteHandler,
            Handlers.BoldHandler,
            Handlers.ItalicHandler,
            Handlers.StrikethroughHandler,
            Handlers.InlineCodeHandler,
            Handlers.LinkHandler,
            Handlers.ImageHandler,
            Handlers.ListHandler,
            Handlers.ListItemHandler,
            Handlers.TaskItemHandler,
            Handlers.TableHandler,
            Handlers.TextHandler,
            Handlers.HorizontalLineHandler,
            Handlers.HTMLBlockHandler,
            Handlers.HTMLInlineHandler,
            Handlers.FootnoteRefHandler
        ];
        listDefaultStrategy.forEach(s => this.strategies.set(s.type, s));
    }

    render(node: ASTNode): React.ReactNode {
        const userRenderer = this.options.renderOptions?.elements?.[node.type]
        const children = (node.children || []).map(child => this.render(child))
        if (userRenderer) {
            return (userRenderer as (n: ASTNode, c: React.ReactNode[]) => React.ReactNode)(node, children)
        }

        const strategy = this.strategies.get(node.type)
        if (strategy) {
            return strategy.render(node, children, this)
        }
        return children.join("")
    }

    renderFootnotes(): React.ReactNode {
        if (this.footnoteResolver.isResolverValid()) {
            const used = this.footnoteResolver.getUsedRef()

            if (used.length === 0) return null

            const items = used.map((id, i) => {
                const def = this.footnoteResolver.getDef(id) ?? ""
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

    renderTable(node: ASTNode, children: React.ReactNode[]): React.ReactNode {
        if (node.type === "Table" && node.rows) {
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
                { className: getClassName(this, node), },
                tHead,
                tBody
            )
        }
        else return React.createElement("p", { className: getClassName(this, node), }, ...children)
    }

    registerStrategy(strategy: RenderStrategy<React.ReactNode>): void {
        this.strategies.set(strategy.type, strategy)
    }
}