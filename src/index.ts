import { ILexer, Lexer } from "./core/lexer"
import { IParser, Parser } from "./core/parser"
import { IRenderer } from "./renderers/index"
import { DefaultRenderer } from "./renderers/default"
import { MarkdownOptions } from "./types/options"
import { mergeOptions } from "./types/options"
import { Token, TokenizerStrategy } from './types/token'
import { ASTNode, ParsingStrategy } from './types/parser'
import { RenderStrategy } from './types/renderer'
import { MarkdownPlugin, createPlugin, definePlugin } from "./types/plugin"
import { BaseConverter } from "./types/converter"

export {
    MarkdownOptions, mergeOptions,
    ILexer, IParser, IRenderer,
    Lexer, Parser, DefaultRenderer,
    Token, TokenizerStrategy,
    ASTNode, ParsingStrategy,
    RenderStrategy,
    MarkdownPlugin, createPlugin, definePlugin,
    BaseConverter,
}

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
    options: MarkdownOptions<string> = {
        renderOptions: {},
        converterOptions: { allowDangerousHtml: false }
    },
    plugin: MarkdownPlugin<string, string>[] = []
): string {
    return new DefaultMarkdownConverter(options, plugin).convert(input)
}

/**
 * Default Markdown converter that outputs a standard HTML string
 * @extends BaseConverter<string>
 * @example
 * ```ts
 * const converter = new DefaultMarkdownConverter(
 *  { 
 *    renderOptions: { 
 *      className: { Header: "my-title" } 
 *    }
 *  }, 
 *  [MyCustomPlugin]
 * );
 * const html = converter.convert("# Hello");
 * ```
 */
export class DefaultMarkdownConverter extends BaseConverter<string> {
    constructor(
        options: MarkdownOptions<string> = {
            renderOptions: {},
            converterOptions: { allowDangerousHtml: false }
        },
        plugin: MarkdownPlugin<string, string>[] = []
    ) {
        super(options, plugin)
    }

    convert(input: string): string {
        const tokens = this.getTokens(input)
        const nodes = this.getNodes(tokens)
        const renderer = new DefaultRenderer(
            this.footnoteResolver,
            this.options,
            this.plugin.map(p => p.renderer)
        )
        return renderer.render(nodes)
    }
}

