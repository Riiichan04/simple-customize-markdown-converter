import React from "react"
import { ReactRenderer } from "./renderers/react"
import { MarkdownOptions } from "./types/options"
import { BaseConverter } from "./types/converter"
import { MarkdownPlugin, createPlugin, definePlugin } from "./types/plugin"

export { ReactRenderer, createPlugin, definePlugin }

/**
 * Convert a Markdown string into a ReactNode.
 * @param input - The Markdown source string
 * @param renderOptions - Optional rendering options
 * @param options - Optional handle options
 * @param [plugin=[]] - Optional plugin for additional render rules
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
    options: MarkdownOptions<React.ReactNode> = {
        renderOptions: {},
        converterOptions: { allowDangerousHtml: false }
    },
    plugin: MarkdownPlugin<string, React.ReactNode>[] = []
): React.ReactNode {
    return new ReactMarkdownConverter(options, plugin).convert(input)
}

/**
 * A React commponent that renders Markdown content.
 * Using `React.useMemo` to ensure performance and prevent unnecessary re-render.
 * @param props.content - The Markdown source to render.
 * @param props.options - Optional configuration for the renderer. 
 * @param props.className - Optional CSS classes for the wrapping `div` element.
 * @param props.plugin - Optional plugin for additional syntax handler.
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
    options?: MarkdownOptions<React.ReactNode>
    className?: string,
    plugin?: MarkdownPlugin<string, React.ReactNode>[]
}> = ({ content, className, options, plugin }) => {
    const rendered = React.useMemo(() => {
        return new ReactMarkdownConverter(options, plugin).convert(content)
    }, [content, options, plugin])

    return React.createElement("div", { className }, rendered)
}

/**
 * React Markdown converter that outputs a React.ReactNode
 * @extends BaseConverter<React.ReactNode>
 * @example
 * ```ts
 * const converter = new ReactMarkdownConverter(
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
export class ReactMarkdownConverter extends BaseConverter<React.ReactNode> {
    constructor(
        options: MarkdownOptions<React.ReactNode> = {
            renderOptions: {},
            converterOptions: { allowDangerousHtml: false }
        },
        plugin: MarkdownPlugin<string, React.ReactNode>[] = []
    ) {
        super(options, plugin)
    }

    convert(input: string): React.ReactNode {
        const tokens = this.getTokens(input)
        const nodes = this.getNodes(tokens)
        const renderer = new ReactRenderer(
            this.footnoteResolver,
            this.options,
            this.plugin.map(p => p.renderer)
        )
        return renderer.render(nodes)
    }
}