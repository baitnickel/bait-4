import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
// import * as Media from './lib/play-media.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}
console.log('v26.08.27');
const AudioDataset = await Fetch.api<T.AudioDataset>(`${PAGE.backend}/media/talks`);
if (AudioDataset === null) {
	window.alert(`AudioDatset is empty!`);
	window.history.back();
}
const Records = AudioDataset!.data;
let Keywords: string[] = [];
const SortByOptions = ['Title', 'Last Played'];
let SortBy = SortByOptions[0];
let ReverseSort = false;

// const QueryElement = document.createElement('div');
// QueryElement.className = 'talks-query-element';
const ListElement = document.createElement('div');
ListElement.className = 'talks-list-element';
const DetailsElement = document.createElement('div');
DetailsElement.className = 'talks-details-element';

//********************************************************************************** */
const SelectionElement = document.createElement('div');
SelectionElement.className = 'talk-selection-div';
const sortByLabel = document.createTextNode('\u00a0\u00a0Sort By: ');
// sortByLabel.classList.add('talk-button-indent');
const radioButtons = new W.RadioGroup('', SortByOptions, 'widget-radio-inline');
for (const inputElement of radioButtons.inputElements) {
	inputElement.addEventListener('click', () => {
		SortBy = radioButtons.value;
		sortTalks();
		listTalks(ListElement);
	});
}
const radioSpan = radioButtons.span;
// radioSpan.classList.add('talk-button-indent');
const textEntry = new W.Text('Keywords: ', '');
textEntry.element.addEventListener('change', () => {
	Keywords = uniqueWords(textEntry.element.value);
	sortTalks();
	listTalks(ListElement);
});
const reverseSort = new W.Checkbox('Reverse Sort: ', false);
reverseSort.label.classList.add('talk-button-indent');
reverseSort.element.addEventListener('change', () => {
	ReverseSort = reverseSort.element.checked;
	sortTalks();
	listTalks(ListElement);
});

SelectionElement.append(textEntry.label);
SelectionElement.append(textEntry.element);
SelectionElement.append(sortByLabel);
SelectionElement.append(radioSpan);
SelectionElement.append(reverseSort.label);
SelectionElement.append(reverseSort.element);
//********************************************************************************** */

export function render() {
	PAGE.setTitle('Talks Dataset');
	// PAGE.content.append(QueryElement);
	PAGE.content.append(SelectionElement);
	PAGE.content.append(ListElement);
	// const dialog = createQueryModalDialog();
	// addQueryButton(dialog);
	sortTalks();
	listTalks(ListElement);  
}

// function addQueryButton(dialog: W.Dialog) {
// 	const queryButton = document.createElement('button');
// 	queryButton.classList.add('query-button');
// 	queryButton.innerText = 'Enter Query';
// 	QueryElement.append(queryButton);
// 	queryButton.addEventListener('click', (e) => {
// 		dialog.element.showModal();
// 	});
// }

function listTalks(division: HTMLDivElement) {
	division.innerHTML = '';
	sortTalks();
	const table = new W.Table(['Detail', 'Title', 'Time', 'Plays', 'Last Play']);
	let i = 0;
	for (const record of Records) {
		if (!Keywords.length || hasKeyword(record)) {
			const lastPlayedDate = new Date(record.lastPlayed);
			table.addRow();
			const buttonHTML = `<input type='button' value='•••' class='talk-detail' id='${i}' />`;
			const buttonCell = table.addCell(buttonHTML, '', true);
			table.addCell(shortTitle(record.title));
			table.addCell(formatTime(record.duration));
			table.addCell(record.playCount.toString());
			table.addCell(T.DateString(lastPlayedDate, 3).slice(0, 10));

			buttonCell.addEventListener('click', (e: Event) => {
				const target = e.target as HTMLTableCellElement;
				showRecordDetails(Number(target.id));
			})
		}
		i += 1;
	}
	table.fillTable(table.element);
	// if (Keywords.length) division.innerHTML = `<p>Keywords: ${Keywords.join(', ')}</p>`;
	division.append(table.element);
}

function showRecordDetails(index: number) {
	const record = Records[index];
	const dialog = document.createElement('dialog');
	dialog.className = 'talk-dialog';

	// /*************************************************************** */
	// const audioControl = document.createElement('audio');
	// audioControl.controls = true;
	// dialog.append(audioControl);
	// /*************************************************************** */

	const textLines: string[] = [];
	textLines.push(`### ${record.title}\n`);
	if (record.begins) textLines.push(record.begins);
	if (record.ends) textLines.push(record.ends);
	let first = true;
	for (const note of record.notes) {
		if (!first) textLines.push('___');
		textLines.push(`###### ${note.heading}\n`);
		for (const line of note.lines) textLines.push(line);
		first = false;
	}
	const highlightedTextLines = highlightKeywords(textLines, Keywords);
	const markedUpText = Markup(highlightedTextLines);
	
	// add 'close' button
	const button = document.createElement('button');
	button.innerHTML = '&times;';
	button.className = 'talk-dialog-exit';
	button.addEventListener('click', () => { dialog.close() });
	
	dialog.innerHTML = markedUpText;
	dialog.append(button);


	PAGE.content.append(dialog);
	dialog.showModal();
}

