import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js'
import { Document } from './lib/document.js';
import { FAKESHEET, FakeSheet, FakeSheetIndex } from './lib/fakesheet.js'
import { MarkupLine } from './lib/markup.js';

const CSS_CLASS = {
	songTitleLink: 'song-title-link',
	metadataLabel: 'songbook-metadata-label',
	metadataValue: 'songbook-metadata-value',
	chords: 'chords',
}
const CSS_ID = {
	errorBlock: 'song-error',
	metadataBlock: 'song-metadata',
	sheetBlock: 'song-sheet',
	diagramBlock: 'song-diagram',
	keyTag: 'key-select',
	capo: 'capo',
	tuning: 'tuning',
	tempo: 'tempo',
	copyright: 'copyright'
}

enum SortOrder {
	Artist,
	Song,
};

const page = new Page();
const dataPath = `${page.fetchOrigin}/data/fakesheets`;

const errorBlock = document.createElement('div');
errorBlock.id = CSS_ID.errorBlock;
const metadataBlock = document.createElement('div');
metadataBlock.id = CSS_ID.metadataBlock;
const sheetBlock = document.createElement('pre');
sheetBlock.id = CSS_ID.sheetBlock;
const diagramBlock = document.createElement('div');
diagramBlock.id = CSS_ID.diagramBlock;
const sortOrder = SortOrder.Artist;

export function render() {
	page.displayMenu();
	page.displayFooter();
	let song = page.parameters.get('song');
	if (song) {
		/** Display the song's fakesheet */
		const fakeSheetFilePath = `${dataPath}/${song}`;
		DB.fetchData(fakeSheetFilePath).then((fakeSheetText: string) => {
			let obsidian = new Document(fakeSheetText);
			if (obsidian.errors) obsidian.reportErrors();
			else {
				let fakeSheet = new FakeSheet(obsidian.markdown, obsidian.metadata);
				fakeSheet.parseMetadata();
				fakeSheet.parseSourceText();
				displaySheet(fakeSheet);
			}
		});
	}
	else {
		/** Display a list of songs having fakesheets */
		page.setTitle('Song Book');
		page.addHeading('List of Songs', 2);
		const fakeSheetIndexPath = `${dataPath}/index.yaml`;
		DB.fetchData(fakeSheetIndexPath).then ((indexText: string) => {
			let yaml = new Document(indexText, true);
			if (yaml.errors) yaml.reportErrors();
			else {
				const fakeSheetIndex = yaml.metadata;
				let songKeys = Object.keys(fakeSheetIndex);
				sortSongKeys(fakeSheetIndex, songKeys);
				let pElement = document.createElement('p');
				let artistDiv: HTMLDivElement|null = null; /** <div> to contain an artist's items */
				let detailsElement: HTMLDetailsElement|null = null;
				let previousArtist = '';
				for (let songKey of songKeys) {
					/** 'songKey' is the fakesheet file name */
					if (sortOrder == SortOrder.Artist) {
						let songBookItem = fakeSheetIndex[songKey].title;
						if (previousArtist != fakeSheetIndex[songKey].artist) {
							if (previousArtist) { /** this is not the first song */
								// close the current <details> block and start a new one
								if (artistDiv && detailsElement) {
									detailsElement.append(artistDiv);
									page.content.append(detailsElement);
								}
							}
							detailsElement = document.createElement('details');
							let summaryElement = document.createElement('summary');
							summaryElement.innerHTML = MarkupLine(fakeSheetIndex[songKey].artist, 'et');
							detailsElement.append(summaryElement);
							artistDiv = document.createElement('div');
							artistDiv.classList.add(CSS_CLASS.songTitleLink);
						}
						if (artistDiv && detailsElement) {
							let anchorElement = document.createElement('a');
							anchorElement.href = page.url + `?page=songbook&song=${songKey}`;
							anchorElement.innerHTML = MarkupLine(songBookItem, 'et');
							artistDiv.appendChild(anchorElement);
							let breakElement = document.createElement('br');
							artistDiv.appendChild(breakElement);
							detailsElement.append(pElement);
						}
					}
					else { /** SortOrder.Song */
						let songBookItem = `${fakeSheetIndex[songKey].title} - ${fakeSheetIndex[songKey].artist}`;
						let anchorElement = document.createElement('a');
						anchorElement.href = page.url + `?page=songbook&song=${songKey}`;
						anchorElement.innerHTML = MarkupLine(songBookItem, 'et');
						pElement.appendChild(anchorElement);
						let breakElement = document.createElement('br');
						pElement.appendChild(breakElement);
						page.content.append(pElement);
					}
					previousArtist = fakeSheetIndex[songKey].artist;
				}
				if (artistDiv && detailsElement) {
					detailsElement.append(artistDiv);
					page.content.append(detailsElement);
				}
			}
		});
	}
}

