import { Page } from './lib/page.js';
import { Markup, MarkupLine } from './lib/markup.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
import * as Media from './lib/media.js';

/**
 * When the modal DetailElement is displayed, certain fields should become
 * clickable (this should be indicated by some subtle style). These are the
 * "static" fields. On click, open a new window or just make the field editable.
 * On changes, call an API to update the JSON value and upon update confirmation
 * update the in-memory value.
 */

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}
console.log('v26.09.06');
const TalkRecords = await Fetch.api<T.TalkRecord[]>(`${PAGE.backend}/media/talks`);
if (!TalkRecords) {
	window.alert(`TalkRecords array is empty!`);
	window.history.back();
}

const TEST = (PAGE.parameters.has('test'));
const MediaFolder = '../media/audio/watts';
const Records = TalkRecords!;

// for Records with zero duration, call API to run in background

let Keywords = new Set<string>();
let LogicalAnd = false;
const WordSegments = /\b(\w+)['’]?(\w+)?\b/g; /** words, including contractions */
const Possessive = /\w+['’']s$/i; /** a word that ends with apostrophe-S */

const Columns = ['Title', 'Type', 'Time', 'Plays', 'Last Play'];
let SortColumn = '';
let ReverseSort = false;

const SelectionElement = selectionElement();
SelectionElement.id = 'header-options';
const ListElement = document.createElement('div');
ListElement.className = 'talks-list-element';
const DetailsElement = document.createElement('div');
DetailsElement.className = 'talks-details-element';

export function render() {
	PAGE.setTitle('Talks Dataset');
	PAGE.header.append(SelectionElement);
	PAGE.content.append(ListElement);
	console.log(`Testing? ${TEST}`);
	sortTalks();
	listTalks(ListElement, Keywords, LogicalAnd);  
}

function listTalks(division: HTMLDivElement, keywords: Set<string>, logicalAnd: boolean) {
	division.innerHTML = '';
	const table = new W.Table(Columns);
	let i = 0;
	for (const record of Records) {
		if (!keywords.size || hasKeywords(record, keywords, logicalAnd)) { /** filter - record must have keywords */
			const title = shortTitle(record.title);
			const lastPlayedDate = new Date(record.lastPlayed);

			table.addRow();
			const titleCell = table.addCell(title);
			titleCell.id = `${i}`;
			titleCell.classList.add('talk-title');
			table.addCell(record.type);
			const timeCell = table.addCell(Media.formatTime(record.duration, false));
			timeCell.classList.add('talk-time');
			const playCountCell = table.addCell(record.playCount.toString());
			playCountCell.classList.add('talk-play-count');
			const lastPlayed = (record.lastPlayed) ? T.DateString(lastPlayedDate, 14) : '';
			table.addCell(lastPlayed);

			titleCell.addEventListener('click', (e: Event) => {
				const target = e.target as HTMLTableCellElement;
				if (TEST) showRecordDetails2(Number(target.id));
				else showRecordDetails3(Number(target.id));
			});
		}
		i += 1;
	}
	table.fillTable(table.element);
	division.append(table.element);

	for (let headingCell of table.headingCells) {
		headingCell.classList.add('talk-column');
		headingCell.addEventListener('click', (e: Event) => {
			const target = e.target as HTMLTableCellElement;
			const column = columnName(target.id, Columns);
			sortTalks(column);
			listTalks(ListElement, Keywords, LogicalAnd);
		});
	}
}

/**
 * Given the element `id` assigned to the column heading names by
 * Table.fillTable, and the array of column names used to construct the Table,
 * return the column name associated with `id`. Using the column names in such
 * functions as `sortTalks` makes the code more readable and easier to maintain.
 */
function columnName(id: string, columns: string[]) {
    const segments = id.split('-');
    const index = Number(segments[segments.length - 1]);
    return columns[index];
}

function showRecordDetails1(index: number) {
	const record = Records[index];
	const dialog = document.createElement('dialog');
	dialog.className = 'talk-dialog';
	// dialog.autofocus = false; /** does nothing */

	const dialogTop = document.createElement('div');
	dialogTop.className = 'talk-dialog-top';

	const audioSection = document.createElement('div');
	if (record.extension) {
		/** add Audio element */
		const audio = new Media.Audio();
		audio.element.src = `${MediaFolder}/${record.title}${record.extension}`;
		audio.element.load();
		audioSection.append(audio.element);
		audioSection.append(audio.panel);
	}
	else {
		const noAudioMessage = document.createElement('paragraph');
		noAudioMessage.innerText = '(No Audio File)';
		audioSection.append(noAudioMessage);
	}

	const titleSection = document.createElement('div');
	titleSection.className = 'talk-dialog-title-section';
	const highlightedTitle = highlightKeywords(record.title, Keywords).join('')
	const titleHeading = MarkupLine(highlightedTitle, 'MET');
	const titleCopyButton = document.createElement('span');
	titleCopyButton.className = 'talk-title-copy';
	titleCopyButton.innerHTML = '▽'; // ▽⬇︎⤵︎
	titleCopyButton.addEventListener('click', () => {
		navigator.clipboard.writeText(record.title); /** copy title to clipboard */
	});
	// there must be a simpler way to include a clickable "button" on a line??
	titleSection.innerHTML = `${titleHeading} `;
	titleSection.append(titleCopyButton);

	const summarySection = document.createElement('div');
	summarySection.className = 'talk-dialog-summary-section';
	const summaryLines: string[] = [];
	if (record.type) summaryLines.push(record.type.toUpperCase());
	if (record.performers) summaryLines.push(`\xA0 with: ${record.performers}`);
	const categories = (record.categories.length) ? record.categories.join(' > ') : '';
	if (categories) summaryLines.push(categories);
	if (record.begins) summaryLines.push(addEllipsis(record.begins));
	if (record.ends) summaryLines.push(addEllipsis(record.ends, false));
	summaryLines.push('___');
	const highlightedSummaryLines = highlightKeywords(summaryLines, Keywords);
	const markedUpSummary = Markup(highlightedSummaryLines);
	summarySection.innerHTML = markedUpSummary;
	
	dialogTop.append(audioSection, titleSection, summarySection);

	/** add 'close' button */
	const exitButton = document.createElement('span');
	exitButton.className = 'talk-dialog-exit';
	exitButton.innerHTML = '&times;';
	exitButton.addEventListener('click', () => {
		dialog.close();
		dialog.remove();
	});
	/** support Escape key close - see: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values */
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			dialog.close();
			dialog.remove();
		}
	});

	const notesSection = document.createElement('div');
	notesSection.className = 'talk-notes';
	const notesLines: string[] = [];
	/** sort the most recent notes to the top */
	record.notes.sort((a,b) => b.date - a.date);
	let first = true;
	for (const note of record.notes) {
		if (!first) notesLines.push('___');
		const heading = `${note.name} (${note.section + 1})`;
		notesLines.push(`###### ${heading}\n`);
		if (!note.lines.length) notesLines.push('(no text lines)');
		else for (const line of note.lines) notesLines.push(line);
		first = false;
	}
	const highlightedNotesLines = highlightKeywords(notesLines, Keywords);
	const markedUpNotes = Markup(highlightedNotesLines);
	notesSection.innerHTML = markedUpNotes;
	
	// dialog.append(audioSection);
	// dialog.append(titleSection);
	// dialog.append(summarySection);
	dialog.append(dialogTop);
	dialog.append(notesSection);
	dialog.append(exitButton);
	PAGE.content.append(dialog);
	dialog.showModal();
}

