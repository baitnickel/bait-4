import { Page } from './lib/page.js';
import * as Embed from './lib/embed.js';
import * as DB from './lib/fetch.js';
import { Markup, MarkupLine } from './lib/markup.js';
export function render() {
    const page = new Page();
    const lyrics = [
        'There’s nothing you can know that isn’t known',
        'Nothing you can see that isn’t shown',
        'Nowhere you can be that isn’t where you’re meant to be',
        // `Session encryption value is ${page.encryption}`,
    ];
    page.content.append(Embed.paragraph(lyrics));
    page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));
    const testMarkdownFile = `${page.fetchOrigin}/data/test-markdown.md`;
    DB.fetchData(testMarkdownFile).then((markdownText) => {
        if (!markdownText) {
            const errorMessage = `Cannot read file: \`${testMarkdownFile}\``;
            page.content.append(Embed.paragraph(MarkupLine(errorMessage, 'etm')));
        }
        else {
            const html = Markup(markdownText);
            page.content.append(Embed.paragraph(html));
        }
    });
}
