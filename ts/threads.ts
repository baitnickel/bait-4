import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets-1.js';
import * as T from './lib/types.js';

const Confirm = 'bait:confirm';
const ConfirmEvent = new Event(Confirm);
const Cancel = 'bait:cancel';
const CancelEvent = new Event(Cancel);

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}

const QueryElement = document.createElement('div');
const OutputElement = document.createElement('div');

export function render() {
	PAGE.content.append(QueryElement);
	PAGE.content.append(OutputElement);
	const modal = createModalDialog();
	addQueryButton(modal);
}

function addQueryButton(modal: W.Dialog) {
	const queryButton = document.createElement('button');
	queryButton.innerText = 'Enter Query';
	QueryElement.append(queryButton);

	queryButton.addEventListener('click', (e) => {
		modal.open();
	});
}

function getPassages(queryString: string) {
	const query = parseQueryString(queryString);
	Fetch.api<T.ThreadPassage[]>(`${PAGE.backend}/threads`, query).then((passages) => {
		displayPassages(passages, OutputElement);
	});
}

function parseQueryString(queryString: string) {
	queryString = queryString.trim();
	let query: T.ThreadQuery;
	const components = queryString.split(/\s+/);
	const root = components.shift()!;
	let prefix = '';
	if (components.length && components[0].length > 1 && components[0].endsWith('-')) {
		prefix = components[0].slice(0, -1);
		components.shift();
	}
	const tags: string[] = [];
	for (const component of components) {
		tags.push(prefix + component);
	}
	query = { root: root, tags: tags };
	return query;
}

function displayPassages(passages: T.ThreadPassage[]|null, division: HTMLDivElement) {
	const lines: string[] = [];
	division.innerHTML = '';
	if (!passages || !passages.length) lines.push('No threads found');
	else {
		sortPassages(passages);
		let priorTag = '';
		for (const passage of passages) {
			if (passage.tag != priorTag) lines.push(`# ${passage.tag}`);
			const fileName = (passage.file === null) ? '(none)' : `${passage.file.name}(${passage.section})`;
			lines.push(`## File: ${fileName}:`);
			lines.push(passage.text);
			lines.push('___');
			priorTag = passage.tag;
		}
	}
	const text = lines.join('\n');
	const markup = Markup(lines);
	division.innerHTML = markup;
}

function sortPassages(passages: T.ThreadPassage[]) {
	passages.sort((a: T.ThreadPassage, b: T.ThreadPassage) => {
		let result = 0;
		result = a.tag.localeCompare(b.tag);
		if (!result && a.file !== null && b.file !== null) {

			result = a.file.path.localeCompare(b.file.path);
			// const aModified = a.file.modified as Date;
			// const bModified = b.file.modified as Date;
			// const aTime = aModified.getTime();
			// const bTime = bModified.getTime();
			// result = aTime - bTime;

			// console.log('a:', a.file.modified.getTime());
			// console.log('b:', b.file.modified.getTime());
			// if (a.file.modified !== undefined && b.file.modified !== undefined) {
			// 	const aTime = a.file.modified.getTime();
			// 	const bTime = b.file.modified.getTime();
			// 	result = aTime - bTime;
			// }
		}
		if (!result) result = a.section - b.section;
		return result;
	});
}

function createModalDialog(rootPath = '', tags = '', tagPrefix = '') {
	const rootValues = ['.', 'Content','Content/chapters','Content/drafts','Content/technical','Content/test-docs', 'notebook'];
	const rootDropDown = new W.Select('Root Path: ');
	rootDropDown.addOptions(rootValues, '--select--');
	const tagPrefixText = new W.Text('Optional Tag Prefix: ', tagPrefix);
	const tagsText = new W.Text('Space-Separated Tags: ', tags);
	const cancelButton = new W.Button('Cancel', CancelEvent);
	const confirmButton = new W.Button('Confirm', ConfirmEvent);

	const modal = new W.Dialog('Query Options')
	modal.element.className = 'threads-dialog';
	modal.addWidget(rootDropDown);
	modal.addWidget(tagPrefixText);
	modal.addWidget(tagsText);
	modal.addWidgets([cancelButton, confirmButton]);
	modal.finish(document.body);

	document.addEventListener(Cancel, () => {
		modal.close();
	});
	document.addEventListener(Confirm, () => {
		modal.close();
		let queryString = rootDropDown.value;
		if (tagPrefixText.value) queryString += ` ${tagPrefixText.value}-`;
		queryString += ` ${tagsText.value}`;
		getPassages(queryString); 
	});

	return modal;
}