/**
 * Given an array of `textLines` and an array of lowercase `keywords`, add
 * markdown highlight characters (e.g., "==word==") to words in the `textLines`
 * that appear in the list of `keywords`.
 */
function highlightKeywords(textLines: string|string[], keywords: Set<string>) {
	if (!Array.isArray(textLines)) textLines = [textLines];
	if (!keywords.size) return textLines;
	const highlightedTextLines: string[] = [];
	for (const textLine of textLines) {
		const segments = wordSegments(textLine);
		for (let i = 0; i < segments.length; i += 1) {
			const segment = segments[i].toLowerCase();
			const nonPossessive = (Possessive.test(segment)) ? segment.slice(0, -2) : '';
			if (keywords.has(segment) || keywords.has(nonPossessive)) segments[i] = `==${segments[i]}==`;
		}
		highlightedTextLines.push(segments.join(''));
	}
	return highlightedTextLines;
}

/**
 * Given a TalkRecord, an array of `keywords`, and the `logicalAnd`
 * boolean, return true if any of the record texts contain any of the
 * `keywords`, else return false. When `logicalAnd` is true, the record texts
 * must contain all of the keywords to receive a true result.
 */
function hasKeywords(record: T.TalkRecord, keywords: Set<string>, logicalAnd = false) {
    let hasKeywords = (logicalAnd) ? true : false;

	/** consolidate all the text lines from the record */
	const textLines: string[] = [];
	textLines.push(record.title);
	textLines.push(record.type);
	textLines.push(record.categories.join(' ')); // should be included?
	textLines.push(record.performers);
	textLines.push(record.begins);
	textLines.push(record.ends);
	for (const note of record.notes) {
		for (const line of note.lines) {
			textLines.push(line);
		}
	}
	const noteText = textLines.join(' ');
	const noteWords = uniqueWords(noteText, true);

	for (const keyword of keywords) {
		if (logicalAnd && !noteWords.has(keyword)) return false;
		if (!logicalAnd && noteWords.has(keyword)) return true;
	}
	return hasKeywords;
}

