import Lexer from "../src/lexer"

describe("Lexer", () => {
    test("Tokenize plain text", () => {
        const lexer = new Lexer("hello")
        const tokens = lexer.tokenize()
        expect(tokens).toEqual([
            { type: "Text", value: "hello" },
            { type: "EOF" },
        ])
    })

    test("Tokenize header", () => {
        const lexer = new Lexer("## Title")
        const tokens = lexer.tokenize()
        expect(tokens).toEqual([
            { type: "Header", level: 2 },
            { type: "Text", value: "Title" },
            { type: "EOF" },
        ])
    })

    test("Tokenize inline code", () => {
        const lexer = new Lexer("`x+y`")
        const tokens = lexer.tokenize()
        expect(tokens).toEqual([
            { type: "InlineCode", content: "x+y" },
            { type: "EOF" },
        ])
    })

    test("Tokenize code block", () => {
        const lexer = new Lexer("```ts\nlet x=1\n```")
        const tokens = lexer.tokenize()
        expect(tokens).toEqual([
            { type: "CodeBlock", lang: "ts", content: "let x=1" },
            { type: "EOF" },
        ])
    })

    test("Tokenize italic", () => {
        const lexer = new Lexer("*italic*")
        const tokens = lexer.tokenize()
        expect(tokens).toEqual([
            { type: "Italic" },
            { type: "Text", value: "italic" },
            { type: "Italic" },
            { type: "EOF" },
        ])
    })

    test("Tokenize bold + italic mix", () => {
        const lexer = new Lexer("**Bold** and *italic* here!!!")
        const tokens = lexer.tokenize()
        expect(tokens).toEqual([
            { type: "Bold" },
            { type: "Text", value: "Bold" },
            { type: "Bold" },
            { type: "Text", value: " and " },
            { type: "Italic" },
            { type: "Text", value: "italic" },
            { type: "Italic" },
            { type: "Text", value: " here!!!" },
            { type: "EOF" },
        ])
    })

    test("Tokenize a paragraph", () => {
        const input =
            "Hello World. This is the best thing. *I'm here to see you guys*. _It's really good_. `Very good`"
        const lexer = new Lexer(input)
        const tokens = lexer.tokenize()
        expect(tokens).toEqual([
            { type: "Text", value: "Hello World. This is the best thing. " },
            { type: "Italic" },
            { type: "Text", value: "I'm here to see you guys" },
            { type: "Italic" },
            { type: "Text", value: ". " },
            { type: "Italic" },
            { type: "Text", value: "It's really good" },
            { type: "Italic" },
            { type: "Text", value: ". " },
            { type: "InlineCode", content: "Very good" },
            { type: "EOF" },
        ])
    })

    test("Tokenize with escape character", () => {
        const input = "\\*This is escaped character\\*"
        const token = new Lexer(input).tokenize()
        expect(token).toEqual([
            { type: "Text", value: "*This is escaped character*" },
            { type: "EOF" }
        ])
    })
})
