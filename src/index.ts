import Lexer from "./core/lexer";
import { Parser } from "./core/parser";
import { FootnoteResolver } from "./core/resolver";
import DefaultRenderer from "./renderers/default";
import { MarkdownDefaultOptions } from "./types/options";
import { RenderOption } from "./types/options/renderOptions";
import { Node } from "./types/node"
import { HTMLConvertExtension } from "./types/extension";

export { RenderOption, MarkdownDefaultOptions, Node }

/**
 * Convert a Markdown string into HTML.
 * @param input - The Markdown source string
 * @param options - Optional rendering options
 * @returns The rendered HTML string
 * 
 * @example
 * ```ts
 * const html = convertMarkdownToHTML("Hello **world**")
 * // => <p>Hello <strong>world</strong></p>
 * ```
 */
export function convertMarkdownToHTML(
    input: string,
    options: MarkdownDefaultOptions = {
        renderOptions: {},
        converterOptions: { allowDangerousHtml: false },
    },
    extensions: HTMLConvertExtension[] = []
): string {
    const tokens = new Lexer(input, extensions).tokenize()
    const footNoteResolver = new FootnoteResolver()
    const nodes = new Parser(tokens, footNoteResolver, extensions).parse()
    return new DefaultRenderer(options, footNoteResolver, extensions).render(nodes)
}