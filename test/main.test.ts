import { convertMarkdownToHTML, RenderOption } from "../src/index"

describe("Test a whole markdown", () => {
    test("A single sentences", () => {
        const result = convertMarkdownToHTML("## Hello world\nThis is my time *OMG*")
        expect(result).toBe("<h2 style=\"border-bottom: 1px solid #d1d9e0b3\">Hello world</h2><p>This is my time <em>OMG</em></p>")
    })

    test("Full document rendering", () => {
        const md =
            `
# Hello everyone
#### Hello world
This is a **simple** paragraph with a [link](https://example.com) and some \`inline code\`.
> This is a blockquote.
![Alt text](image.png)
\`\`\`js
console.log("Hello World")
\`\`\`
~~justatext~~
\\*thisis\\*escape character
This is a text
***
This is also a text
--\\-
`
        expect(convertMarkdownToHTML(md)).toBe('<h1 style=\"border-bottom: 1px solid #d1d9e0b3\">Hello everyone</h1><h4>Hello world</h4><p>This is a <strong>simple</strong> paragraph with a <a href="https://example.com">link</a> and some <code>inline code</code>.</p><blockquote style=\"margin:0; padding:0 1em; color:#59636e; border-left:.25em solid #d1d9e0;\"><p> This is a blockquote.</p></blockquote><img src="image.png" alt="Alt text"/><pre><code class="lang-js">console.log("Hello World")</code></pre><p><s>justatext</s></p><p>*thisis*escape character</p><p>This is a text</p><hr><p>This is also a text</p><p>---</p>'
        )
    })


    test("Test render list", () => {
        const md = "- Item 1\n- Item 2\n- Item 3"
        expect(convertMarkdownToHTML(md)).toBe('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>')
    })

    test("Test render nested list", () => {
        const md = "- Item 1\n  - Subitem 1.1\n  - Subitem 1.2\n- Item 2"
        expect(convertMarkdownToHTML(md)).toBe('<ul><li>Item 1<ul><li>Subitem 1.1</li><li>Subitem 1.2</li></ul></li><li>Item 2</li></ul>')
    })

    test("Test render 3-level nested list", () => {
        const md = "- Item 1\n  - Subitem 1.1\n    - Subsubitem 1.1.1\n  - Subitem 1.2\n- Item 2"
        expect(convertMarkdownToHTML(md)).toBe("<ul><li>Item 1<ul><li>Subitem 1.1<ul><li>Subsubitem 1.1.1</li></ul></li><li>Subitem 1.2</li></ul></li><li>Item 2</li></ul>")
    })

    test("Test render nested ordered list", () => {
        const md = "1. Item 1\n   1. Subitem 1.1\n   2. Subitem 1.2\n2. Item 2"
        expect(convertMarkdownToHTML(md)).toBe(
            "<ol><li>Item 1<ol><li>Subitem 1.1</li><li>Subitem 1.2</li></ol></li><li>Item 2</li></ol>"
        )
    })

    test("Test render mixed nested list", () => {
        const md = "- Item 1\n  1. Subitem 1.1\n  2. Subitem 1.2\n- Item 2"
        expect(convertMarkdownToHTML(md)).toBe(
            '<ul><li>Item 1<ol><li>Subitem 1.1</li><li>Subitem 1.2</li></ol></li><li>Item 2</li></ul>'
        )
    })

    test("Render task list", () => {
        const md = "- [ ] Incomplete\n- [x] Complete"
        expect(convertMarkdownToHTML(md))
            .toBe('<ul><li><input type=\"checkbox\" disabled >Incomplete</li><li><input type=\"checkbox\" disabled checked>Complete</li></ul>')
    })

    test("Render table", () => {
        const md = "| Name  | Age |\n|-------|----:|\n| Alice |  24 |\n| Bob   |  30 |";
        expect(convertMarkdownToHTML(md)).toBe(
            '<table><thead><tr><th style="text-align:left">Name</th><th style="text-align:right">Age</th></tr></thead>' +
            '<tbody><tr><td style="text-align:left">Alice</td><td style="text-align:right">24</td></tr>' +
            '<tr><td style=\"text-align:left">Bob</td><td style="text-align:right">30</td></tr></tbody></table>')
    })

    test("Basic customize render", () => {
        const renderOptions: RenderOption = {
            elements: {
                Header: (node, children) => {
                    //Customize for only Heading 1
                    if (node.level === 1) {
                        return `<h5 class="custom-h1">${children.join("")}</h5>`
                    }
                    //Keep all remain Heading
                    return `<h${node.level}>${children.join("")}</h${node.level}>`
                },
                Paragraph: (_node, children) => `<div class="paragraph">${children.join("")}</div>`,
                Bold: (_node, children) => `<b class="bold-text">${children.join("")}</b>`,
            }
        }

        const input = "# Title\nHello **World**"
        expect(convertMarkdownToHTML(input, renderOptions)).toBe('<h5 class="custom-h1">Title</h5><div class="paragraph">Hello <b class="bold-text">World</b></div>')
    })

    test("Html render", () => {
        const md = 'Hello\n<span style="color:blue">friend</span>, today is a <b>beautiful day</b> 😄<div align="center"><h2 style="color:green">🌿 Welcome to My Page 🌿</h2><p>This is an <span style="color:red">HTML block</span> that mixes inline.</p></div>'
        expect(convertMarkdownToHTML(md)).toBe(`<p>Hello</p><p><span style="color:blue">friend</span>, today is a <b>beautiful day</b> 😄</p><div align="center"><h2 style="color:green">🌿 Welcome to My Page 🌿</h2><p>This is an <span style="color:red">HTML block</span> that mixes inline.</p></div>`);
    })
})