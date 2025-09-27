/**
 * Deprecated, replaced by the Table class in the widgets module. See old
 * example of its use below.
 * 
 * RowData is a map containing fieldName:fieldValue, representing field names
 * and field values for a single table row. The 'createTable' function expects
 * an array of RowData maps, typically read from JSON or YAML. In the YAML
 * example below, 'pets' is of type: RowData[].
 ```
   pets:
     -
       type: dog
       name: Tracy
       born: 1966
     -
       type: cat
       name: Figaro
       born: 1990
```
 */
export type RowData = Map<string, string|number|boolean|null>;

/**
 * `Options.headingColumns` is an array of fieldNames (keys in the RowData map),
 * identifying which field(s) will be displayed as row headings (bold and
 * centered) in the data rows--typically the first cell in each data row.
 * 
 * When provided, `Options.classPrefix` will add a CSS class to each data row,
 * using this string as the class prefix. This is normally used in combination
 * with `Options.classElement`.
 * 
 * `Options.classElement` is the fieldName in the RowData whose fieldValue is
 * added to the class prefix for use in CSS styling. For instance, in the "pets"
 * example above, we might set the classPrefix to 'pet-type-' and the
 * classElement to 'type' to support CSS:
 * 
 * - .pet-type-dog {color: green;}
 * - .pet-type-cat {color: blue;}
 */
export type Options = {
	headingColumns: string[],
	classPrefix: string,
	classElement: string,
};

/**
 * Given `rows` (an array of maps, where the map key is a string field name and
 * the map value is a string, number, boolean, or null field value), `columns`
 * (a list of field names to be included as table columns), and optional
 * `options` (which can affect styling), build an HTML table and return an
 * HTMLTableElement.
 * 
 * This function was designed for converting JSON or YAML file structures into
 * HTML Tables. As such, it is a bit rigid in terms of things like column
 * headings (which must be valid YAML keys, for instance).
 */
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

/**
 * Split heading into multiple words on hyphens or underscores, and
 * capitalize each word.
 */
function prettyHeading(heading: string) {
    let prettyWords: string[] = [];
    let words = heading.split(/[-_]+/g);
    for (let word of words) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        prettyWords.push(word)
    }
    return prettyWords.join(' ');
}

/** old example of usage: */
/*
	const tableRows: Table.RowData[] = [];
	for (const site of sites) {
		const map: Table.RowData = new Map(Object.entries(site));
		tableRows.push(map);
	}
	const tableElements = ['site', 'type', 'size', 'tents', 'table', 'comment'];
	const tableOptions: Table.Options = {
		headingColumns: ['site'],
		classPrefix: 'campsite-',
		classElement: 'category',
	};
	sitesDiv.append(Table.createTable(tableRows, tableElements, tableOptions));
*/