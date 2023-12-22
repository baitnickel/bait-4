/**
 * A Collection is, in effect, an extension of Map. Collection keys must be
 * strings, and Collection values are specified by the generic Structure type,
 * which represents the data record in the Collection entries.
 */
export class Collection<Structure> {
	private map;
	private originalKeys;
	private index;
	get keys() { return Array.from(this.map.keys()) }
	get size() { return this.map.size }

	constructor(data: any = {}) {
		this.map = new Map<string, Structure>(Object.entries(data));
		this.originalKeys = Array.from(this.map.keys());
		this.index = (this.size !== 0) ? 0 : null;
	}

	/**
	 * Given a `key` to an `Structure` record, return the `record` or
	 * `undefined` if the key is invalid.
	 */
	record(key: string) {
		let record = this.map.get(key);
		return record;
	}

	/**
	 * Return the key of the first entry in the collection, or null if the
	 * collection is empty.
	 */
	first() {
		if (this.size) {
			this.index = 0;
			return this.keys[this.index];
		}
		else return null;
	}

	/**
	 * Return the key of the previous entry in the collection, or null if the
	 * collection is empty or there is no previous key.
	 */
	previous() {
		if (this.size && this.index) {
			this.index -= 1;
			return this.keys[this.index];
		}
		else return null;
	}

	/**
	 * Return the key of the next entry in the collection, or null if the
	 * collection is empty or there is no next key.
	 */
	next() {
		if (this.size && this.index !== null && this.index < this.size - 1) {
			this.index += 1;
			return this.keys[this.index];
		}
		else return null;
	}

	/**
	 * Return the key of the last entry in the collection, or null if the
	 * collection is empty.
	 */
	last() {
		// if (this.size && this.index && this.index !== this.size - 1) {
		if (this.size) {
			this.index = this.size - 1;
			return this.keys[this.index];
		}
		else return null;
	}

	/**
	 * Sort the private map in place. Field names may contain an optional prefix
	 * of sort options to control sort direction (assuming ascending),
	 * case-sensitivity (assuming not), title-sorting (assuming not). The prefix
	 * is separated from the field name with a colon. Each option is a single
	 * case-insensitive character, and multiple options may be included in the
	 * prefix (as in 'dct:fieldname').
	 * - d: descending
	 * - c: case-sensitive
	 * - t: title (ignore leading 'a', 'an', 'the')
	 */
	sort(fields: string|string[] = []) {
		const newMap = new Map<string, Structure>();
		let descending = false;
		let caseSensitive = false;
		let titleSort = false;
		let sortFields: string[] = (typeof fields == 'string') ? [fields] : fields;
		let sortedKeys = this.originalKeys; /* when no argument, revert to original sort */
		if (sortFields.length) {
			sortedKeys = this.keys; /* get a copy of the property */
			sortedKeys.sort((a, b) => {
				let sortValue = 0;
				const recordA: any = this.map.get(a)!;
				const recordB: any = this.map.get(b)!;
				for (let field of sortFields) {

					let options: string[] = [];
					const colonPosition = field.indexOf(':');
					if (colonPosition >= 0) {
						let prefix = field.slice(0, colonPosition);
						options = prefix.split('');
						field = field.slice(colonPosition + 1);
						for (const option of options) {
							if (option.toLowerCase() == 'd') {
								descending = true;
								continue;
							}
							if (option.toLowerCase() == 'c') {
								caseSensitive = true;
								continue;
							}
							if (option.toLowerCase() == 't') {
								titleSort = true;
								continue;
							}
						}
					}


					if (field in recordA && field in recordB) {
						let fieldA = recordA[field];
						let fieldB = recordB[field];
						if (!caseSensitive) {
							fieldA = fieldA.toLowerCase();
							fieldB = fieldB.toLowerCase();
						}
						if (titleSort) {
							fieldA = SortableTitle(fieldA);
							fieldB = SortableTitle(fieldB);
						}
						if (fieldA == fieldB) continue;
						if (descending) sortValue = (fieldA > fieldB) ? -1 : 1;
						else sortValue = (fieldA > fieldB) ? 1 : -1;
						break;
					}
				}
				return sortValue;
			});
		}
		for (const key of sortedKeys) {
			newMap.set(key, this.map.get(key)!);
		}
		this.map = newMap;
	}

	/**
	 * Randomly sort the private map.
	 */
	shuffle() {
		const newMap = new Map<string, Structure>();
		const shuffledKeys = ShuffleKeys(this.keys);
		for (const key of shuffledKeys) newMap.set(key, this.map.get(key)!);
		this.map = newMap;
	}

	/**
	 * Return an array of strings, representing a subset of this Collection's
	 * keys, including only entries that pass the test in the given `include`
	 * function.
	 */
	subset(include: (key: string) => boolean) {
		const keys: string[] = [];
		for (const key of this.keys) {
			if (include(key)) keys.push(key);
		}
		return keys;
	}

