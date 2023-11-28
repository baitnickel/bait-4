import { Page } from './lib/page.js';
import * as Embed from './lib/embed.js';
import * as DB from './lib/fetch.js';
export function render() {
    const page = new Page();
    const lyrics = [
        'There’s nothing you can know that isn’t known',
        'Nothing you can see that isn’t shown',
        'Nowhere you can be that isn’t where you’re meant to be',
    ];
    page.content.append(Embed.paragraph(lyrics));
    // page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));
    if (page.local) {
        const songsIndexFile = `${page.fetchOrigin}/Indices/fakesheets.json`;
        DB.fetchCollection(songsIndexFile).then((songs) => {
            const dataLines = [];
            dataLines.push(`Bundle Size: ${songs.size}`);
            songs.sort('artist');
            // songs.shuffle();
            // songs.sort();
            let id = 0;
            for (const key of songs.keys) {
                id += 1;
                dataLines.push(`${id}: ${songs.get(key, 'artist')} - ${key}`);
            }
            page.content.append(Embed.paragraph(dataLines));
        });
        // const songsIndexFile = `${page.fetchOrigin}/Indices/fakesheets.json`;
        // // const songsIndexFile = `${page.fetchOrigin}/data/park.md`;
        // // DB.fetchData(songsIndexFile).then((fileContent: any) => {
        // // 	const dataset = new Dataset<T.FakesheetLookups>(fileContent);
        // // 	let selectedKeys = dataset.sort(dataset.keys, ['title', 'artist']);
        // // 	selectedKeys = dataset.filter(selectedKeys, 'artist', 'The Volumes');
        // DB.fetchMap<T.FakesheetLookups>(songsIndexFile).then((songsMap) => {
        // 	let selectedKeys = Array.from(songsMap.keys());
        // 	// selectedKeys = Data.Shuffle(selectedKeys);
        // 	// selectedKeys = Data.SortedKeys(songsMap, ['artist', 'title']);
        // 	selectedKeys = Data.FilteredKeys(songsMap, 'artist', 'The Volumes');
        // 	const dataLines: string[] = [];
        // 	for (const key of selectedKeys) {
        // 		const lookups = songsMap.get(key)!;
        // 		dataLines.push(`${key}: ${lookups.artist} - ${lookups.title}`);
        // 	}
        // 	page.content.append(Embed.paragraph(dataLines));
        // });
        // const testMarkdownFile = `${page.fetchOrigin}/data/test-markdown.md`;
        // DB.fetchData(testMarkdownFile).then((fileContent: string) => {
        // 	if (!fileContent) {
        // 		const errorMessage = `Cannot read file: \`${testMarkdownFile}\``;
        // 		page.content.append(Embed.paragraph(MarkupLine(errorMessage, 'etm')));
        // 	}
        // 	else {
        // 		const markdownDocument = new MarkdownDocument(fileContent);
        // 		markdownDocument.text += `\n\nFirst text line is: ${markdownDocument.textOffset + 1}`;
        // 		const html = Markup(markdownDocument.text);
        // 		page.content.append(Embed.paragraph(html));
        // 	}
        // });
    }
}
