import { Node, TableCell, TableRow } from "./types/node";
import { Token } from "./types/token";

export class Parser {
    listToken: Token[]
    pos: number = 0

    constructor(listToken: Token[]) {
        this.listToken = listToken
    }

    /**
     * Parse a list token to a node
     * @return A parsed abstract syntax tree (AST)
     */
    parse(): Node {
        return {
            type: "Document",
            children: this.parseBlocks()
        }
    }

    private peek(offset: number = 0): Token | null {
        const i = this.pos + offset
        return i < this.listToken.length ? this.listToken[i] : null
    }

    private next(amount: number = 1): void {
        this.pos += amount
    }

    private isEnd(): boolean {
        return this.peek()?.type === "EOF"
    }

    private parseBlocks(): Node[] {
        const listNode: Node[] = []
        while (!this.isEnd()) {
            const currentNode = this.peek()
            if (!currentNode) break

            switch (currentNode.type) {
                case "Header": {
                    listNode.push(this.parseHeader())
                    break
                }
                case "CodeBlock": {
                    listNode.push(this.parseCodeBlock())
                    break
                }
                case "Quote": {
                    listNode.push(this.parseQuote())
                    break
                }
                case "Image": {
                    listNode.push(this.parseImage())
                    break
                }
                case "HorizontalLine": {
                    listNode.push(this.parseHorizontalLine())
                    break
                }
                case "ListStart": {
                    listNode.push(this.parseList())
                    break
                }
                case "TableStart": {
                    listNode.push(this.parseTable())
                    break
                }
                case "NewLine": {
                    this.next() // skip
                    break
                }
                default: listNode.push(this.parseParagraph())
            }
        }
        return listNode
    }

    private parseParagraph(): Node {
        return {
            type: "Paragraph",
            children: this.parseInlineUntil("NewLine")
        }
    }

    private parseCodeBlock(): Node {
        const tok = this.peek()
        this.next()
        return {
            type: "CodeBlock",
            lang: tok?.type === "CodeBlock" ? tok.lang : "",
            content: tok?.type === "CodeBlock" ? tok.content : ""
        }
    }

    private parseHeader(): Node {
        const currentNode = this.peek()
        this.next()
        return {
            type: "Header",
            level: currentNode?.type === "Header" ? currentNode.level : 1,
            children: this.parseInlineUntil("NewLine") //Temp
        }
    }

    private parseBold(): Node {
        this.next() // skip marker
        return { type: "Bold", children: this.parseInlineUntil("Bold") }
    }

    private parseItalic(): Node {
        this.next() // skip marker
        return { type: "Italic", children: this.parseInlineUntil("Italic") }
    }

    private parseStrikethrough(): Node {
        this.next() // skip marker
        return { type: "Strikethrough", children: this.parseInlineUntil("Strikethrough") }
    }

    private parseInlineCode(): Node {
        const tok = this.peek()
        this.next()
        return {
            type: "InlineCode",
            content: tok?.type === "InlineCode" ? tok.content : ""
        }
    }

    private parseQuote(): Node {
        this.next() //skip marker
        return { type: "Quote", children: [{ type: "Paragraph", children: this.parseInlineUntil("NewLine") }] }
    }

    private parseList(): Node {
        const tok = this.peek()
        if (tok?.type === "ListStart") {
            this.next() //skip marker
            const result: Node = {
                type: "List",
                level: tok.level,
                ordered: tok.ordered,
                children: [],
            }
            let nextToken = this.peek()
            while (!this.isEnd()) {
                if (nextToken?.type === "ListItem" || nextToken?.type === "TaskItem") {
                    result.children.push(this.parseListItem())
                    nextToken = this.peek()
                }
                else if (nextToken?.type === "ListEnd") {
                    this.next()
                    break
                }
                else break
            }

            return result
        }
        //Temp return
        return {
            type: "Text",
            value: ""
        }
    }

    private parseListItem(): Node {
        const currentToken = this.peek()
        this.next() // skip marker   
        const children: Node[] = []
        while (!this.isEnd()) {
            const tok = this.peek()
            if (!tok) break

            if (tok.type === "NewLine") {
                this.next()
                continue
            }

            if (tok.type === "ListStart") {
                children.push(this.parseList())
                continue
            }

            if (["ListItem", "TaskItem", "ListEnd"].includes(tok.type)) {
                break
            }

            children.push({
                type: "Paragraph",
                children: this.parseInlineUntil("NewLine")
            })
        }

        return currentToken?.type === "TaskItem" ? {
            type: "TaskItem",
            checked: currentToken.type === "TaskItem" ? currentToken.checked : false,
            children: children
        } : {
            type: "ListItem",
            children: children
        }
    }

    private parseLink(): Node {
        const tok = this.peek()
        this.next()
        if (tok?.type === "Link") {
            return {
                type: "Link",
                href: tok.href,
                text: tok.text
            }
        }
        return { type: "Link", href: "", text: "" }
    }

    private parseImage(): Node {
        const tok = this.peek()
        this.next()
        if (tok?.type === "Image") {
            return {
                type: "Image",
                src: tok.src,
                alt: tok.alt
            }
        }
        else return { type: "Image", src: "", alt: "" }
    }

    private parseTable(): Node {
        this.next() // skip TableStart token
        const parseRow = (): TableRow => {
            const rowStartToken = this.peek()
            if (rowStartToken?.type !== "RowStart") return { isHeader: false, cells: [] }

            this.next() // skip RowStart token
            const cells: TableCell[] = []
            while (this.peek() && this.peek()!.type !== "RowEnd") {
                cells.push(parseCell())
            }
            this.next() // skip RowEnd token
            return {
                isHeader: rowStartToken.isHeader,
                cells: cells
            }
        }

        const parseCell = (): TableCell => {
            const cellStartToken = this.peek()
            if (cellStartToken?.type !== "CellStart") return { align: "left", chlidren: [] }

            this.next() // skip CellStart token
            const childrens = this.parseInlineUntil("CellEnd")
            return {
                align: cellStartToken.align,
                chlidren: [{ type: "Paragraph", children: childrens }]
            }
        }

        const rows: TableRow[] = []
        while (this.peek()?.type !== "TableEnd") {
            rows.push(parseRow())
            if (this.isEnd()) break
        }
        this.next()
        return {
            type: "Table",
            rows: rows
        }
    }

    private parseHorizontalLine(): Node {
        const tok = this.peek()
        this.next() // skip marker
        return { type: "HorizontalLine" }
    }

    private parseInlineUntil(stopType: Token["type"] | Token["type"][]): Node[] {
        const stop = Array.isArray(stopType) ? stopType : [stopType]
        const listNode: Node[] = []
        while (!this.isEnd()) {
            const currentNode = this.peek()
            if (!currentNode) break
            if (stop.includes(currentNode.type)) break

            switch (currentNode.type) {
                case "Bold": {
                    listNode.push(this.parseBold())
                    break
                }
                case "Italic": {
                    listNode.push(this.parseItalic())
                    break
                }
                case "Strikethrough": {
                    listNode.push(this.parseStrikethrough())
                    break
                }
                case "InlineCode": {
                    listNode.push(this.parseInlineCode())
                    break
                }
                case "Text": {
                    listNode.push({ type: "Text", value: currentNode.value })
                    this.next()
                    break
                }
                case "Link": {
                    listNode.push(this.parseLink())
                    break
                }
                default: this.next()
            }
        }
        this.next() //Skip stop token
        return listNode
    }

}
