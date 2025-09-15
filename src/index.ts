import Lexer from "./lexer";
import { Parser } from "./parser";
import Renderer, { RenderOption } from "./renderer";

export function convertMarkdownToHTML(input: string, options: RenderOption = {}): string {
    const tokens = new Lexer(input).tokenize()
    const nodes = new Parser(tokens).parse()
    return new Renderer(options).render(nodes)
}