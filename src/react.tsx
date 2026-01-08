import React from "react";
import { ReactRenderOption } from "./types/options/reactRenderOptions";
import Lexer from "./core/lexer";
import { FootnoteResolver } from "./core/resolver";
import { Parser } from "./core/parser";
import ReactRenderer from "./renderers/react";
import { MarkdownReactOptions } from "./types/options";
import { Node } from "./types/node"
import { ReactConvertExtension } from "./types/extension";

export { MarkdownReactOptions, ReactRenderOption, Node }

/**
 * Convert a Markdown string into a ReactNode.
 * @param input - The Markdown source string
 * @param renderOptions - Optional rendering options
 * @param options - Optional handle options
 * @returns The rendered `React.ReactNode` ready to be rendered into a React component.
 * 
 * @example
 * ```tsx
 * const node = convertMarkdownToReactNode("## Hello React");
 * return <div>{node}</div>;
 * ```
 */
export function convertMarkdownToReactNode(
    input: string,
    options: MarkdownReactOptions = {
        renderOptions: {},
        converterOptions: { allowDangerousHtml: false }
    },
    extensions: ReactConvertExtension[] = []
): React.ReactNode {
    const tokens = new Lexer(input, extensions).tokenize()
    const footNoteResolver = new FootnoteResolver()
    const nodes = new Parser(tokens, footNoteResolver, extensions).parse()
    return new ReactRenderer(footNoteResolver, options, extensions).render(nodes)
}

/**
 * A React commponent that renders Markdown content.
 * Using `React.useMemo` to ensure performance and prevent unnecessary re-render.
 * @param props.content - The Markdown source to render.
 * @param props.options - Optional configuration for the renderer. 
 * @param props.extensions - Optional syntax extension for renderer.
 * @param props.className - Optional CSS classes for the wrapping `div` element.
 * @example
 * ```tsx
 * <MarkdownComponent
 *    content="**Bold text here**"
 *    className="markdown markdown-rendered"
 *    options={{ converterOptions: { allowDangerousHtml: true } }}
 * />
 * ```
 */
export const MarkdownComponent: React.FC<{
    content: string,
    options?: MarkdownReactOptions,
    extensions?: ReactConvertExtension[],
    className?: string
}> = ({ content, className, options, extensions = [] }) => {
    const rendered = React.useMemo(() => {
        return convertMarkdownToReactNode(content, options)
    }, [content, options, extensions])

    return React.createElement("div", { className }, rendered)
}