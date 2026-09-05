import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
import * as A from './lib/play-audio.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
console.log('v26.09.04');
const AudioDataset = await Fetch.api(`${PAGE.backend}/media/talks`);
if (AudioDataset === null) {
    window.alert(`AudioDatset is empty!`);
    window.history.back();
}
const MediaFolder = '../media/audio/watts';
const TalkTimesData = './data/audio/watts-talk-times.txt';
const Records = AudioDataset.data;
// not yet supported ... might be better done with a button
// ... (or done automatically by checking last update in metadata)
if (PAGE.parameters.has('refresh-times')) {
    refreshTimes(TalkTimesData, Records);
    window.alert('Audio file times data refreshed');
    window.history.back();
}
let Keywords = new Set();
let LogicalAnd = false;
const WordSegments = /\b(\w+)['’]?(\w+)?\b/g; /** words, including contractions */
const SortByOptions = ['Title', 'Last Play'];
let SortBy = SortByOptions[0];
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
    sortTalks();
    listTalks(ListElement, Keywords, LogicalAnd);
}
function listTalks(division, keywords, logicalAnd) {
    division.innerHTML = '';
    sortTalks();
    const table = new W.Table(['Title', 'Time', 'Plays', 'Last Play']);
    let i = 0;
    for (const record of Records) {
        if (!keywords.size || hasKeywords(record, keywords, logicalAnd)) {
            const title = shortTitle(record.title);
            const lastPlayedDate = new Date(record.lastPlayed);
            table.addRow();
            const titleHTML = `<input type='button' value='${title}' class='talk-title' id='${i}' />`;
            const titleCell = table.addCell(titleHTML, '', true);
            table.addCell(A.FormatTime(record.duration));
            table.addCell(record.playCount.toString());
            table.addCell(T.DateString(lastPlayedDate, 14));
            titleCell.addEventListener('click', (e) => {
                const target = e.target;
                showRecordDetails(Number(target.id));
            });
        }
        i += 1;
    }
    table.fillTable(table.element);
    division.append(table.element);
}
function showRecordDetails(index) {
    const record = Records[index];
    const dialog = document.createElement('dialog');
    dialog.className = 'talk-dialog';
    dialog.innerHTML = '';
    const textLines = [];
    textLines.push(`### ${record.title}\n`);
    if (record.begins)
        textLines.push(record.begins);
    if (record.ends)
        textLines.push(record.ends);
    /** sort most recent note at the top */
    record.notes.sort((a, b) => b.heading.localeCompare(a.heading));
    let first = true;
    for (const note of record.notes) {
        if (!first)
            textLines.push('___');
        textLines.push(`###### ${note.heading}\n`);
        for (const line of note.lines)
            textLines.push(line);
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
    /** add 'close' button */
    const button = document.createElement('button');
    button.innerHTML = '&times;';
    button.className = 'talk-dialog-exit';
    button.addEventListener('click', () => {
        dialog.close();
        dialog.remove();
    });
    /** support Escape key close */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dialog.close();
            dialog.remove();
        }
    });
    dialog.innerHTML += markedUpText;
    dialog.append(button);
    PAGE.content.append(dialog);
    dialog.showModal();
}
/**
 * Given an array of `textLines` and an array of lowercase `keywords`, add
 * markdown highlight characters (e.g., "==word==") to words in the `textLines`
 * that appear in the list of `keywords`.
 */
