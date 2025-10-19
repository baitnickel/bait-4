import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as MD from './lib/md.js';
import { Markup } from './lib/markup.js';
import * as W from './lib/widgets.js';

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
}

const PAGE = new Page();
PAGE.setTitle('Chords');
const FakesheetIndices = `${PAGE.site}/Indices/fakesheets.json`;
const FakesheetSubpath = 'Content/fakesheets';
const Fakesheets = await Fetch.map<T.FileStats>(FakesheetIndices);
const Chords = await getChords(Fakesheets);

export function render() {
	// const fakesheetPaths: string[] = [];
	// for (const fakesheet of Fakesheets.keys()) fakesheetPaths.push(fakesheet);
	const listSection = document.createElement('div');
	const flattenedChords: string[] = [];
	for (const chord of Chords) flattenedChords.push(`${chord.name} ${chord.notation} ${chord.intervals.join(' ')} ${chord.notes.join(' ')}`);
	listSection.innerHTML = flattenedChords.join('<br>');
	PAGE.content.append(listSection);

	// const chordData = new Set<string>();
	// for (const fakesheetPath of fakesheetPaths) {
		// const fullPath = `${PAGE.site}/Content/fakesheets/${fakesheetPath}`;
		// Fetch.text(fullPath).then((fileText) => {
		// 	const markdown = new MD.Markdown(fileText);
		// 	if (markdown.metadata && 'chords' in markdown.metadata) {
		// 		const chords: string[] = markdown.metadata['chords'];
		// 		for (const chord of chords) chordData.add(chord);
		// 	}
		// });
	// }

	// const chords = Array.from(chordData).sort((a,b) => {
	// 	const aWords = a.split(/\s+/);
	// 	const bWords = b.split(/\s+/);
	// 	let result = aWords[0].localeCompare(bWords[0]);
	// 	if (!result) result = aWords[1].localeCompare(bWords[1]);
	// 	return result;
	// });

	// const chordSection = document.createElement('div');
	// const chordNotations: string[] = [];
	// for (const chord of chords) chordNotations.push(chord);
	// chordSection.innerHTML = chordNotations.join('<br>');
	// PAGE.content.append(chordSection);
}

async function getChords(fakesheets: Map<string, T.FileStats>) {
	let chordList: string[] = [];
	for (const fakesheet of fakesheets.keys()) {
		const fullPath = `${PAGE.site}/${FakesheetSubpath}/${fakesheet}`;
		await Fetch.text(fullPath).then((fileText) => {
			const markdown = new MD.Markdown(fileText);
			if (markdown.metadata && 'chords' in markdown.metadata) {
				const chords: string[] = markdown.metadata['chords'];
				for (const chord of chords) {
					if (/\s+/.test(chord.trim())) chordList.push(chord);
				}
			}
		});
	}
	chordList = chordList.sort((a,b) => {
		const aWords = a.split(/\s+/);
		const bWords = b.split(/\s+/);
		let result = aWords[0].localeCompare(bWords[0]);
		if (!result) result = aWords[1].localeCompare(bWords[1]);
		return result;
	});
	const chordSet = new Set<string>();
	for (let chord of chordList) {
		chord = chord.replace(/\s+/, ' ');
		chordSet.add(chord);
	}
	chordList = Array.from(chordSet.keys());
	const chordData: ChordStructure[] = [];
	for (const chord of chordList) {
		const [name, notation] = chord.split(/\s+/);
		chordData.push({ name: name, notation: notation, intervals: [], notes: []});
	}
	return chordData;
}
