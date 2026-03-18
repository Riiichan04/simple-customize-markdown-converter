import { ConvertOption } from "./converterOptions"
import { GenericRenderElements, RenderOption } from './renderOptions'
import { NodeType } from '../parser'

/**
 * General option for rendering Markdown into HTML strings.
 *
 * Accepts both a **flat shorthand** (top-level `elements`, `className`, `allowDangerousHtml`)
 * and the original **nested** structure (`renderOptions`, `converterOptions`).
 * When both are provided for the same key the flat shorthand takes priority.
 *
 * @template TOutput - Output type after rendered
 *
 * @example
 * ```ts
 * // Flat shorthand (recommended for simple use-cases)
 * convertMarkdownToHTML(md, {
 *   elements: { Bold: (_node, children) => `<b>${children.join("")}</b>` },
 *   className: { Header: "my-title" },
 *   allowDangerousHtml: true,
 * });
 *
 * // Nested (original API, still fully supported)
 * convertMarkdownToHTML(md, {
 *   renderOptions: { elements: { Bold: ... }, className: { ... } },
 *   converterOptions: { allowDangerousHtml: true },
 * });
 * ```
 */
export interface MarkdownOptions<TOutput> {
    // ── Flat shorthand ──────────────────────────────────────────────────────
    /**
     * Custom element renderers.
     * Shorthand for `renderOptions.elements`.
     * Flat keys take priority over `renderOptions.elements` when both are supplied.
     */
    elements?: GenericRenderElements<TOutput>
    /**
     * Custom CSS class names per node type.
     * Shorthand for `renderOptions.className`.
     * Use `"Header"` for all header levels, or `"Header1"`…`"Header6"` for specific levels.
     * Flat keys take priority over `renderOptions.className` when both are supplied.
     */
    className?: Partial<Record<NodeType | "Header1" | "Header2" | "Header3" | "Header4" | "Header5" | "Header6", string>>
    /**
     * Allow raw HTML in Markdown input.
     * Shorthand for `converterOptions.allowDangerousHtml`.
     * Flat value takes priority over `converterOptions.allowDangerousHtml` when both are supplied.
     */
    allowDangerousHtml?: boolean
    // ── Nested (original API) ────────────────────────────────────────────────
    /** Custom render functions for the rendering stage. */
    renderOptions?: RenderOption<TOutput>
    /** Global converter options. */
    converterOptions?: ConvertOption
}

/**
 * Normalises a {@link MarkdownOptions} object by merging the flat shorthand fields
 * (`elements`, `className`, `allowDangerousHtml`) with the nested `renderOptions` /
 * `converterOptions`.  Flat fields take priority over nested ones for the same key.
 *
 * Renderers call this internally so all options — flat or nested — are respected.
 *
 * @template TOutput - Output type of the renderer.
 * @param opts - Raw options as supplied by the caller.
 * @returns A normalised `MarkdownOptions` with only `renderOptions` and `converterOptions` set.
 */
export function mergeOptions<TOutput>(opts: MarkdownOptions<TOutput>): MarkdownOptions<TOutput> {
    function mergeField<T extends object>(flat: T | undefined, nested: T | undefined): T | undefined {
        return (flat || nested) ? { ...nested, ...flat } as T : undefined
    }

    return {
        renderOptions: {
            elements: mergeField(opts.elements, opts.renderOptions?.elements),
            className: mergeField(opts.className, opts.renderOptions?.className),
        },
        converterOptions: {
            allowDangerousHtml:
                opts.allowDangerousHtml ?? opts.converterOptions?.allowDangerousHtml ?? false
        }
    }
}