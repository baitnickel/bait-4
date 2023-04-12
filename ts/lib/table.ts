/**
 * RowData is a map containing fieldName:fieldValue, representing field names and
 * field values for a single table row. The 'createTable' function expects an
 * array of RowData maps, typically read from JSON or YAML. In the YAML example below,
 * 'pets' is of type: RowData[].
 *
   pets:
     -
       type: dog
       name: Tracy
       born: 1966
     -
       type: cat
       name: Figaro
       born: 1990
 */

export type RowData = Map<string, string|number|boolean|null>;

export type Options = {
	headingColumns: string[],
	classPrefix: string,
	classElement: string,
};

export function createTable(rows: RowData[], columns: string[], options: Options|null = null) {
	let tableElement = document.createElement('table');
	if (columns.length) {
		let rowElement = document.createElement('tr');
		for (let column of columns) {
			let rowItemElement = document.createElement('th');
			rowItemElement.innerText = prettyHeading(column);
			rowElement.appendChild(rowItemElement);
		}
		tableElement.appendChild(rowElement);

		for (let row of rows) {
			let rowElement = document.createElement('tr');
			if (options && row.has(options.classElement)) {
				rowElement.classList.add(`${options.classPrefix}${row.get(options.classElement)}`);
			}
			for (let column of columns) {
				let cellType = (options && options.headingColumns.includes(column)) ? 'th' : 'td';
				let rowItemElement = document.createElement(cellType);
				let value = (row.has(column)) ? row.get(column) : '';
				if (value === null) value = '';
				rowItemElement.innerText = `${value}`;
				rowElement.appendChild(rowItemElement);
			}
			tableElement.appendChild(rowElement);
		}
	}
	return tableElement;
}

function prettyHeading(heading: string) {
	/**
	 * Split heading into multiple words on hyphens or underscores, and
	 * capitalize each word.
	 */
    let prettyWords: string[] = [];
    let words = heading.split(/[-_]+/g);
    for (let word of words) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        prettyWords.push(word)
    }
    return prettyWords.join(' ');
}