function highlightKeywords(textLines, keywords) {
    if (!keywords.size)
        return textLines;
    const highlightedTextLines = [];
    for (const textLine of textLines) {
        const segments = wordSegments(textLine);
        for (let i = 0; i < segments.length; i += 1) {
            if (keywords.has(segments[i].toLowerCase()))
                segments[i] = `==${segments[i]}==`;
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
function shortTitle(title, maximumLength = 35) {
    let shortTitle = title.trim();
    const ellipsis = '...';
    const maximum = maximumLength - ellipsis.length;
    if (title.length > maximum) {
        const matches = title.match(/(.*)\s+(p\d+)$/i);
        if (matches)
            shortTitle = matches[1].slice(0, maximum) + ellipsis + matches[2];
        else
            shortTitle = title.slice(0, maximum).trim() + ellipsis;
    }
    return shortTitle;
}
/**
 * Given an AudioData record, an array of `keywords`, and the `logicalAnd`
 * boolean, return true if any of the record texts contain any of the
 * `keywords`, else return false. When `logicalAnd` is true, the record texts
 * must contain all of the keywords to receive a true result.
 */
function hasKeywords(record, keywords, logicalAnd = false) {
    let hasKeywords = (logicalAnd) ? true : false;
    /** consolidate all the text lines from the record */
    const noteLines = [];
    noteLines.push(record.title);
    noteLines.push(record.begins);
    noteLines.push(record.ends);
    for (const note of record.notes) {
        for (const line of note.lines) {
            noteLines.push(line);
        }
    }
    const noteText = noteLines.join(' ');
    const noteWords = uniqueWords(noteText);
    for (const keyword of keywords) {
        if (logicalAnd && !noteWords.has(keyword))
            return false;
        if (!logicalAnd && noteWords.has(keyword))
            return true;
    }
    return hasKeywords;
}
/**
 * Given a text string containing words separated by boundaries (whitespace,
 * punctuation, etc.), return a Set of words converted to lowercase.
 */
function uniqueWords(wordString) {
    const uniqueWords = new Set();
    wordString = wordString.toLowerCase();
    const matches = wordString.match(WordSegments);
    if (matches) {
        for (const match of matches) {
            if (match)
                uniqueWords.add(match);
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
function wordSegments(text, regexp = WordSegments) {
    const segments = [];
    let match;
    let nextIndex = 0;
    while ((match = regexp.exec(text)) !== null) {
        const wordIndex = match.index;
        const nextWordIndex = regexp.lastIndex;
        if (nextIndex < wordIndex)
            segments.push(text.slice(nextIndex, wordIndex));
        segments.push(text.slice(wordIndex, nextWordIndex));
        nextIndex = nextWordIndex;
    }
    if (nextIndex < text.length)
        segments.push(text.slice(nextIndex));
    return segments;
}
/**
 * Sort talk records based on `SortBy` and `ReverseSort` options.
 */
function sortTalks() {
    Records.sort((a, b) => {
        let result = 0;
        if (SortBy == 'Last Play')
            result = a.lastPlayed - b.lastPlayed;
        else
            result = a.title.localeCompare(b.title); /** default: sort by title */
        if (ReverseSort)
            result *= -1;
        return result;
    });
}
function selectionElement() {
    const selectionElement = document.createElement('div');
    const sortByLabel = document.createTextNode('\u00a0\u00a0\u00a0\u00a0Sorted By: ');
    const radioButtons = new W.RadioGroup('', SortByOptions, 'widget-radio-inline');
    for (const inputElement of radioButtons.inputElements) {
        inputElement.addEventListener('click', () => {
            SortBy = radioButtons.value;
            sortTalks();
            listTalks(ListElement, Keywords, LogicalAnd);
        });
    }
    const radioSpan = radioButtons.span;
    const textEntry = new W.Text('Keywords: ', '');
    textEntry.element.addEventListener('change', () => {
        Keywords = uniqueWords(textEntry.element.value);
        sortTalks();
        listTalks(ListElement, Keywords, LogicalAnd);
    });
    const logicalAnd = new W.Checkbox('All: ', false);
    logicalAnd.label.classList.add('talk-button-indent');
    logicalAnd.element.addEventListener('change', () => {
        LogicalAnd = logicalAnd.element.checked;
        sortTalks();
        listTalks(ListElement, Keywords, LogicalAnd);
    });
    const reverseSort = new W.Checkbox('Reversed: ', false);
    reverseSort.label.classList.add('talk-button-indent');
    reverseSort.element.addEventListener('change', () => {
        ReverseSort = reverseSort.element.checked;
        sortTalks();
        listTalks(ListElement, Keywords, LogicalAnd);
    });
    selectionElement.append(textEntry.label);
    selectionElement.append(textEntry.element);
    selectionElement.append(logicalAnd.label);
    selectionElement.append(logicalAnd.element);
    selectionElement.append(sortByLabel);
    selectionElement.append(radioSpan);
    selectionElement.append(reverseSort.label);
    selectionElement.append(reverseSort.element);
    return selectionElement;
}
// not yet supported
async function refreshTimes(dataFilePath, records) {
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
}