/**
 * Given a text string containing words separated by boundaries (whitespace,
 * punctuation, etc.), return a Set of words converted to lowercase. When
 * `expand` is set to true, some words will be generated--for instance, words
 * ending with "'s" will cause the word without the "'s" to be generated.
 */
function uniqueWords(wordString: string, expand = false) {
	const uniqueWords = new Set<string>();
	wordString = wordString.toLowerCase();
	const matches = wordString.match(WordSegments);
	if (matches) {
		for (const word of matches) {
			if (word) {
				uniqueWords.add(word);
				if (expand) {
					const additionalWords = expansions(word);
					for (const additionalWord of additionalWords) uniqueWords.add(additionalWord);
				}
			}
		} 
	}
	return uniqueWords;
}

/**
 * Given a word, return expansions or variations of the word. For example, the
 * word "Jung's" might return ["Jung"]
 */
function expansions(word: string) {
	let expansions = [];
	if (Possessive.test(word)) expansions.push(word.slice(0, -2));
	return expansions;
}

/**
 * Given a `text` string, return a new text string with an ellipsis added to the
 * end (by default) or to the beginning (if `suffix` is set to false). If the
 * `text` already contains a string of periods and/or whitespace characters at
 * its end (or beginning), a "standard" three periods ellipsis will replace it,
 * set apart from the text with a single space.
 * 
 * This function may not have general applicability as it will always trim the
 * text.
 */
