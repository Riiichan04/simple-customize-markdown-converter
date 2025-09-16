# Simple Custom Markdown Converter
This simple library help you convert Markdown to HTML and customize it.

## Feature
Currently, this lib only supports:
- Headings (#, ##, …)
- Paragraphs
- Bold (\*\*text\*\*)
- Italic (\*text\* or \_text\_)
- Inline code (\`code\`)
- Code blocks (\`\`\`lang ... \`\`\`)

And customizable renderer for all elements

## Install
```bash
npm install simple-custom-markdown-converter
```

## Usage
#### 1. Convert markdown to HTML
```js
const input = `
# Hello World
This is **bold** and *italic*
`
console.log(convertMarkdownToHTML(input))
```
Output:
```html
<h1>Hello World</h1>
<p>This is <strong>bold</strong> and <em>italic</em></p>
```

#### 2. Customize your converter
You can also customize which HTML should be rendered which every commmon Markdown syntax.

For example: change `<h1>` to `<h5>`, wrap paragraphs in `<div>`, or style bold text:
```ts
const renderOptions: RenderOption = {
  elements: {
    Header: (node, children) => {
        //Customize for only Heading 1
        if (node.level === 1) {
            return `<h5 class="custom-h1">${children.join("")}</h5>`
        }
        //Keep all remain Heading
        return `<h${node.level}>${children.join("")}</h${node.level}>`
    },
    Paragraph: (_node, children) => `<div class="paragraph">${children.join("")}</div>`,
    Bold: (_node, children) => `<b class="bold-text">${children.join("")}</b>`,
  }
}

const input = `
# Title
Hello **World**
`

console.log(convertMarkdownToHTML(input, renderOptions))
```

Output:
```html
<h5 class="custom-h1">Title</h5>
<div class="paragraph">Hello <b class="bold-text">World</b></div>
```