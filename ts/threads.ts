import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
import * as T from './lib/types.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}

const QueryElement = document.createElement('div');
QueryElement.className = 'threads-query-element';
const OutputElement = document.createElement('div');
OutputElement.className = 'threads-output-element';
let ReverseSort: boolean;

export function render() {
	PAGE.content.append(QueryElement);
	PAGE.content.append(OutputElement);
	const dialog = createModalDialog();
	addQueryButton(dialog);
}

function addQueryButton(dialog: W.Dialog) {
	const queryButton = document.createElement('button');
	queryButton.innerText = 'Enter Query';
	QueryElement.append(queryButton);
	queryButton.addEventListener('click', (e) => {
		dialog.element.showModal();
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
			if (passage.tag != priorTag) lines.push(`#$ ${passage.tag}`);
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
			// result = a.file.path.localeCompare(b.file.path);

			/** Date types aren't recognized?? Using workaround... */
			// const aModified = a.file.modified as Date;
			// const bModified = b.file.modified as Date;
			// const aTime = aModified.getTime();
			// const bTime = bModified.getTime();
			// result = (ReverseSort) ? bTime - aTime : aTime - bTime;
			const aModified = a.file.modified.toString();
			const bModified = b.file.modified.toString();
			if (ReverseSort) result = bModified.localeCompare(aModified);
			else result = aModified.localeCompare(bModified);
		}
		if (!result) result = a.section - b.section;
		return result;
	});
}

function createModalDialog(rootPath = '', tags = '', tagPrefix = '') {
	const dialog = new W.Dialog('Query Options')
	const rootValues = ['.', 'Content','Content/chapters','Content/drafts','Content/technical','Content/test-docs', 'notebook'];
	const rootDropDown = dialog.addSelect('Root Path:', rootValues);
	const tagPrefixText = dialog.addText('Optional Tag Prefix:', '');
	const tagsText = dialog.addText('Space-Separated Tags(+):', '');
	const reverseSort = dialog.addCheckbox('Show Most Recent First:', true);

	dialog.confirmButton.addEventListener('click', () => {
		let queryString = rootDropDown.value;
		if (tagPrefixText.value) queryString += ` ${tagPrefixText.value}-`;
		queryString += ` ${tagsText.value}`;
		ReverseSort = reverseSort.checked;
		getPassages(queryString); 
	});

	return dialog;
}
