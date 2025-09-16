import Lexer from "./lexer";
import { Parser } from "./parser";
import Renderer from "./renderer";
import { RenderOption } from "./renderOptions";

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
export function convertMarkdownToHTML(input: string, options: RenderOption = {}): string {
    const tokens = new Lexer(input).tokenize()
    const nodes = new Parser(tokens).parse()
    return new Renderer(options).render(nodes)
}