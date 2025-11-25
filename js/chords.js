import { Page } from './lib/page.js';
import { Instrument, Chord } from './lib/fakesheet.js';
import * as W from './lib/widgets.js';
import { SVG, Point } from './lib/graphics.js';
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
export function render() {
    /** Interactive chord/interval utilities */
    const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
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
    const diagramSize = new W.Range('Diagram Size', 32, 20, 64, 1, ['Pixels'], true);
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
    if (PAGE.local)
        newDiagram(testDiv, diagramSize);
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
function newDiagram(division, diagramSize) {
    const diagram = new ChordDiagram(6, 5, Number(diagramSize.element.value), 'sans-serif', 'red');
    diagram.grid();
    diagram.chordName('G major', .33);
    const nutMarks = diagram.nutMarks(.67, .33);
    const fretNumbers = diagram.fretNumbers(.6, .25);
    const fingerMarks = diagram.fingerMarks(.5, .275);
    // for (let fingerMark of fingerMarks) console.log(fingerMark.id);
    for (let fret = 0; fret < diagram.frets; fret += 1)
        fretNumbers[fret].innerHTML = `${fret + 1}`;
    for (let string = 0; string < diagram.strings; string += 1)
        nutMarks[string].innerHTML = 'x';
    const paragraph = document.createElement('p');
    paragraph.append(diagram.svg.element);
    division.append(paragraph);
}
/**
 * Event Listener: when a finger mark is clicked, toggle its visibility.
 *
 * If we're going to call a ChordDiagram method (or two) in here, we might as
 * well let the method do all the work!
*/
function fingered(id, diagram) {
    const [string, fret] = id.split(',');
    const element = document.getElementById(id);
    if (element) {
        const opacity = element.getAttribute('fill-opacity');
        if (opacity !== null) {
            if (opacity == '0') {
                /**
                 * Turning on a mark must set that string's nut mark to '' and
                 * set the opacity of any other marks on that string to 0.
                 */
                element.setAttribute('fill-opacity', '1');
                diagram.setString(Number(string), Number(fret));
            }
            else {
                /**
                 * Turning off a mark must set that string's nut mark to 'x',
                 * and ensure that the opacity of all marks on that string are
                 * set to 0.
                 */
                element.setAttribute('fill-opacity', '0');
                diagram.resetString(Number(string));
            }
        }
    }
}
class ChordDiagram {
    svg;
    font;
    strings;
    frets;
    width;
    height;
    fretWidth;
    fretHeight;
    fretNumberWidth;
    fretMargin;
    gridWidth;
    gridHeight;
    gridCenter;
    nameHeight;
    nutHeight;
    gridPoint;
    namePoint;
    constructor(strings, frets, fretWidth, font, borderColor = '') {
        this.strings = strings;
        this.frets = frets;
        this.fretWidth = fretWidth;
        this.fretHeight = fretWidth * 1.3;
        this.fretNumberWidth = fretWidth * .75;
        this.fretMargin = fretWidth * .5;
        this.gridWidth = fretWidth * (strings - 1);
        this.gridHeight = this.fretHeight * frets + this.fretMargin; // is bottom margin necessary?
        this.gridCenter = this.gridWidth * .5;
        this.nameHeight = this.fretHeight * .75;
        this.nutHeight = this.fretHeight * .25;
        this.width = this.fretNumberWidth + (this.fretMargin * 2) + this.gridWidth;
        this.height = this.nameHeight + this.nutHeight + this.gridHeight;
        this.gridPoint = new Point(this.fretNumberWidth + this.fretMargin, this.nameHeight + this.nutHeight);
        this.namePoint = new Point(this.gridPoint.x + this.gridCenter, this.nameHeight * .75);
        this.font = font;
        this.svg = new SVG(this.width, this.height, borderColor);
    }
    /** Draw strings/frets grid in SVG */
    grid() {
        this.svg.addGrid(this.gridPoint, this.strings - 1, this.frets, this.fretWidth, this.fretHeight);
    }
    /** Set the chord name in the diagram */
    chordName(name, verticalAdjustment) {
        this.svg.addText(this.namePoint, 'middle', { value: name, fontSize: this.fretHeight * verticalAdjustment, fontFamily: this.font });
    }
    /**
     * Initialize the nut mark elements (one for each string, bass thru treble).
     */
    nutMarks(verticalAdjustment, fontSizeAdjustment) {
        const nutMarks = [];
        for (let string = 0; string < this.strings; string += 1) {
            const x = this.gridPoint.x + (string * this.fretWidth);
            const y = this.nameHeight + (this.nutHeight * verticalAdjustment);
            const point = new Point(x, y);
            nutMarks.push(this.svg.addText(point, 'middle', { value: '', fontSize: this.fretHeight * fontSizeAdjustment, fontFamily: this.font }));
        }
        return nutMarks;
    }
    /**
     * Initialize the fret number elements (one for each fret relative to the
     * top fret).
     */
    fretNumbers(verticalAdjustment, fontSizeAdjustment) {
        const fretNumbers = [];
        for (let fret = 0; fret < this.frets; fret += 1) {
            const x = this.fretNumberWidth;
            const y = this.nameHeight + this.nutHeight + (this.fretHeight * verticalAdjustment) + (fret * this.fretHeight);
            const point = new Point(x, y);
            fretNumbers.push(this.svg.addText(point, 'end', { value: '', fontSize: this.fretHeight * fontSizeAdjustment, fontFamily: this.font }));
        }
        return fretNumbers;
    }
    /**
     * Initialize the finger mark elements (one for each fret of each
     * string). These will serve as hotspots, becoming visible only when
     * clicked.
     */
    fingerMarks(verticalAdjustment, radiusAdjustment) {
        const fingerMarks = [];
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
                    /** Can't we simply do all the work right here? Mostly
                     * calling one or more methods. */
                    fingered(fingerMark.id, this);
                });
            }
        }
        return fingerMarks;
    }
    /**
     * These methods above need to be clearer when they are initializing
     * elements of the diagram (and setting array properties that will be
     * manipulated later). The values of Chord Name, Nut Marks, Finger Marks,
     * Fret Numbers need separate methods for controlling their values
     * dynamically!
     */
    /**
     * These two methods below should maintain `this.notation` and then refresh
     * the nutMarks and FingerMarks. The notation is initially 'xxxxxx' (or an
     * array of number|null values for each string).
     */
    /** Set string's nutMark to '' and set the opacity of any other marks on that string to 0. */
    setString(string, fret) {
        console.log(`remove any nutMark from string ${this.strings - string} and show a fingerMark only at fret ${fret + 1}`);
    }
    /** Set string's nutMark to 'x' and set all fingerMarks to opacity 0 */
    resetString(string) {
        console.log(`remove all fingerMarks from string ${this.strings - string} and set its nutMark to 'x'`);
    }
}
function getChordData(instrument, notation) {
    const chordData = [];
    const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
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
function sortChordData(chordData) {
    chordData.sort((a, b) => {
        const aKnownModifier = (a.modifier != '?') ? 1 : 0;
        const bKnownModifier = (b.modifier != '?') ? 1 : 0;
        const aPrimary = (a.intervals[0] == '1') ? 1 : 0;
        const bPrimary = (b.intervals[0] == '1') ? 1 : 0;
        let result = bKnownModifier - aKnownModifier;
        if (!result)
            result = bPrimary - aPrimary;
        if (!result)
            result = a.root.localeCompare(b.root);
        return result;
    });
}
function displayChordData(chordData, grid, intervalsDiv) {
    for (const chordDatum of chordData) {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-cell small';
        if (chordDatum.modifier != '?') {
            const highlight = (chordDatum.intervals[0] == '1') ? 'red' : 'blue';
            gridItem.classList.add(highlight);
        }
        gridItem.innerHTML += `${chordDatum.root}${chordDatum.modifier} (${chordDatum.intervalPattern})`;
        const intervalsAndNotes = [];
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
