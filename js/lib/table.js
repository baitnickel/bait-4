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
export function createTable(rows, columns, options = null) {
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
                if (value === null)
                    value = '';
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
function prettyHeading(heading) {
    let prettyWords = [];
    let words = heading.split(/[-_]+/g);
    for (let word of words) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        prettyWords.push(word);
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
