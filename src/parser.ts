import { Node } from "./node";
import { Token } from "./token";

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
                    this.next()
                }
                    break
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

    private parseInlineCode(): Node {
        const tok = this.peek()
        this.next()
        return {
            type: "InlineCode",
            content: tok?.type === "InlineCode" ? tok.content : ""
        }
    }

    private parseInlineUntil(stopType: Token["type"]): Node[] {
        const listNode: Node[] = []
        while (!this.isEnd() && this.peek()?.type !== stopType) {
            const currentNode = this.peek()
            if (!currentNode) break
            switch (currentNode.type) {
                case "Bold": {
                    listNode.push(this.parseBold())
                    break
                }
                case "Italic": {
                    listNode.push(this.parseItalic())
                    break
                }
                case "InlineCode": {
                    listNode.push(this.parseInlineCode())
                    break
                }
                case "Text": {
                    listNode.push({ type: "Text", value: currentNode.value })
                }
                default: this.next()
            }
        }
        this.next() //Skip stop token
        return listNode
    }

}
