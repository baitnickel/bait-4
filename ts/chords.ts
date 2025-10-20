import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as MD from './lib/md.js';
import { Instrument, Chord } from './lib/fakesheet.js';
import * as W from './lib/widgets.js';

import { Markup } from './lib/markup.js';

/**
 * Display a table of guitar chords, showing name, notation, intervals, notes
 * (and diagram?). Chord data is taken from fakesheets' "chords" metadata,
 * sorted uniquely by name and notation.
 */
type ChordStructure = {
	name: string;
	notation: string;
	intervals: string[];
	notes: string[];
	diagram: SVGSVGElement|null;
}

const PAGE = new Page();
PAGE.setTitle('Chords', 1);
const FakesheetIndices = `${PAGE.site}/Indices/fakesheets.json`;
const FakesheetsPath = `${PAGE.site}/Content/fakesheets`;
const Fakesheets = await Fetch.map<T.FileStats>(FakesheetIndices);
const Chords = await getChords(Fakesheets);

export function render() {
	const listSection = document.createElement('div');
	const flattenedChords: string[] = [];
	for (const chord of Chords) flattenedChords.push(`${chord.name} ${chord.notation}`);
	listSection.innerHTML = flattenedChords.join('<br>');
	listSection.innerHTML += `<p>${Chords.length} distinct chords</p>`;
	// PAGE.content.append(listSection);

	getChordData(Chords);
	const table = new W.Table(['Name', 'Diagram', 'Notation', 'Intervals', 'Notes'], 1);
	for (const chord of Chords) {
		table.addRow();
		table.addCell(chord.name);
		// const diagram = (chord.diagram) ? chord.diagram.innerHTML : '';
		const diagram = '';
		table.addCell(diagram);
		table.addCell(chord.notation);
		table.addCell(chord.intervals.join(' '));
		table.addCell(chord.notes.join(' '));
	}
	table.fillTable()
	const tableSection = table.element;
	PAGE.content.append(tableSection);
}

function getChordData(chordStructures: ChordStructure[]) {
	const instrument = new Instrument('guitar');
	for (let chordStructure of chordStructures) {
		const chordObject = new Chord(chordStructure.name, instrument, chordStructure.notation);
		chordStructure.intervals = chordObject.intervals();
		chordStructure.notes = chordObject.intervals(true);
		chordStructure.diagram = chordObject.diagram('sans-serif', 0.5);
	}
}

async function getChords(fakesheets: Map<string, T.FileStats>) {
	
	/** Extract and normalize chord notation strings (e.g., "C7 x32310") from fakesheets */
	let chordNotations: string[] = [];
	for (const fakesheet of fakesheets.keys()) { /** fakesheet.key() is the subpath of the fakesheet file */
		const fullPath = `${FakesheetsPath}/${fakesheet}`;
		await Fetch.text(fullPath).then((fileText) => {
			const markdown = new MD.Markdown(fileText);
			const chordsKey = 'chords';
			if (markdown.metadata && chordsKey in markdown.metadata) {
				for (let chordNotation of markdown.metadata[chordsKey] as string[]) {
					chordNotation = chordNotation.trim();
					if (chordNotation.split(/\s+/).length == 2) {
						chordNotation = chordNotation.replace(/\s+/, ' ');
						chordNotations.push(chordNotation);
					}
					else console.log(`Invalid chord/notation in ${fakesheet}: ${chordNotation}`);
				}
			}
		});
	}

	/** Sort the chord-notation strings */
	chordNotations = chordNotations.sort((a,b) => {
		const aWords = a.split(/\s+/);
		const bWords = b.split(/\s+/);
		let result = 0;
		for (let i = 0; !result && i < 2; i += 1) result = aWords[i].localeCompare(bWords[i]);
		return result;
	});

	/** For each distinct chord-notation, create and return ChordStructure data */
	const chordData: ChordStructure[] = [];
	let previousChordNotation = ''
	for (const chordNotation of chordNotations) {
		if (previousChordNotation != chordNotation) {
			const [name, notation] = chordNotation.split(/\s+/);
			chordData.push({ name: name, notation: notation, intervals: [], notes: [], diagram: null});
		}
		previousChordNotation = chordNotation;
	}
	return chordData;
}
