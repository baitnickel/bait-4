import { Page } from './lib/page.js';
import { Instrument, Chord } from './lib/fakesheet.js';
import { SVG, RichText, XY } from './lib/graphics.js';

type ChordData = {
	root: string;
	intervals: string[];
	notes: string[];
	intervalPattern: string;
	modifier: string;
}

const PAGE = new Page();
PAGE.setTitle('Chords', 1);

export function render() {
	const rangeWidgetParagraph = document.createElement('p');
	const textWidgetParagraph = document.createElement('p');
	const svgParagraph = document.createElement('p');
	const intervalsDiv = document.createElement('div');
	PAGE.content.append(rangeWidgetParagraph);
	PAGE.content.append(textWidgetParagraph);
	PAGE.content.append(svgParagraph);
	PAGE.content.append(intervalsDiv);

	const gridContainer = document.createElement('div');
	gridContainer.className = 'grid-auto';
	PAGE.content.append(gridContainer);
	
	const instrument = new Instrument('guitar');
	const diagram = new ChordDiagram(instrument, 5, 32, gridContainer);
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
// function newDiagram(division: HTMLDivElement, diagramSize: W.Range) {

class ChordDiagram {
	svg: SVG;
	diagramCell: HTMLElement;
	chordsCell: HTMLElement;
	notationsCell: HTMLElement;
	saveButton: HTMLButtonElement;
	instrument: Instrument;
	strings: number;
	frets: number;
	firstFret: number;
	fretted: number[];
	chordName: SVGTextElement|null;
	nutMarks: SVGTextElement[];
	fretNumbers: SVGTextElement[];
	fingerMarks: SVGCircleElement[];
	notes: SVGTextElement[];
	intervals: SVGTextElement[];
	savedChordDefinitions: string[];

	static open = 'o';
	static mute = 'x';
	static mutedString = -1;
	static openString = 0;
	static defaultText: RichText = { value: '', fontSize: 0, fontFamily: 'sans-serif' };

	constructor(instrument: Instrument, frets: number, singleFretWidth: number, container: HTMLElement, borderColor = '') {
		this.diagramCell = document.createElement('div');
		this.diagramCell.className = 'grid-cell';
		this.chordsCell = document.createElement('div');
		this.chordsCell.className = 'grid-cell small sans-serif';
		this.notationsCell = document.createElement('div');
		this.notationsCell.className = 'grid-cell small sans-serif';
		container.append(this.diagramCell);
		container.append(this.chordsCell);
		container.append(this.notationsCell);

		this.instrument = instrument;
		this.strings = instrument.strings;
		this.frets = frets;
		this.firstFret = 1;
		this.fretted = []; /** an array of actual fretted positions, one for each string */
		this.chordName = null;
		this.nutMarks = [];
		this.fretNumbers = [];
		this.fingerMarks = [];
		this.notes = [];
		this.intervals = [];
		this.savedChordDefinitions = ['chords:'];

		this.svg = this.buildSVG(singleFretWidth, borderColor);
		this.loadSVGData('');
		this.diagramCell.append(this.svg.element);

		const buttons = document.createElement('p');
		this.diagramCell.append(buttons);

		const resetButton = document.createElement('button');
		resetButton.className = 'simple-button';
		resetButton.innerText = 'Reset';
		this.diagramCell.append(resetButton);
		resetButton.addEventListener('click', (e) => { this.resetDiagram(); });
		buttons.append(resetButton);

		this.saveButton = document.createElement('button');
		this.saveButton.className = 'simple-button';
		this.saveButton.innerText = 'Save';
		this.saveButton.disabled = true;
		this.diagramCell.append(this.saveButton);
		buttons.append(this.saveButton);

		this.saveButton.addEventListener('click', () => {
			const notation = `  - ${this.chordName!.innerHTML} ${this.notation()}`;
			this.savedChordDefinitions.push(notation);
			this.notationsCell.innerHTML = PAGE.wrapCode(this.savedChordDefinitions);
			this.saveButton.disabled = true;
		});
	}

	/**
	 * Create the SVG element with all of its component elements.
	 * 
	 * X: fretNumber.width fretMargin.width grid.width fretMargin.width
	 * Y: name.height nut.height grid.height
	 */
	buildSVG(singleFretWidth: number, borderColor = '') {
		const singleFret = new DOMRect(0, 0, singleFretWidth, singleFretWidth * 1.3);
		const gridWidth = singleFret.width * (this.strings - 1);
		const marginWidth = singleFret.width * .4;

		/** set SVG component width and height dimensions */
		const name = new DOMRect(0, 0, gridWidth + (marginWidth * 2), singleFret.height);
		const nut = new DOMRect(0, 0, singleFret.width, singleFret.height * .3);
		const fretNumber = new DOMRect(0, 0, singleFret.width * .6, singleFret.height);
		const grid = new DOMRect(0, 0, gridWidth, singleFret.height * this.frets);
		const fingerMark = new DOMRect(0, 0, singleFret.width, singleFret.height);
		const note = new DOMRect(0, 0, singleFret.width, singleFret.height * .5);
		const interval = new DOMRect(0, 0, singleFret.width, singleFret.height * .5);

		/** set SVG component positions */
		XY(name, fretNumber.width + marginWidth + (gridWidth / 2), singleFret.height * .6);
		XY(nut, fretNumber.width + marginWidth, name.height + (nut.height * .5));
		XY(fretNumber, fretNumber.width, singleFret.height + nut.height);
		XY(grid, fretNumber.width + marginWidth, name.height + nut.height);
		XY(fingerMark, grid.x, name.height + nut.height);
		XY(note, fretNumber.width + marginWidth, name.height + nut.height + grid.height);
		XY(interval, fretNumber.width + marginWidth, name.height + nut.height + grid.height + note.height);

		/** create SVG container */
		const width = fretNumber.width + marginWidth + grid.width + marginWidth;
		const height = name.height + nut.height + grid.height + note.height + interval.height;
		const svg = new SVG(width, height, borderColor);
		
		/**
		 * Add SVG component elements.
		 * 
		 * Note that `fingerMarks` must be added last, on top of the grid, to
		 * ensure that clicks on these elements are properly recognized.
		 */
		svg.addGrid(grid, this.strings - 1, this.frets, singleFret.width, singleFret.height);
		this.chordName = this.chordNameElement(svg, name, singleFret.height * .5);
		this.nutMarks = this.nutMarkElements(svg, nut, singleFret.height * .4);
		this.fretNumbers = this.fretNumberElements(svg, fretNumber, singleFret.height * .25);
		this.fingerMarks = this.fingerMarkElements(svg, fingerMark, singleFret.width * .275);
		this.notes = this.noteElements(svg, note, singleFret.height * .3);
		this.intervals = this.intervalElements(svg, interval, singleFret.height * .25);

		return svg;
	}

	/**
	 * Initialize fretted, nutMarks, fretNumbers ... for new diagram
	 * 
	 * @todo add/revise logic so that this may be used both for initializing a
	 * new SVG object and re-displaying and existing SVG object (e.g., with
	 * different sizing).
	 */
	loadSVGData(chordName: string) {
		this.setChordName(chordName);
		for (let string = 0; string < this.strings; string += 1) {
			this.fretted.push(ChordDiagram.mutedString);
			this.setNutMark(string, ChordDiagram.mute);
		}
		this.setFretNumbers(this.firstFret);
	}

	resetDiagram(/** perhaps pass a notation string here */) {
		this.setFretNumbers(1);
		this.setChordName('');
		for (let string = 0; string < this.strings; string += 1) {
			this.resetString(string, false);
			this.setNoteName(string, '');
			this.setInterval(string, '');
		}
		this.chordsCell.innerHTML = '';
	}

	/** Initialize the chord name element */
	chordNameElement(svg: SVG, name: DOMRect, fontSize: number) {
		const richText = ChordDiagram.defaultText;
		richText.fontSize = fontSize;
		const chordName = svg.addText(name, 'middle', richText);
		return chordName;
	}

	setChordName(name: string) {
		if (this.chordName !== null) this.chordName.innerHTML = name;
	}

	/**
	 * Initialize the nut mark elements (one for each string, bass thru treble).
	 */
	nutMarkElements(svg: SVG, nut: DOMRect, fontSize: number) {
		const nutMarks: SVGTextElement[] = [];
		const richText = ChordDiagram.defaultText;
		richText.fontSize = fontSize;
		for (let string = 0; string < this.strings; string += 1) {
			const x = nut.x + (string * nut.width);
			const point = new DOMPoint(x, nut.y);
			const nutMark = svg.addText(point, 'middle', richText);
			nutMarks.push(nutMark);

			nutMark.addEventListener('click', () => {
				const currentMark = nutMark.innerHTML;
				if (currentMark) {
					const newMark = (currentMark == ChordDiagram.mute) ? ChordDiagram.open : ChordDiagram.mute;
					this.setNutMark(string, newMark);
					this.fretted[string] = (newMark == ChordDiagram.open) ? ChordDiagram.openString : ChordDiagram.mutedString;
					this.resetChord();
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
	fretNumberElements(svg: SVG, fretNumber: DOMRect, fontSize: number) {
		const fretNumbers: SVGTextElement[] = [];
		const richText = ChordDiagram.defaultText;
		richText.fontSize = fontSize;
		const verticalOffset = fretNumber.height * .6;
		for (let fret = 0; fret < this.frets; fret += 1) {
			const y = fretNumber.y + verticalOffset + (fret * fretNumber.height);
			const rectangle = new DOMRect(fretNumber.x, y);
			fretNumbers.push(svg.addText(rectangle, 'end', richText));
		}
		return fretNumbers;
	}

	setFretNumbers(firstFret: number) {
		this.firstFret = firstFret;
		for (let fret = 0; fret < this.frets; fret += 1) this.fretNumbers[fret].innerHTML = `${fret + firstFret}`;
	}

	noteElements(svg: SVG, note: DOMRect, fontSize: number) {
		const noteNames: SVGTextElement[] = [];
		const richText = ChordDiagram.defaultText;
		richText.fontSize = fontSize;
		for (let string = 0; string < this.strings; string += 1) {
			const x = note.x + (string * note.width);
			const point = new DOMPoint(x, note.y + note.height * .75);
			const noteName = svg.addText(point, 'middle', richText);
			noteNames.push(noteName);
		}
		return noteNames;
	}

	setNoteName(string: number, value: string) {
		this.notes[string].innerHTML = value;
	}
	setNoteNames(values: string[]) {
		for (let i = 0; i < values.length; i += 1) this.notes[i].innerHTML = values[i];
	}

	intervalElements(svg: SVG, interval: DOMRect, fontSize: number) {
		const intervals: SVGTextElement[] = [];
		const richText = ChordDiagram.defaultText;
		richText.fontSize = fontSize;
		for (let string = 0; string < this.strings; string += 1) {
			const x = interval.x + (string * interval.width);
			const point = new DOMPoint(x, interval.y + interval.height * .5);
			const noteName = svg.addText(point, 'middle', richText);
			intervals.push(noteName);
		}
		return intervals;
	}

	setInterval(string: number, value: string) {
		this.intervals[string].innerHTML = value;
	}
	setIntervals(values: string[]) {
		for (let i = 0; i < values.length; i += 1) this.intervals[i].innerHTML = values[i];
	}

	/**
	 * Initialize the finger mark elements (one for each fret of each
	 * string). These will serve as hotspots, becoming visible only when
	 * clicked.
	 */
	fingerMarkElements(svg: SVG, fingerMark: DOMRect, radius: number) {
		const fingerMarks: SVGCircleElement[] = [];
		for (let string = 0; string < this.strings; string += 1) {
			const x = fingerMark.x + (string * fingerMark.width);
			const verticalOffset = fingerMark.height * .5;
			for (let fret = 0; fret < this.frets; fret += 1) {
				const y = fingerMark.y + verticalOffset + (fret * fingerMark.height);
				const point = new DOMPoint(x, y);
				const fingerMarkElement = svg.addCircle(point, radius, false);
				fingerMarkElement.id = `${string},${fret}`;
				fingerMarks.push(fingerMarkElement);

				fingerMarkElement.addEventListener('click', () => {
					this.markString(fingerMarkElement, string, fret);
					this.resetChord();
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
			if (opacity == SVG.clear) this.setString(string, fret);
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
				const opacity = (Number(fretID) == fret) ? SVG.opaque : SVG.clear;
				fingerMark.setAttribute('fill-opacity', opacity);
			}
		}
	}
	
	/**
	 * When a fingerMark is cleared, set string's nutMark to open or muted
	 * (based on the `openString` option) and clear all the fingerMarks on the
	 * string.
	 */
	resetString(string: number, openString = true) {
		const nutMark = (openString) ? ChordDiagram.open : ChordDiagram.mute;
		this.setNutMark(string, nutMark);
		this.fretted[string] = (openString) ? ChordDiagram.openString : ChordDiagram.mutedString;
		for (const fingerMark of this.fingerMarks) {
			const [stringID] = fingerMark.id.split(',');
			if (Number(stringID) == string) fingerMark.setAttribute('fill-opacity', SVG.clear);
		}
	}

	resetChord() {
		let chordName = '';
		const chordData = this.getChordData(this.instrument, this.notation());
		if (chordData.length) {
			this.sortChordData(chordData);
			if (chordData[0].notes.find((element) => element != '') !== undefined) {
				chordName = `${chordData[0].root}${chordData[0].modifier}`;
			}
			this.setNoteNames(chordData[0].notes);
			this.setIntervals(chordData[0].intervals);
		}
		this.setChordName(chordName);
		this.displayChordData(chordData);
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

	getChordData(instrument: Instrument, notation: string) {
		const chordData: ChordData[] = [];
		const roots = ['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B'];
		for (const root of roots) {
			const chord = new Chord(root, instrument, notation);
			const intervals = chord.intervals(true);
			const notes = chord.notes(false, true);
			const intervalPattern = chord.intervalPattern(intervals);
			const modifier = (intervalPattern.startsWith('1-')) ? chord.modifier(intervals) : '?';
			chordData.push({
				root: root,
				intervals: intervals,
				notes: notes,
				intervalPattern: intervalPattern,
				modifier: modifier
			});
		}
		return chordData;
	}

	sortChordData(chordData: ChordData[]) {
		chordData.sort((a,b) => {
			const aKnownModifier = (a.modifier != '?') ? 1 : 0;
			const bKnownModifier = (b.modifier != '?') ? 1 : 0;
			const aFirstInterval = a.intervals.find((element) => element != '');
			const bFirstInterval = b.intervals.find((element) => element != '');
			const aPrimary = (aFirstInterval === '1') ? 1 : 0;
			const bPrimary = (bFirstInterval === '1') ? 1 : 0;
			let result = bKnownModifier - aKnownModifier;
			if (!result) result = bPrimary - aPrimary;
			if (!result) result = a.root.localeCompare(b.root);
			return result;
		});
	}

	/**
	 * Called whenever actioned diagram components are clicked to refresh the
	 * display of possible chords meeting the diagrammed criteria and the list
	 * of saved chords.
	 */
	displayChordData(chordData: ChordData[]) {
		this.chordsCell.innerHTML = '';
		let knownChords = false;
		for (const chordDatum of chordData) {
			// console.log(`${chordDatum.root}${chordDatum.modifier} (${chordDatum.intervalPattern})`);
			const intervals = chordDatum.intervals.filter((element) => element != '');
			if (chordDatum.intervalPattern.startsWith('1-')) {
				const chordItem = document.createElement('p');
				const chordName = `${chordDatum.root}${chordDatum.modifier}`;
				if (chordDatum.modifier != '?') {
					const highlight = (intervals[0] == '1') ? 'red' : 'blue';
					chordItem.classList.add(highlight);
					// chordItem.innerHTML += `<br>${chordName} (${intervals.join(', ')})`;
					chordItem.innerHTML += `<br>${chordName} (${chordDatum.intervalPattern})`;
					knownChords = true; // don't enable "Save" until it works
				}
				this.chordsCell.append(chordItem);
			}
		}
		this.saveButton.disabled = !knownChords;
		// let chordDefinition = '';
		// if (knownChords && chordData.length) {
		// 	chordDefinition = `${chordData[0].root}${chordData[0].modifier} ${this.notation()}`;
		// }
		// this.saveButton.addEventListener('click', () => {
		// 	if (chordDefinition) {
		// 		this.savedChordDefinitions.push(chordDefinition);
		// 		this.notationsCell.innerHTML = this.savedChordDefinitions.join('<br>');
		// 	}
		// 	this.saveButton.disabled = true;
		// });
	}
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

	// const diagramSize = new W.Range('Diagram Size', 32, 24, 64, 1, ['Pixels'], true);
	// const sizes: string[] = [];
	// for (let i = 4; i < 30; i += 2) sizes.push(i.toString());
	// const diagramSize = new W.Select('Diagram Size: ', sizes);
	// rangeWidgetParagraph.append(diagramSize.label);
	// rangeWidgetParagraph.append(diagramSize.element);
	// rangeWidgetParagraph.append(diagramSize.element.outerText);
	// const textEntry = new W.Text('Enter Notation: ', '');
	// textEntry.label.className = 'sans-serif';
	// textWidgetParagraph.append(textEntry.label);
	// textWidgetParagraph.append(textEntry.element);
	// textWidgetParagraph.append('\u00A0\u00A0 e.g.: "x02210"');
	// const instrument = new Instrument('guitar');
	// const diagram = new ChordDiagram(instrument.strings, 5, Number(diagramSize.element.value));

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

// const FakesheetIndices = `${PAGE.site}/Indices/fakesheets.json`;
// const FakesheetsPath = `${PAGE.site}/Content/fakesheets`;
// const Fakesheets = await Fetch.map<T.FileStats>(FakesheetIndices);
// const Chords = await getChords(Fakesheets);
// const ChordModifiers = await Fetch.map<string>(`${PAGE.site}/data/chords/intervals.yaml`);

	// textEntry.element.addEventListener('change', () => {
	// 	const notation = textEntry.element.value.trim().toLowerCase();
	// 	svgParagraph.innerHTML = '';
	// 	intervalsDiv.innerHTML = '';
	// 	const diagramChord = new Chord('C', instrument, notation);
	// 	const pixels = Number(diagramSize.element.value);
	// 	svgParagraph.append(diagramChord.diagram('sans-serif', 1, pixels, notation)); // 'sans-serif', 0.5
	// 	const grid = document.createElement('div');
	// 	grid.className = 'grid-auto';
	// 	const chordData = getChordData(instrument, notation);
	// 	sortChordData(chordData);
	// 	displayChordData(chordData, grid, intervalsDiv);
	// 	textEntry.element.value = '';
	// });
