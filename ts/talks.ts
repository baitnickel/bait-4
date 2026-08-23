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
console.log('v26.08.21.13.43');
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
const OutputElement = document.createElement('div');
OutputElement.className = 'talks-output-element';

export function render() {
	PAGE.setTitle('Talks Dataset');
	PAGE.content.append(QueryElement);
	PAGE.content.append(OutputElement);
	const dialog = createModalDialog();
	addQueryButton(dialog);
	sortTalks();
	listTalks(OutputElement);  
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
	const table = new W.Table(['', 'Title', /*'Collection', 'Category',*/ 'Plays', 'Last Play']);
	for (const record of Records) {
		let i = 0
		if (!Keywords || hasKeyword(record)) {
			const lastPlayedDate = new Date(record.lastPlayed);
			const collection = record.categories[0];
			const category = record.categories[1];
			table.addRow();
			// table.addCell('\u2d48') // ('\u229b');
			table.addCell(`<input type='button' value=' ' class='talk-detail' id='${i}' />`, '', true);
			table.addCell(shortTitle(record.title));
			// table.addCell(collection);
			// table.addCell(category);
			table.addCell(record.playCount.toString());
			table.addCell(T.DateString(lastPlayedDate, 3).slice(0, 10));
		}
		i += 1;
	}
	table.fillTable(table.element);
	if (Keywords) division.innerHTML = `<p>Keywords: ${Keywords}</p>`;
	division.append(table.element);
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
		if (SortBy == 'Categorized Title') {
			/** sort blank categories last using '~' */
			const acollection = (a.categories[0]) ? a.categories[0] : '~';
			const bcollection = (b.categories[0]) ? b.categories[0] : '~';
			const acategory = (a.categories[1]) ? a.categories[1] : '~';
			const bcategory = (b.categories[1]) ? b.categories[1] : '~';
			result = acollection.localeCompare(bcollection);
			if (!result) result = acategory.localeCompare(bcategory);
			if (!result) result = a.title.localeCompare(b.title);
		}
		else if (SortBy == 'Last Played') result = a.lastPlayed - b.lastPlayed;
		else result = a.title.localeCompare(b.title); /** default: sort by title */
		if (ReverseSort) result *= -1;
		return result;
	});
}

function createModalDialog() {
	const dialog = new W.Dialog('Query Options')
	const keywords = dialog.addText('Keywords:', '');
	const sortValues = ['Title', 'Categorized Title', 'Last Played'];
	const sortDropDown = dialog.addSelect('Sort By:', sortValues);
	const reverseSort = dialog.addCheckbox('Reverse Sort:', false);

	dialog.confirmButton.addEventListener('click', () => {
		Keywords = keywords.value;
		SortBy = sortDropDown.value;
		ReverseSort = reverseSort.checked;
		sortTalks();
		listTalks(OutputElement);  
	});

	return dialog;
}
