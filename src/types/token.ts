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
 * - Text: Plain text content.
 * - Bold: Bold marker (`**`).
 * - Italic: Italic marker (`*` or `_`).
 * - InlineCode: Inline code snippet (`` ` ``), with its `content`.
 * - QUote: A quote block (`>`).
 * - EOF: A special token, this is the end of input.
 */
export type Token =
    | { type: "Header", level: number }
    | { type: "CodeBlock", lang: string, content: string }
    | { type: "NewLine" }
    | { type: "Text", value: string }
    | { type: "Bold" }
    | { type: "Italic" }
    | { type: "InlineCode", content: string }
    | { type: "Quote" }
    | { type: "EOF" }