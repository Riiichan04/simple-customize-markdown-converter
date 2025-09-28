import { emit } from "process"
import { Token } from "./types/token"
import { match } from "assert"

export default class Lexer {
    input: string
    pos: number = 0
    listToken: Token[] = []
    // Flag for handle special syntax
    listLevelFlag: number = 0
    // listFootnote: Map<string, string> = new Map()

    constructor(input: string) {
        this.input = input
    }

    //Reset input and other attribute
    setInput(input: string) {
        this.input = input
        this.pos = 0
        this.listLevelFlag = 0
        this.listToken = []
    }

    /**
     * Tokenize the markdown into a list of tokens.
     * @param isEof - `True` when input is whole markdown, `False` if input is just a part of markdown.
     * @returns List of tokens
     */
    tokenize(isEof = true): Token[] {
        const TOKEN_HANDLER = [
            //Handle escape character first
            {
                match: (lex: Lexer) => lex.peek() === "\\" && lex.peek(1) !== undefined,
                emit: (lex: Lexer) => {
                    lex.next(1);
                    lex.handleTextBlock()
                }
            },
            //For HTML
            //Comment
            { match: (lex: Lexer) => lex.startsWith("<!--"), emit: (lex: Lexer) => lex.readUntilMatchString("-->", true), },
            //Normal HTML
            {
                match: (lex: Lexer) => lex.peek() === "<",
                emit: (lex: Lexer) => {
                    //Handle comment
                    const line = lex.peekUntil(">");
                    const blockRegex = /^<(h[1-6]|div|table|pre|blockquote|ul|ol|li|p|section|article|header|footer|nav|aside|hr|form|iframe)\b/i;
                    if (blockRegex.test(line)) {
                        lex.handleHtmlBlock();
                    } else {
                        lex.handleHtmlInline();
                    }
                }
            },
            {
                //Regex: if line started with at least 3 characters: -, *, _
                match: (lex: Lexer) => /^([-*_])\1{2,}$/.test(lex.peekUntil("\n").trim()) && this.getLastToken()?.type === "NewLine",
                emit: (lex: Lexer) => lex.handleHorizontalLine()
            },
            { match: (lex: Lexer) => lex.startsWith("```"), emit: (lex: Lexer) => lex.handleCodeBlock() },
            { match: (lex: Lexer) => lex.startsWith("**"), emit: (lex: Lexer) => lex.handleBold() },
            { match: (lex: Lexer) => lex.startsWith("~~"), emit: (lex: Lexer) => lex.handleStrikethrough() },
            // { match: (lex: Lexer) => lex.startsWith("[^"), emit: (lex: Lexer) => lex.handleFootnote() },
            //For List
            {
                match: (lex: Lexer) => lex.isStartOfLine() && /^(\s*)([-*+]) \[( |x|X)\] /.test(lex.peekUntil("\n")),
                emit: (lex: Lexer) => lex.handleList(false, true)
            },
            {
                //Regex: if line started with zero or more spaces, then have - or + or * + 1 space
                match: (lex: Lexer) => lex.isStartOfLine() && /^(\s*)([-*+]) /.test(lex.peekUntil("\n")),
                emit: (lex: Lexer) => lex.handleList(false, false)
            },
            {
                //Regex: if line started with zero or more spaces, then have number. character + 1 space
                match: (lex: Lexer) => lex.isStartOfLine() && /^(\s*)(\d+)\. /.test(lex.peekUntil("\n")),
                emit: (lex: Lexer) => lex.handleList(true, false)
            },
            {
                match: (lex: Lexer) => lex.listLevelFlag > 0 && lex.isStartOfLine() && !/^(\s*)([-+*]|\d+\.) /.test(lex.peekUntil("\n")),
                emit: (lex: Lexer) => {
                    while (lex.listLevelFlag > 0) {
                        lex.handleEndList()
                    }
                }
            },
            //For table
            { match: (lex: Lexer) => lex.isStartOfLine() && /^\s*\|.*\|\s*$/.test(lex.peekUntil("\n")), emit: (lex: Lexer) => lex.handleTable() },
            //For common syntax
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

        while (this.listLevelFlag > 0) {
            this.handleEndList()
        }

        if (isEof) this.listToken.push({ type: "EOF" })
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

    private handleTable(): void {
        const tokenizeResult: Token[] = []
        const handler = new Lexer("")
        const header = this.readUntil("\n", true)
        const headerDetails = header.trim().replace(/^ *\|/, "").replace(/\| *$/, "").split("|")
        const align = this.readUntil("\n", true)
        const alignDetails = align.trim().replace(/^ *\|/, "").replace(/\| *$/, "").split("|")
        if (alignDetails.length !== headerDetails.length || !alignDetails.every(c => /^:?-{3,}:?$/.test(c))) {
            this.listToken.push({ type: "Text", value: `${header}\n${align}\n` })
            return
        }
        else {
            //Handle alignment
            const normalizeAlign = alignDetails.map(value => {
                if (value.startsWith(":") && value.endsWith(":")) return "center"
                else if (value.endsWith(":")) return "right"
                else return "left"
            })

            tokenizeResult.push({ type: "TableStart" })
            //Handle header
            tokenizeResult.push({ type: "RowStart", isHeader: true })
            headerDetails.forEach((cell, index) => {
                tokenizeResult.push({ type: "CellStart", align: normalizeAlign[index] ?? "left" })
                handler.setInput(cell.trim())
                tokenizeResult.push(...handler.tokenize(false))
                tokenizeResult.push({ type: "CellEnd" })
            })
            tokenizeResult.push({ type: "RowEnd" })

            //Handle body
            while (!this.isEndOfFile()) {
                const body = this.readUntil("\n", true)
                if (!body) break
                const line = body.trim()
                if (!line.startsWith("|") || !line.endsWith("|")) break //End of table
                const bodyDetail = body.trim().replace(/^ *\|/, "").replace(/\| *$/, "").split("|")
                tokenizeResult.push({ type: "RowStart", isHeader: false })
                bodyDetail.forEach((cell, index) => {
                    tokenizeResult.push({ type: "CellStart", align: normalizeAlign[index] ?? "left" })
                    handler.setInput(cell.trim())
                    tokenizeResult.push(...handler.tokenize(false))
                    tokenizeResult.push({ type: "CellEnd" })
                })
                tokenizeResult.push({ type: "RowEnd" })
            }
            tokenizeResult.push({ type: "TableEnd" })
            this.listToken.push(...tokenizeResult)
        }
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
        this.next() //Skip remain *
    }

    private handleStrikethrough() {
        this.listToken.push({ type: "Strikethrough" })
        this.next() //Skip remain ~
    }

    private handleInlineBlock() {
        let content = ""
        this.next() //Skip open block
        while (!this.isEndOfFile() && !this.startsWith("`")) {
            content += this.peek()
            this.next()
        }

        this.listToken.push({ "type": "InlineCode", content: content })
    }

    private handleQuoteBlock() {
        this.listToken.push({ type: "Quote" })
    }

    private handleList(isOrdered: boolean, isTask: boolean) {
        const line = this.peekUntil("\n")
        if (isTask) {
            const m = line.match(/^(\s*)([-*+]) \[( |x|X)\] (.*)$/)!
            const indent = Math.floor(m[1].length / 2) + 1
            while (this.listLevelFlag < indent) this.handleStartList(false)
            while (this.listLevelFlag > indent) this.handleEndList()

            this.next(m[1].length + 4)
            this.handleTaskItem(m[3].toLowerCase() === "x")
        }
        else {
            //Regex: line started with: Group 1: zero or more spaces, group 2: (- or + or * + 1 space) or (number with . character), group 3: everything else in line
            const m = isOrdered ? line.match(/^(\s*)(\d+)\. (.*)$/)! : line.match(/^(\s*)([-*+]) (.*)$/)!
            const indent = Math.floor(m[1].length / 2) + 1  //m[1] to get the spaces in group 1
            while (this.listLevelFlag < indent) this.handleStartList(isOrdered)
            while (this.listLevelFlag > indent) this.handleEndList()

            this.next(m[1].length + (isOrdered ? 1 : 0)) //+1 due to marker have 2 characters (e.g: 1.) instead 1 like unordered list
            this.handleListItem()
        }
    }

    private handleStartList(isOrder: boolean) {
        this.listLevelFlag++
        this.listToken.push({ type: "ListStart", level: this.listLevelFlag, ordered: isOrder })
    }

    private handleListItem() {
        this.next() // Skip space between - and text
        this.listToken.push({ type: "ListItem" })
    }

    private handleTaskItem(isChecked: boolean) {
        this.next() // Skip space between last ] and text
        this.listToken.push({ type: "TaskItem", checked: isChecked })
    }

    private handleEndList() {
        this.listLevelFlag === 0 ? 0 : this.listLevelFlag--
        this.listToken.push({ type: "ListEnd" })
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

    private handleHorizontalLine() {
        this.next(2) //Skip two first characters, remain will be skiped after loop
        this.listToken.push({ type: "HorizontalLine" })
    }

    private handleHtmlBlock() {
        const openTag = this.readUntil(">", true) + ">"
        const matchTagName = /^<\s*([a-zA-Z0-9]+)/.exec(openTag)
        const tagName = matchTagName ? matchTagName[1] : null
        //Tagname is not valid
        if (!tagName) {
            this.listToken.push({ type: "Text", value: "<" })
            return
        }

        //If it's self-closing tag
        if (openTag.endsWith("/>") || ["hr", "img", "br", "input", "meta", "link"].includes(tagName)) {
            this.listToken.push({ type: "HTMLBlock", value: openTag })
            return
        }

        let content = ""
        while (!this.isEndOfFile()) {
            if (this.peekUntilByOffset(`</${tagName}>`.length).toLowerCase() === `</${tagName}>`) {
                break
            }
            content += this.peek()
            this.next()
        }
        const closeTag = `</${tagName}>`
        this.next(closeTag.length - 1)  //Skip closing tag
        this.listToken.push({ type: "HTMLBlock", value: openTag + content + closeTag })
    }

    private handleHtmlInline() {
        const openTag = this.readUntil(">", true) + ">"
        const matchTagName = /^<\s*([a-zA-Z0-9]+)/.exec(openTag)
        const tagName = matchTagName ? matchTagName[1] : null
        if (!tagName) {
            this.listToken.push({ type: "Text", value: "<" })
            return
        }

        const content = this.readUntilMatchString(`</${tagName}>`)
        const closeTag = `</${tagName}>`
        this.next(closeTag.length - 1)  //Skip closing tag
        this.listToken.push({ type: "HTMLInline", value: openTag + content + closeTag });
    }
    // private handleFootnote() {
    //     const footNote = this.readUntil("]")
    //     const noteId = /\[\^([^\]]+)\]/.exec(footNote)
    // }

    //Utilities function    
    private readUntil(char: string, isConsumeChar = false): string {
        let result = ""
        while (this.peek() !== char) {
            result += this.peek()
            this.next()
            if (this.isEndOfFile()) break
        }
        if (isConsumeChar) this.next(char.length) //Make cursor skip the char
        return result
    }

    private peekUntil(char: string): string {
        let result = ""
        let i = 0
        while (true) {
            const current = this.peek(i++)
            if (current == null) break
            if (current == char) break
            result += current
        }
        return result
    }

    private peekUntilByOffset(offset: number): string {
        let result = ""
        let i = 0
        while (i !== offset) {
            const current = this.peek(i++)
            if (current == null) break
            if (this.isEndOfFile()) break
            result += current
        }
        return result
    }

    private isStartOfLine(): boolean {
        return this.pos === 0 || this.peek(-1) === "\n"
    }

    private readUntilMatchString(str: string, isConsume = false): string {
        let result = "";

        while (!this.isEndOfFile()) {
            if (this.peekUntilByOffset(str.length) === str) {
                if (isConsume) this.next(str.length);
                break;
            }
            result += this.peek();
            this.next();
        }

        return result;
    }
}
