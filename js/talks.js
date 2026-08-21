import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
console.log('v26.08.21.13.43');
const AudioDataset = await Fetch.api(`${PAGE.backend}/media/talks`);
if (AudioDataset === null) {
    window.alert(`AudioDatset is empty!`);
    window.history.back();
}
const Records = AudioDataset.data;
let SortBy = 'Title';
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
}
function addQueryButton(dialog) {
    const queryButton = document.createElement('button');
    queryButton.innerText = 'Enter Query';
    QueryElement.append(queryButton);
    queryButton.addEventListener('click', (e) => {
        dialog.element.showModal();
    });
}
function listTalks(division) {
    division.innerHTML = '';
    const outputLines = [];
    sortTalks();
    const table = new W.Table(['Title', 'Collection', 'Category', 'Plays', 'Last Play']);
    for (const record of Records) {
        const lastPlayedDate = new Date(record.lastPlayed);
        const collection = record.categories[0];
        const category = record.categories[1];
        table.addRow();
        table.addCell(record.title);
        table.addCell(collection);
        table.addCell(category);
        table.addCell(record.playCount.toString());
        table.addCell(T.DateString(lastPlayedDate, 3).slice(0, 10));
    }
    table.fillTable(table.element);
    division.append(table.element);
}
function sortTalks() {
    Records.sort((a, b) => {
        let result = 0;
        if (SortBy == 'Categorized Title') {
            result = a.categories[0].localeCompare(b.categories[0]);
            if (!result)
                result = a.categories[1].localeCompare(b.categories[1]);
            if (!result)
                result = a.title.localeCompare(b.title);
        }
        else if (SortBy == 'Last Played')
            result = a.lastPlayed - b.lastPlayed;
        else
            result = a.title.localeCompare(b.title); /** default: sort by title */
        if (ReverseSort)
            result *= -1;
        return result;
    });
    // if (SortBy == 'Title') Records.sort((a,b) => {
    // 	let result = a.title.localeCompare(b.title);
    // 	if (ReverseSort) result *= -1;
    // });
    // else if (SortBy == 'Last Played') Records.sort((a,b) => {
    // 	if (ReverseSort) return b.lastPlayed - a.lastPlayed;
    // 	else return a.lastPlayed - b.lastPlayed;
    // });
}
function createModalDialog() {
    const dialog = new W.Dialog('Query Options');
    const sortValues = ['Title', 'Categorized Title', 'Last Played'];
    const sortDropDown = dialog.addSelect('Sort By:', sortValues);
    const reverseSort = dialog.addCheckbox('Reverse Sort:', false);
    dialog.confirmButton.addEventListener('click', () => {
        SortBy = sortDropDown.value;
        ReverseSort = reverseSort.checked;
        sortTalks();
        listTalks(OutputElement);
    });
    return dialog;
}
