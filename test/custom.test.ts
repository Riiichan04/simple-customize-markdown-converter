import { convertMarkdownToHTML, MarkdownDefaultOptions } from "../src/index"

const renderWithEmoji = (text: string) => {
    return text.replace(/:([a-z0-9_]+):/g, (match, emojiName) => {
        return `<img src="/assets/emoji/${emojiName}.png" alt="${emojiName}" class="emoji" style="height:1em; vertical-align:middle;" />`;
    });
};

test("Custom Render emoji", () => {
    const options: MarkdownDefaultOptions = {
        renderOptions: {
            elements: {
                Text: (node) => {
                    const value = (node as any).value;
                    return renderWithEmoji(value);
                }
            }
        }
    };

    const md = "Hello :smile:! Have a nice day!!! :fire:";
    const result = convertMarkdownToHTML(md, options);

    expect(result).toBe(
        '<p>Hello <img src="/assets/emoji/smile.png" alt="smile" class="emoji" style="height:1em; vertical-align:middle;" />! Have a nice day!!! <img src="/assets/emoji/fire.png" alt="fire" class="emoji" style="height:1em; vertical-align:middle;" /></p>'
    );
});