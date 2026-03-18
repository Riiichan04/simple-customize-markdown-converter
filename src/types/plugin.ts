import { Token, TokenizerStrategy } from "./token";
import { ASTNode, NodeType, ParsingStrategy } from "./parser"
import { RenderStrategy } from "./renderer";

/**
 * Representing a custom plugin for the Markdown converter.
 * It allow to define new syntax by hooking into the `Lexing`, `Parsing` and `Rendering` stages.
 * @template TOutput - The type of final rendered output
 */
export interface MarkdownPlugin<T extends string, TOutput> {
    /**
     * Unique identifier for the plugin
     */
    name: T
    /**
     * Define the context of plugin
     */
    type: "block" | "inline"
    /**
     * Strategy for the Lexer.
     * The `type` property of this property must be same as `name` property
     */
    tokenizer: TokenizerStrategy & { type: T },
    /**
     * Strategy for the Parser.
     * The `type` property of this property must be same as `name` property
     */
    parser: ParsingStrategy & { type: T }
    /**
     * Strategy for the Renderer.
     * The `type` property of this property must be same as `name` property
     */
    renderer: RenderStrategy<TOutput> & { type: T }
}

/**
 * A helper function to create a plugin
 * @template T - The literal string type for the plugin name.
 * @template TOutput - The output type.
 * @param name - Name of plugin
 * @param type - Context of plugin, determine for parser processing
 * @param tokenizer - Tokenizer strategy for Lexer
 * @param parser - Parser strategy for Parser
 * @param renderer - Render strategy for Renderer
 * @returns - A complete Markdown plugin
 */
export function createPlugin<T extends string, TOutput>(
    name: T,
    type: "block" | "inline",
    tokenizer: Omit<TokenizerStrategy, "type">,
    parser: Omit<ParsingStrategy, "type">,
    renderer: Omit<RenderStrategy<TOutput>, "type">
): MarkdownPlugin<T, TOutput> {
    const finalTokenizer = Object.assign(tokenizer, { type: name }) as TokenizerStrategy & { type: T }
    const finalParser = Object.assign(parser, { type: name }) as ParsingStrategy & { type: T }
    const finalRenderer = Object.assign(renderer, { type: name }) as RenderStrategy<TOutput> & { type: T }

    return {
        name,
        type,
        tokenizer: finalTokenizer,
        parser: finalParser,
        renderer: finalRenderer
    }
}

/**
 * Creates a plugin from a regex pattern, greatly reducing the boilerplate needed for
 * simple Extension Rules. The tokenizer cursor advancement and the parser step are
 * handled automatically — you only need to supply a pattern, an extractor, and a renderer.
 *
 * The regex is tested against the remaining input at the current lexer position.
 * It is automatically anchored to `^` so it always matches from the current position.
 *
 * @template T - The literal string type for the plugin name.
 * @template TOutput - The output type (`string` for HTML, `React.ReactNode` for React).
 * @param name - Unique name for the plugin (used as the token/node type).
 * @param type - Plugin context: `"inline"` for inline syntax, `"block"` for block-level syntax.
 * @param options.pattern - RegExp matched at the current lexer position.
 * @param options.extract - Converts the regex match array to token data (cursor is auto-advanced).
 * @param options.render - Renders the AST node to the output type.
 * @returns A complete {@link MarkdownPlugin}.
 *
 * @example
 * ```ts
 * // Inline plugin: renders :emoji_name: syntax
 * const emojiPlugin = definePlugin("Emoji", "inline", {
 *   pattern: /^:([^:]+):/,
 *   extract: ([, value]) => ({ value }),
 *   render: (node) => `<span class="emoji emoji-${node.value}">😊</span>`,
 * });
 *
 * convertMarkdownToHTML("Hello :wave: world", {}, [emojiPlugin]);
 * // => <p>Hello <span class="emoji emoji-wave">😊</span> world</p>
 * ```
 *
 * @example
 * ```tsx
 * // React inline plugin
 * const emojiPlugin = definePlugin("Emoji", "inline", {
 *   pattern: /^:([^:]+):/,
 *   extract: ([, value]) => ({ value }),
 *   render: (node) => React.createElement("span", { className: `emoji emoji-${node.value}` }, "😊"),
 * });
 * ```
 */
export function definePlugin<T extends string, TOutput>(
    name: T,
    type: "block" | "inline",
    options: {
        /**
         * RegExp matched at the current lexer position.
         * The pattern is always anchored to `^` automatically.
         * For block plugins you do not need to add a start-of-line check yourself —
         * the helper already calls `isStartOfLine()` before testing the pattern.
         */
        pattern: RegExp
        /**
         * Converts the regex `RegExpMatchArray` to token data.
         * Do **not** include `type` — it is set automatically to `name`.
         * The lexer cursor is advanced past the match automatically.
         */
        extract: (match: RegExpMatchArray) => Omit<Token, "type">
        /**
         * Renders the AST node to the output type.
         * `children` contains already-rendered child nodes (useful for block plugins).
         */
        render: (node: ASTNode, children: TOutput[]) => TOutput
    }
): MarkdownPlugin<T, TOutput> {
    const { pattern, extract, render } = options

    // Always anchor to current position; strip 'g' flag to avoid stateful regex issues
    const safeFlags = pattern.flags.replace("g", "")
    const anchoredPattern = pattern.source.startsWith("^")
        ? new RegExp(pattern.source, safeFlags)
        : new RegExp("^(?:" + pattern.source + ")", safeFlags)

    const tokenizer: TokenizerStrategy & { type: T } = {
        type: name,
        match: (lex) => {
            if (type === "block" && !lex.isStartOfLine()) return false
            return anchoredPattern.test(lex.input.slice(lex.pos))
        },
        emit: (lex) => {
            const remaining = lex.input.slice(lex.pos)
            const match = anchoredPattern.exec(remaining)
            if (!match) return
            const tokenData = extract(match)
            // The Lexer's tokenize() loop calls this.next() once after every emit().
            // So emit() must advance by (match length - 1) to land on the last matched
            // character; the loop's next() will then step past it.
            if (match[0].length > 1) lex.next(match[0].length - 1)
            lex.listToken.push({ ...tokenData, type: name })
        }
    }

    const parser: ParsingStrategy & { type: T } = {
        type: name,
        execute: (p, token) => {
            p.next(1)
            return { ...token, type: name as string } as ASTNode
        }
    }

    const renderer: RenderStrategy<TOutput> & { type: T } = {
        type: name,
        render: (node, children) => render(node, children)
    }

    return { name, type, tokenizer, parser, renderer }
}