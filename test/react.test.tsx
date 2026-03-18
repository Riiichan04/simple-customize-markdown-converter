import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { convertMarkdownToReactNode, MarkdownComponent, definePlugin } from '../src/react'
import { MarkdownOptions } from "../src/types/options";
import { MarkdownPlugin } from "../src";
import { createPlugin } from "../src/types/plugin";

describe("React Renderer Testing", () => {
    const renderToString = (node: React.ReactNode) => renderToStaticMarkup(node as React.ReactElement);

    test("Basic Markdown to ReactNode", () => {
        const md = "## Hello React\nThis is **bold**";
        const result = convertMarkdownToReactNode(md);

        expect(renderToString(result)).toBe(
            '<h2 style="border-bottom:1px solid #d1d9e0b3">Hello React</h2>' +
            '<p>This is <strong>bold</strong></p>'
        );
    });

    test("Complex document with CodeBlock and Quote", () => {
        const md = "> Quote\n```js\nconst a = 1;\n```";
        const result = convertMarkdownToReactNode(md);

        expect(renderToString(result)).toBe(
            '<blockquote style="margin:0;padding:0 1em;color:#59636e;border-left:.25em solid #d1d9e0">' +
            '<p> Quote</p></blockquote>' +
            '<pre><code class="lang-js">const a = 1;</code></pre>'
        );
    });

    test("Task list rendering in React", () => {
        const md = "- [ ] Todo\n- [x] Done";
        const result = convertMarkdownToReactNode(md);

        expect(renderToString(result)).toBe(
            '<ul>' +
            '<li style="list-style-type:none"><input type="checkbox" disabled="" readOnly=""/>Todo</li>' +
            '<li style="list-style-type:none"><input type="checkbox" disabled="" readOnly="" checked=""/>Done</li>' +
            '</ul>'
        );
    });

    test("Table rendering with alignment", () => {
        const md = "| Name | Side |\n|:---:|:---:|\n| Luke | Light |";
        const result = convertMarkdownToReactNode(md);

        expect(renderToString(result)).toBe(
            '<table><thead><tr>' +
            '<th style="text-align:center">Name</th>' +
            '<th style="text-align:center">Side</th>' +
            '</tr></thead><tbody><tr>' +
            '<td style="text-align:center">Luke</td>' +
            '<td style="text-align:center">Light</td>' +
            '</tr></tbody></table>'
        );
    });

    test("Custom React elements override", () => {
        const options: MarkdownOptions<React.ReactNode> = {
            renderOptions: {
                elements: {
                    Bold: ((_node, children: React.ReactNode[]) => React.createElement("span", { style: { color: 'blue' } }, ...children)),
                    Link: ((node) => {
                        if (node.href && node.href.startsWith('@')) {
                            return React.createElement("button", { className: "mention" }, node.text);
                        }
                        return React.createElement("a", { href: node.href, target: "_blank", rel: "noopener" }, node.text);
                    })
                }
            }
        };

        const md = "Stay **strong** [@hero](@hero)";
        const result = convertMarkdownToReactNode(md, options);

        expect(renderToString(result)).toBe(
            '<p>Stay <span style="color:blue">strong</span> <button class="mention">@hero</button></p>'
        );
    });

    test("Dangerous HTML handling in React", () => {
        const md = '<div class="custom">Raw</div>';
        const secureResult = convertMarkdownToReactNode(md, { converterOptions: { allowDangerousHtml: false } });
        expect(renderToString(secureResult)).toBe('<code>&lt;div class=&quot;custom&quot;&gt;Raw&lt;/div&gt;</code>');
    });

    test("Footnote resolver in React", () => {
        const md = "Text[^1]\n[^1]: Note content";
        const result = convertMarkdownToReactNode(md);
        const html = renderToString(result);

        expect(html).toContain('<sup id="fnref:1">');
        expect(html).toContain('<section class="footnotes">');
        expect(html).toContain('<a href="#fnref:1" class="footnote-backref">↩</a>');
    });

    test("MarkdownComponent (React Wrapper)", () => {
        const md = "# Title";
        const html = renderToStaticMarkup(
            <MarkdownComponent content={md} className="md-body" />
        );

        expect(html).toBe(
            '<div class="md-body">' +
            '<h1 style="border-bottom:1px solid #d1d9e0b3">Title</h1>' +
            '</div>'
        );
    });

    test("Inject custom classNames in React rendering", () => {
        const options: MarkdownOptions<React.ReactNode> = {
            renderOptions: {
                className: {
                    Header: "h-common",
                    Header2: "h2-special",
                    Bold: "font-heavy"
                }
            }
        };

        const md = "## Header\n**bold**";
        const result = convertMarkdownToReactNode(md, options);
        const html = renderToString(result);

        const expected =
            '<h2 class="h2-special" style="border-bottom:1px solid #d1d9e0b3">Header</h2>' +
            '<p><strong class="font-heavy">bold</strong></p>';

        expect(html).toBe(expected);
    });

    test("Plugin system: Custom Emoji (:omg:)", () => {
        const emojiPlugin = createPlugin<string, React.ReactNode>(
            "Emoji",
            "inline",
            {
                match: (lexer) => lexer.peek() === ":",
                emit: (lexer) => {
                    lexer.next();
                    const value = lexer.readUntil(":");
                    lexer.listToken.push({ type: "Emoji", value });
                }
            },
            {
                execute: (parser, token) => {
                    parser.next(1);
                    return { type: "Emoji", value: token.value };
                }
            },
            {
                render: (node) => React.createElement(
                    "span",
                    { className: `emoji emoji-${node.value}` },
                    "😲"
                )
            }
        );

        const md = "Hello :omg: world";

        const result = convertMarkdownToReactNode(md, {}, [emojiPlugin]);
        const html = renderToString(result);
        expect(html).toBe('<p>Hello <span class="emoji emoji-omg">😲</span> world</p>');
    });

    test("definePlugin: inline pattern (:emoji:)", () => {
        const emojiPlugin = definePlugin<"Emoji", React.ReactNode>("Emoji", "inline", {
            pattern: /^:([^:]+):/,
            extract: ([, value]) => ({ value }),
            render: (node) => React.createElement(
                "span",
                { className: `emoji emoji-${node.value}` },
                "😲"
            )
        });

        const result = convertMarkdownToReactNode("Hello :omg: world", {}, [emojiPlugin]);
        expect(renderToString(result)).toBe('<p>Hello <span class="emoji emoji-omg">😲</span> world</p>');
    });

    test("Flat options: elements shorthand in React", () => {
        const result = convertMarkdownToReactNode("**bold** text", {
            elements: {
                Bold: (_node, children: React.ReactNode[]) =>
                    React.createElement("b", { className: "flat-bold" }, ...children)
            }
        });
        expect(renderToString(result)).toBe('<p><b class="flat-bold">bold</b> text</p>');
    });

    test("Flat options: className shorthand in React", () => {
        const result = convertMarkdownToReactNode("## Header", {
            className: { Header: "h-common", Header2: "h2-special" }
        });
        expect(renderToString(result)).toBe(
            '<h2 class="h2-special" style="border-bottom:1px solid #d1d9e0b3">Header</h2>'
        );
    });

    test("Flat options: allowDangerousHtml shorthand in React", () => {
        const md = '<div class="raw">HTML</div>';
        const safe = convertMarkdownToReactNode(md);
        const unsafe = convertMarkdownToReactNode(md, { allowDangerousHtml: true });
        // Safe: escaped inside a <code> element
        expect(renderToString(safe)).toContain("&lt;div");
        // Unsafe: raw HTML injected via dangerouslySetInnerHTML (React wraps it in a div)
        expect(renderToString(unsafe)).toContain('<div class="raw">HTML</div>');
    });
});