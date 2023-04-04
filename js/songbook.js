import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { Document } from './lib/document.js';
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
    copyright: 'copyright'
};
const song = 'all-the-time';
const page = new Page();
const errorBlock = document.createElement('div');
errorBlock.id = CSS_ID.errorBlock;
const metadataBlock = document.createElement('div');
metadataBlock.id = CSS_ID.metadataBlock;
const sheetBlock = document.createElement('pre');
sheetBlock.id = CSS_ID.sheetBlock;
const diagramBlock = document.createElement('div');
diagramBlock.id = CSS_ID.diagramBlock;
// const sortOrder = SortOrder.Artist;
export function render() {
    page.displayMenu();
    page.displayFooter();
    const FakeSheetFilePath = `${page.fetchOrigin}/data/fakesheets/${song}.md`;
    DB.fetchData(FakeSheetFilePath).then((fakeSheetText) => {
        let obsidian = new Document(fakeSheetText);
        if (obsidian.errors)
            obsidian.reportErrors();
        else {
            let fakeSheet = new FakeSheet(obsidian.markdown, obsidian.metadata);
            fakeSheet.parseMetadata();
            fakeSheet.parseSourceText();
            displaySheet(fakeSheet);
        }
    });
}
function displaySheet(fakesheet) {
    /** Display song title in both HTML title and Heading */
    let title = (fakesheet.title) ? fakesheet.title : '(untitled)';
    if (fakesheet.artist)
        title += ` - ${fakesheet.artist}`;
    document.title = MarkupLine(title, 'ET');
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
    let itemSpanElement = document.createElement('span');
    itemSpanElement.id = id;
    let labelSpanElement = document.createElement('span');
    let valueSpanElement = document.createElement('span');
    label += ' ';
    let labelText = document.createTextNode(MarkupLine(label, 'T'));
    labelSpanElement.appendChild(labelText);
    labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
    let valueText = document.createTextNode(MarkupLine(value, 'T'));
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
        errorBlock.appendChild(document.createTextNode('Errors:'));
        errorBlock.appendChild(document.createElement('br'));
        for (let error of fakesheet.errors) {
            errorBlock.appendChild(document.createTextNode(error));
            errorBlock.appendChild(document.createElement('br'));
        }
        errorBlock.appendChild(document.createElement('br'));
    }
}
function fillMetadataBlock(fakesheet) {
    metadataBlock.innerHTML = '';
    if (fakesheet.key) {
        let labelSpanElement = document.createElement('span');
        let labelText = document.createTextNode('Key: ');
        labelSpanElement.appendChild(labelText);
        labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
        let selectElement = keySelectElement(fakesheet);
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
    if (fakesheet.copyright) {
        metadataBlock.appendChild(metadataItem(CSS_ID.copyright, '©', MarkupLine(fakesheet.copyright, 'T')));
    }
}
function fillSheetBlock(fakesheet) {
    sheetBlock.innerHTML = '';
    let fakeSheetLines = fakesheet.fakeSheetLines();
    for (let fakeSheetLine of fakeSheetLines) {
        let lineType = fakeSheetLine[0];
        fakeSheetLine = fakeSheetLine.slice(1) + '\n'; /** remove character 0 and add a newline for <pre> */
        let lineText = document.createTextNode(MarkupLine(fakeSheetLine, 'F'));
        if (lineType == FAKESHEET.chordLine) {
            let spanElement = document.createElement('span');
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
    let diagrams = fakesheet.chordDiagrams();
    if (diagrams.length) {
        let horizontalRuleElement = document.createElement('hr');
        diagramBlock.appendChild(horizontalRuleElement);
        for (let diagram of diagrams) {
            diagramBlock.appendChild(diagram);
        }
    }
}
function keySelectElement(fakesheet) {
    /** Define the musical Key of the song as a drop-down selection */
    let selectElement = document.createElement('select');
    selectElement.name = 'keys';
    selectElement.id = CSS_ID.keyTag;
    if (fakesheet.key) {
        let labelElement = document.createElement('label');
        labelElement.htmlFor = CSS_ID.keyTag;
        metadataBlock.appendChild(labelElement); /** ### should be a sub-div? */
        let minorCharacter = (fakesheet.key.minor) ? 'm' : '';
        let currentKey = (fakesheet.newKey) ? fakesheet.newKey.base : fakesheet.key.base;
        for (let tonicSet of FAKESHEET.tonics) {
            let tonics = tonicSet.split(FAKESHEET.tonicSeparator);
            for (let tonic of tonics) {
                let value = tonic + minorCharacter;
                let text = (value == fakesheet.key.base) ? `${value} ◆` : value;
                let defaultKey = (value == fakesheet.key.base);
                let selectedKey = (value == currentKey);
                let option = new Option(text, value, defaultKey, selectedKey);
                selectElement.add(option);
            }
        }
        selectElement.addEventListener('change', (e) => {
            /**
             * e.target is the element listened to (selectElement)
             * e.target.value holds the new value of the element after it's changed (e.g., "Bm")
             */
            let element = e.target; /** "as" type casting required for TypeScript */
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
