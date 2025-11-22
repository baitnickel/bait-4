import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as MD from './lib/md.js';
import { Instrument, Chord } from './lib/fakesheet.js';
import * as W from './lib/widgets.js';
import { SVG, Point } from './lib/graphics.js';

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
	const rangeWidgetParagraph = document.createElement('p');
	const textWidgetParagraph = document.createElement('p');
	const svgParagraph = document.createElement('p');
	const intervalsDiv = document.createElement('div');
	PAGE.content.append(rangeWidgetParagraph);
	PAGE.content.append(textWidgetParagraph);
	PAGE.content.append(svgParagraph);
	PAGE.content.append(intervalsDiv);
			const testDiv = document.createElement('div');
			PAGE.content.append(testDiv);
	const diagramSize = new W.Range('Diagram Size', 24, 4, 64, 1, ['Pixels'], true);
	// const sizes: string[] = [];
	// for (let i = 4; i < 30; i += 2) sizes.push(i.toString());
	// const diagramSize = new W.Select('Diagram Size: ', sizes);
	rangeWidgetParagraph.append(diagramSize.label);
	rangeWidgetParagraph.append(diagramSize.element);
	rangeWidgetParagraph.append(diagramSize.element.outerText);
	const textEntry = new W.Text('Enter Notation: ', '');
	// textEntry.label.className = 'sans-serif';
	textWidgetParagraph.append(textEntry.label);
	textWidgetParagraph.append(textEntry.element);
	textWidgetParagraph.append('\u00A0\u00A0 e.g.: "x02210"');
	const instrument = new Instrument('guitar');

	diagramSize.element.addEventListener('change', () => {
		if (PAGE.local) {
			testDiv.innerHTML = '';
			newDiagram(testDiv, diagramSize);
		}
	});

	textEntry.element.addEventListener('change', () => {
		const notation = textEntry.element.value.trim().toLowerCase();
		svgParagraph.innerHTML = '';
		intervalsDiv.innerHTML = '';
		const diagramChord = new Chord('C', instrument, notation);
		const pixels = Number(diagramSize.element.value);
		svgParagraph.append(diagramChord.diagram('sans-serif', 1, pixels, notation)); // 'sans-serif', 0.5
		const grid = document.createElement('div');
		grid.className = 'grid-auto';
		const chordData = getChordData(instrument, notation);
		sortChordData(chordData);
		displayChordData(chordData, grid, intervalsDiv);
		textEntry.element.value = '';
	});

	if (PAGE.local) newDiagram(testDiv, diagramSize);
}

function newDiagram(division: HTMLDivElement, diagramSize: W.Range) {
	/**
	 * @todo
	 * 
	 * Maintain an undo/redo array of buttons clicked; the values being
	 * (taken from) button IDs--pointing to the clicked element and also
	 * indicating string and fret.
	 */

	const fingerings: string[] = [];

	/** fretWidth determines the scale of everything. 25...50 is a reasonable range */
	const fretWidth = Number(diagramSize.element.value);
	const fretHeight = fretWidth * 1.5;
	const strings = 6;
	const frets = 5;

	const fretNumberWidth = fretWidth * .75;
	const fretMargin = fretWidth / 2;
	const gridWidth = fretWidth * (strings - 1);
	const gridHeight = fretHeight * frets + fretMargin; /** fretMargin adds margin on bottom (necessary?) */
	const gridCenter = gridWidth / 2;
	const nameHeight = fretHeight * .75;
	const nutHeight = fretHeight / 4;

	const width = fretNumberWidth + (fretMargin * 2) + gridWidth;
	const height = nameHeight + nutHeight + gridHeight;
	
	const svg = new SVG(width, height, 'red');

	const gridPoint = new Point(fretNumberWidth + fretMargin, nameHeight + nutHeight);
	const namePoint = new Point(gridPoint.x + gridCenter, nameHeight * .75);

	/** initialize the nut mark elements (one for each string, 6th thru 1st) */
	const nutMarks: SVGTextElement[] = [];
	for (let string = 0; string < strings; string += 1) {
		const x = gridPoint.x + (string * fretWidth);
		const y = nameHeight + (nutHeight * .67);
		const point = new Point(x, y);
		nutMarks.push(svg.addText(point, 'middle', {value: '', fontSize: fretHeight / 3, fontFamily: 'sans-serif'}));
	}
	/** initialize the fret number elements (one for each fret relative to the top fret) */
	const fretNumbers: SVGTextElement[] = [];
	for (let fret = 0; fret < frets; fret += 1) {
		const x = fretNumberWidth;
		const y = nameHeight + nutHeight + (fretHeight / 2) + (fret * fretHeight);
		const point = new Point(x, y);
		fretNumbers.push(svg.addText(point, 'end', {value: '', fontSize: fretHeight / 4, fontFamily: 'sans-serif'}));
	}
	/**
	 * Initialize the finger mark elements (one for each fret of each
	 * string). These will serve as hotspots, becoming visible only when
	 * clicked.
	 */
	const fingerIDs: string[] = [];
	const radius = fretWidth / 3;
	for (let string = 0; string < strings; string += 1) {
		const x = gridPoint.x + (string * fretWidth);
		for (let fret = 0; fret < frets; fret += 1) {
			const y = nameHeight + nutHeight + (fretHeight / 2) + (fret * fretHeight);
			const point = new Point(x, y);
			// const visible = (string == 0 && fret == 2) || (string == 1 && fret == 1) || (string == 5 && fret == 2);
			const fingerMark = svg.addCircle(point, radius, false);
			fingerMark.id = `${string},${fret}`;

			fingerMark.addEventListener('click', () => {
				fingered(fingerMark.id, fingerIDs);
				// fingerIDs.push(fingerMark.id);
				// fingerMark.setAttribute('visibility', 'visible');
			});
		}
	}

	svg.addGrid(gridPoint, strings - 1, frets, fretWidth, fretHeight);
	svg.addText(namePoint, 'middle', {value: 'G major', fontSize: fretHeight / 3, fontFamily: 'sans-serif'});
	for (let fret = 0; fret < frets; fret += 1) fretNumbers[fret].innerHTML = `${fret + 1}`;
	nutMarks[2].innerHTML = 'o';
	nutMarks[3].innerHTML = 'o';
	nutMarks[4].innerHTML = 'o';

	const paragraph = document.createElement('p');
	paragraph.append(svg.element);
	division.append(paragraph);
}

