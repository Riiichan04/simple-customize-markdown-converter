import { convertMarkdownToHTML, MarkdownPlugin, definePlugin } from "../src/index";
import { RenderOption } from "../src/types/options/renderOptions";

describe("Test a whole markdown", () => {
    test("A single sentences", () => {
        const result = convertMarkdownToHTML("## Hello world\nThis is my time *OMG*")
        expect(result).toBe("<h2 style=\"border-bottom: 1px solid #d1d9e0b3\">Hello world</h2><p>This is my time <em>OMG</em></p>")
    })

    test("Full document rendering", () => {
        const md = "# Hello everyone\n#### Hello world\nThis is a **simple** paragraph with a [link](https://example.com) and some `inline code`.\n> This is a blockquote.\n![Alt text](image.png)\n```js\nconsole.log(\"Hello World\")\n```\n~~justatext~~\n\\*thisis\\*escape character\nThis is a text\n***\nThis is also a text\n--\\-";

        const expected =
            '<h1 style="border-bottom: 1px solid #d1d9e0b3">Hello everyone</h1>' +
            '<h4>Hello world</h4>' +
            '<p>This is a <strong>simple</strong> paragraph with a <a href="https://example.com" target=\"_blank\" rel=\"noopener\">link</a> and some <code>inline code</code>.</p>' +
            '<blockquote style="margin:0; padding:0 1em; color:#59636e; border-left:.25em solid #d1d9e0;"><p> This is a blockquote.</p></blockquote>' +
            '<img src="image.png" alt="Alt text"/>' +
            '<pre><code class="lang-js">console.log("Hello World")</code></pre>' +
            '<p><s>justatext</s></p>' +
            '<p>*thisis*escape character</p>' +
            '<p>This is a text</p>' +
            '<hr>' +
            '<p>This is also a text</p>' +
            '<p>---</p>';

        expect(convertMarkdownToHTML(md)).toBe(expected);
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

    test("Render task list", () => {
        const md = "- [ ] Incomplete\n- [x] Complete"
        expect(convertMarkdownToHTML(md))
            .toBe('<ul><li style=\"list-style-type: none\"><input type="checkbox" disabled >Incomplete</li><li style=\"list-style-type: none\"><input type="checkbox" disabled checked>Complete</li></ul>')
    })

    test("Render table", () => {
        const md = "| Name  | Age |\n|-------|----:|\n| Alice |  24 |\n| Bob   |  30 |";
        expect(convertMarkdownToHTML(md)).toBe(
            '<table><thead><tr><th style="text-align:left">Name</th><th style="text-align:right">Age</th></tr></thead>' +
            '<tbody><tr><td style="text-align:left">Alice</td><td style="text-align:right">24</td></tr>' +
            '<tr><td style="text-align:left">Bob</td><td style="text-align:right">30</td></tr></tbody></table>'
        )
    })

    test("Basic customize render", () => {
        const renderOptions: RenderOption<string> = {
            elements: {
                Header: (node, children) => {
                    if (node.level === 1) return `<h5 class="custom-h1">${children.join("")}</h5>`;
                    return `<h${node.level}>${children.join("")}</h${node.level}>`;
                },
                Paragraph: (_node, children) => `<div class="paragraph">${children.join("")}</div>`,
                Bold: (_node, children) => `<b class="bold-text">${children.join("")}</b>`,
            }
        }

        const input = "# Title\nHello **World**"
        expect(convertMarkdownToHTML(input, { renderOptions })).toBe('<h5 class="custom-h1">Title</h5><div class="paragraph">Hello <b class="bold-text">World</b></div>')
    })

    test("Footnote", () => {
        const md = `Here is a footnote[^a] inline and another[^b]. Also repeat[^a].\n[^b]: Definition of b.\n[^a]: Definition of a.`
        const expected = '<p>Here is a footnote<sup id="fnref:1"><a href="#fn:1" class="footnote-ref">[1]</a></sup> inline and another<sup id="fnref:2"><a href="#fn:2" class="footnote-ref">[2]</a></sup>. Also repeat<sup id="fnref:1"><a href="#fn:1" class="footnote-ref">[1]</a></sup>.</p>' +
            '<section class="footnotes"><ol><li id="fn:1"><p>Definition of a. <a href="#fnref:1" class="footnote-backref">↩</a></p></li><li id="fn:2"><p>Definition of b. <a href="#fnref:2" class="footnote-backref">↩</a></p></li></ol></section>';

        expect(convertMarkdownToHTML(md)).toBe(expected);
    })

    test("Inject custom classNames in HTML rendering", () => {
        const renderOptions: RenderOption<string> = {
            className: {
                Header: "common-h",
                Header1: "main-title",
                Paragraph: "text-muted"
            }
        };

        const md = "# Title\nParagraph content";
        const result = convertMarkdownToHTML(md, { renderOptions });

        const expected =
            '<h1 class="main-title" style="border-bottom: 1px solid #d1d9e0b3">Title</h1>' +
            '<p class="text-muted">Paragraph content</p>';

        expect(result).toBe(expected);
    })

    test("Plugin system: Custom Emoji (:omg:)", () => {
        const emojiPlugin: MarkdownPlugin<string, string> = {
            name: "Emoji",
            type: "inline",
            tokenizer: {
                type: "Emoji",
                match: (lexer) => lexer.peek() === ":",
                emit: (lexer) => {
                    lexer.next()
                    lexer.listToken.push({ type: "Emoji", value: lexer.readUntil(":") })
                }
            },
            parser: {
                type: "Emoji",
                execute: (parser, token) => {
                    parser.next(1)
                    return { type: "Emoji", value: token.value };
                }
            },
            renderer: {
                type: "Emoji",
                render: (node) => {
                    return `<span class="emoji emoji-${node.value}">😲</span>`;
                }
            }
        };

        const md = "Hello :omg: world";

        const result = convertMarkdownToHTML(md, undefined, [emojiPlugin]);

        expect(result).toBe('<p>Hello <span class="emoji emoji-omg">😲</span> world</p>');
    })

    test("definePlugin: inline pattern (:emoji:)", () => {
        const emojiPlugin = definePlugin<"Emoji", string>("Emoji", "inline", {
            pattern: /^:([^:]+):/,
            extract: ([, value]) => ({ value }),
            render: (node) => `<span class="emoji emoji-${node.value}">😲</span>`
        })

        const result = convertMarkdownToHTML("Hello :omg: world", undefined, [emojiPlugin])
        expect(result).toBe('<p>Hello <span class="emoji emoji-omg">😲</span> world</p>')
    })

    test("definePlugin: repeated inline pattern in same paragraph", () => {
        const plugin = definePlugin<"Mark", string>("Mark", "inline", {
            pattern: /^==([^=]+)==/,
            extract: ([, value]) => ({ value }),
            render: (node) => `<mark>${node.value}</mark>`
        })

        const result = convertMarkdownToHTML("This is ==highlighted== and ==also this==", undefined, [plugin])
        expect(result).toBe('<p>This is <mark>highlighted</mark> and <mark>also this</mark></p>')
    })

    test("Flat options: elements shorthand", () => {
        const result = convertMarkdownToHTML("# Title\nHello **World**", {
            elements: {
                Header: (node, children) => `<h5 class="custom-h1">${children.join("")}</h5>`,
                Paragraph: (_node, children) => `<div class="paragraph">${children.join("")}</div>`,
                Bold: (_node, children) => `<b>${children.join("")}</b>`,
            }
        })
        expect(result).toBe('<h5 class="custom-h1">Title</h5><div class="paragraph">Hello <b>World</b></div>')
    })

    test("Flat options: className shorthand", () => {
        const result = convertMarkdownToHTML("# Title\nParagraph content", {
            className: {
                Header: "common-h",
                Header1: "main-title",
                Paragraph: "text-muted"
            }
        })
        const expected =
            '<h1 class="main-title" style="border-bottom: 1px solid #d1d9e0b3">Title</h1>' +
            '<p class="text-muted">Paragraph content</p>'
        expect(result).toBe(expected)
    })

    test("Flat options: allowDangerousHtml shorthand", () => {
        const md = '<div class="custom">Raw HTML</div>'
        const result = convertMarkdownToHTML(md, { allowDangerousHtml: true })
        expect(result).toBe('<div class="custom">Raw HTML</div>')
    })

    test("Flat options take priority over nested renderOptions", () => {
        // Both flat and nested provide a Bold renderer; flat should win
        const result = convertMarkdownToHTML("**text**", {
            elements: {
                Bold: (_node, children) => `<b class="flat">${children.join("")}</b>`
            },
            renderOptions: {
                elements: {
                    Bold: (_node, children) => `<strong class="nested">${children.join("")}</strong>`
                }
            }
        })
        expect(result).toBe('<p><b class="flat">text</b></p>')
    })
})