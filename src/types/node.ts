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
 * - InlineCode: Inline code snippet, with it's `content`
 * - Quote: A quote block
 * - CodeBlock: A code block, with it's `lang` and `content`
 * - Link: A link, with it's `text` and `href`
 * - Image: An image, with it's `src` and `alt`
 * - Text: Raw text content.
 */
export type Node =
  | { type: "Document"; children: Node[] }
  | { type: "Paragraph"; children: Node[] }
  | { type: "Header"; level: number; children: Node[] }
  | { type: "Bold"; children: Node[] }
  | { type: "Italic"; children: Node[] }
  | { type: "Strikethrough", children: Node[] }
  | { type: "InlineCode"; content: string }
  | { type: "CodeBlock"; lang: string; content: string }
  | { type: "Quote"; children: Node[] }
  | { type: "Link"; href: string; text: string }
  | { type: "Image", src: string; alt: string }
  | { type: "Text"; value: string }