import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { Document } from './lib/document.js';
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
export function render() {
    const page = new Page();
    page.displayMenu();
    page.displayFooter();
    /**
     * read the 'song' document
     * create the FakeSheet object using the metadata and markdown
     */
    const FakeSheetFilePath = `${page.fetchOrigin}/data/fakesheets/${song}.md`;
    DB.fetchData(FakeSheetFilePath).then((fakeSheetText) => {
        let obsidian = new Document(fakeSheetText);
        if (obsidian.metadata) {
            let fakeSheetMetadata = metadata(obsidian.metadata);
            console.log(fakeSheetMetadata);
        }
    });
}
function metadata(documentMetadata) {
    let title = '';
    let artist = '';
    let composers = [];
    let key = '';
    let capo = 0;
    let tuning = '';
    let tempo = '';
    let copyright = '';
    let chords = [];
    if (documentMetadata) {
        if ('title' in documentMetadata)
            title = documentMetadata['title'];
        if ('artist' in documentMetadata)
            artist = documentMetadata['artist'];
        if ('composers' in documentMetadata) {
            if (Array.isArray(documentMetadata['composers']))
                composers = documentMetadata['composers'];
            else
                composers.push(documentMetadata['composers']);
        }
        if ('key' in documentMetadata)
            key = documentMetadata['key'];
        if ('capo' in documentMetadata) {
            if (!isNaN(documentMetadata['capo']))
                capo = Number(documentMetadata['capo']);
        }
        if ('tuning' in documentMetadata)
            tuning = documentMetadata['tuning'];
        if ('tempo' in documentMetadata)
            tempo = documentMetadata['tempo'];
        if ('copyright' in documentMetadata)
            copyright = documentMetadata['copyright'];
        if ('chords' in documentMetadata) {
            if (Array.isArray(documentMetadata['chords']))
                chords = documentMetadata['chords'];
            else
                chords.push(documentMetadata['chords']);
        }
    }
    let fakeSheetMetadata = {
        title: title,
        artist: artist,
        composers: composers,
        key: key,
        capo: capo,
        tuning: tuning,
        tempo: tempo,
        copyright: copyright,
        chords: chords,
    };
    return fakeSheetMetadata;
}
// function displaySheet(fakesheet: FakeSheet) {
// 	/** Display song title in both HTML title and Heading */
// 	let title = (fakesheet.title) ? fakesheet.title : '(untitled)';
// 	if (fakesheet.artist) title += ` - ${fakesheet.artist}`;
// 	document.title = MarkupLine(title, 'ET');
// 	this.addHeading(MarkupLine(title, 'ET'), 4);
// 	/** Create placeholders for page content */
// 	this.content.append(this.errorBlock);
// 	this.content.append(this.metadataBlock);
// 	this.content.append(this.sheetBlock);
// 	this.content.append(this.diagramBlock);
// 	/** Fill the page content blocks */
// 	this.fillErrorBlock(fakesheet);
// 	this.fillMetadataBlock(fakesheet);
// 	this.fillSheetBlock(fakesheet);
// 	this.fillDiagramBlock(fakesheet);
// }
// function metadataItem(id: string, label: string, value: string) {
// 	let itemSpanElement = document.createElement('span');
// 	itemSpanElement.id = id;
// 	let labelSpanElement = document.createElement('span');
// 	let valueSpanElement = document.createElement('span');
// 	label += ' ';
// 	let labelText = document.createTextNode(MarkupLine(label, 'T'));
// 	labelSpanElement.appendChild(labelText);
// 	labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
// 	let valueText = document.createTextNode(MarkupLine(value, 'T'));
// 	valueSpanElement.appendChild(valueText);
// 	valueSpanElement.classList.add(CSS_CLASS.metadataValue);
// 	itemSpanElement.appendChild(labelSpanElement);
// 	itemSpanElement.appendChild(valueSpanElement);
// 	itemSpanElement.appendChild(document.createElement('br'));
// 	return itemSpanElement;
// }
// function fillErrorBlock(fakesheet: FakeSheet) {
// 	this.errorBlock.innerHTML = '';
// 	if (fakesheet.errors.length) {
// 		this.errorBlock.appendChild(document.createTextNode('Errors:'));
// 		this.errorBlock.appendChild(document.createElement('br'));
// 		for (let error of fakesheet.errors) {
// 			this.errorBlock.appendChild(document.createTextNode(error));
// 			this.errorBlock.appendChild(document.createElement('br'));
// 		}
// 		this.errorBlock.appendChild(document.createElement('br'));
// 	}
// }
// function fillMetadataBlock(fakesheet: FakeSheet) {
// 	this.metadataBlock.innerHTML = '';
// 	if (fakesheet.key) {
// 		let labelSpanElement = document.createElement('span');
// 		let labelText = document.createTextNode('Key: ');
// 		labelSpanElement.appendChild(labelText);
// 		labelSpanElement.classList.add(CSS_CLASS.metadataLabel);
// 		let selectElement = this.keySelectElement(fakesheet);
// 		this.metadataBlock.appendChild(labelSpanElement);
// 		this.metadataBlock.appendChild(selectElement);
// 		this.metadataBlock.appendChild(document.createElement('br'));
// 	}
// 	if (fakesheet.capoMessage()) {
// 		this.metadataBlock.appendChild(this.metadataItem(CSS_ID.capo, 'Capo:', fakesheet.capoMessage()));
// 	}
// 	if (fakesheet.tuning.length) {
// 		this.metadataBlock.appendChild(this.metadataItem(CSS_ID.tuning, 'Tuning:', fakesheet.tuning.join(' ')));
// 	}
// 	if (fakesheet.tempo) {
// 		this.metadataBlock.appendChild(this.metadataItem(CSS_ID.tempo, 'Tempo:', fakesheet.tempo.toString()));
// 	}
// 	if (fakesheet.copyright) {
// 		this.metadataBlock.appendChild(this.metadataItem(CSS_ID.copyright, '©', MarkupLine(fakesheet.copyright, 'T')));
// 	}
// }
// function fillSheetBlock(fakesheet: FakeSheet) {
// 	this.sheetBlock.innerHTML = '';
// 	let fakeSheetLines = fakesheet.fakeSheetLines();
// 	for (let fakeSheetLine of fakeSheetLines) {
// 		let lineType = fakeSheetLine[0];
// 		fakeSheetLine = fakeSheetLine.slice(1) + '\n'; /** remove character 0 and add a newline for <pre> */
// 		let lineText = document.createTextNode(MarkupLine(fakeSheetLine, 'F'));
// 		if (lineType == FAKESHEET.chordLine) {
// 			let spanElement = document.createElement('span');
// 			spanElement.classList.add(CSS_CLASS.chords);
// 			spanElement.appendChild(lineText);
// 			this.sheetBlock.appendChild(spanElement);
// 		} else this.sheetBlock.appendChild(lineText);
// 	}
// }
// function fillDiagramBlock(fakesheet: FakeSheet) {
// 	this.diagramBlock.innerHTML = '';
// 	let diagrams = fakesheet.chordDiagrams();
// 	if (diagrams.length) {
// 		let horizontalRuleElement = document.createElement('hr');
// 		this.diagramBlock.appendChild(horizontalRuleElement);
// 		for (let diagram of diagrams) {
// 			this.diagramBlock.appendChild(diagram);
// 		}
// 	}
// }
// function keySelectElement(fakesheet: FakeSheet) {
// 	/** Define the musical Key of the song as a drop-down selection */
// 	let selectElement = document.createElement('select');
// 	selectElement.name = 'keys';
// 	selectElement.id = CSS_ID.keyTag;
// 	if (fakesheet.key) {
// 		let labelElement = document.createElement('label');
// 		labelElement.htmlFor = CSS_ID.keyTag;
// 		this.metadataBlock.appendChild(labelElement); /** ### should be a sub-div? */
// 		let minorCharacter = (fakesheet.key.minor) ? 'm' : '';
// 		let currentKey = (fakesheet.newKey) ? fakesheet.newKey.base : fakesheet.key.base;
// 		for (let tonicSet of FAKESHEET.tonics) {
// 			let tonics = tonicSet.split(FAKESHEET.tonicSeparator);
// 			for (let tonic of tonics) {
// 				let value = tonic + minorCharacter;
// 				let text = (value == fakesheet.key.base) ? `${value} ◆` : value;
// 				let defaultKey = (value == fakesheet.key.base);
// 				let selectedKey = (value == currentKey);
// 				let option = new Option(text, value, defaultKey, selectedKey);
// 				selectElement.add(option);
// 			}
// 		}
// 		selectElement.addEventListener('change', (e: Event) => {
// 			// e.target is the element listened to (selectElement)
// 			// e.target.value holds the new value of the element after it's changed (e.g., "Bm")
// 			let element = e.target as HTMLSelectElement; /** "as" type casting required for TypeScript */
// 			this.changeKey(fakesheet, element.value);
// 		});
// 	}
// 	return selectElement;
// }
// function changeKey(fakesheet: FakeSheet, newKey: string) {
// 	console.log(`Change key to: ${newKey}`);
// 	fakesheet.changeKey(newKey);
// 	/** Refill the page content blocks */
// 	this.fillErrorBlock(fakesheet);
// 	this.fillMetadataBlock(fakesheet);
// 	this.fillSheetBlock(fakesheet);
// 	this.fillDiagramBlock(fakesheet);
// }
