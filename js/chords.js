import { Page } from './lib/page.js';
import { Instrument, Chord } from './lib/fakesheet.js';
import * as W from './lib/widgets.js';
const PAGE = new Page();
PAGE.setTitle('Chords', 1);
export function render() {
    /** Interactive chord/interval utilities */
    const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
    const textWidgetParagraph = document.createElement('p');
    const svgParagraph = document.createElement('p');
    const intervalsDiv = document.createElement('div');
    PAGE.content.append(textWidgetParagraph);
    PAGE.content.append(svgParagraph);
    PAGE.content.append(intervalsDiv);
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
        const chordData = [];
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
        /** sort chord w/ root at first interval to the top, then sort by root */
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
        textEntry.element.value = '';
    });
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
