/**
 * A Collection is created from JSON text, representing a Map with string keys
 * and values specified by a generic type.
 * - Usage: const collection = new Collection\<MyType\>(jsonText);
 *
 * `map` is the Map represented in the JSON text. `orderedKeys` is an array of
 * Map keys; this array may be reordered via the `sort` method.
 */
export class Collection<Value> {
	map: Map<string, Value>;
	index: number;
	orderedKeys: string[]; // persists until sorted again
	randomKeys: string[]; // array is depleted every time an entry is requested, rebuilt when empty

	constructor(jsonText: any) {
		/* convert raw JSON text into a Map object */
		this.map = new Map<string, Value>(Object.entries(jsonText));
		this.index = 0;
		this.orderedKeys = Array.from(this.map.keys()); // modified by sort method
		this.randomKeys = Shuffle(this.orderedKeys);
	}

	/**
	 * Using the given Map field or fields, reorder the keys in the
	 * `orderedKeys` array and reset the `currentKey` to be the first element of
	 * the array. Field names may have a '+' or '-' prefix to indicate ascending
	 * or descending sort, respectively. '+' is assumed if neither character is
	 * present.
	 */
	sort(fields: string[]) {
		// using the fields array, sort the data record keys
		// first field is primary sort, second is secondary, etc.
		// default sort is ascending, overridden by "-" prefix ("+" is assumed)
		// remove special prefix ('+', '-', etc.) during processing
		// we may need prefix options such as: case-sensitive? title-sort?
		// can options be field prefixes or do we need sortField objects?

		this.orderedKeys.sort((a, b) => {
			let sortValue = 0;
			/*
			 *  These map values must be defined as type 'any', as this is a
			 *  generic routine and is intended to work for any type of value.
			 */
			const recordA: any = this.map.get(a)!;
			const recordB: any = this.map.get(b)!;
			for (const field of fields) {
				if (field in recordA && field in recordB) {
					const fieldA = recordA[field];
					const fieldB = recordB[field];
					if (fieldA == fieldB) continue;
					sortValue = (fieldA > fieldB) ? 1 : -1;
					break;
				}
			}
			return sortValue;
		});	
	} 

	// any/all of these may pass in an optional filter (tags, etc.)

	/**
	 * Return the current key, i.e., the key pointed to by the `index` property.
	 */
	currentKey() {
		if (!this.orderedKeys.length) return '';
		return this.orderedKeys[this.index];
	}

	/**
	 * Return the first key in `orderedKeys` (the key at index 0), and reset the
	 * index to 0.
	 */
	firstKey() {
		if (!this.orderedKeys.length) return '';
		this.index = 0;
		return this.orderedKeys[this.index];
	}

	/**
	 * Return the last key in `orderedKeys`, and reset the index to the position
	 * of the last key.
	 */
	lastKey() {
		if (!this.orderedKeys.length) return '';
		this.index = this.orderedKeys.length - 1;
		return this.orderedKeys[this.index];
	}

	/**
	 * Return the next key in `orderedKeys`, and reset the index to the position
	 * of this key.
	 */
	nextKey() {
		if (!this.orderedKeys.length) return '';
		this.index += 1;
		if (this.index >= this.orderedKeys.length) this.index = 0;
		return this.orderedKeys[this.index];
	}

	/**
	 * Return the previous key in `orderedKeys`, and reset the index to the
	 * position of this key.
	 */
	previousKey() {
		if (!this.orderedKeys.length) return '';
		this.index -= 1;
		if (this.index < 0) this.index = this.orderedKeys.length - 1;
		return this.orderedKeys[this.index];
	}

	// proximateKey() {
	// 	if (!this.orderedKeys.length) return '';
	// 	return ''; // not supported yet ... is there a general meaning here??
	// }

	/**
	 * Return a randomly selected key from `orderedKeys`. The index is not
	 * changed. This method may be called multiple times, and will return a
	 * different key each time until all keys have been returned, at which time
	 * the random selection will be reinitialized.
	 */
	randomKey() {
		let randomKey = '';
		if (this.randomKeys.length) {
			randomKey = this.randomKeys.shift()!; // get and remove the random key
		} 
		else {
			this.randomKeys = Shuffle(this.orderedKeys); /* generate a new randomKeys array */
			if (this.randomKeys.length) randomKey = this.randomKeys.shift()!;
		}
		return randomKey;
	}

	// /**
	//  * Return an HTML representation of the Map data (options to be determined).
	//  */
	// render(options: string[]) {
	// 	let html = '';
	// 	// options are like render "as article", "as quote", etc.
	// 	// this is where a header/options record may be needed
	// 	// returns HTML
	// 	return html;
	// }
}

/**
 * Given an array of strings, return a new array containing the same entries
 * randomly shuffled.
 */
export function Shuffle(entries: string[]) {
	const shuffledEntries: string[] = [];
	const copyOfEntries = entries.slice(0); /* don't modify original array */
	while (copyOfEntries.length > 0) {
		const randomIndex = Math.floor(Math.random() * copyOfEntries.length);
		shuffledEntries.push(copyOfEntries.splice(randomIndex, 1)[0]);
	}
	return shuffledEntries;
}

/**
 * Given a string containing a title (such as a song title or a band
 * name), return a string that may be used in sorting, where all
 * characters are converted to lower case, and leading articles ('a',
 * 'an', and 'the') are moved to the title's end.
 */ 
function sortableTitle(rawTitle: string) {
	let adjustedTitle = rawTitle.toLowerCase();
	const words = adjustedTitle.split(/\s+/);
	if (!words[0]) words.shift(); /** remove leading whitespace */
	/** remove leading article */
	if (['a', 'an', 'the'].includes(words[0])) {
		const newLastWord = words.shift();
		if (newLastWord) words.push(newLastWord);
	} 
	adjustedTitle = words.join(' ');
	return adjustedTitle;
}
