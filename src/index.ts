import Lexer from "./lexer";
import { Parser } from "./parser";
import Renderer from "./renderer";
import { FootnoteResolver } from "./resolver";
import { RenderOption } from "./types/renderOptions";

export { RenderOption }

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
    const footNoteResolver = new FootnoteResolver()
    const nodes = new Parser(tokens, footNoteResolver).parse()
    return new Renderer(options, footNoteResolver).render(nodes)
}