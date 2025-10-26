import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as MD from './lib/md.js';
import { Instrument, Chord } from './lib/fakesheet.js';
import * as W from './lib/widgets.js';

import { Markup } from './lib/markup.js';
// const W3NameSpace = 'http://www.w3.org/2000/svg';

/** 
 * @todo
 * Draw a simple fretboard made up of toggle buttons in a grid, with toggle
 * buttons for open vs muted strings, styled drop-down for starting fret number
 * (usually 1). Also need refresh/clear/undo/redo. Text input should allow a
 * chord name--on resolution create the notation and log it if so desired. The
 * reverse operation is done when the user operates the fretboard, announcing
 * notations and possible chord name(s) with every button press. Interpretation
 * of the chord names will rely primarily upon 1) designation of the root and at
 * least one other note, 2) looking up the interval pattern in an intervals/chord
 * name library.
 * 
 * Lots of display-chord possibilities. In addition to displaying fretboard
 * fingering, we can display piano fingering.
 */

/**
 * Display a table of guitar chords, showing name, notation, intervals, notes
 * (and diagram?). Chord data is taken from fakesheets' "chords" metadata,
 * sorted uniquely by name and notation.
 */
type ChordStructure = {
	name: string;
	notation: string;
	intervals: string[];
	pattern: string;
	notes: string[];
	diagram: SVGSVGElement|null;
}

const PAGE = new Page();
PAGE.setTitle('Chords', 1);
const FakesheetIndices = `${PAGE.site}/Indices/fakesheets.json`;
const FakesheetsPath = `${PAGE.site}/Content/fakesheets`;
const Fakesheets = await Fetch.map<T.FileStats>(FakesheetIndices);
// const Chords = await getChords(Fakesheets);
const ChordModifiers = await Fetch.map<string>(`${PAGE.site}/data/chords/intervals.yaml`);

export function render() {
	/** Simply list Chords */
	// const listSection = document.createElement('div');
	// const flattenedChords: string[] = [];
	// for (const chord of Chords) flattenedChords.push(`${chord.name} ${chord.notation}`);
	// listSection.innerHTML = flattenedChords.join('<br>');
	// listSection.innerHTML += `<p>${Chords.length} distinct chords</p>`;
	// PAGE.content.append(listSection);

	/** Display a Table of CHords data */
	// getChordData(Chords);
	// const table = new W.Table(['Name', 'Diagram', 'Notation', 'Pattern', 'Intervals', 'Notes'], 1);
	// for (const chord of Chords) {
	// 	table.addRow();
	// 	table.addCell(chord.name);
	// 	const diagram = (chord.diagram === null) ? '' : chord.diagram; 
	// 	const diagramCell = table.addCell('');
	// 	diagramCell.append(diagram);
	// 	table.addCell(chord.notation);
	// 	table.addCell(chord.pattern);
	// 	table.addCell(chord.intervals.join(' '));
	// 	table.addCell(chord.notes.join(' '));
	// }
	// table.fillTable()
	// const tableSection = table.element;
	// PAGE.content.append(tableSection);

	/** Interactive chord/interval utilities */
	const textWidgetParagraph = document.createElement('p');
	const intervalsParagraph = document.createElement('p');
	const svgParagraph = document.createElement('p');
	PAGE.content.append(textWidgetParagraph);
	PAGE.content.append(intervalsParagraph);
	PAGE.content.append(svgParagraph);
	const textEntry = new W.Text('Enter Root Note & Notation (separated by space): ', '');
	// textEntry.label.className = 'sans-serif';
	textWidgetParagraph.append(textEntry.label);
	textWidgetParagraph.append(textEntry.element);
	textWidgetParagraph.append('\u00A0\u00A0 e.g.: "A x02210"');
	const instrument = new Instrument('guitar');
	// instrument.updatePitches(['D','Bb','D','G','B','E']);
	textEntry.element.addEventListener('change', () => {
		let entry = textEntry.element.value.trim();
		entry = entry[0].toUpperCase() + entry.slice(1); /** allow lowercase root here */
		const [chordName, notation] = entry.split(/\s+/);
		const chord = new Chord(chordName, instrument, notation);

		const intervals = chord.intervals();
		const intervalPattern = chord.intervalPattern(intervals);
		let chordModifier = ChordModifiers.get(intervalPattern);
		if (chordModifier === undefined) chordModifier = '?';
		else if (!chordModifier) chordModifier = ' major';
		intervalsParagraph.innerHTML = `Root: ${chordName}, Notation: ${notation}`; //<br>
		intervalsParagraph.innerHTML += `<br>Looks like ${chord.root}${chordModifier} (${intervalPattern})`;
		const notes = chord.intervals(true);
		intervalsParagraph.innerHTML += '<p>';
		const intervalsAndNotes: string[] = [];
		for (let i = 0; i < intervals.length; i += 1) {
			intervalsAndNotes.push(`${intervals[i]}:${notes[i]}`);
		}
		intervalsParagraph.innerHTML += `${intervalsAndNotes.join(`\u00A0\u00A0`)}`;
		intervalsParagraph.innerHTML += '</p>';
		svgParagraph.append(chord.diagram()); // 'sans-serif', 0.5
		textEntry.element.value = '';
	});
}

function getChordData(chordStructures: ChordStructure[]) {
	const instrument = new Instrument('guitar');
	for (let chordStructure of chordStructures) {
		const chordObject = new Chord(chordStructure.name, instrument, chordStructure.notation);
		chordStructure.intervals = chordObject.intervals();
		const intervalPattern = chordObject.intervalPattern(chordStructure.intervals);
		let chordModifier = ChordModifiers.get(intervalPattern);
		if (chordModifier === undefined) chordModifier = '?';
		else if (!chordModifier) chordModifier = 'major';
		chordStructure.pattern = `${intervalPattern} (${chordModifier})`;
		chordStructure.notes = chordObject.intervals(true);
		chordStructure.diagram = chordObject.diagram('sans-serif', 1);
	}
}

/**
 * @todo
 * Add the ability to select a single fakesheet
 */
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
			chordData.push({ name: name, notation: notation, intervals: [], pattern: '', notes: [], diagram: null});
		}
		previousChordNotation = chordNotation;
	}
	return chordData;
}
