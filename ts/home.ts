import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as FS from './lib/fetch.js';
import * as DB from './lib/fetch.js'
import * as Data from './lib/datasets.js';
import { MarkdownDocument } from './lib/md.js';
import { Markup, MarkupLine } from './lib/markup.js';

export function render() {
	const page = new Page();

	const quoteElement = page.appendElement('div', 'quote');
	FS.fetchData('Content/data/quotes.json').then((quotes: T.Quote[]) => {
		page.addRandomQuote(quoteElement, quotes);
	});

	const lyrics: string[] = [
		'There’s nothing you can know that isn’t known',
		'Nothing you can see that isn’t shown',
		'Nowhere you can be that isn’t where you’re meant to be',
	];
	page.appendParagraph(lyrics);
	// page.content.append(Embed.paragraph(lyrics));
	page.appendPhoto('i-SDpf2qV', 'S');
	// page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));
	page.appendVideo('5FQpeqFmwVk', 560, 315);

	if (page.local) {

		const songsIndexFile = `${page.fetchOrigin}/Indices/fakesheets.json`;
		DB.fetchCollection<T.FakesheetLookups>(songsIndexFile).then((songs) => {
			const dataLines: string[] = [];
			const fvalue = '7';
			const expression = `${fvalue} == 007`;
			const query = new Data.Query(expression);
			dataLines.push(`Query: ${expression} is ${query.result()}`);
			dataLines.push(`Collection Size: ${songs.size}`);
			songs.sort('dt:artist');
			// songs.shuffle();
			const randomKey = Data.RandomKey(songs.keys);
			if (randomKey) {
				let randomSong = songs.record(randomKey);
				dataLines.push(`Random Song: ${randomSong!.title}`);
			}
			// songs.sort();
			let id = 0;
			for (const key of songs.keys) {
				id += 1;
				const song = songs.record(key)!;
				dataLines.push(`${id}: ${song.artist} - ${key}`);
			}
			page.appendParagraph(dataLines);
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
