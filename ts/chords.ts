import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as MD from './lib/md.js';
import { Instrument, Chord } from './lib/fakesheet.js';
import * as W from './lib/widgets.js';
import { SVG, Point, RichText } from './lib/graphics.js';

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
	const diagramSize = new W.Range('Diagram Size', 32, 24, 64, 1, ['Pixels'], true);
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

/**
 * @todo
 * 
 * Maintain an undo/redo array of buttons clicked; the values being
 * (taken from) button IDs--pointing to the clicked element and also
 * indicating string and fret.
 * 
 * Save diagrams to a downloadable "chord library file"--function to take a
 * key and notation, and return a chord name--this is enough to generate a
 * diagram.
 */
function newDiagram(division: HTMLDivElement, diagramSize: W.Range) {

	const paragraph = document.createElement('p');
	const instrument = new Instrument('guitar');
	const diagram = new ChordDiagram(instrument.strings, 5, Number(diagramSize.element.value));
	paragraph.append(diagram.svg.element);
	division.append(paragraph);
}

class ChordDiagram {
	svg: SVG;
	strings: number;
	frets: number;
	firstFret: number;
	chordName: SVGTextElement;
	nutMarks: SVGTextElement[];
	fretNumbers: SVGTextElement[];
	fingerMarks: SVGCircleElement[];
	fretted: number[];
	width: number;
	height: number;
	fretWidth: number;
	fretHeight: number;
	fretNumberWidth: number;
	fretMargin: number;
	gridWidth: number;
	gridHeight: number;
	gridCenter: number;
	nameHeight: number;
	nutHeight: number;
	gridPoint: Point;
	namePoint: Point;

	static open = 'o';
	static mute = 'x';
	static up = '\u21e7';
	static down = '\u21e9';
	static defaultText: RichText = { value: '', fontSize: 12, fontFamily: 'sans-serif' };

	constructor(strings: number, frets: number, fretWidth: number, borderColor = '') {
		this.strings = strings;
		this.frets = frets;
		this.fretted = []; /** an array of actual fretted positions, one for each string */
		for (let string = 0; string < this.strings; string += 1) this.fretted.push(-1);
		this.fretWidth = fretWidth;
		this.fretHeight = fretWidth * 1.3;
		this.fretNumberWidth = fretWidth * .6; // .75
		this.fretMargin = fretWidth * .4; // .5
		this.gridWidth = fretWidth * (strings - 1);
		this.gridHeight = this.fretHeight * frets + this.fretMargin; // is bottom margin necessary?
		this.gridCenter = this.gridWidth * .5; // will always be .5 (centered in the middle)
		this.nameHeight = this.fretHeight; // * .75;
		this.nutHeight = this.fretHeight * .3; //.25;
		this.width = this.fretNumberWidth + (this.fretMargin * 2) + this.gridWidth;
		this.height = this.nameHeight + this.nutHeight + this.gridHeight;
		this.gridPoint = new Point(this.fretNumberWidth + this.fretMargin, this.nameHeight + this.nutHeight);
		this.namePoint = new Point(this.gridPoint.x + this.gridCenter, this.nameHeight * .6); // .75
		this.svg = new SVG(this.width, this.height, borderColor);
		this.svg.addGrid(this.gridPoint, this.strings - 1, this.frets, this.fretWidth, this.fretHeight);
		this.chordName = this.chordNameElement(.5); // .33
		this.nutMarks = this.nutMarkElements(.5, .4); // (.67,.33);
		this.firstFret = 1;
		this.fretNumbers = this.fretNumberElements(this.firstFret, .6, .25);
		this.fingerMarks = this.fingerMarkElements(.5, .275);
	}

	/** Initialize the chord name element */
	chordNameElement(verticalAdjustment: number) {
		const richText = ChordDiagram.defaultText;
		richText.fontSize = this.fretHeight * verticalAdjustment;
		const chordName = this.svg.addText(this.namePoint, 'middle', richText);
		return chordName;
	}

	setChordName(name: string) {
		this.chordName.innerHTML = name;
	}

