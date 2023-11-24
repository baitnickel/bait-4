import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Embed from './lib/embed.js';
import * as DB from './lib/fetch.js'
import { Collection, Shuffle } from './lib/datasets.js';
import { MarkdownDocument } from './lib/md.js';
import { Markup, MarkupLine } from './lib/markup.js';

export function render() {
	const page = new Page();
	const lyrics: string[] = [
		'There’s nothing you can know that isn’t known',
		'Nothing you can see that isn’t shown',
		'Nowhere you can be that isn’t where you’re meant to be',
	];
	page.content.append(Embed.paragraph(lyrics));
	page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));

	if (page.local) {
		const songsIndexFile = `${page.fetchOrigin}/Indices/fakesheets.json`;
		DB.fetchData(songsIndexFile).then((fileContent: string) => {
			const songCollection = new Collection<T.FakesheetLookups>(fileContent);
			songCollection.sort(['artist', 'title']);
			let keys = songCollection.orderedKeys;
			for (const key of keys) {
				const lookups = songCollection.map.get(key)!;
				console.log(`${key}: ${lookups.artist} ${lookups.title}`);
			} 
			// for (const [fileName, songInfo] of songCollection.map) {
			// 	console.log(`${fileName}: ${songInfo.title}`);
			// }
		});

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