function displaySheet(fakesheet: FakeSheet) {
	/** Display song title in both HTML title and Heading */
	let title = (fakesheet.title) ? fakesheet.title : '(untitled)';
	if (fakesheet.artist) title += ` - ${fakesheet.artist}`;
	document.title = MarkupLine(title, 'ET');
	page.addHeading(MarkupLine(title, 'ET'), 4);

	/** Create placeholders for page content */
	page.content.append(errorBlock);
	page.content.append(metadataBlock);
	page.content.append(sheetBlock);
	page.content.append(diagramBlock);

	/** Fill the page content blocks */
	fillErrorBlock(fakesheet);
	fillMetadataBlock(fakesheet);
	fillSheetBlock(fakesheet);
	fillDiagramBlock(fakesheet);
}

function metadataItem(id: string, label: string, value: string) {
	let itemSpanElement = document.createElement('span');
	itemSpanElement.id = id;
	let labelSpanElement = document.createElement('span');
	let valueSpanElement = document.createElement('span');
	label += ' ';
	let labelText = document.createTextNode(MarkupLine(label, 'T'));
	labelSpanElement.appendChild(labelText);
	labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
	let valueText = document.createTextNode(MarkupLine(value, 'T'));
	valueSpanElement.appendChild(valueText);
	valueSpanElement.classList.add(CSS_CLASS.metadataValue);
	itemSpanElement.appendChild(labelSpanElement);
	itemSpanElement.appendChild(valueSpanElement);
	itemSpanElement.appendChild(document.createElement('br'));
	return itemSpanElement;
}

function fillErrorBlock(fakesheet: FakeSheet) {
	errorBlock.innerHTML = '';
	if (fakesheet.errors.length) {
		errorBlock.appendChild(document.createTextNode('Errors:'));
		errorBlock.appendChild(document.createElement('br'));
		for (let error of fakesheet.errors) {
			errorBlock.appendChild(document.createTextNode(error));
			errorBlock.appendChild(document.createElement('br'));
		}
		errorBlock.appendChild(document.createElement('br'));
	}
}

function fillMetadataBlock(fakesheet: FakeSheet) {
	metadataBlock.innerHTML = '';

	if (fakesheet.key) {
		let labelSpanElement = document.createElement('span');
		let labelText = document.createTextNode('Key: ');
		labelSpanElement.appendChild(labelText);
		labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
		let selectElement = keySelectElement(fakesheet);
		metadataBlock.appendChild(labelSpanElement);
		metadataBlock.appendChild(selectElement);
		metadataBlock.appendChild(document.createElement('br'));
	}

	if (fakesheet.capoMessage()) {
		metadataBlock.appendChild(metadataItem(CSS_ID.capo, 'Capo:', fakesheet.capoMessage()));
	}
	if (fakesheet.tuning.length) {
		metadataBlock.appendChild(metadataItem(CSS_ID.tuning, 'Tuning:', fakesheet.tuning.join(' ')));
	}
	if (fakesheet.tempo) {
		metadataBlock.appendChild(metadataItem(CSS_ID.tempo, 'Tempo:', fakesheet.tempo.toString()));
	}
	if (fakesheet.copyright) {
		metadataBlock.appendChild(metadataItem(CSS_ID.copyright, '©', MarkupLine(fakesheet.copyright, 'T')));
	}
}

