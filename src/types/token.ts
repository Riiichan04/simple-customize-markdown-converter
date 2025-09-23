/**
 * Token produced by the Markdown lexer.
 *
 * Each token represents the smallest meaningful unit of Markdown syntax
 * before being parsed into the AST.
 *
 * Variants:
 * - Header: Markdown header (`#`), with a `level` (1–6).
 * - CodeBlock: Fenced code block (` ``` `), with optional `lang` and its `content`.
 * - NewLine: Line break (`\n`).
 * - Bold: Bold marker (`**`).
 * - Italic: Italic marker (`*` or `_`).
 * - Strikethrough: Strikethrough marker (`~~`)
 * - InlineCode: Inline code snippet (`` ` ``), with its `content`.
 * - Quote: A quote block (`>`).
 * - ListStart: Start a list
 * - ListItem: A list's item (`* ` or `+ ` or `- ` or `number with dot`)
 * - TaskItem: A task item in a list (`- [ ]` or `- [x]`)
 * - ListEnd: End a list
 * - Link: A link (`[text](url)`)
 * - Image: An image (`![alt](url)`)
 * - HorizontalLine: A horizontal line (`---` or `___` or `***`)
 * - Text: Plain text content.
 * - EOF: A special token, this is the end of input.
 */
export type Token =
    | { type: "Header", level: number }
    | { type: "CodeBlock", lang: string, content: string }
    | { type: "NewLine" }
    | { type: "Bold" }
    | { type: "Italic" }
    | { type: "Strikethrough" }
    | { type: "InlineCode", content: string }
    | { type: "Quote" }
    | { type: "ListStart", ordered: boolean, level: number }
    | { type: "ListItem" }
    | { type: "TaskItem", checked: boolean }
    | { type: "ListEnd" }
    | { type: "Link", text: string, href: string }
    | { type: "Image", src: string, alt: string }
    | { type: "HorizontalLine" }
    | { type: "Text", value: string }
    | { type: "EOF" }
    | { type: "TableStart" }
    | { type: "TableEnd" }
    | { type: "RowStart", isHeader: boolean }
    | { type: "RowEnd" }
    | { type: "CellStart", align: "left" | "center" | "right" }
    | { type: "CellEnd" }