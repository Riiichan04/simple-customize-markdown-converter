import Renderer from "../src/renderer"
import { Node } from "../src/types/node"

describe("Renderer", () => {
    test("Renders a simple paragraph", () => {
        const node: Node = {
            type: "Document",
            children: [
                {
                    type: "Paragraph",
                    children: [{ type: "Text", value: "Hello world" }]
                }
            ]
        }
        const renderer = new Renderer({})
        expect(renderer.render(node)).toBe("<p>Hello world</p>")
    })

    test("Renders headers correctly", () => {
        const node: Node = {
            type: "Header",
            level: 3,
            children: [{ type: "Text", value: "Title" }]
        }
        const renderer = new Renderer({})
        expect(renderer.render(node)).toBe("<h3>Title</h3>")
    })

    test("supports custom render for headers", () => {
        const node: Node = {
            type: "Header",
            level: 3,
            children: [{ type: "Text", value: "Title" }]
        }
        const renderer = new Renderer({
            elements: {
                Header: (_node, children) => `<h5>${children.join("")}</h5>`
            }
        })
        expect(renderer.render(node)).toBe("<h5>Title</h5>")
    })

    test("escapes inline code", () => {
        const node: Node = {
            type: "InlineCode",
            content: "<script>"
        }
        const renderer = new Renderer({})
        expect(renderer.render(node)).toBe("<code>&lt;script&gt;</code>")
    })

    test("Renders nested bold/italic", () => {
        const node: Node = {
            type: "Paragraph",
            children: [
                {
                    type: "Bold",
                    children: [
                        { type: "Text", value: "Bold " },
                        { type: "Italic", children: [{ type: "Text", value: "Italic" }] }
                    ]
                }
            ]
        }
        const renderer = new Renderer({})
        expect(renderer.render(node)).toBe("<p><strong>Bold <em>Italic</em></strong></p>")
    })

    test("Render quote", () => {
        const node: Node = {
            type: "Quote",
            children: [
                {
                    type: "Paragraph",
                    children: [
                        { type: "Text", value: "Hello?. This is a quote" }
                    ]
                },
                {
                    type: "Paragraph",
                    children: [
                        { type: "Text", value: "And here is a quote too" }
                    ]
                }
            ]
        }
        const renderer = new Renderer({})
        expect(renderer.render(node)).toBe("<blockquote><p>Hello?. This is a quote</p><p>And here is a quote too</p></blockquote>")
    })
})