function fillSheetBlock(fakesheet: FakeSheet) {
	sheetBlock.innerHTML = '';
	let fakeSheetLines = fakesheet.fakeSheetLines();
	for (let fakeSheetLine of fakeSheetLines) {
		let lineType = fakeSheetLine[0];
		fakeSheetLine = fakeSheetLine.slice(1) + '\n'; /** remove character 0 and add a newline for <pre> */
		let lineText = document.createTextNode(MarkupLine(fakeSheetLine, 'F'));
		if (lineType == FAKESHEET.chordLine) {
			let spanElement = document.createElement('span');
			spanElement.classList.add(CSS_CLASS.chords);
			spanElement.appendChild(lineText);
			sheetBlock.appendChild(spanElement);
		} else sheetBlock.appendChild(lineText);
	}
}

function fillDiagramBlock(fakesheet: FakeSheet) {
	diagramBlock.innerHTML = '';
	let diagrams = fakesheet.chordDiagrams();
	if (diagrams.length) {
		let horizontalRuleElement = document.createElement('hr');
		diagramBlock.appendChild(horizontalRuleElement);
		for (let diagram of diagrams) {
			diagramBlock.appendChild(diagram);
		}
	}
}

function keySelectElement(fakesheet: FakeSheet) {
	/** Define the musical Key of the song as a drop-down selection */
	let selectElement = document.createElement('select');
	selectElement.name = 'keys';
	selectElement.id = CSS_ID.keyTag;
	if (fakesheet.key) {
		let labelElement = document.createElement('label');
		labelElement.htmlFor = CSS_ID.keyTag;
		metadataBlock.appendChild(labelElement); /** ### should be a sub-div? */
		
		let minorCharacter = (fakesheet.key.minor) ? 'm' : '';
		let currentKey = (fakesheet.newKey) ? fakesheet.newKey.base : fakesheet.key.base;
		for (let tonicSet of FAKESHEET.tonics) {
			let tonics = tonicSet.split(FAKESHEET.tonicSeparator);
			for (let tonic of tonics) {
				let value = tonic + minorCharacter;
				let text = (value == fakesheet.key.base) ? `${value} ◆` : value;
				let defaultKey = (value == fakesheet.key.base);
				let selectedKey = (value == currentKey);
				let option = new Option(text, value, defaultKey, selectedKey);
				selectElement.add(option);
			}
		}

		selectElement.addEventListener('change', (e: Event) => {
			/** 
			 * e.target is the element listened to (selectElement)
			 * e.target.value holds the new value of the element after it's changed (e.g., "Bm")
			 */
			let element = e.target as HTMLSelectElement; /** "as" type casting required for TypeScript */
			changeKey(fakesheet, element.value);
		});
	}
	return selectElement;
}

function changeKey(fakesheet: FakeSheet, newKey: string) {
	console.log(`Change key to: ${newKey}`);
	fakesheet.changeKey(newKey);
	/** Refill the page content blocks */
	fillErrorBlock(fakesheet);
	fillMetadataBlock(fakesheet);
	fillSheetBlock(fakesheet);
	fillDiagramBlock(fakesheet);
}

function sortSongKeys(songs: FakeSheetIndex, songKeys: string[]) {
	songKeys.sort((a, b) => {
		let artistA = sortableTitle(songs[a].artist);
		let artistB = sortableTitle(songs[b].artist);
		let titleA = sortableTitle(songs[a].title);
		let titleB = sortableTitle(songs[b].title);
		let sortValue = 0;
		if (sortOrder != SortOrder.Artist || artistA == artistB) {
			sortValue = (titleA > titleB) ? 1 : -1;
		}
		else sortValue = (artistA > artistB) ? 1 : -1;
		return sortValue;
	});
}

function sortableTitle(rawTitle: string) {
	/**
	 * Given a string containing a title (such as a song title or a band
	 * name), return a string that may be used in sorting, where all
	 * characters are converted to lower case, and leading articles ('a',
	 * 'an', and 'the') are moved to the title's end.
	 */ 
	let adjustedTitle = rawTitle.toLowerCase();
	let words = adjustedTitle.split(/\s+/);
	if (!words[0]) words.shift(); /** remove leading whitespace */
	/** remove leading article */
	if (['a', 'an', 'the'].includes(words[0])) {
		let newLastWord = words.shift();
		if (newLastWord) words.push(newLastWord);
	} 
	adjustedTitle = words.join(' ');
	return adjustedTitle;
}
