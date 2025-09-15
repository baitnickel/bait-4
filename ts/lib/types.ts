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

/**
 * Given a `date` (and an optional `format`) return a string representing the
 * date. The default format is 0.
 * 
 * Formats:
 * - 0: 2024-02-01T22:35:51.175Z  (toISOString)
 * - 1: Thu Feb 01 2024 14:35:51 GMT-0800 (Pacific Standard Time)  (toString)
 * - 2: 2024-02-01 14:35:51
 * - 3: 2024-02-01 14:35
 * - 4: Thursday, February 1, 2024 2:35pm
 * - 5: February 1, 2024 2:35pm
 * - 6: Thu Feb 1, 2024 2:35pm
 * - 7: Feb 1, 2024 2:35pm
 * - 8: Feb 1, 2024
 * - 9: Thu Feb 1, 2024
 * - 10: Feb 2024
 * - 11: 2024
 * - 12: Thu Feb 1, 2024 2:35:51pm
 */
export function DateString(date: Date, format = 0) {
	if (format == 0) return date.toISOString();
	if (format == 1) return date.toString();
	const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
	const mon = months[date.getMonth()];
	const weekday = weekdays[date.getDay()];
	const year = date.getFullYear().toString().padStart(2, '0');
	const m = (date.getMonth() + 1).toString();
	const month = m.padStart(2, '0');
	const d = date.getDate().toString();
	const day = d.padStart(2, '0');
	const hour = date.getHours().toString().padStart(2, '0');
	const minute = date.getMinutes().toString().padStart(2, '0');
	const second = date.getSeconds().toString().padStart(2, '0');
	if (format == 2) return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
	if (format == 3) return `${year}-${month}-${day} ${hour}:${minute}`;

	let h = date.getHours();
	const amPm = (h < 12) ? 'am' : 'pm';
	if (h > 12) h -= 12;
	else if (h == 0) h = 12;
	if (format == 4) return `${weekday}, ${mon} ${d}, ${year} ${h}:${minute}${amPm}`;
	if (format == 5) return `${mon} ${d}, ${year} ${h}:${minute}${amPm}`;
	if (format == 6) return `${weekday.slice(0, 3)} ${mon.slice(0, 3)} ${d}, ${year} ${h}:${minute}${amPm}`;
	if (format == 7) return `${mon.slice(0, 3)} ${d}, ${year} ${h}:${minute}${amPm}`;
	if (format == 8) return `${mon.slice(0, 3)} ${d}, ${year}`;
	if (format == 9) return `${weekday.slice(0, 3)} ${mon.slice(0, 3)} ${d}, ${year}`;
	if (format == 10) return `${mon.slice(0, 3)} ${year}`;
	if (format == 11) return `${year}`;
	if (format == 12) return `${weekday.slice(0, 3)} ${mon.slice(0, 3)} ${d}, ${year} ${h}:${minute}:${second}${amPm}`;
	return date.toISOString(); // default
}

/**
 * Given a string of `text`, return the text in the form of a title, where case
 * (upper/lower) is adjusted according to standard rules (as defined here).
 * 
 * - Capitalize the first word and the last word
 * - Capitalize nouns, pronouns, adjectives, verbs, adverbs, subordinating conjunctions
 * - Do not capitalize articles, prepositions, coordinating conjunctions
 * - (Capitalize words of 4 or more characters ... ignoring this rule for now)
 * 
 * If `sortable` is true, remove leading "a", "an", or "the" and convert text to
 * lowercase.
 */
export function Title(text: string, sortable = false) {
	let title = '';
	const lowerWords = ['a', 'an', 'and', 'at', 'nor', 'of', 'or', 'the', 'with'];
	const words = text.trim().split(/\s+/);
	if (sortable && ['a', 'an', 'the'].includes(words[0].toLowerCase())) words.shift();
	const adjustedWords: string[] = [];
	for (let i = 0; i < words.length; i += 1) {
		let word = words[i];
		const firstWord = (i == 0);
		const lastWord = (i == (words.length - 1));
		const lowerWord = lowerWords.includes(word);
		const letters = word.split('');
		let firstLetter = letters[0];
		if (firstWord || lastWord || !lowerWord) firstLetter = firstLetter.toUpperCase();
		word = firstLetter + word.substring(1);
		adjustedWords.push(word);
	}
	title = adjustedWords.join(' ');
	if (sortable) title = title.toLowerCase();
	return title;
}

// export type Message = {
// 	type: 'E' | 'W' | 'I';
// 	text: string;
// }

/**
 * For Stats details, see:
 * https://nodejs.org/docs/latest-v16.x/api/fs.html#class-fsstats
 *
 * We are not adding all FS.Stats values here--only the ones that we are likely
 * to use. Add additional ones as needed.
 */
