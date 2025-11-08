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

// type ChordStructure = {
// 	name: string;
// 	notation: string;
// 	intervals: string[];
// 	pattern: string;
// 	notes: string[];
// 	diagram: SVGSVGElement|null;
// }

const PAGE = new Page();
PAGE.setTitle('Chords', 1);
// const FakesheetIndices = `${PAGE.site}/Indices/fakesheets.json`;
// const FakesheetsPath = `${PAGE.site}/Content/fakesheets`;
// const Fakesheets = await Fetch.map<T.FileStats>(FakesheetIndices);
// const Chords = await getChords(Fakesheets);
// const ChordModifiers = await Fetch.map<string>(`${PAGE.site}/data/chords/intervals.yaml`);

type ChordData = {
	root: string;
	intervals: string[];
	notes: string[];
	intervalPattern: string;
	modifier: string;
}

export function render() {
	/** Interactive chord/interval utilities */
	const roots = ['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'];
	const textWidgetParagraph = document.createElement('p');
	const svgParagraph = document.createElement('p');
	const intervalsDiv = document.createElement('div');
			const testDiv = document.createElement('div');
	PAGE.content.append(textWidgetParagraph);
	PAGE.content.append(svgParagraph);
	PAGE.content.append(intervalsDiv);
			PAGE.content.append(testDiv);
	const textEntry = new W.Text('Enter Notation: ', '');
	// textEntry.label.className = 'sans-serif';
	textWidgetParagraph.append(textEntry.label);
	textWidgetParagraph.append(textEntry.element);
	textWidgetParagraph.append('\u00A0\u00A0 e.g.: "x02210"');
	const instrument = new Instrument('guitar');

	textEntry.element.addEventListener('change', () => {
		const notation = textEntry.element.value.trim().toLowerCase();
		svgParagraph.innerHTML = '';
		intervalsDiv.innerHTML = '';
		const diagramChord = new Chord('C', instrument, notation);
		svgParagraph.append(diagramChord.diagram('sans-serif', 1, 16, notation)); // 'sans-serif', 0.5
		const grid = document.createElement('div');
		grid.className = 'grid-auto';
		const chordData = getChordData(instrument, notation);
		sortChordData(chordData);
		displayChordData(chordData, grid, intervalsDiv);
		textEntry.element.value = '';
	});

	if (PAGE.local) {

		// /** display hand-drawn SVG */
		// const fretboard = document.createElement('img');
		// fretboard.setAttribute('src', `${PAGE.site}/images/music/fretboard.svg`);
		// fretboard.width = 180;
		// testDiv.append(fretboard);

		/** display side-by-side diagramed chords to compare scaling */
		const chords = ['Cmaj7 332000', 'Gmaj7 320002'];
		let first = true;
		for (const chord of chords) {
			const [chordName, notation] = chord.split(/\s+/);
			const diagramChord = new Chord(chordName, instrument, notation);
			if (first) testDiv.append(diagramChord.diagram()); /** default */
			else testDiv.append(diagramChord.diagram('sans-serif', 1, 14)); /** nearly equivalent grid; xoxo, dots, name scaled a little differently */
			first = false;
		}

		// const fretboard = document.createElement('p');
		// // fretboard.style.width = '173px';
		// // fretboard.style.height = '231px';
		// // fretboard.style.backgroundImage = `url(${PAGE.site}/Images/fretboard.png)`;
		// const diagramChord = new Chord('C', instrument, 'xxxxxx');
		// const svg = diagramChord.diagram('sans-serif', 1, 16, ' okay ');
		// const outerHTML = svg.outerHTML;
		// fretboard.innerText = outerHTML; /** displays SVG as text */
		// // fretboard.innerHTML = outerHTML; /** displays SVG image */
		// // fretboard.style.backgroundImage = outerHTML; /** does not work */


		// // const diagramImage = document.createElement('img');
		// // diagramImage.setAttribute('src', 'data:image/sg+xml,' + svg);
		// // fretboard.style.backgroundImage = `url(${'data:image/sg+xml,' + outerHTML})`;
		// // fretboard.style.backgroundImage = `url(${outerHTML})`;
		// // fretboard.style.backgroundImage = `url(${diagramChord.diagram('sans-serif', 1, 16, ' okay ')})`;
		// // fretboard.innerHTML += `width: ${width}<br>`;
		// // fretboard.innerHTML += `height: ${height}<br>`;

		// // fretboard.innerHTML = 'The quick brown fox jumps over the lazy dog. '.repeat(8);
		// testDiv.append(fretboard);
	}
}

