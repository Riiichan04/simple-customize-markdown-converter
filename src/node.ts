export type Node =
  | { type: "Document"; children: Node[] }
  | { type: "Paragraph"; children: Node[] }
  | { type: "Header"; level: number; children: Node[] }
  | { type: "Bold"; children: Node[] }
  | { type: "Italic"; children: Node[] }
  | { type: "InlineCode"; content: string }
  | { type: "CodeBlock"; lang: string; content: string }
  | { type: "Text"; value: string }