/**
 * General Type definitions used by both command line scripts and website code.
 */

/**
 * Given any data object, return its type as a string:
 * 'null', 'undefined', 'string', 'number', 'boolean',
 * 'bigint', 'symbol', 'function', 'object', 'array',
 * 'map'.
 */
export function Type(data: any) {
	let type: string;
	if (data === null) type = 'null';
    else if (Array.isArray(data)) type = 'array';
    else if (data instanceof Map) type = 'map';
    else type = typeof data;
	return type.toLowerCase();
}

/**
 * File types (based on extensions).
 */
export function IsMarkdownFile(pathName: string) {
	const markdownExtension = /\.md$/i;
	return markdownExtension.test(pathName);
}
export function IsJsonFile(pathName: string) {
	const jsonExtension = /\.json$/i;
	return jsonExtension.test(pathName);
}
export function IsYamlFile(pathName: string) {
	const yamlExtension = /\.ya?ml$/i;
	return yamlExtension.test(pathName);
}

/**
 * File Information is read from the OS file data and YAML metadata. These are
 * used determine how to sync files between the source and target systems.
*/
export const AccessKey = 'Access';
export type FileInfo = {
	revision: number; /* Date.valueOf(); */
	access: number;
}

/**
 * Fakesheet files contain special YAML metadata, some of which is used in
 * lookup functionality in the frontend.
 */
export const SongTitleKey = 'title';
export const SongArtistKey = 'artist';
export type FakesheetLookups = {
	title: string;
	artist: string;
}

export type Song = {
	title: string;
	composers: string[];
	copyright: string;
}

export type Chord = {
	name: string;
	notation: string;
}

export type FakeSheet = {
	song: Song;
	artist: string;
	key: string;
	capo: number;
	tuning: string;
	tempo: number;
	chords: Chord[];
	text: string;
}

export type Collection = {
	title: string;
	entry: Song[];  /** or Song[]|Video[] ... */
}

// export type Song = {
// 	audio: string;      /** e.g., audio/my-title.mp3*/
// 	fakesheet: string;  /** e.g., fakesheets/my-title.md */
// 	title: string;
// };

type Location = {
	city: string;
	state: string;
	country: string;
}

type Photo = {
	uri: string;
	width: number;
	height: number;
}

type JournalEntry = {
	id: string;
	source: string;
	created: Date;
	modified: Date;
	favorite: boolean;
	tags: string[];
	location: Location;
	photo: Photo;
	text: string;
}
