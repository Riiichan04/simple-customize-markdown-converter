/**
 * AST (Abstract Syntax Tree) node definition.
 * 
 * Each node represents a Markdown construct and some special nodes (Document, Paragraph).
 * Some nodes are containers (have `children`), while others are leaf nodes (contain text).
 * 
 * Variants:
 * - Document: Root node, contains all other nodes.
 * - Paragraph: A block of text, contain inline nodes.
 * - Header: A header with given `level` (1-6)
 * - Bold: Bold text
 * - Italic: Italic text
 * - Strikethrough: Strilethrough text
 * - InlineCode: Inline code snippet, with it's `content`
 * - Quote: A quote block
 * - CodeBlock: A code block, with it's `lang` and `content`
 * - List: A list, with it's level and children
 * - ListItem: An item of a list, with it's children
 * - TaskItem: An item for tasklist, with it's checked state
 * - Link: A link, with it's `text` and `href`
 * - Image: An image, with it's `src` and `alt`
 * - HorizontalLine: A horizontal line
 * - Text: Raw text content.
 */
export type Node =
    | { type: "Document"; children: Node[] }
    | { type: "Paragraph"; children: Node[] }
    | { type: "Header"; level: number; children: Node[] }
    | { type: "Bold"; children: Node[] }
    | { type: "Italic"; children: Node[] }
    | { type: "Strikethrough"; children: Node[] }
    | { type: "InlineCode"; content: string }
    | { type: "CodeBlock"; lang: string; content: string }
    | { type: "Quote"; children: Node[] }
    | { type: "List"; ordered: boolean; level: number; children: Node[] }
    | { type: "ListItem"; children: Node[]; }
    | { type: "TaskItem"; checked: boolean; children: Node[] }
    | { type: "Link"; href: string; text: string }
    | { type: "Image", src: string; alt: string }
    | { type: "HorizontalLine" }
    | { type: "Text"; value: string }
    | { type: "Table"; rows: TableRow[] }
    | { type: "HTMLBlock", value: string }
    | { type: "HTMLInline", value: string }


export type TableRow = {
    isHeader: boolean,
    cells: TableCell[]
}

export type TableCell = {
    align: "left" | "center" | "right",
    children: Node[]
}