function getChordData(instrument: Instrument, notation: string) {
	const chordData: ChordData[] = [];
	const roots = ['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'];
	for (const root of roots) {
		const chord = new Chord(root, instrument, notation);
		const intervals = chord.intervals();
		const notes = chord.notes(true);
		const intervalPattern = chord.intervalPattern(intervals);
		if (intervalPattern.startsWith('1-')) {
			let modifier = chord.modifier(intervals);
			chordData.push({
				root: root,
				intervals: intervals,
				notes: notes,
				intervalPattern: intervalPattern,
				modifier: modifier
			});
		}
	}
	return chordData;
}

function sortChordData(chordData: ChordData[]) {
	chordData.sort((a,b) => {
		const aKnownModifier = (a.modifier != '?') ? 1 : 0;
		const bKnownModifier = (b.modifier != '?') ? 1 : 0;
		const aPrimary = (a.intervals[0] == '1') ? 1 : 0;
		const bPrimary = (b.intervals[0] == '1') ? 1 : 0;
		let result = bKnownModifier - aKnownModifier;
		if (!result) result = bPrimary - aPrimary;
		if (!result) result = a.root.localeCompare(b.root);
		return result;
	});
}

function displayChordData(chordData: ChordData[], grid: HTMLDivElement, intervalsDiv: HTMLDivElement) {		
	for (const chordDatum of chordData) {
		const gridItem = document.createElement('div');
		gridItem.className = 'grid-cell small';
		if (chordDatum.modifier != '?') {
			const highlight = (chordDatum.intervals[0] == '1') ? 'red' : 'blue';
			gridItem.classList.add(highlight);
		}
		gridItem.innerHTML += `${chordDatum.root}${chordDatum.modifier} (${chordDatum.intervalPattern})`;
		const intervalsAndNotes: string[] = [];
		for (let i = 0; i < chordDatum.intervals.length; i += 1) {
			intervalsAndNotes.push(`${chordDatum.intervals[i]}: ${chordDatum.notes[i]}`);
		}
		gridItem.innerHTML += `<br>${intervalsAndNotes.join(`\u00A0\u00A0`)}`;
		grid.append(gridItem);
	}
	intervalsDiv.append(grid);
}

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

// function getChordData(chordStructures: ChordStructure[]) {
// 	const instrument = new Instrument('guitar');
// 	for (let chordStructure of chordStructures) {
// 		const chordObject = new Chord(chordStructure.name, instrument, chordStructure.notation);
// 		chordStructure.intervals = chordObject.intervals();
// 		const intervalPattern = chordObject.intervalPattern(chordStructure.intervals);
// 		let chordModifier = ChordModifiers.get(intervalPattern);
// 		if (chordModifier === undefined) chordModifier = '?';
// 		else if (!chordModifier) chordModifier = 'major';
// 		chordStructure.pattern = `${intervalPattern} (${chordModifier})`;
// 		chordStructure.notes = chordObject.intervals(true);
// 		chordStructure.diagram = chordObject.diagram('sans-serif', 1);
// 	}
// }

/**
 * @todo
 * Add the ability to select a single fakesheet
 */
// async function getChords(fakesheets: Map<string, T.FileStats>) {
	
// 	/** Extract and normalize chord notation strings (e.g., "C7 x32310") from fakesheets */
// 	let chordNotations: string[] = [];
// 	for (const fakesheet of fakesheets.keys()) { /** fakesheet.key() is the subpath of the fakesheet file */
// 		const fullPath = `${FakesheetsPath}/${fakesheet}`;
// 		await Fetch.text(fullPath).then((fileText) => {
// 			const markdown = new MD.Markdown(fileText);
// 			const chordsKey = 'chords';
// 			if (markdown.metadata && chordsKey in markdown.metadata) {
// 				for (let chordNotation of markdown.metadata[chordsKey] as string[]) {
// 					chordNotation = chordNotation.trim();
// 					if (chordNotation.split(/\s+/).length == 2) {
// 						chordNotation = chordNotation.replace(/\s+/, ' ');
// 						chordNotations.push(chordNotation);
// 					}
// 					else console.log(`Invalid chord/notation in ${fakesheet}: ${chordNotation}`);
// 				}
// 			}
// 		});
// 	}

// 	/** Sort the chord-notation strings */
// 	chordNotations = chordNotations.sort((a,b) => {
// 		const aWords = a.split(/\s+/);
// 		const bWords = b.split(/\s+/);
// 		let result = 0;
// 		for (let i = 0; !result && i < 2; i += 1) result = aWords[i].localeCompare(bWords[i]);
// 		return result;
// 	});

// 	/** For each distinct chord-notation, create and return ChordStructure data */
// 	const chordData: ChordStructure[] = [];
// 	let previousChordNotation = ''
// 	for (const chordNotation of chordNotations) {
// 		if (previousChordNotation != chordNotation) {
// 			const [name, notation] = chordNotation.split(/\s+/);
// 			chordData.push({ name: name, notation: notation, intervals: [], pattern: '', notes: [], diagram: null});
// 		}
// 		previousChordNotation = chordNotation;
// 	}
// 	return chordData;
// }
