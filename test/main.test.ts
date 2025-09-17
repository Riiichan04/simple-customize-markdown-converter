import { convertMarkdownToHTML } from "../src/index"

describe("Test a whole markdown", () => {
    test("A single sentences", () => {
        const result = convertMarkdownToHTML("## Hello world\nThis is my time *OMG*")
        expect(result).toBe("<h2>Hello world</h2><p>This is my time <em>OMG</em></p>")
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
        expect(convertMarkdownToHTML(md)).toBe('<h1>Hello everyone</h1><h4>Hello world</h4><p>This is a <strong>simple</strong> paragraph with a <a href="https://example.com">link</a> and some <code>inline code</code>.</p><blockquote><p> This is a blockquote.</p></blockquote><img src="image.png" alt="Alt text"/><pre><code class="lang-js">console.log("Hello World")</code></pre><p><s>justatext</s></p><p>*thisis*escape character</p><p>This is a text</p><hr><p>This is also a text</p><p>---</p>'
        )
    })
})