function addEllipsis(text: string, suffix = true) {
    let newText = text.trim();
    const ellipsis = '...';
	let patternString = '([\\.\\s]*)';
	patternString = (suffix) ? `${patternString}$` : `^${patternString}`;
	const pattern = new RegExp(patternString);
    if (newText.search(pattern) >= 0) newText = newText.replace(pattern, '');
    newText = (suffix) ? `${newText} ${ellipsis}` : `${ellipsis} ${newText}`;
	return newText.trim();
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
function wordSegments(text: string, regexp = WordSegments) {
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

function sortTalks(column = '') {
	if (column) {
		/**
		 * toggle sort direction on repeated clicks of the same column header,
		 * or else use the default sort
		 */
		if (column == SortColumn) ReverseSort = !ReverseSort;
		else ReverseSort = false;
	}
	Records.sort((a,b) => {
		let result = 0;
		if (column == 'Type') result = a.type.localeCompare(b.type);
		else if (column == 'Time') result = a.duration - b.duration;
		else if (column == 'Plays') result = a.playCount - b.playCount;
		else if (column == 'Last Play') result = b.lastPlayed - a.lastPlayed;
		else {
			/** default: sort by title */
			column = 'Title';
			result = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
		}
		if (ReverseSort) result *= -1;
		return result;
	});
	SortColumn = column;
}

function selectionElement() {
	const selectionElement = document.createElement('div');
	const textEntry = new W.Text('Keywords: ', '');
	textEntry.element.addEventListener('change', () => {
		// if (!Keywords) LogicalAnd = false; // when Keywords == '' also set LogicalAnd to false
		Keywords = uniqueWords(textEntry.element.value);
		listTalks(ListElement, Keywords, LogicalAnd);
	});
	// perhaps use toggling button:
	// logical or: ∨ (Having Any of) (with Any)
	// logical and: ∧ (Having All of) (with All)
	const logicalAnd = new W.Checkbox('All: ', false);
	logicalAnd.label.classList.add('talk-button-indent');
	logicalAnd.element.addEventListener('change', () => {
		LogicalAnd = logicalAnd.element.checked;
		listTalks(ListElement, Keywords, LogicalAnd);
	});

	selectionElement.append(textEntry.label);
	selectionElement.append(textEntry.element);
	selectionElement.append(logicalAnd.label);
	selectionElement.append(logicalAnd.element);
	return selectionElement;
}

// not yet supported
// async function refreshTimes(dataFilePath: string, records: T.TalkRecord[]) {
	/*
		Must loop over file names + extensions from `records`,
		and for each one create an array of strings consisting of
		name+extenstion and duration seconds,
		separated by a delimiter (such as '\t').
		Use the PlayAudio.LoadAudioData function as demonstated in the home module,
		function testTalkTime.
		Then call an API passing the array of strings.
		The API will (over)write a text file representing the array.
		The text file can be read by the module that builds the AudioDataset.
		Ideally, we should only *update* the text file for *new* files ...
		... if file was JSON, we could include an element for "last update".
	*/
// }



/** new function, using popover instead of dialog */

function showRecordDetails2(index: number) {
	const record = Records[index];
	const details = document.createElement('div');
	details.id = 'talk-details';
	details.popover = 'manual';

	const overviewSection = document.createElement('div');
	overviewSection.id = 'talk-details-top';

	const audioSection = document.createElement('div');
	if (record.extension) {
		/** add Audio element */
		const audio = new Media.Audio(30);
		audio.element.src = `${MediaFolder}/${record.title}${record.extension}`;
		audio.element.load();
		audioSection.append(audio.element);
		audioSection.append(audio.panel);
	}
	else {
		const noAudioMessage = document.createElement('paragraph');
		noAudioMessage.innerText = '(No Audio File)';
		audioSection.append(noAudioMessage);
	}

	const titleSection = document.createElement('div');
	titleSection.id = 'talk-details-title-section';
	const highlightedTitle = highlightKeywords(record.title, Keywords).join('')
	const titleHeading = MarkupLine(highlightedTitle, 'MET');
	const title = document.createElement('span');
	title.innerHTML = titleHeading;
	const titleCopyButton = document.createElement('span');
	titleCopyButton.id = 'talk-title-copy';
	titleCopyButton.innerHTML = '⬇︎'; // ▽⬇︎⤵︎🔑🪄📥🔖📌⌘C
	titleCopyButton.addEventListener('click', () => {
		navigator.clipboard.writeText(record.title); /** copy title to clipboard */
	});
	titleSection.append(titleCopyButton, ' ', title);

	const summarySection = document.createElement('div');
	summarySection.id = 'talk-details-summary-section';
	const summaryLines: string[] = [];
	if (record.type) summaryLines.push(record.type.toUpperCase());
	if (record.performers) summaryLines.push(`\xA0 with: ${record.performers}`);
	const categories = (record.categories.length) ? record.categories.join(' > ') : '';
	if (categories) summaryLines.push(categories);
	if (record.begins) summaryLines.push(addEllipsis(record.begins));
	if (record.ends) summaryLines.push(addEllipsis(record.ends, false));
	summaryLines.push('___');
	const highlightedSummaryLines = highlightKeywords(summaryLines, Keywords);
	const markedUpSummary = Markup(highlightedSummaryLines);
	summarySection.innerHTML = markedUpSummary;
	
	overviewSection.append(audioSection, titleSection, summarySection);

	/** add 'close' button */
	const exitButton = document.createElement('span');
	exitButton.id = 'talk-details-exit';
	exitButton.innerHTML = '&times;';
	exitButton.addEventListener('click', () => {
		details.hidePopover();
		details.remove();
	});
	/** https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values */
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			details.hidePopover();
			details.remove();
		}
	});

	const notesSection = document.createElement('div');
	notesSection.id = 'talk-notes';
	const notesLines: string[] = [];
	/** sort the most recent notes to the top */
	record.notes.sort((a,b) => b.date - a.date);
	let first = true;
	for (const note of record.notes) {
		if (!first) notesLines.push('___');
		const heading = `${note.name} (${note.section + 1})`;
		notesLines.push(`###### ${heading}\n`);
		if (!note.lines.length) notesLines.push('(no text lines)');
		else for (const line of note.lines) notesLines.push(line);
		first = false;
	}
	const highlightedNotesLines = highlightKeywords(notesLines, Keywords);
	const markedUpNotes = Markup(highlightedNotesLines);
	notesSection.innerHTML = markedUpNotes;
	
	details.append(overviewSection, exitButton, notesSection);
	PAGE.content.append(details);
	details.showPopover();
}