	/**
	 * Initialize the nut mark elements (one for each string, bass thru treble).
	 */
	nutMarkElements(verticalAdjustment: number, fontSizeAdjustment: number) {
		const nutMarks: SVGTextElement[] = [];
		const richText = ChordDiagram.defaultText;
		richText.value = ChordDiagram.mute;
		richText.fontSize = this.fretHeight * fontSizeAdjustment;
		for (let string = 0; string < this.strings; string += 1) {
			const x = this.gridPoint.x + (string * this.fretWidth);
			const y = this.nameHeight + (this.nutHeight * verticalAdjustment);
			const point = new Point(x, y);
			const nutMark = this.svg.addText(point, 'middle', richText);
			nutMarks.push(nutMark);

			nutMark.addEventListener('click', () => {
				const currentMark = nutMark.innerHTML;
				if (currentMark) {
					const newMark = (currentMark == ChordDiagram.mute) ? ChordDiagram.open : ChordDiagram.mute;
					this.setNutMark(string, newMark);
					this.fretted[string] = (newMark == ChordDiagram.open) ? 0 : -1;
					this.setChordName(this.notation());
				}
			});
		}
		return nutMarks;
	}

	setNutMark(string: number, value: string) {
		this.nutMarks[string].innerHTML = value;
	}

	/**
	 * Initialize the fret number elements (one for each fret relative to the
	 * top fret).
	 */
	fretNumberElements(firstFret: number, verticalAdjustment: number, fontSizeAdjustment: number) {
		const fretNumbers: SVGTextElement[] = [];
		const richText = ChordDiagram.defaultText;
		richText.fontSize = this.fretHeight * fontSizeAdjustment;
		for (let fret = 0; fret < this.frets; fret += 1) {
			richText.value = `${fret + firstFret}`;
			const x = this.fretNumberWidth;
			const y = this.nameHeight + this.nutHeight + (this.fretHeight * verticalAdjustment) + (fret * this.fretHeight);
			const point = new Point(x, y);
			fretNumbers.push(this.svg.addText(point, 'end', richText));
		}
		return fretNumbers;
	}

	setFretNumbers(firstFret: number) {
		this.firstFret = firstFret;
		for (let fret = 0; fret < this.frets; fret += 1) this.fretNumbers[fret].innerHTML = `${fret + firstFret}`;
	}

	/**
	 * Initialize the finger mark elements (one for each fret of each
	 * string). These will serve as hotspots, becoming visible only when
	 * clicked.
	 */
	fingerMarkElements(verticalAdjustment: number, radiusAdjustment: number, ) {
		const fingerMarks: SVGCircleElement[] = [];
		const radius = this.fretWidth * radiusAdjustment;
		for (let string = 0; string < this.strings; string += 1) {
			const x = this.gridPoint.x + (string * this.fretWidth);
			for (let fret = 0; fret < this.frets; fret += 1) {
				const y = this.nameHeight + this.nutHeight + (this.fretHeight * verticalAdjustment) + (fret * this.fretHeight);
				const point = new Point(x, y);
				const fingerMark = this.svg.addCircle(point, radius, false);
				fingerMark.id = `${string},${fret}`;
				fingerMarks.push(fingerMark);

				fingerMark.addEventListener('click', () => {
					this.markString(fingerMark, string, fret);
					this.setChordName(this.notation());
				});
			}
		}
		return fingerMarks;
	}

	/**
	 * Called as a fingerMark event listener to update the display and manage
	 * underlying data.
	 */
	markString(element: SVGCircleElement, string: number, fret: number) {
		const opacity = element.getAttribute('fill-opacity');
		if (opacity !== null) {
			if (opacity == '0') this.setString(string, fret);
			else this.resetString(string);
		}
	}

	/**
	 * Clear the string's nutMark, show the fingerMark at the given string and
	 * fret, and hide any other fingerMarks on that string.
	 */
	setString(string: number, fret: number) {
		this.setNutMark(string, '');
		this.fretted[string] = fret + this.firstFret;
		for (const fingerMark of this.fingerMarks) {
			const [stringID, fretID] = fingerMark.id.split(',');
			if (Number(stringID) == string) {
				const opacity = (Number(fretID) == fret) ? '1' : '0';
				fingerMark.setAttribute('fill-opacity', opacity);
			}
		}
	}
	
	/**
	 * Set string's nutMark to muted and hide all fingerMarks.
	 */
	resetString(string: number) {
		const nutMark = ChordDiagram.mute;
		this.setNutMark(string, nutMark);
		this.fretted[string] = -1;
		for (const fingerMark of this.fingerMarks) {
			const [stringID, fretID] = fingerMark.id.split(',');
			if (Number(stringID) == string) fingerMark.setAttribute('fill-opacity', '0');
		}
	}

	/**
	 * Given fretted positions, return the guitar tab-like notation.
	 */
	notation() {
		let notation = '';
		for (let i = 0; i < this.fretted.length; i += 1) {
			if (this.fretted[i] < 0) notation += ChordDiagram.mute;
			else if (this.fretted[i] > 9) notation += `(${this.fretted[i]})`;
			else notation += `${this.fretted[i]}`;
		}
		return notation;
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