function fingered(id: string, fingerIDs: string[]) {
	console.log(id);
	fingerIDs.push(id);
	const element = document.getElementById(id);
	if (element) {
		console.log('trying to change visibility')
		/** toggle between hidden and visible */
		const opacity = element.getAttribute('fill-opacity');
		if (opacity !== null) {
			if (opacity == '0') element.setAttribute('fill-opacity', '1');
			else element.setAttribute('fill-opacity', '0');
		}
		// element.setAttribute('visibility', 'visible');
	}
	else console.log('cannot get element ID');
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


/*
flagButton.addEventListener('click', () => {
	const text = `Flagged Image: ${imageSet.images[imageSet.index]}`;
	const logEntry: T.LogEntry = { text: text };
	Fetch.api<T.LogEntry>(`${PAGE.backend}/log/`, logEntry).then((response) => { console.log(response)});
});
*/

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


// /** display hand-drawn SVG */
/**
 * @todo
 * If we can draw a frame with hidden buttons (circles, rectangles,
 * triangles, etc.), we could modify the SVG in place (dynamic file),
 * turning fret spots on and off, etc. This would eliminate scaling
 * issues. (drawing can be done with a new Chord.diagram method)
 * 
 * But a panel (div) with a framework background, and an array of button
 * elements laid across it, buttons positioned via relative percentages
 * within the panel. Buttons can be turned on and off, hidden and
 * visible, in a very straightforward (and scalable) way. Right?
 */
// const SVG = 'http://www.w3.org/2000/svg';

// const svg = document.createElementNS(SVG, 'svg');
// svg.setAttribute('width', '400');
// svg.setAttribute('height', '400');
// svg.setAttribute('viewBox', '0 0 400 400');
// const rectangle1 = document.createElementNS(SVG, 'rect');
// rectangle1.setAttribute('x', '150');
// rectangle1.setAttribute('y', '150');
// rectangle1.setAttribute('width', '100');
// rectangle1.setAttribute('height', '100');
// rectangle1.setAttribute('fill', '#f00');
// const rectangle2 = document.createElementNS(SVG, 'rect');
// rectangle2.setAttribute('x', '100');
// rectangle2.setAttribute('y', '200');
// rectangle2.setAttribute('width', '100');
// rectangle2.setAttribute('height', '100');
// rectangle2.setAttribute('fill', '#00f');
// rectangle2.setAttribute('fill-opacity', '1');

// svg.appendChild(rectangle1);
// svg.appendChild(rectangle2);
// testDiv.append(svg);

// rectangle1.addEventListener('click', () => { console.log('clicked on red'); });
// rectangle2.addEventListener('click', () => {
// 	console.log('clicked on blue');

// 	/** toggle between hidden and visible */
// 	const opacity = rectangle2.getAttribute('fill-opacity');
// 	if (opacity !== null) {
// 		if (opacity == '0') rectangle2.setAttribute('fill-opacity', '1');
// 		else rectangle2.setAttribute('fill-opacity', '0');
// 	}

	/** fade out with each click then return to visible */
	// let opacity = rectangle2.getAttribute('fill-opacity');
	// if (opacity !== null) {
	// 	let value = Number(opacity);
	// 	if (value <= 0) value = 1;
	// 	else value -= .1;
	// 	rectangle2.setAttribute('fill-opacity', `${value}`);
	// }
// });

/** display SVG image from file created using the "Graphic" app */
// const fretboard = document.createElement('img');
// fretboard.setAttribute('src', `${PAGE.site}/images/music/fretboard.svg`);
// fretboard.width = 180;
// testDiv.append(fretboard);

/** display side-by-side diagramed chords to compare scaling */
// const chords = ['Cmaj7 332000', 'Gmaj7 320002'];
// let first = true;
// for (const chord of chords) {
// 	const [chordName, notation] = chord.split(/\s+/);
// 	const diagramChord = new Chord(chordName, instrument, notation);
// 	if (first) testDiv.append(diagramChord.diagram()); /** default */
// 	else testDiv.append(diagramChord.diagram('sans-serif', 1, 14)); /** nearly equivalent grid; xoxo, dots, name scaled a little differently */
// 	first = false;
// }

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
