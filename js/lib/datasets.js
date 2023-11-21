/**
 * A Collection is created from JSON text, representing a Map with string keys
 * and values treated as any type (can't pass generic types into a class).
 */
export class Collection {
    constructor(jsonText) {
        /* convert raw JSON text into a Map object */
        this.map = new Map(Object.entries(jsonText));
        this.index = 0;
        this.orderedKeys = Array.from(this.map.keys()); // modified by sort method
        this.randomKeys = Shuffle(this.orderedKeys);
    }
    sort(fields) {
        const keys = Array.from(this.map.keys());
        // using the fields array, sort the data record keys
        // first field is primary sort, second is secondary, etc.
        // default sort is ascending, overridden by "-" prefix ("+" is assumed)
        // remove prefix for processing
        return keys; // sorted keys
    }
    // any/all of these may pass in an optional filter (tags, etc.)
    currentKey() {
        if (!this.orderedKeys.length)
            return '';
        return this.orderedKeys[this.index];
    }
    firstKey() {
        if (!this.orderedKeys.length)
            return '';
        this.index = 0;
        return this.orderedKeys[this.index];
    }
    lastKey() {
        if (!this.orderedKeys.length)
            return '';
        this.index = this.orderedKeys.length - 1;
        return this.orderedKeys[this.index];
    }
    nextKey() {
        if (!this.orderedKeys.length)
            return '';
        this.index += 1;
        if (this.index >= this.orderedKeys.length)
            this.index = 0;
        return this.orderedKeys[this.index];
    }
    previousKey() {
        if (!this.orderedKeys.length)
            return '';
        this.index -= 1;
        if (this.index < 0)
            this.index = this.orderedKeys.length - 1;
        return this.orderedKeys[this.index];
    }
    proximateKey() {
        if (!this.orderedKeys.length)
            return '';
        return ''; // not supported yet ... is there a general meaning here??
    }
    randomKey() {
        let randomKey = '';
        if (this.randomKeys.length) {
            randomKey = this.randomKeys.shift(); // get and remove the random key
        }
        else {
            this.randomKeys = Shuffle(this.orderedKeys); /* generate a new randomKeys array */
            if (this.randomKeys.length)
                randomKey = this.randomKeys.shift();
        }
        return randomKey;
    }
    render(options) {
        let html = '';
        // options are like render "as article", "as quote", etc.
        // this is where a header/options record may be needed
        // returns HTML
        return html;
    }
}
/**
 * Given an array of strings, return a new array containing the same entries
 * randomly shuffled.
 */
export function Shuffle(entries) {
    const shuffledEntries = [];
    const copyOfEntries = entries.slice(0); /* don't modify original array */
    while (copyOfEntries.length > 0) {
        const randomIndex = Math.floor(Math.random() * copyOfEntries.length);
        shuffledEntries.push(copyOfEntries.splice(randomIndex, 1)[0]);
    }
    return shuffledEntries;
}
