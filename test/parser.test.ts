import { Parser } from "../src/parser"
import { Token } from "../src/types/token"
import { Node } from "../src/types/node"

describe("Parser", () => {
    test("Parse plain text paragraph", () => {
        const tokens: Token[] = [
            { type: "Text", value: "hello" },
            { type: "NewLine" },
            { type: "EOF" },
        ]

        const parser = new Parser(tokens)
        const ast = parser.parse()

        expect(ast).toEqual<Node>({
            type: "Document",
            children: [
                {
                    type: "Paragraph",
                    children: [{ type: "Text", value: "hello" }],
                },
            ],
        })
    })

    test("Parse header with text", () => {
        const tokens: Token[] = [
            { type: "Header", level: 2 },
            { type: "Text", value: "title" },
            { type: "NewLine" },
            { type: "EOF" },
        ]

        const parser = new Parser(tokens)
        const ast = parser.parse()

        expect(ast).toEqual<Node>({
            type: "Document",
            children: [
                {
                    type: "Header",
                    level: 2,
                    children: [{ type: "Text", value: "title" }],
                },
            ],
        })
    })

    test("Parse bold inside paragraph", () => {
        const tokens: Token[] = [
            { type: "Text", value: "hello " },
            { type: "Bold" }, // mở bold
            { type: "Text", value: "world" },
            { type: "Bold" }, // đóng bold
            { type: "NewLine" },
            { type: "EOF" },
        ]

        const parser = new Parser(tokens)
        const ast = parser.parse()

        expect(ast).toEqual<Node>({
            type: "Document",
            children: [
                {
                    type: "Paragraph",
                    children: [
                        { type: "Text", value: "hello " },
                        {
                            type: "Bold",
                            children: [{ type: "Text", value: "world" }],
                        },
                    ],
                },
            ],
        })
    })

    test("Parse code block", () => {
        const tokens: Token[] = [
            { type: "CodeBlock", lang: "js", content: "console.log(1)" },
            { type: "EOF" },
        ]

        const parser = new Parser(tokens)
        const ast = parser.parse()

        expect(ast).toEqual<Node>({
            type: "Document",
            children: [
                {
                    type: "CodeBlock",
                    lang: "js",
                    content: "console.log(1)",
                },
            ],
        })
    })

    test("Parse inline code inside paragraph", () => {
        const tokens: Token[] = [
            { type: "Text", value: "run " },
            { type: "InlineCode", content: "npm start" },
            { type: "NewLine" },
            { type: "EOF" },
        ]

        const parser = new Parser(tokens)
        const ast = parser.parse()

        expect(ast).toEqual<Node>({
            type: "Document",
            children: [
                {
                    type: "Paragraph",
                    children: [
                        { type: "Text", value: "run " },
                        { type: "InlineCode", content: "npm start" },
                    ],
                },
            ],
        })
    })
})