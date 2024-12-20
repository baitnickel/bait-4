import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { MarkdownDocument } from './lib/md.js';
import { FAKESHEET, FakeSheet } from './lib/fakesheet.js';
import { MarkupLine } from './lib/markup.js';
const CSS_CLASS = {
    songTitleLink: 'song-title-link',
    metadataLabel: 'songbook-metadata-label',
    metadataValue: 'songbook-metadata-value',
    chords: 'chords',
};
const CSS_ID = {
    errorBlock: 'song-error',
    metadataBlock: 'song-metadata',
    sheetBlock: 'song-sheet',
    diagramBlock: 'song-diagram',
    keyTag: 'key-select',
    capo: 'capo',
    tuning: 'tuning',
    tempo: 'tempo',
    composers: 'composers',
    copyright: 'copyright',
};
const ARTIST_SORT = 'a';
const SONG_SORT = 's';
const page = new Page();
const fakeSheetsSubPath = 'Content/fakesheets';
const fakeSheetsPath = `${page.site}/${fakeSheetsSubPath}`;
const indicesPath = `${page.site}/Indices`;
const articles = await Fetch.map(`${indicesPath}/articles.json`);
const errorBlock = document.createElement('div');
errorBlock.id = CSS_ID.errorBlock;
const metadataBlock = document.createElement('div');
metadataBlock.id = CSS_ID.metadataBlock;
const sheetBlock = document.createElement('pre');
sheetBlock.id = CSS_ID.sheetBlock;
const diagramBlock = document.createElement('div');
diagramBlock.id = CSS_ID.diagramBlock;
export async function render() {
    const songQuery = page.parameters.get('song');
    const sortQuery = page.parameters.get('sort');
    if (songQuery) {
        /** Display the song's fakesheet */
        const fakeSheetFilePath = `${fakeSheetsPath}/${songQuery}`;
        const fakeSheetText = await Fetch.text(fakeSheetFilePath);
        if (!fakeSheetText) {
            const errorMessage = `The URL contains an invalid song file name: \`${songQuery}\``;
            page.content.innerHTML = MarkupLine(errorMessage, 'etm');
        }
        else {
            /** get the file's revision date */
            let revision = null;
            let articleKey = `${fakeSheetsSubPath}/${songQuery}`;
            if (articles.has(articleKey)) {
                const fakeSheetProperties = articles.get(articleKey);
                revision = fakeSheetProperties.revision;
            }
            /** convert the text to fakesheet and display it */
            const markdown = new MarkdownDocument(fakeSheetText);
            if (markdown.errors)
                page.content.innerHTML = markdown.errorMessages();
            else {
                const fakeSheet = new FakeSheet(markdown);
                displaySheet(fakeSheet, revision);
            }
        }
    }
    else {
        /** Display a list of songs having fakesheets */
        page.setTitle('Song Book');
        /* refresh default footer */
        page.displayFooter();
        page.addHeading('List of Songs');
        const fakeSheetIndexPath = `${indicesPath}/fakesheets.json`;
        const songMap = await Fetch.map(fakeSheetIndexPath);
        let sortOrder = ARTIST_SORT; /** @todo should be widget option */
        if (sortQuery) {
            const lowerCaseSortQuery = sortQuery.toLowerCase();
            if (lowerCaseSortQuery[0] == ARTIST_SORT)
                sortOrder = ARTIST_SORT;
            else if (lowerCaseSortQuery[0] == SONG_SORT)
                sortOrder = SONG_SORT;
        }
        const songKeys = sortedSongKeys(songMap, sortOrder); /** 'songKeys' are the fakesheet file names */
        const pElement = document.createElement('p');
        let artistDiv = null; /** <div> to contain an artist's items */
        let detailsElement = null;
        let previousArtist = '';
        for (const songKey of songKeys) {
            const song = songMap.get(songKey);
            if (sortOrder == ARTIST_SORT) {
                const songBookItem = song.title;
                if (previousArtist != song.artist) {
                    if (previousArtist) { /** this is not the first song */
                        /** close the current <details> block and start a new one */
                        if (artistDiv && detailsElement) {
                            detailsElement.append(artistDiv);
                            page.content.append(detailsElement);
                        }
                    }
                    detailsElement = document.createElement('details');
                    const summaryElement = document.createElement('summary');
                    summaryElement.innerHTML = MarkupLine(song.artist, 'et');
                    detailsElement.append(summaryElement);
                    artistDiv = document.createElement('div');
                    artistDiv.classList.add(CSS_CLASS.songTitleLink);
                }
                if (artistDiv && detailsElement) {
                    const anchorElement = document.createElement('a');
                    anchorElement.href = page.url + `?page=songbook&song=${songKey}`;
                    anchorElement.innerHTML = MarkupLine(songBookItem, 'et');
                    artistDiv.appendChild(anchorElement);
                    const breakElement = document.createElement('br');
                    artistDiv.appendChild(breakElement);
                    detailsElement.append(pElement);
                }
            }
            else { /** sortOrder == SONG_SORT */
                const songBookItem = `${song.title} - ${song.artist}`;
                const anchorElement = document.createElement('a');
                anchorElement.href = page.url + `?page=songbook&song=${songKey}`;
                anchorElement.innerHTML = MarkupLine(songBookItem, 'et');
                pElement.appendChild(anchorElement);
                const breakElement = document.createElement('br');
                pElement.appendChild(breakElement);
                page.content.append(pElement);
            }
            previousArtist = song.artist;
        }
        if (artistDiv && detailsElement) {
            detailsElement.append(artistDiv);
            page.content.append(detailsElement);
        }
    }
}
function displaySheet(fakesheet, revision) {
    const title = (fakesheet.artist) ? `${fakesheet.title} - ${fakesheet.artist}` : fakesheet.title;
    document.title = MarkupLine(title, 'ET');
    /* refresh footer */
    page.displayFooter(revision);
    page.addHeading(MarkupLine(title, 'ET'), 4);
    /** Create placeholders for page content */
    page.content.append(errorBlock);
    page.content.append(metadataBlock);
    page.content.append(sheetBlock);
    page.content.append(diagramBlock);
    /** Fill the page content blocks */
    fillErrorBlock(fakesheet);
    fillMetadataBlock(fakesheet);
    fillSheetBlock(fakesheet);
    fillDiagramBlock(fakesheet);
}
function metadataItem(id, label, value) {
    const itemSpanElement = document.createElement('span');
    itemSpanElement.id = id;
    const labelSpanElement = document.createElement('span');
    const valueSpanElement = document.createElement('span');
    label += ' ';
    const labelText = document.createTextNode(MarkupLine(label, 'T'));
    labelSpanElement.appendChild(labelText);
    labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
    const valueText = document.createTextNode(MarkupLine(value, 'T'));
    valueSpanElement.appendChild(valueText);
    valueSpanElement.classList.add(CSS_CLASS.metadataValue);
    itemSpanElement.appendChild(labelSpanElement);
    itemSpanElement.appendChild(valueSpanElement);
    itemSpanElement.appendChild(document.createElement('br'));
    return itemSpanElement;
}
function fillErrorBlock(fakesheet) {
    errorBlock.innerHTML = '';
    if (fakesheet.errors.length) {
        for (const error of fakesheet.errors) {
            errorBlock.appendChild(document.createTextNode(error));
            errorBlock.appendChild(document.createElement('br'));
        }
        errorBlock.appendChild(document.createElement('br'));
    }
}
function fillMetadataBlock(fakesheet) {
    metadataBlock.innerHTML = '';
    if (fakesheet.key) {
        const labelSpanElement = document.createElement('span');
        const labelText = document.createTextNode('Key: ');
        labelSpanElement.appendChild(labelText);
        labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
        const selectElement = keySelectElement(fakesheet);
        metadataBlock.appendChild(labelSpanElement);
        metadataBlock.appendChild(selectElement);
        metadataBlock.appendChild(document.createElement('br'));
    }
    if (fakesheet.capoMessage()) {
        metadataBlock.appendChild(metadataItem(CSS_ID.capo, 'Capo:', fakesheet.capoMessage()));
    }
    if (fakesheet.tuning.length) {
        metadataBlock.appendChild(metadataItem(CSS_ID.tuning, 'Tuning:', fakesheet.tuning.join(' ')));
    }
    if (fakesheet.tempo) {
        metadataBlock.appendChild(metadataItem(CSS_ID.tempo, 'Tempo:', fakesheet.tempo.toString()));
    }
    if (fakesheet.composers) {
        metadataBlock.appendChild(metadataItem(CSS_ID.composers, 'Written By:', MarkupLine(fakesheet.composers, 'T')));
    }
    if (fakesheet.copyright) {
        metadataBlock.appendChild(metadataItem(CSS_ID.copyright, '©', MarkupLine(fakesheet.copyright, 'T')));
    }
}
function fillSheetBlock(fakesheet) {
    sheetBlock.innerHTML = '';
    const fakeSheetLines = fakesheet.fakeSheetLines();
    for (const fakeSheetLine of fakeSheetLines) {
        fakeSheetLine.text += '\n'; /** add a newline for <pre> */
        const lineText = document.createTextNode(MarkupLine(fakeSheetLine.text, 'F'));
        if (fakeSheetLine.type == FAKESHEET.chordLine) {
            const spanElement = document.createElement('span');
            spanElement.classList.add(CSS_CLASS.chords);
            spanElement.appendChild(lineText);
            sheetBlock.appendChild(spanElement);
        }
        else
            sheetBlock.appendChild(lineText);
    }
}
function fillDiagramBlock(fakesheet) {
    diagramBlock.innerHTML = '';
    const diagrams = fakesheet.chordDiagrams();
    if (diagrams.length) {
        const horizontalRuleElement = document.createElement('hr');
        diagramBlock.appendChild(horizontalRuleElement);
        for (const diagram of diagrams) {
            diagramBlock.appendChild(diagram);
        }
    }
}
function keySelectElement(fakesheet) {
    /** Define the musical Key of the song as a drop-down selection */
    const selectElement = document.createElement('select');
    selectElement.name = 'keys';
    selectElement.id = CSS_ID.keyTag;
    if (fakesheet.key) {
        const labelElement = document.createElement('label');
        labelElement.htmlFor = CSS_ID.keyTag;
        metadataBlock.appendChild(labelElement); /** ### should be a sub-div? */
        const minorCharacter = (fakesheet.key.minor) ? 'm' : '';
        const currentKey = (fakesheet.newKey) ? fakesheet.newKey.base : fakesheet.key.base;
        const tonics = fakesheet.tonics(false); /** plain ASCII for Option "value" */
        const unicodeTonics = fakesheet.tonics(true); /** unicode for Option "text" (drop-down list) */
        for (let i = 0; i < tonics.length; i += 1) {
            const value = tonics[i] + minorCharacter;
            let text = unicodeTonics[i] + minorCharacter;
            if (value == fakesheet.key.base)
                text += ' ◆';
            const defaultKey = (value == fakesheet.key.base);
            const selectedKey = (value == currentKey);
            /** see: https://developer.mozilla.org/en-US/docs/Web/API/HTMLOptionElement/Option */
            const option = new Option(text, value, defaultKey, selectedKey);
            selectElement.add(option);
        }
        selectElement.addEventListener('change', (e) => {
            /**
             * e.target is the element listened to (selectElement)
             * e.target.value holds the new value of the element after it's changed (e.g., "Bm")
             */
            const element = e.target; /** "as" type casting required for TypeScript */
            changeKey(fakesheet, element.value);
        });
    }
    return selectElement;
}
function changeKey(fakesheet, newKey) {
    console.log(`Change key to: ${newKey}`);
    fakesheet.changeKey(newKey);
    /** Refill the page content blocks */
    fillErrorBlock(fakesheet);
    fillMetadataBlock(fakesheet);
    fillSheetBlock(fakesheet);
    fillDiagramBlock(fakesheet);
}
function sortedSongKeys(songMap, sortOrder) {
    const keys = Array.from(songMap.keys());
    keys.sort((a, b) => {
        const songA = songMap.get(a);
        const songB = songMap.get(b);
        const artistA = sortableTitle(songA.artist);
        const artistB = sortableTitle(songB.artist);
        const titleA = sortableTitle(songA.title);
        const titleB = sortableTitle(songB.title);
        let sortValue = 0;
        if (sortOrder != ARTIST_SORT || artistA == artistB) {
            sortValue = (titleA > titleB) ? 1 : -1;
        }
        else
            sortValue = (artistA > artistB) ? 1 : -1;
        return sortValue;
    });
    return keys;
}
/**
 * Given a string containing a title (such as a song title or a band
 * name), return a string that may be used in sorting, where all
 * characters are converted to lower case, and leading articles ('a',
 * 'an', and 'the') are moved to the title's end.
 */
function sortableTitle(rawTitle) {
    let adjustedTitle = rawTitle.toLowerCase();
    const words = adjustedTitle.split(/\s+/);
    if (!words[0])
        words.shift(); /** remove leading whitespace */
    /** remove leading article */
    if (['a', 'an', 'the'].includes(words[0])) {
        const newLastWord = words.shift();
        if (newLastWord)
            words.push(newLastWord);
    }
    adjustedTitle = words.join(' ');
    return adjustedTitle;
}
