import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js'
import * as Data from './lib/datasets.js';
import { MarkdownDocument } from './lib/md.js';
import { Markup, MarkupLine } from './lib/markup.js';

export function render() {
	const page = new Page();
	
	const Quote = page.appendContent('#Quote');
	const TestCollection = page.appendContent('#TestCollection');
	const TestMap = page.appendContent('#TestMap');
	const TestMarkdown = page.appendContent('#TestMarkdown');
	const Lorem = page.appendContent('#Lorem .blue');
	const Photo = page.appendContent('#Photo');
	const Video = page.appendContent('#Video');

	Fetch.fetchData(`${page.site}/Content/data/quotes.json`).then((quotes: T.Quote[]) => {
		const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
		page.appendQuote(Quote, randomQuote);

		const lorem = `Aliquip deserunt adipisicing id labore nisi ipsum aliqua sunt ex adipisicing velit sint quis nulla. Non ea irure voluptate non. Pariatur proident eu sunt non ullamco excepteur enim in enim reprehenderit eu occaecat occaecat tempor. Veniam aute non dolore tempor ex dolor tempor sint enim proident. Reprehenderit ex anim magna tempor adipisicing consequat ipsum exercitation laborum duis sunt fugiat nostrud. Excepteur aute commodo laboris qui ad enim amet velit. Nulla ex do labore anim ut commodo amet laboris eu dolore est. Ut sunt fugiat labore in sit id qui. Minim voluptate irure ea ea deserunt aliquip eiusmod commodo. Reprehenderit id ex amet quis elit labore et ad amet consequat deserunt anim. Anim ullamco sint elit veniam.`;
		page.appendParagraph(Lorem, lorem);
	});

	// page.appendPhoto(Photo, 'i-SDpf2qV', 'S');
	// page.appendParagraph('');
	// page.appendVideo(Video, '9MtLIkk2ihw', 400, 220);

	if (page.local) {
		const testCollection = true;
		const testMap = false;
		const testMarkdown = true;

		if (testCollection) {
			const songsIndexFile = `${page.site}/Indices/fakesheets.json`;
			Fetch.fetchCollection<T.FakesheetLookups>(songsIndexFile).then((songs) => {
				const dataLines: string[] = [];
				songs.sort('dt:artist');
				// songs.shuffle();
				const randomKey = Data.RandomKey(songs.keys);
				if (randomKey) {
					let randomSong = songs.record(randomKey)!;
					dataLines.push(`Random Song: ==${randomSong.title}==`);
					dataLines.push('');
				}

				let id = 0;
				let key = songs.first(); //songs.last();
				while (key) {
					id += 1;
					const song = songs.record(key)!;
					dataLines.push(`${id}: [${songs.preceding}] ${song.artist} - ${song.title} [${songs.succeeding}]`);
					key = songs.next(); //songs.previous();
				}

				dataLines.push('___');
				id = 0;
				for (const key of songs.keys) {
					const song = songs.record(key)!;
					if (song.artist == 'Dan' || song.artist.startsWith('Elle')) {
						id += 1;
						dataLines.push(`${id}: ${song.artist} - ${song.title}`);
					}
				}

				page.appendParagraph(TestCollection, dataLines);
			});
		}

		if (testMap) {
			const songsIndexFile = `${page.site}/Indices/fakesheets.json`;
			Fetch.fetchMap<T.FakesheetLookups>(songsIndexFile).then((songsMap) => {
				const dataLines: string[] = [];
				const collection = new Data.Collection<T.FakesheetLookups>(songsMap);
				let entry = collection.first();
				while (entry !== null) {
					const record = collection.record(entry);
					dataLines.push(`${entry}: ${record!.artist} - ${record!.title}`);
					entry = collection.next();
				}
				page.appendParagraph(TestMap, dataLines);
			});
		}

		if (testMarkdown) {
			const testMarkdownFile = `${page.site}/data/test-markdown.md`;
			Fetch.fetchData(testMarkdownFile).then((fileContent: string) => {
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
