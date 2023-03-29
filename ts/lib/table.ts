/**
 * RowData is an object containing key:values, representing field names and
 * field values for a single table row. The 'createTable' function expects a
 * RowData array, typically read from JSON or YAML. In the YAML example below,
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

export type RowData = { [key: string]: string|number|boolean|null };

export type TableOptions = {
	headingCells: string[],
	classPrefix: string,
	classElement: string,
};

export function createTable(
	rows: RowData[],
	headings: string[],
	elements: string[],
	tableOptions: TableOptions|null = null,
) {
	let tableElement = document.createElement('table');
	if (headings.length) {
		let rowElement = document.createElement('tr');
		for (let heading of headings) {
			let rowItemElement = document.createElement('th');
			rowItemElement.innerText = heading;
			rowElement.appendChild(rowItemElement);
		}
		tableElement.appendChild(rowElement);
	}
	for (let row of rows) {
		let rowElement = document.createElement('tr');
		if (tableOptions && tableOptions.classElement in row && row[tableOptions.classElement]) {
			rowElement.classList.add(`${tableOptions.classPrefix}${row[tableOptions.classElement]}`);
		}
		for (let element of elements) {
			let cellType = (tableOptions && tableOptions.headingCells.includes(element)) ? 'th' : 'td';
			let rowItemElement = document.createElement(cellType);
			let value = (element in row) ? row[element] : '';
			if (value === null) value = '';
			rowItemElement.innerText = `${value}`;
			rowElement.appendChild(rowItemElement);
		}
		tableElement.appendChild(rowElement);
	}
	return tableElement;
}
