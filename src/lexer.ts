import { emit } from "process"
import { Token } from "./types/token"

export default class Lexer {
    input: string
    pos: number = 0
    listToken: Token[] = []

    constructor(input: string) {
        this.input = input
    }

    /**
     * Tokenize the markdown into a list of tokens.
     * @returns List of tokens
     */
    tokenize(): Token[] {
        const TOKEN_HANDLER = [
            { match: (lex: Lexer) => lex.startsWith("```"), emit: (lex: Lexer) => lex.handleCodeBlock() },
            { match: (lex: Lexer) => lex.startsWith("**"), emit: (lex: Lexer) => lex.handleBold() },
            { match: (lex: Lexer) => lex.peek() === "`", emit: (lex: Lexer) => lex.handleInlineBlock() },
            { match: (lex: Lexer) => lex.peek() === "#", emit: (lex: Lexer) => lex.handleHeader() },
            { match: (lex: Lexer) => lex.peek() === "*" || lex.peek() === "_", emit: (lex: Lexer) => lex.handleItalic() },
            { match: (lex: Lexer) => lex.peek() === ">", emit: (lex: Lexer) => lex.handleQuoteBlock() },
            { match: (lex: Lexer) => lex.peek() === "[", emit: (lex: Lexer) => lex.handleLink() },
            { match: (lex: Lexer) => lex.peek() === "!" && lex.peek(1) === "[", emit: (lex: Lexer) => lex.handleImage() },
            { match: (lex: Lexer) => lex.peek() === "\n", emit: (lex: Lexer) => lex.listToken.push({ type: "NewLine" }) },
        ]

        while (!this.isEndOfFile()) {
            let matched = false
            for (const handler of TOKEN_HANDLER) {
                if (handler.match(this)) {
                    handler.emit(this)
                    matched = true
                    break
                }
            }
            if (!matched) {
                this.handleTextBlock()
            }
            this.next()
        }
        this.listToken.push({ type: "EOF" })
        return this.listToken
    }


    //Get current character with offset
    private peek(offset: number = 0) {
        const i = this.pos + offset
        return i < this.input.length ? this.input[i] : null
    }

    //Move cursor by amount
    private next(amount: number = 1) {
        this.pos += amount
    }

    //If current cursor startsWith given str
    private startsWith(str: string): boolean {
        return this.input.slice(this.pos, this.pos + str.length) === str
    }

    private isEndOfFile(): boolean {
        return this.pos >= this.input.length
    }

    private getLastToken(): Token {
        return this.listToken[this.listToken.length - 1]
    }

    private handleHeader(): void {
        let level = 0

        while (this.peek() === "#") {
            level++
            this.next()
        }

        if (this.peek() === " ") {
            this.next()
            this.pos--
        }

        this.listToken.push({ type: "Header", level })
    }

    private handleCodeBlock() {
        let lang = ""
        let content = ""

        this.next(3)    //Skip open block

        while (!this.isEndOfFile() && this.peek() !== "\n") {
            lang += this.peek()
            this.next()
        }

        this.next() //Skip \n
        while (!this.isEndOfFile() && !this.startsWith("```")) {
            content += this.peek()
            this.next()
        }

        this.next(2) //Skip close block (due to next() after each tokenize iteration)

        this.listToken.push({ "type": "CodeBlock", lang: lang.trim(), content: content.trimEnd() })
    }

    private handleTextBlock() {
        const currentChar = this.peek()
        if (currentChar === null) return
        const lastToken = this.getLastToken()

        if (lastToken?.type === "Text") lastToken.value += currentChar
        else this.listToken.push({ type: "Text", value: currentChar })
    }

    private handleItalic() {
        this.listToken.push({ type: "Italic" })
    }

    private handleBold() {
        this.listToken.push({ type: "Bold" })
        this.next() //Skip *
    }

    private handleInlineBlock() {
        let content = ""
        this.next() //Skip open block
        while (!this.isEndOfFile() && !this.startsWith("`")) {
            content += this.peek()
            this.next()
        }

        // this.next() //Skip close block
        this.listToken.push({ "type": "InlineCode", content: content })
    }

    private handleQuoteBlock() {
        this.listToken.push({ type: "Quote" })
    }

    private handleLink() {
        this.next() //Skip [
        const text = this.readUntil("]")
        this.next() //Skip ]

        if (this.peek() === "(") {
            this.next() //Skip (
            const url = this.readUntil(")")
            //Don't skip ) due to auto skip on while loop
            this.listToken.push({ type: "Link", text: text, href: url })
        }
        else this.listToken.push({ type: "Text", value: `[${text}]` })
    }

    private handleImage() {
        this.next() //Skip !
        if (this.peek() !== "[") return

        this.next() //Skip [
        const alt = this.readUntil("]")
        this.next() //Skip ]

        if (this.peek() === "(") {
            this.next() //Skip (
            const src = this.readUntil(")")
            this.next() //Skip )
            this.listToken.push({ type: "Image", alt: alt, src: src })
        }
        else this.listToken.push({ type: "Text", value: `![${alt}]` })

    }

    private readUntil(char: string): string {
        let result = ""
        while (this.peek() !== char) {
            result += this.peek()
            this.next()
        }
        return result
    }
}
