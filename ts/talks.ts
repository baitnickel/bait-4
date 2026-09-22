import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
import * as A from './lib/play-audio.js';

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
const AudioData = await Fetch.api<T.AudioData[]>(`${PAGE.backend}/media/talks`);
if (!AudioData) {
	window.alert(`AudioData is empty!`);
	window.history.back();
}

const MediaFolder = '../media/audio/watts';
// const TalkTimesData = './data/audio/watts-talk-times.txt';
const Records = AudioData!;

//  // not yet supported ... might be better done with a button
//  // ... (or done automatically by checking last update in metadata)
// if (PAGE.parameters.has('refresh-times')) {
// 	refreshTimes(TalkTimesData, Records);
// 	window.alert('Audio file times data refreshed');
// 	window.history.back();
// }

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

/** needs more testing: */
// const PopupMessage = document.createElement('dialog');
// PopupMessage.className = 'talk-popup-message';
// PopupMessage.innerHTML = '';

export function render() {
	PAGE.setTitle('Talks Dataset');
	PAGE.header.append(SelectionElement);
	PAGE.content.append(ListElement);
	sortTalks();
	listTalks(ListElement, Keywords, LogicalAnd);  
}

function listTalks(division: HTMLDivElement, keywords: Set<string>, logicalAnd: boolean) {
	division.innerHTML = '';
	// sortTalks();
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
			const timeCell = table.addCell(A.FormatTime(record.duration));
			timeCell.classList.add('talk-time');
			const playCountCell = table.addCell(record.playCount.toString());
			playCountCell.classList.add('talk-play-count');
			table.addCell(T.DateString(lastPlayedDate, 14));

			titleCell.addEventListener('click', (e: Event) => {
				const target = e.target as HTMLTableCellElement;
				showRecordDetails(Number(target.id));
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

function showRecordDetails(index: number) {
	const record = Records[index];
	const dialog = document.createElement('dialog');
	dialog.className = 'talk-dialog';
	dialog.innerHTML = '';

	const textLines: string[] = [];
	textLines.push(`### ${record.title}\n`);
	const categories = (record.categories.length) ? record.categories.join(' > ') : '';
	if (categories) textLines.push(categories);
	if (record.type) textLines.push(record.type);
	if (record.performers) textLines.push(`With: ${record.performers}`);
	if (record.begins) textLines.push(`${record.begins} ...`);
	if (record.ends) textLines.push(`... ${record.ends}`);
	/** sort most recent note at the top */
	record.notes.sort((a,b) => b.heading.localeCompare(a.heading));
	let first = true;
	for (const note of record.notes) {
		if (!first) textLines.push('___');
		textLines.push(`###### ${note.heading}\n`);
		for (const line of note.lines) textLines.push(line);
		first = false;
	}
	const highlightedTextLines = highlightKeywords(textLines, Keywords);
	const markedUpText = Markup(highlightedTextLines);
	
	/** add Audio element */
	const uri = `${MediaFolder}/${record.title}${record.extension}`;
	const audio = new Audio();
	audio.controls = true;
	dialog.append(audio);
	A.Play(audio, uri);
	
	/** add 'location' button */
	const locationButton = document.createElement('button');
	locationButton.innerHTML = '\u2316';
	locationButton.className = 'talk-dialog-location';
	locationButton.addEventListener('click', () => {
		const position = audio.currentTime; // always returns 0!
		const copyText = (position == 0) ? record.title : A.FormatTime(position);
		PAGE.clipboardCopy(copyText);
		//   dialog popup here needs more testing //
		// PopupMessage.innerHTML = copyText;
		// PAGE.content.append(dialog);
		// PAGE.popupMessage(PopupMessage, 3);
	});

	/** add 'close' button */
	const exitButton = document.createElement('button');
	exitButton.innerHTML = '&times;';
	exitButton.className = 'talk-dialog-exit';
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
	
	dialog.innerHTML += markedUpText;
	dialog.append(locationButton);
	dialog.append(exitButton);
	PAGE.content.append(dialog);
	dialog.showModal();
}

/**
 * Given an array of `textLines` and an array of lowercase `keywords`, add
 * markdown highlight characters (e.g., "==word==") to words in the `textLines`
 * that appear in the list of `keywords`.
 */
function highlightKeywords(textLines: string[], keywords: Set<string>) {
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
 * Given an AudioData record, an array of `keywords`, and the `logicalAnd`
 * boolean, return true if any of the record texts contain any of the
 * `keywords`, else return false. When `logicalAnd` is true, the record texts
 * must contain all of the keywords to receive a true result.
 */
function hasKeywords(record: T.AudioData, keywords: Set<string>, logicalAnd = false) {
    let hasKeywords = (logicalAnd) ? true : false;

	/** consolidate all the text lines from the record */
	const noteLines: string[] = [];
	noteLines.push(record.title);
	noteLines.push(record.type);
	noteLines.push(record.categories.join(' ')); // should be included?
	noteLines.push(record.performers);
	noteLines.push(record.begins);
	noteLines.push(record.ends);
	for (const note of record.notes) {
		for (const line of note.lines) {
			noteLines.push(line);
		}
	}
	const noteText = noteLines.join(' ');
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
		else if (column == 'Last Play') result = a.lastPlayed - b.lastPlayed;
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
		Keywords = uniqueWords(textEntry.element.value);
		// sortTalks();
		listTalks(ListElement, Keywords, LogicalAnd);
	});
	const logicalAnd = new W.Checkbox('All: ', false);
	logicalAnd.label.classList.add('talk-button-indent');
	logicalAnd.element.addEventListener('change', () => {
		LogicalAnd = logicalAnd.element.checked;
		// sortTalks();
		listTalks(ListElement, Keywords, LogicalAnd);
	});

	selectionElement.append(textEntry.label);
	selectionElement.append(textEntry.element);
	selectionElement.append(logicalAnd.label);
	selectionElement.append(logicalAnd.element);
	return selectionElement;
}

// not yet supported
// async function refreshTimes(dataFilePath: string, records: T.AudioData[]) {
	/*
		Must loop over file names + extensions from `records`,
		and for each one create an array of strings consisting of
		name+extenstion and duration seconds,
		separated by a delimiter (such as '\t').
		Use the A.LoadAudioData function as demonstated in the home module,
		function testTalkTime.
		Then call an API passing the array of strings.
		The API will (over)write a text file representing the array.
		The text file can be read by the module that builds the AudioDataset.
		Ideally, we should only *update* the text file for *new* files ...
		... if file was JSON, we could include an element for "last update".
	*/
// }