	/**
	 * Extract only those entries meeting some selection criteria, such as an
	 * array of Query statements.
	 *
	 * I think this method should take an expression, where the first word is a
	 * valid field name in this.map, the second word is a comparison operator,
	 * and the remainder of the expression is a value to be tested. This should
	 * return either the selected keys or a new Collection.
	 */
	// extract() {
	// }
}

/**
 * A Query object is created from a string expression, e.g.:
 * - 'title == a day in the life'
 * - 'composer != "leonard bernstein"'
 * - 'year >= 1970'
 *
 * Valid operators are: '==', '!=', '<', '>', '<=', '>='
 *
 * The part of the expression that precedes the operator is a value that is
 * typically read from a field in a data record. If it contains spaces or is not
 * a number, it will be quoted. The part of the expression that follows the
 * operator may be quoted--if it is meant to be treated as a number, it must be
 * numeric and unquoted.
 */
export class Query {
	private fieldValue: string;
	private operator: string;
	private testValue: string;
	private numericTest: boolean;

	constructor(expression: string) {
		const matchResults = /\s*(\S+)\s+(\S+)\s+(.*)/.exec(expression.trim());
		this.numericTest = true;
		if (matchResults !== null) {
			this.fieldValue = matchResults[1];
			this.operator = matchResults[2].toUpperCase();
			this.testValue = matchResults[3];
			/* if `testValue` is quoted, remove the quote marks (' or ") */
			if (
				(this.testValue.startsWith("'") && this.testValue.endsWith("'"))
				|| (this.testValue.startsWith('"') && this.testValue.endsWith('"'))
			) {
				this.testValue = this.testValue.slice(1, -1);
				this.numericTest = false;
			}
		}
		else {
			this.fieldValue = '';
			this.operator = '';
			this.testValue = '';
		}
	}

	/**
	 * Perform the logical comparison represented by the expression passed to
	 * the constructor, and return a boolean result.
	 */
	result() {
		// '==' | '!=' | '<' | '>' | '<=' | '>='
		let result = false;
		const fieldNumber = Number(this.fieldValue);
		const testNumber = Number(this.testValue);
		const numbers = (!isNaN(fieldNumber) && !isNaN(testNumber));
		switch (this.operator) {
			case '==':
				if (numbers && this.numericTest) {
					if (fieldNumber == testNumber) result = true;
				}
				else if (`${this.fieldValue}` == `${this.testValue}`) result = true;
				break;
			case '!=':
				if (numbers && this.numericTest) {
					if (fieldNumber != testNumber) result = true;
				}
				else if (`${this.fieldValue}` != `${this.testValue}`) result = true;
				break;
			case '<':
				if (numbers && this.numericTest) {
					if (fieldNumber < testNumber) result = true;
				}
				else if (`${this.fieldValue}` < `${this.testValue}`) result = true;
				break;
			case '>':
				if (numbers && this.numericTest) {
					if (fieldNumber > testNumber) result = true;
				}
				else if (`${this.fieldValue}` > `${this.testValue}`) result = true;
				break;
			case '<=':
				if (numbers && this.numericTest) {
					if (fieldNumber <= testNumber) result = true;
				}
				else if (`${this.fieldValue}` <= `${this.testValue}`) result = true;
				break;
			case '>=':
				if (numbers && this.numericTest) {
					if (fieldNumber >= testNumber) result = true;
				}
				else if (`${this.fieldValue}` >= `${this.testValue}`) result = true;
				break;
			default:
				/* always return false if the operator is invalid */
				result = false;
		}
		return result;
	}
} 

/**
 * Given a string containing a title (such as a song title or a band
 * name), return a string that may be used in sorting, where all
 * characters are converted to lower case, and leading articles ('a',
 * 'an', and 'the') are moved to the title's end.
 */ 
export function SortableTitle(rawTitle: string) {
	let adjustedTitle = rawTitle;
	const words = adjustedTitle.split(/\s+/);
	if (!words[0]) words.shift(); /** remove leading whitespace */
	/** remove leading article */
	if (['a', 'an', 'the'].includes(words[0].toLowerCase())) {
		const newLastWord = words.shift();
		if (newLastWord) words.push(newLastWord);
	} 
	adjustedTitle = words.join(' ');
	return adjustedTitle;
}

/**
 * Given an array of strings (such as Map keys), return a new array containing
 * the same strings randomly shuffled.
 */
export function ShuffleKeys(keys: string[]) {
	const shuffledStrings: string[] = [];
	const copyOfStrings = keys.slice(); /* don't modify original keys */
	while (copyOfStrings.length > 0) {
		const randomIndex = Math.floor(Math.random() * copyOfStrings.length);
		shuffledStrings.push(copyOfStrings.splice(randomIndex, 1)[0]);
	}
	return shuffledStrings;
}

/**
 * Given an array of strings (such as Map keys), return a string selected at
 * random from the array. If the array is empty, return `undefined`.
 */
export function RandomKey(keys: string[]) {
	let key: string|undefined = undefined;
	if (keys.length) {
		const randomIndex = Math.floor(Math.random() * keys.length);
		key = keys[randomIndex];
	}
	return key;
}
