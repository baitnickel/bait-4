/**
 * General Type definitions used by both command line scripts and website code.
 * Also contains functions--it is not to be regarded as merely a type
 * declarations file.
 * 
 * @todo
 * - define `uri` as an extension of string, enforce valid URI
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
 * Given an array of object property values, converted to strings if necessary,
 * return a "key" string. Represent missing values with the empty string ('').
 * Properties should be selected for the purpose of generating unique keys.
 * 
 * E.g.: songKey = ObjectKey([song.title, song.artist]);
 */
export function ObjectKey(properties: string[]) {
	const keySegments: string[] = [];
	const connector = '+';
	for (let property of properties) {
		let keySegment = '';
		property = property.replace(/\'/g, ''); /* remove apostrophes */
		let words = property.split(/[\s\W_]/); /* break words on space and non-alphanumeric */
		words.forEach(word => {
			word = word.toLowerCase().trim();
			if (word) {
				word = word[0].toUpperCase() + word.substring(1);
				keySegment += word;
			}
		});
		keySegments.push(keySegment);
	}
	return keySegments.join(connector);
}

/**
 * File types (based on extensions).
 */
const MarkdownExtension = /\.md$/i;
const JsonExtension = /\.json$/i;
const YamlExtension = /\.ya?ml$/i;

export function IsMarkdownFile(pathName: string) {
	return MarkdownExtension.test(pathName);
}
export function IsJsonFile(pathName: string) {
	return JsonExtension.test(pathName);
}
export function IsYamlFile(pathName: string) {
	return YamlExtension.test(pathName);
}

// export type Message = {
// 	type: 'E' | 'W' | 'I';
// 	text: string;
// }

/**
 * Markdown files intended for website display will have most, if not all, of
 * the properties declared in this type. All values are strings to simplify
 * metadata preprocessing, though some may require string versions of other
 * types, i.e., numbers, booleans, etc.
 */
export type Metadata = {
	aliases: string[];
	tags: string[];
	access: string;
	title: string;
	artist: string;
}

/**
 * File Information is read from the OS file data and YAML metadata. These are
 * used determine how to sync files between the source and target systems.
*/
export type FileStats = {
	access: number;
	revision: number; /* Date.valueOf(); */
}

/**
 * Fakesheet files contain special YAML metadata, some of which is used in
 * lookup functionality in the frontend.
 */
export type FakesheetLookups = {
	title: string;
	artist: string;
}

export type Option = {
	element: string;
	type: string;
}

///////////// this has been moved into the file-system module
// /**
//  * Given `metadata` of any type and a `defaultObject` of any type, return a new
//  * object of the same type as `defaultObject`, setting properties from values in
//  * `metadata` if the properties exist in `defaultObject`, and otherwise setting
//  * properties from the `defaultObject`. Any properties in `metadata` that are
//  * not in `defaultObject` are not included in the new object.
//  * 
//  * Adding "as Type" when calling this function, where "Type" is
//  * `defaultObject`'s type, will coerce the new object to the same type as
//  * `defaultObject`. For example:
//  * - const defaultObject: DefaultObjectType = { a: 1, b: 2, c: 3 };
//  * - const newObject = Properties(data, defaultObject) as DefaultObjectType;
//  */
// export function Properties(metadata: any, defaultObject: any) {
// 	const newObject: {[index: string]: any} = {};
// 	const objectKeys = Object.keys(defaultObject);
// 	for (const key of objectKeys) {
// 		if (metadata !== null && key in metadata && metadata[key] !== null) {
// 			/* override the default property value using the value in metadata */
// 			newObject[key] = metadata[key];
// 		}
// 		/* use the value from the default object */
// 		else newObject[key] = defaultObject[key];
// 	}
// 	return newObject;
// }

// export type Song = {
// 	title: string;
// 	composers: string[];
// 	copyright: string;
// }

// export type Chord = {
// 	name: string;
// 	notation: string;
// }

// export type FakeSheet = {
// 	song: Song;
// 	artist: string;
// 	key: string;
// 	capo: number;
// 	tuning: string;
// 	tempo: number;
// 	chords: Chord[];
// 	text: string;
// }

// export type Collection = {
// 	title: string;
// 	entry: Song[];  /** or Song[]|Video[] ... */
// }

// export type Song = {
// 	audio: string;      /** e.g., audio/my-title.mp3*/
// 	fakesheet: string;  /** e.g., fakesheets/my-title.md */
// 	title: string;
// };

// type Location = {
// 	city: string;
// 	state: string;
// 	country: string;
// }

type Photo = {
	uri: string;
	width: number;
	height: number;
}

// type JournalEntry = {
// 	id: string;
// 	source: string;
// 	created: Date;
// 	modified: Date;
// 	favorite: boolean;
// 	tags: string[];
// 	location: Location;
// 	photo: Photo;
// 	text: string;
// }

/**
 * From the bait-3 JSON files
 */

type Track = {
	id: number;
	title: string;
	performers: string[];
	composers: string[];
	date: string; /* year */
	audio: string; /* file path */
	sheets: string[]; /* unused */
	notes: string;
}
type Album = {
	id: number; /* key */
	title: string;
	images: string[]; /* unused */
	tracks: Track[];
	notes: string;
}

type SongSheet = {
	file: string; /* key */
	title: string;
	artist: string;
	copyright: string;
}

type HexagramText = {
	commentary: string[];
	verse: string[];
}
type IChingName = {
	chinese: string;
	english: string;
	script: string;
}
type Hexagram = {
	chapter: number;
	character: string;
	commentary: string[];
	image: HexagramText;
	judgment: HexagramText;
	lines: HexagramText[];
	name: IChingName;
}
type IChing = {
	attribution: string;
	hexagrams: Hexagram[];
	trigrams: IChingName[];
}
type Radical = {
	unicode: number;
	character_name: string;
	definitions: string[];
	positive: boolean|null;
}
type Images = {
	file: string;
	created: string; /* Date */
}

type Journal /* JournalEntry */ = { /* keyed by uri */
	summary: string;
	created: string; /* Date */
	modified: string; /* Date */
	starred: boolean;
	tags: string[];
	/* Location */
	city: string;
	state: string;
	country: string;
	/* Photo */
	photoFile: string;
	photoWidth: number;
	photoHeight: number;
}
// type Journal = {
// 	file: { entry: JournalEntry };
// }

// type ParkAccount = {
// 	account: { color: string };
// }
type Camper = { /* keyed by name */
	color: string;
}
type ParkReservation = { /* keyed by Campground name + Site name */
	// parkId: number;
	// campgroundId: number;
	// site: string;
	arrival: string; /* pseudo Date */
	days: number; /* or `nights` */
	// account: ParkAccount;
	account: string; /* key for Camper record */
}
type Campsite = { /* keyed by Campground name + Site name */
	// site: string;
	type: string;
	size: string;
	tents: number;
	table: string;
	/* reservations: ParkReservation[]; */
	comments: string;
}
type Campground = { /* get rid of 'id' and key by name */
	// id: number;
	// name: string;
	map: string; /* uri */
	comments: string[];
}
// get rid of Park and just define Campgrounds instead
// type Park = {
// 	id: number;
// 	name: string;
// 	campgrounds: Campground[];
// }

export type Quote = {
	text: string;
	attribution: string;
	note: string;
	date: string; /* Date.toISOString() */
	source: string;
}