/**
 * Given an array of `textLines` and an array of lowercase `keywords`, add
 * markdown highlight characters (e.g., "==word==") to words in the `textLines`
 * that appear in the list of `keywords`.
 */
function highlightKeywords(textLines: string[], keywords: string[]) {
	if (!Keywords.length) return textLines;
	const highlightedTextLines: string[] = [];
	for (const textLine of textLines) {
		const segments = wordSegments(textLine);
		for (let i = 0; i < segments.length; i += 1) {
			if (keywords.includes(segments[i].toLowerCase())) segments[i] = `==${segments[i]}==`;
		}
		highlightedTextLines.push(segments.join(''));
	}
	return highlightedTextLines;
}

/**
 * Given a `title` text string and a desired `maximumLength`, return a shortened
 * version of the title with an ellipsis indicating characters removed.
 * Characters are typically removed from the end of the title string, but when
 * the title ends with a part number (e.g., "p1"), it is preserved and
 * characters preceding the part number are removed instead.
 */
function shortTitle(title: string, maximumLength = 35) {
	let shortTitle = title.trim();
	const ellipsis = '...';
	const maximum = maximumLength - ellipsis.length;
	if (title.length > maximum) {
		const matches = title.match(/(.*)\s+(p\d+)$/i);
		if (matches) shortTitle = matches[1].slice(0, maximum) + ellipsis + matches[2];
		else shortTitle = title.slice(0, maximum).trim() + ellipsis;
	}
	return shortTitle;
}

function hasKeyword(record: T.AudioData) {
	let hasKeyword = false;
	if (Keywords.length) {
		let textLines: string[] = [];
		textLines.push(record.title);
		textLines.push(record.begins);
		textLines.push(record.ends);
		for (const note of record.notes) textLines = textLines.concat(note.lines);
		keywordLoop: for (let keyword of Keywords) {
			for (const textLine of textLines) {
				const uniqueTextWords = uniqueWords(textLine);
				for (const uniqueTextWord of uniqueTextWords) {
					if (uniqueTextWord == keyword) {
						hasKeyword = true;
						break keywordLoop;
					}
				}
			}
		}
	}
	return hasKeyword;
}

function sortTalks() {
	Records.sort((a,b) => {
		let result = 0;
		if (SortBy == 'Last Played') result = a.lastPlayed - b.lastPlayed;
		else result = a.title.localeCompare(b.title); /** default: sort by title */
		if (ReverseSort) result *= -1;
		return result;
	});
}

/**
 * Given a text string containing words separated by boundaries (whitespace,
 * punctuation, etc.), return an array of unique words converted to lowercase.
 */
function uniqueWords(wordString: string) {
	const uniqueWords: string[] = [];
	wordString = wordString.toLowerCase();
	const matches = wordString.match(/\b(\w*)\b/g);
	if (matches) {
		for (let match of matches) {
			if (match && !uniqueWords.includes(match)) uniqueWords.push(match);
		}
	}
	return uniqueWords;
}

/**
 * Given a text string, return an array of text segments, where the text is
 * divided into words and non-words. `segments.join('')` will return the
 * original text string.
 * 
 * The default `regexp` pattern breaks the text into segments by word
 * boundaries, supporting contractions (e.g. "don't"). Other possible patterns
 * include basic word boundaries:
 * - /\b(\w+)\b/g
 * 
 * and words including contractions that only start with alpha characters:
 * - /\b([A-Z]\w*)['’]?(\w+)?\b/gi
 */
function wordSegments(text: string, regexp = /\b(\w+)['’]?(\w+)?\b/g) {
	const segments: string[] = [];
	let match;
	let nextIndex = 0;
	while ((match = regexp.exec(text)) !== null) {
		const wordIndex = match.index;
		const nextWordIndex = regexp.lastIndex;
		if (nextIndex < wordIndex) segments.push(text.slice(nextIndex, wordIndex));
		segments.push(text.slice(wordIndex, nextWordIndex));
		nextIndex = nextWordIndex;
	}
	if (nextIndex < text.length) segments.push(text.slice(nextIndex));
	return segments;
}

/**
 * Given a number of seconds, return a formatted time string ('HH:MM:SS').
 * Return an empty string if seconds is a negative number.
 */
function formatTime(seconds: number) {
	let formattedTime = '';
	seconds = Math.round(seconds);
	if (seconds > 0) {
		const hours = Math.floor(seconds/3600)
		seconds -= (hours * 3600);
		const minutes = Math.floor(seconds/60);
		seconds -= (minutes * 60)
		formattedTime = (hours) ? `${hours}:` + `${minutes}`.padStart(2, '0') : `${minutes}`;
		formattedTime += `:${seconds}`.padStart(2, '0');
	}
	return formattedTime;
}

// function createQueryModalDialog() {
// 	const dialog = new W.Dialog('Query Options')
// 	const keywordString = dialog.addText('Keywords:', '');
// 	const sortValues = ['Title', 'Last Played'];
// 	const sortDropDown = dialog.addSelect('Sort By:', sortValues);
// 	const reverseSort = dialog.addCheckbox('Reverse Sort:', false);

// 	dialog.confirmButton.addEventListener('click', () => {
// 		Keywords = uniqueWords(keywordString.value);
// 		SortBy = sortDropDown.value;
// 		ReverseSort = reverseSort.checked;
// 		sortTalks();
// 		listTalks(ListElement);  
// 	});

// 	return dialog;
// }
