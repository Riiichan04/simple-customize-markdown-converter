import { Node } from "./node";
import { Token } from "./token";

export class Parser {
    listToken: Token[]
    pos: number = 0

    constructor(listToken: Token[]) {
        this.listToken = listToken
    }

    peek(offset: number = 0): Token | null {
        const i = this.pos + offset
        return i < this.listToken.length ? this.listToken[i] : null
    }

    next(amount: number = 1): void {
        this.pos += amount
    }

    isEnd(): boolean {
        return this.peek()?.type === "EOF"
    }

    //Entry point
    parse(): Node {
        return {
            type: "Document",
            children: this.parseBlocks()
        }
    }

    parseBlocks(): Node[] {
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

    parseParagraph(): Node {
        return {
            type: "Paragraph",
            children: this.parseInlineUntil("NewLine")
        }
    }

    parseCodeBlock(): Node {
        const tok = this.peek()
        return {
            type: "CodeBlock",
            lang: tok?.type === "CodeBlock" ? tok.lang : "",
            content: tok?.type === "CodeBlock" ? tok.content : ""
        }
    }

    parseHeader(): Node {
        const currentNode = this.peek()
        this.next()
        return {
            type: "Header",
            level: currentNode?.type === "Header" ? currentNode.level : 1,
            children: this.parseInlineUntil("NewLine") //Temp
        }
    }

    parseBold(): Node {
        this.next() // skip marker
        return { type: "Bold", children: this.parseInlineUntil("Bold") }
    }

    parseItalic(): Node {
        this.next() // skip marker
        return { type: "Italic", children: this.parseInlineUntil("Italic") }
    }

    parseInlineCode(): Node {
        const tok = this.peek()
        this.next()
        return {
            type: "InlineCode",
            content: tok?.type === "InlineCode" ? tok.content : ""
        }
    }

    parseInlineUntil(stopType: Token["type"]): Node[] {
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