function showRecordDetails3(index: number) {
	const record = Records[index];
	const details = document.createElement('div');
	// details.id = 'talk-details';
	// details.popover = 'manual';
	// details.style.backgroundColor = 'rgb(230, 240, 255)';
	detailsGrid(details, record);
	PAGE.content.append(details);
	details.showPopover();
}

/**
 * Given a `container` element (e.g., HTMLDivElement), load the `summary` and
 * `details` items into the container.
 * 
 * - Are there any requirements/assumptions for the container?
 * - 
 */
function detailsGrid(container: HTMLElement, record: T.TalkRecord) {
	container.style.width = '50%';
	container.style.height = '75%';
	container.style.padding = '1rem';
	container.style.backgroundColor = 'rgb(230, 240, 255)';
	container.style.display = 'grid';
	container.popover = 'manual';
	const overview = overviewSection(record, container);
	const notes = notesSection(record);
	container.append(overview, notes);
}

function overviewSection(record: T.TalkRecord, container: HTMLElement) {
	const overview = document.createElement('div');
	// overview.id = 'talk-details-top';
	const button = exitButton(record, container);
	const audio = audioSection(record);
	const title = titleSection(record);
	const summary = summarySection(record);
	overview.append(button, audio, title, summary);
	return overview;
}

function exitButton(record: T.TalkRecord, container: HTMLElement) {
	const button =  document.createElement('span');
	// button.id = 'talk-details-exit';
	button.style.position = 'absolute';
	button.style.top = '3%';
	button.style.right = '3%';
	button.style.zIndex = '2'; /* force buttons to show up on top of images */
	button.style.background = 'none';
	button.style.border = 'none';
	button.style.fontSize = '1.5rem';  /* 4rem; */
	button.style.color = 'black';
	button.style.cursor = 'pointer'; /* to indicate element is clickable */
	button.style.padding = '0';
	button.innerHTML = '&times;';
	button.addEventListener('click', () => {
		container.hidePopover();
		container.remove();
	});
	/** https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values */
	document.addEventListener('keydown', (e) => { // document -> container?
		if (e.key === 'Escape') {
			container.hidePopover();
			container.remove();
		}
	});
	return button;
}

