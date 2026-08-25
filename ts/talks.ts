import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}
console.log('v26.08.24');
const AudioDataset = await Fetch.api<T.AudioDataset>(`${PAGE.backend}/media/talks`);
if (AudioDataset === null) {
	window.alert(`AudioDatset is empty!`);
	window.history.back();
}
const Records = AudioDataset!.data;
let Keywords: string[] = [];
let SortBy = 'Last Played';
let ReverseSort = false;

const QueryElement = document.createElement('div');
QueryElement.className = 'talks-query-element';
const ListElement = document.createElement('div');
ListElement.className = 'talks-list-element';
const DetailsElement = document.createElement('div');
DetailsElement.className = 'talks-details-element';

export function render() {
	PAGE.setTitle('Talks Dataset');
	PAGE.content.append(QueryElement);
	PAGE.content.append(ListElement);
	const dialog = createQueryModalDialog();
	addQueryButton(dialog);
	sortTalks();
	listTalks(ListElement);  
}

function addQueryButton(dialog: W.Dialog) {
	const queryButton = document.createElement('button');
	queryButton.classList.add('query-button');
	queryButton.innerText = 'Enter Query';
	QueryElement.append(queryButton);
	queryButton.addEventListener('click', (e) => {
		dialog.element.showModal();
	});
}

function listTalks(division: HTMLDivElement) {
	division.innerHTML = '';
	sortTalks();
	const table = new W.Table(['Detail', 'Title', 'Plays', 'Last Play']);
	let i = 0;
	for (const record of Records) {
		if (!Keywords.length || hasKeyword(record)) {
			const lastPlayedDate = new Date(record.lastPlayed);
			table.addRow();
			const buttonCell = table.addCell(`<input type='button' value='•••' class='talk-detail' id='${i}' />`, '', true);
			buttonCell.addEventListener('click', (e: Event) => {
				const target = e.target as HTMLTableCellElement;
				showRecordDetails(Number(target.id));
			})
			table.addCell(shortTitle(record.title));
			table.addCell(record.playCount.toString());
			table.addCell(T.DateString(lastPlayedDate, 3).slice(0, 10));
		}
		i += 1;
	}
	table.fillTable(table.element);
	if (Keywords.length) division.innerHTML = `<p>Keywords: ${Keywords.join(', ')}</p>`;
	division.append(table.element);
}

function showRecordDetails(index: number) {
	const record = Records[index];
	const dialog = document.createElement('dialog');
	dialog.className = 'talk-dialog';

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
	const highlightedTextLines = highlightKeywords(Keywords, textLines);
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

function highlightKeywords(keywords: string[], textLines: string[]) {
	const highlightedTextLines = textLines;
	// const keywordsList = keywords.trim().split(/\s+/);	
	return highlightedTextLines;
}

function shortTitle(title: string) {
	let shortTitle = title.trim();
	const ellipsis = '...';
	if (title.length > 32) {
		const matches = title.match(/(.*)\s+(p\d+)$/i);
		if (matches) shortTitle = matches[1].slice(0, 32) + ellipsis + matches[2];
		else shortTitle = title.slice(0, 32).trim() + ellipsis;
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

function createQueryModalDialog() {
	const dialog = new W.Dialog('Query Options')
	const keywordString = dialog.addText('Keywords:', '');
	const sortValues = ['Title', 'Last Played'];
	const sortDropDown = dialog.addSelect('Sort By:', sortValues);
	const reverseSort = dialog.addCheckbox('Reverse Sort:', false);

	dialog.confirmButton.addEventListener('click', () => {
		Keywords = uniqueWords(keywordString.value);
		SortBy = sortDropDown.value;
		ReverseSort = reverseSort.checked;
		sortTalks();
		listTalks(ListElement);  
	});

	return dialog;
}
