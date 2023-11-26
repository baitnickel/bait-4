/**
 * Using the given Map field or fields, reorder the keys in the
 * `orderedKeys` array and reset the `currentKey` to be the first element of
 * the array. Field names may have a '+' or '-' prefix to indicate ascending
 * or descending sort, respectively. '+' is assumed if neither character is
 * present.
 */
export function SortedKeys<Key, Value>(map: Map<Key, Value>, fields: string[]) {
	// using the fields array, sort the data record keys
	// first field is primary sort, second is secondary, etc.
	// default sort is ascending, overridden by "-" prefix ("+" is assumed)
	// remove special prefix ('+', '-', etc.) during processing
	// we may need prefix options such as: case-sensitive? title-sort?
	// can options be field prefixes or do we need sortField objects?

	const sortedKeys = Array.from(map.keys()); /* get a copy of the property */
	sortedKeys.sort((a, b) => {
		let sortValue = 0;
		/*
			*  These map values must be defined as type 'any', as this is a
			*  generic routine and is intended to work for any type of value.
			*/
		const recordA: any = map.get(a)!;
		const recordB: any = map.get(b)!;
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
	return sortedKeys;
}

/**
 * @todo
 * Instead of `field` and `value` parameters, we must provide a Query object,
 * comprised of an array of field, operator, and value entries.
 */
export function FilteredKeys<Key, Value>(map: Map<Key, Value>, field: string, value: string) {
	let filteredKeys: Key[] = [];
	for (const key of Array.from(map.keys())) {
		const entry: any = map.get(key);
		if (entry !== undefined) {
			if (entry && entry[field] == value) filteredKeys.push(key);
		}
	}
	return filteredKeys;
}

/**
 * Given an array of Map keys, return a new array containing the same keys
 * randomly shuffled.
 */
export function Shuffle<Key>(keys: Key[]) {
	const shuffledEntries: Key[] = [];
	const copyOfEntries = keys.slice(); /* don't modify original array */
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

///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A Dataset object. Given JSON text, return a Map containing data that conforms to Dataset standards:
 * - string key
 * - value containing required fields (to be determined)
 * 
 * `Dataset.keys` may be filtered using the standard Array.filter, e.g.:
 * - const filteredKeys = dataset.keys.filter(Value['field'] == 'ok');
 */
class Dataset<Value> {
	map: Map<string, Value>;
	keys: string[];
	randomKeys: string[];

	constructor(jsonData: any) {
		/* convert raw JSON data object into a Map object */
		this.map = new Map<string, Value>(Object.entries(jsonData));
		this.keys = Array.from(this.map.keys());
		this.randomKeys = Shuffle(this.keys);
	}

	/**
	 * `this.keys` may be filtered using the standard Array.filter, e.g.:
	 * - const filteredKeys = dataset.keys.filter
	 */

	/**
	 * Using the given Map field or fields, reorder the keys in the
	 * `orderedKeys` array and reset the `currentKey` to be the first element of
	 * the array. Field names may have a '+' or '-' prefix to indicate ascending
	 * or descending sort, respectively. '+' is assumed if neither character is
	 * present.
	 */
	sort(keys: string[], fields: string[]) {
		// using the fields array, sort the data record keys
		// first field is primary sort, second is secondary, etc.
		// default sort is ascending, overridden by "-" prefix ("+" is assumed)
		// remove special prefix ('+', '-', etc.) during processing
		// we may need prefix options such as: case-sensitive? title-sort?
		// can options be field prefixes or do we need sortField objects?

		const sortedKeys = keys.slice(); /* get a copy of the property */
		sortedKeys.sort((a, b) => {
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
		return sortedKeys;
	}

	filter(keys: string[], field: string, value: string) {
		// let filteredKeys = this.keys.slice();
		// filteredKeys = Array.from(this.map.keys()).filter((key: string) => {
		// 	const entry: Value|undefined = this.map.get(key);
		// 	if (entry) return entry[field] === value;
		// });
		let filteredKeys: string[] = [];
		for (const key of keys) {
			const entry: any = this.map.get(key);
			if (entry !== undefined) {
				if (entry && entry[field] == value) filteredKeys.push(key);
			}
		}
		return filteredKeys;
	}

	/**
	 * Return a randomly selected key from the given `keys` array. This method
	 * may be called multiple times, and will return a different key each time
	 * until all keys have been returned, at which time the returned key will be
	 * `undefined`--unless `recycling` is specified, in which case the random
	 * selection will be reinitialized from the given `keys`.
	 */
	randomKey(keys: string[], recycling = false) {
		let randomKey: string|undefined = undefined;
		if (keys.length) {
			if (!this.randomKeys.length && recycling) this.randomKeys = Shuffle(keys);
			randomKey = this.randomKeys.shift();
		}
		return randomKey;
	}
}

/**
 * A Collection is created from JSON text, representing a Map with string keys
 * and values specified by a generic type.
 * - Usage: const collection = new Collection\<MyType\>(jsonText);
 *
 * `map` is the Map represented in the JSON text. `orderedKeys` is an array of
 * Map keys; this array may be reordered via the `sort` method.
 */
class Collection<Value> {
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
