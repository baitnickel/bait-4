import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as DB from './lib/fetch.js'
import * as Data from './lib/datasets.js';
import { MarkdownDocument } from './lib/md.js';
import { Markup, MarkupLine } from './lib/markup.js';

export function render() {
	const page = new Page();
	
	const Quote = page.appendContent();
	const Collection = page.appendContent();
	const TestMap = page.appendContent();
	const TestMarkdown = page.appendContent();
	const Lorem = page.appendContent();
	const Photo = page.appendContent();
	const Video = page.appendContent();

	DB.fetchData(`${page.fetchOrigin}/Content/data/quotes.json`).then((quotes: T.Quote[]) => {
		const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
		page.appendQuote(Quote, randomQuote);

		const lorem = `Aliquip deserunt adipisicing id labore nisi ipsum aliqua sunt ex adipisicing velit sint quis nulla. Non ea irure voluptate non. Pariatur proident eu sunt non ullamco excepteur enim in enim reprehenderit eu occaecat occaecat tempor. Veniam aute non dolore tempor ex dolor tempor sint enim proident. Reprehenderit ex anim magna tempor adipisicing consequat ipsum exercitation laborum duis sunt fugiat nostrud. Excepteur aute commodo laboris qui ad enim amet velit. Nulla ex do labore anim ut commodo amet laboris eu dolore est. Ut sunt fugiat labore in sit id qui. Minim voluptate irure ea ea deserunt aliquip eiusmod commodo. Reprehenderit id ex amet quis elit labore et ad amet consequat deserunt anim. Anim ullamco sint elit veniam.`;
		page.appendParagraph(Lorem, lorem);
	});

	page.appendPhoto(Photo, 'i-SDpf2qV', 'S');
	// page.appendParagraph('');
	page.appendVideo(Video, '9MtLIkk2ihw', 400, 220);

	if (page.local) {
		const testCollection = false;
		const testMap = false;
		const testMarkdown = false;

		if (testCollection) {
			const songsIndexFile = `${page.fetchOrigin}/Indices/fakesheets.json`;
			DB.fetchCollection<T.FakesheetLookups>(songsIndexFile).then((songs) => {
				const dataLines: string[] = [];
				songs.sort('dt:artist');
				// songs.shuffle();
				const randomKey = Data.RandomKey(songs.keys);
				if (randomKey) {
					let randomSong = songs.record(randomKey);
					dataLines.push(`Random Song: ==${randomSong!.title}==`);
					dataLines.push('');
				}
				// songs.sort();
				let id = 0;
				for (const key of songs.keys) {
					id += 1;
					const song = songs.record(key)!;
					dataLines.push(`${id}: ${song.artist} - ${key}`);
				}
				page.appendParagraph(Collection, dataLines);
			});
		}

		if (testMap) {
			const songsIndexFile = `${page.fetchOrigin}/Indices/fakesheets.json`;
			DB.fetchMap<T.FakesheetLookups>(songsIndexFile).then((songsMap) => {
				let selectedKeys = Array.from(songsMap.keys());
				const dataLines: string[] = [];
				for (const key of selectedKeys) {
					const lookups = songsMap.get(key)!;
					dataLines.push(`${key}: ${lookups.artist} - ${lookups.title}`);
				}
				page.appendParagraph(TestMap, dataLines);
			});
		}

		if (testMarkdown) {
			const testMarkdownFile = `${page.fetchOrigin}/data/test-markdown.md`;
			DB.fetchData(testMarkdownFile).then((fileContent: string) => {
				if (!fileContent) {
					const errorMessage = `Cannot read file: ${testMarkdownFile}`;
					page.appendParagraph(TestMarkdown, errorMessage);
				}
				else {
					const markdownDocument = new MarkdownDocument(fileContent);
					markdownDocument.text += `\n\nFirst text line is: ${markdownDocument.textOffset + 1}`;
					const html = Markup(markdownDocument.text);
					const paragraph = page.appendParagraph(TestMarkdown, '');
					paragraph.innerHTML = html;
				}
			});
		}
	}
}