function audioSection(record: T.TalkRecord) {
	const audio = document.createElement('div');
	if (record.extension) {
		/** add Audio element */
		const audioObject = new Media.Audio(30);
		audioObject.element.src = `${MediaFolder}/${record.title}${record.extension}`;
		audioObject.element.load();
		audio.append(audioObject.element);
		audio.append(audioObject.panel);
	}
	else {
		const noAudioMessage = document.createElement('paragraph');
		noAudioMessage.innerText = '(No Audio File)';
		audio.append(noAudioMessage);
	}
	return audio;
}

function titleSection(record: T.TalkRecord) {
	const title = document.createElement('div');
	// title.id = 'talk-details-title-section';
	title.style.marginTop = '1rem';
	title.style.fontFamily = 'sans-serif';
	title.style.fontWeight = 'normal';
	title.style.fontSize = '1.1rem';
	const highlightedTitle = highlightKeywords(record.title, Keywords).join('')
	const titleHeading = MarkupLine(highlightedTitle, 'MET');
	const titleText = document.createElement('span');
	titleText.innerHTML = titleHeading;
	const titleCopyButton = document.createElement('span');
	titleCopyButton.id = 'talk-title-copy';
	titleCopyButton.innerHTML = '🔖'; // ▽⬇︎⤵︎🔑🪄📥🔖📌⌘C
	titleCopyButton.addEventListener('click', () => {
		navigator.clipboard.writeText(record.title); /** copy title to clipboard */
	});
	title.append(titleCopyButton, ' ', titleText);
	return title;
}

function summarySection(record: T.TalkRecord) {
	const summary = document.createElement('div');
	// summary.id = 'talk-details-summary-section';
	summary.style.fontFamily = 'sans-serif';
	summary.style.fontWeight = '500';
	summary.style.fontSize = '.9rem';
	summary.style.color = '#600';
	const summaryLines: string[] = [];
	if (record.type) summaryLines.push(record.type.toUpperCase());
	if (record.performers) summaryLines.push(`\xa0 with: ${record.performers}`);
	const categories = (record.categories.length) ? record.categories.join(' > ') : '';
	if (categories) summaryLines.push(categories);
	if (record.begins) summaryLines.push(addEllipsis(record.begins));
	if (record.ends) summaryLines.push(addEllipsis(record.ends, false));
	summaryLines.push('___');
	const highlightedSummaryLines = highlightKeywords(summaryLines, Keywords);
	const markedUpSummary = Markup(highlightedSummaryLines);
	summary.innerHTML = markedUpSummary;
	return summary;
}

function notesSection(record: T.TalkRecord) {
	const notes = document.createElement('div');
	// notes.id = 'talk-notes';
	// notes.style.height = '75%';
	notes.style.overflow = 'auto';
	notes.style.fontFamily = 'sans-serif';
	notes.style.fontWeight = 'normal';
	notes.style.fontSize = '.8rem';
	const notesLines: string[] = [];
	/** sort the most recent notes to the top */
	record.notes.sort((a,b) => b.date - a.date);
	let first = true;
	for (const note of record.notes) {
		if (!first) notesLines.push('___');
		const heading = `${note.name} (${note.section + 1})`;
		notesLines.push(`###### ${heading}\n`);
		if (!note.lines.length) notesLines.push('(no text lines)');
		else for (const line of note.lines) notesLines.push(line);
		first = false;
	}
	const highlightedNotesLines = highlightKeywords(notesLines, Keywords);
	const markedUpNotes = Markup(highlightedNotesLines);
	notes.innerHTML = markedUpNotes;
	return notes;
}
