/**
 * A Collection is, in effect, an extension of Map. Collection keys must be
 * strings, and Collection values are specified by the generic Interface type,
 * which represents the data record in the Collection entries.
 */
export class Collection {
    get keys() { return Array.from(this.map.keys()); }
    get size() { return this.map.size; }
    constructor(data = {}) {
        this.map = new Map(Object.entries(data));
        this.originalKeys = Array.from(this.map.keys());
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
    sort(fields = []) {
        const newMap = new Map();
        let descending = false;
        let caseSensitive = false;
        let titleSort = false;
        let sortFields = (typeof fields == 'string') ? [fields] : fields;
        let sortedKeys = this.originalKeys; /* when no argument, revert to original sort */
        if (sortFields.length) {
            sortedKeys = this.keys; /* get a copy of the property */
            sortedKeys.sort((a, b) => {
                let sortValue = 0;
                const recordA = this.map.get(a);
                const recordB = this.map.get(b);
                for (let field of sortFields) {
                    let options = [];
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
                            fieldA = title(fieldA);
                            fieldB = title(fieldB);
                        }
                        if (fieldA == fieldB)
                            continue;
                        if (descending)
                            sortValue = (fieldA > fieldB) ? -1 : 1;
                        else
                            sortValue = (fieldA > fieldB) ? 1 : -1;
                        break;
                    }
                }
                return sortValue;
            });
        }
        for (const key of sortedKeys) {
            newMap.set(key, this.map.get(key));
        }
        this.map = newMap;
    }
    /**
     * Randomly sort the private map.
     */
    shuffle() {
        const sortedKeys = [];
        const newMap = new Map();
        const copyOfKeys = this.keys;
        while (copyOfKeys.length > 0) {
            const randomIndex = Math.floor(Math.random() * copyOfKeys.length);
            sortedKeys.push(copyOfKeys.splice(randomIndex, 1)[0]);
        }
        for (const key of sortedKeys) {
            newMap.set(key, this.map.get(key));
        }
        this.map = newMap;
    }
    /**
     * Similar to Map.get, return the value of a given field in the entry
     * specified by the given key. Unlike Map.get, a non-null value will always
     * be returned.
     */
    get(key, field) {
        let fieldValue = '';
        let record = this.map.get(key);
        if (record !== undefined && field in record) {
            fieldValue = record[field];
        }
        return fieldValue;
    }
    /**
     * Extract only those entries meeting some selection criteria, such as an
     * array of Query statements.
     */
    extract() {
    }
}
/**
 * Given a string containing a title (such as a song title or a band
 * name), return a string that may be used in sorting, where all
 * characters are converted to lower case, and leading articles ('a',
 * 'an', and 'the') are moved to the title's end.
 */
function title(rawTitle) {
    let adjustedTitle = rawTitle;
    const words = adjustedTitle.split(/\s+/);
    if (!words[0])
        words.shift(); /** remove leading whitespace */
    /** remove leading article */
    if (['a', 'an', 'the'].includes(words[0].toLowerCase())) {
        const newLastWord = words.shift();
        if (newLastWord)
            words.push(newLastWord);
    }
    adjustedTitle = words.join(' ');
    return adjustedTitle;
}
/**
 * Given an array of strings (such as Map keys), return a new array containing
 * the same strings randomly shuffled.
 */
export function Shuffle(array) {
    const shuffledStrings = [];
    const copyOfStrings = array.slice(); /* don't modify original array */
    while (copyOfStrings.length > 0) {
        const randomIndex = Math.floor(Math.random() * copyOfStrings.length);
        shuffledStrings.push(copyOfStrings.splice(randomIndex, 1)[0]);
    }
    return shuffledStrings;
}
