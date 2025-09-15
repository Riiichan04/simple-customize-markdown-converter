export type Token =
    | { type: "Header", level: number } // #
    | { type: "CodeBlock", lang: string, content: string }  // ```
    | { type: "NewLine" }   // `
    | { type: "Text", value: string }   //Just normal text
    | { type: "Bold" }  // **
    | { type: "Italic" }    // * or _
    | { type: "InlineCode", content: string }   // `
    | { type: "EOF" }