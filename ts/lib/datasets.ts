/**
 * A Collection is created from JSON text, representing a Map with string keys
 * and values treated as any type (can't pass generic types into a class).
 */
export class Collection<Value> {
	map: Map<string, Value>;
	// headerRecord: Value; // or possibly a standard Collections header type
	// dataRecords: Map<string, Value>; 
	currentKey: string;
	orderedKeys: string[]; // persists until sorted again
	randomKeys: string[]; // array is depleted every time an entry is requested, rebuilt when empty

	constructor(jsonPath: any) {
		// convert raw file into data object and extract the header row and the data rows
		let jsonData = {}; // read the jsonPath file and get data object
		this.map = new Map<string, Value>(Object.entries(jsonData));
		// this.headerRecord = {};
		// this.dataRecords = {};
		this.currentKey = '';
		this.orderedKeys = []; // populated by sort method
		this.randomKeys = []; // populated by random method
	}

	sort(fields: string[]) {
		const keys = Object.keys(this.map);
		// using the fields array, sort the data record keys
		// first field is primary sort, second is secondary, etc.
		// default sort is ascending, overridden by "-" prefix ("+" is assumed)
		// remove prefix for processing
		return keys; // sorted keys
	}

	// any/all of these may pass in an optional filter (tags, etc.)
	first() {}
	last() {}
	next() {}
	previous() {}
	proximate() {}
	random() {
		let randomKey: string|undefined
		randomKey = this.randomKeys.pop(); // get and remove the random key
		if (randomKey === undefined) {
			// regenerate a new this.randomKeys (avoid first being same as current?)
			randomKey = this.randomKeys.pop();
		}
		if (randomKey) this.currentKey = randomKey;
	}

	render(options: string[]) {
		let html = '';
		// options are like render "as article", "as quote", etc.
		// returns HTML
		return html;
	}
}
