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
let Keywords = '';
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
		if (!Keywords || hasKeyword(record)) {
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
	if (Keywords) division.innerHTML = `<p>Keywords: ${Keywords}</p>`;
	division.append(table.element);
}

function showRecordDetails(index: number) {
	const record = Records[index];
	const dialog = document.createElement('dialog');

	const texts: string[] = [];
	texts.push(`### ${record.title}\n`);
	if (record.begins) texts.push(record.begins);
	if (record.ends) texts.push(record.ends);
	let first = true;
	for (const note of record.notes) {
		if (!first) texts.push('___');
		for (const line of note.lines) texts.push(line);
		first = false;
	}
	// if Keywords, call function to return texts with ==keywords==)
	const markedUpText = Markup(texts);
	// add 'close' button
	// style dialog element so that it is less wide than PAGE content

	dialog.innerHTML = markedUpText;
	PAGE.content.append(dialog);
	dialog.showModal();
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
	if (Keywords) {
		const keywords = Keywords.trim().split(/\s+/);
		let texts: string[] = [];
		texts.push(record.title);
		texts.push(record.begins);
		texts.push(record.ends);
		for (const note of record.notes) texts = texts.concat(note.lines);
		keywordLoop: for (let keyword of keywords) {
			keyword = keyword.toLowerCase();
			for (const text of texts) {
				if (text.toLowerCase().includes(keyword)) {
					hasKeyword = true;
					break keywordLoop;
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

function createQueryModalDialog() {
	const dialog = new W.Dialog('Query Options')
	const keywords = dialog.addText('Keywords:', '');
	const sortValues = ['Title', 'Last Played'];
	const sortDropDown = dialog.addSelect('Sort By:', sortValues);
	const reverseSort = dialog.addCheckbox('Reverse Sort:', false);

	dialog.confirmButton.addEventListener('click', () => {
		Keywords = keywords.value;
		SortBy = sortDropDown.value;
		ReverseSort = reverseSort.checked;
		sortTalks();
		listTalks(ListElement);  
	});

	return dialog;
}