export type File = {
	name: string,          /* file name without extension */
	base: string,          /* file name with extension */
	extension: string,     /* file extension including "." converted to lowercase */
	path: string,          /* full file path */
	dirname: string,       /* full directory name without file name */
	isFile: boolean,       /* true if regular file */
	isDirectory: boolean,  /* true if directory */
	created: Date,         /* Date created */
	modified: Date,        /* Date modified */
	accessed: Date,        /* Date accessed */
	size: number,          /* number of bytes */
	hash: string,          /* SHA hash */
}

/**
 * File Information is read from the OS file data and YAML metadata. These are
 * used determine how to sync files between the source and target systems.
*/
export type FileStats = {
	id: number;
	access: number;
	revision: number; /* Date.valueOf(); */
}

/**
 * The ArticleProperties are the values that will be written to the articles
 * index file.
 */
export type ArticleProperties = {
	id: number;
	access: number;
	revision: number;
	aliases: string[];
	tags: string[];
}

/**
 * Markdown files intended for website display will have most, if not all, of
 * the properties declared in this type. All values are strings to simplify
 * metadata preprocessing, though some may require string versions of other
 * types, i.e., numbers, booleans, etc.
 */
export type Metadata = {
	aliases: string[];
	tags: string[];
	id: string;
	access: string;
	title: string;
	artist: string;
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

export type HexagramText = {     // bait-3: IChingTexts
	commentary: string[];
	verse: string[];
}
export type IChingName = {      // bait-3: Descriptor
	chinese: string;
	english: string;
	script: string;
}
export type Hexagram = {
	chapter: number;
	character: string; /** unicode character representing hexagram lines */
	commentary: string[];
	image: HexagramText;
	judgment: HexagramText;
	lines: HexagramText[];
	name: IChingName;
}
export type IChing = {            // bait-3: IChingData
	attribution: string;
	hexagrams: Hexagram[];
	trigrams: IChingName[];
}
export type Radical = {
	unicode: number;
	character_name: string;  // bait-3: characterName
	definitions: string[];
	positive: boolean|null;  // bait-3: boolean only
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
// export type Camper = { /* keyed by camper name */
// 	color: string;
// }

export type CampCosts = {
	year: number;
	site: number; /* per-night campsite cost */
	cabin: number; /* per-night cabin cost */
	reservation: number; /* per-site reservation fee */
	cancellation: number; /* per-site cancellation fee */
	modification: number; /* per-site reservation modification fee */
}
export type CampAdjustment = {
	year: number;
	group: string;
	amount: number;
	for: string;
}
export type CampGroup = {
	name: string; /* name of reservation account holder */
	color: string; /* color associated with account */
}
export type Reservation = { 
	site: string|number;
	arrival: string; /* pseudo Date: YYYY-MM-DD */
	reserved: number; /* nights reserved */
	cancelled: number; /* nights cancelled */
	modified: number; /* number of times reservation has been modified */
	purchaser: string; /* key for Account record, optionally followed by "/<alias>" */
	occupants: string; /* "<account-key>/<occupant-names>" or "?", "none", "main site", etc. */
}
export type ParkReservations = { /* keyed by Park name */ //### unused
	reservations: Reservation[];
}
export type Campsite = { /* array structure under Campground.sites */
	site: string|number;
	category: string;
	type: string;
	size: string;
	tents: number;
	table: string;
	comment: string;
}
export type Campground = { /* structure keyed by Park name */
	map: string; /* uri */
	comments: string[];
	sites: Campsite[];
}
// /* currently only one Park (smitty) */
// export type Park = {
// 	campground: Campground;
// }

export type Quote = {
	text: string;
	attribution: string;
	note: string;
	date: string; /* Date.toISOString() */
	source: string;
}

/** for `log` API */
export type LogEntry = {
	text: string;
}

/** for `annotations` API */
export type Annotation = {
	date: string;
	query: string;
	title: string;
	id: number|null;
	note: string;
}

/** for `timeline` API */
export type TimedEvent = {
	dateValue: number; /** number of milliseconds */
	precision: number; /** segment count (1:Y, 2:YM, 3:YMD) */
	approximate: boolean;
	personal: boolean;
	description: string; /** markdown */
	note: string; /** markdown */
}

/** for `media/images` API */
export type MediaImageData = {
	album: string;
	filePaths: string[];
}

/** for `threads` API */
export type ThreadQuery = {
	root: string;
	tags: string[];
}
export type ThreadPassage = {
	file: File|null;
	section: number;
	tag: string;
	text: string;
}
