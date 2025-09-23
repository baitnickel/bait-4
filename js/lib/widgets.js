/**
 * The Widget superclass manages element.id assignments automatically, using its
 * static `odometer`. We are assuming that the ID is usually needed only for
 * tying the label element to the widget (control) element. By default, we
 * enclose the widget element inside the label element. The Dialog and, perhaps,
 * future Form classes will override this as they will layout the label and
 * widgets in a grid.
 */
export class Widget {
    constructor(element, labelHTML = '', appendElement = true) {
        element.id = Widget.nextID();
        this.label = document.createElement('label');
        this.label.htmlFor = element.id;
        this.label.innerHTML = labelHTML;
        if (appendElement)
            this.label.append(element);
    }
    static nextID() {
        Widget.odometer += 1;
        const base = 'Widget';
        const suffix = Widget.odometer.toString();
        return `${base}-${suffix}`;
    }
}
Widget.odometer = 0;
/**
 * Each of the Widget subclasses must maintain its own `element` property so
 * that the correct HTML Element type is associated with the subclass.
 */
export class Checkbox extends Widget {
    constructor(labelHTML, checked, appendElement = true) {
        const element = document.createElement('input');
        super(element, labelHTML, appendElement);
        this.element = element;
        this.element.type = 'checkbox';
        this.element.checked = checked;
    }
}
export class Text extends Widget {
    constructor(labelHTML, value, appendElement = true) {
        const element = document.createElement('input');
        super(element, labelHTML, appendElement);
        this.element = element;
        this.element.value = value;
    }
}
export class Range extends Widget {
    constructor(labelHTML, value, minimum, maximum, step, outputTexts, appendElement = true) {
        const element = document.createElement('input');
        super(element, labelHTML, appendElement);
        this.element = element;
        this.element.type = 'range';
        this.element.value = value.toString();
        this.element.min = minimum.toString();
        this.element.max = maximum.toString();
        this.element.step = step.toString();
        const output = document.createElement('output');
        output.innerHTML = outputText(element, outputTexts);
        this.label.append(output);
        this.element.addEventListener('input', () => {
            output.innerHTML = `${outputText(this.element, outputTexts)}`;
        });
    }
}
export class Select extends Widget {
    constructor(labelHTML, options, appendElement = true) {
        const element = document.createElement('select');
        super(element, labelHTML, appendElement);
        this.element = element;
        this.element.value = '';
        addOptions(this.element, options);
    }
}
export class RadioInput extends Widget {
    constructor(labelHTML, groupName, checked, appendElement = false) {
        const element = document.createElement('input');
        super(element, labelHTML, appendElement);
        this.element = element;
        this.element.type = 'radio';
        this.element.name = groupName;
        this.element.checked = checked;
        this.element.value = labelHTML;
    }
}
/**
 * Currently used only for the `Range` Widget--could be moved into the `Range`
 * subclass as a method if we don't find some general usage for it here.
 */
function outputText(element, outputTexts) {
    let outputText = '';
    const wildcard = '%%';
    const numericValue = Number(element.value);
    while (outputTexts.length < 3)
        outputTexts.push('');
    if (numericValue < 2)
        outputText = outputTexts[numericValue];
    else
        outputText = outputTexts[2];
    outputText = '<br>' + outputText.replace(wildcard, element.value);
    return outputText;
}
/**
 * Currently used only for the `Select` Widget--could be moved into the `Select`
 * subclass as a method if we don't find some general usage for it here.
 *
 * ### We were attempting to support a default option here (other than the disabled
 * "--select--" option), by treating the first option having a "*" suffix as the
 * default, but it doesn't work. The starred option, when chosen always sets the
 * Select element's value to ''.
 */
function addOptions(element, options) {
    const optionElements = [];
    const defaultOption = '--select--';
    let activeOption = '';
    options = options.map((option) => option.trim());
    for (let i = 0; i < options.length; i += 1) {
        let option = options[i];
        if (option.endsWith('*')) {
            options[i] = option.slice(0, -1).trim();
            if (!activeOption)
                activeOption = options[i];
        }
    }
    if (!activeOption) {
        options.unshift(defaultOption);
        activeOption = defaultOption;
    }
    for (let option of options) {
        let optionElement;
        if (option == activeOption) {
            optionElement = new Option(option, '', true, true);
            if (option == defaultOption)
                optionElement.disabled = true;
        }
        else
            optionElement = new Option(option);
        optionElements.push(optionElement);
    }
    if (activeOption != defaultOption)
        element.value = activeOption;
    for (const optionElement of optionElements)
        element.add(optionElement);
}
/**
 * Create a group of radio buttons. Unlike many of the other widgets, the value
 * of the RadioGroup (i.e., the RadioInput object that has been checked) is not
 * returned via an `element.value` property, but via this widget's `value`
 * method.
 */
export class RadioGroup {
    constructor(legendText, labels, className) {
        this.fieldset = document.createElement('fieldset');
        this.legend = document.createElement('legend');
        const controls = document.createElement('div');
        controls.className = className;
        this.className = className;
        this.legend.innerHTML = legendText;
        this.fieldset.append(this.legend);
        this.fieldset.append(controls);
        this.inputElements = [];
        const group = Widget.nextID();
        let first = true;
        for (const label of labels) {
            const checked = first; /** check the first radioInput */
            const radioInput = new RadioInput(label, group, checked);
            first = false;
            this.inputElements.push(radioInput.element);
            controls.append(radioInput.element, radioInput.label);
        }
    }
    get value() {
        let value = '';
        for (const inputElement of this.inputElements) {
            if (inputElement.checked) {
                value = inputElement.value;
                break;
            }
        }
        return value;
    }
}
/**
 * Create a Dialog element, including a FieldSet with assorted controls (Text,
 * Checkbox, Range, Select) and standardized Cancel and Confirm buttons. The
 * following classNames are applied by default:
 *
 * - dialog-grid (two-column grid for labels and elements)
 * - dialog-button-group (area for Cancel and Confirm buttons)
 * - dialog-button (styling for each of the Cancel and Confirm buttons)
 */
export class Dialog {
    constructor(legendText, target = document.body) {
        this.element = document.createElement('dialog');
        target.append(this.element);
        this.fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.innerHTML = legendText;
        this.fieldset.append(legend);
        this.controls = document.createElement('div');
        this.controls.className = 'dialog-grid';
        this.fieldset.append(this.controls);
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'dialog-button-group';
        this.cancelButton = document.createElement('button');
        this.cancelButton.className = 'dialog-button';
        this.cancelButton.innerText = 'Cancel';
        this.cancelButton.addEventListener('click', () => { this.element.close(); });
        this.confirmButton = document.createElement('button');
        this.confirmButton.className = 'dialog-button';
        this.confirmButton.innerText = 'Confirm';
        this.confirmButton.addEventListener('click', () => { this.element.close(); });
        buttonsDiv.append(this.cancelButton);
        buttonsDiv.append(this.confirmButton);
        this.element.append(this.fieldset);
        this.element.append(buttonsDiv);
    }
    addText(labelHTML, value) {
        const widget = new Text(labelHTML, value, false);
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
    addCheckbox(labelHTML, checked) {
        const widget = new Checkbox(labelHTML, checked, false);
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
    addRange(labelHTML, value, minimum, maximum, step, outputTexts) {
        const widget = new Range(labelHTML, value, minimum, maximum, step, outputTexts, false);
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
    addSelect(labelHTML, options) {
        const widget = new Select(labelHTML, options, false);
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
    addRadioGroup(legendText, labels) {
        const widget = new RadioGroup(legendText, labels, 'widget-radio-group');
        const fillerLabel = document.createElement('label'); /** empty element to fill Dialog's right column */
        this.controls.append(widget.fieldset, fillerLabel);
        return widget;
    }
}
Dialog.odometer = 0;
/**
 * Create an HTMLTableElement from a collection of row and cell data.
 *
 * Instantiate the Table object (with an array of heading values and the number
 * of columns in each data row to be created as a row header, if any). Then call
 * `addCell` for each cell of the first data row, and call `addRow` to complete
 * the row. Repeat for each row. When finished, call `createTable`, which
 * returns the HTMLTableElement.
 *
 * `addCell` and `addRow` return the HTMLTableCellElement and
 * HTMLTableRowElement, respectively, and these can be updated after creation,
 * e.g.:
 *
 * - const cell = table.addCell('value', '');
 * - cell.style.color = 'blue';
 * - cell.colSpan = 2;
 */
export class Table {
    constructor(headingValues, rowHeadings = 0) {
        this.headingValues = headingValues;
        this.rowHeadings = rowHeadings;
        this.rows = [];
        this.cells = [];
    }
    addRow(className) {
        const row = document.createElement('tr');
        if (className)
            row.classList.add(className);
        for (const cell of this.cells)
            row.append(cell);
        this.rows.push(row);
        this.cells = []; /** clear the cells array to make ready for the next row */
        return row;
    }
    addCell(text, className) {
        const cellType = (this.cells.length < this.rowHeadings) ? 'th' : 'td';
        const cell = document.createElement(cellType);
        cell.innerText = text;
        if (className)
            cell.classList.add(className);
        this.cells.push(cell);
        return cell;
    }
    createTable(className) {
        const table = document.createElement('table');
        if (className)
            table.classList.add(className);
        const row = document.createElement('tr');
        for (const headingValue of this.headingValues) {
            const cell = document.createElement('th');
            cell.innerText = headingValue;
            row.append(cell);
        }
        table.append(row);
        for (const row of this.rows)
            table.append(row);
        return table;
    }
}
/********* pre-Widget code *********************************************************/
/**
 * The Navigator class manages a set of buttons (First, Previous, Next, Last)
 * for navigating through a set of documents (an array of file path names).
 */
export class Navigator {
    constructor(documents, event) {
        this.index = 0;
        this.documents = documents;
        this.firstButton = document.createElement('button');
        this.previousButton = document.createElement('button');
        this.nextButton = document.createElement('button');
        this.lastButton = document.createElement('button');
        this.event = event;
        /** default button texts */
        this.firstButton.innerHTML = '&larrb;';
        this.previousButton.innerHTML = '&larr;';
        this.nextButton.innerHTML = '&rarr;';
        this.lastButton.innerHTML = '&rarrb;';
        if (this.documents.length > 1) {
            this.firstButton.disabled = true;
            this.previousButton.disabled = true;
            this.firstButton.addEventListener('click', () => {
                this.index = 0;
                this.firstButton.disabled = true;
                this.previousButton.disabled = true;
                this.lastButton.disabled = false;
                this.nextButton.disabled = false;
                document.dispatchEvent(this.event);
            });
            this.previousButton.addEventListener('click', () => {
                if (this.index > 0) {
                    this.index -= 1;
                    if (this.index == 0) {
                        this.firstButton.disabled = true;
                        this.previousButton.disabled = true;
                    }
                    this.lastButton.disabled = false;
                    this.nextButton.disabled = false;
                    document.dispatchEvent(this.event);
                }
            });
            this.nextButton.addEventListener('click', () => {
                if (this.index < this.documents.length - 1) {
                    this.index += 1;
                    this.firstButton.disabled = false;
                    this.previousButton.disabled = false;
                    if (this.index == this.documents.length - 1) {
                        this.lastButton.disabled = true;
                        this.nextButton.disabled = true;
                    }
                    document.dispatchEvent(this.event);
                }
            });
            this.lastButton.addEventListener('click', () => {
                if (this.index < this.documents.length - 1) {
                    this.index = this.documents.length - 1;
                    this.firstButton.disabled = false;
                    this.previousButton.disabled = false;
                    this.lastButton.disabled = true;
                    this.nextButton.disabled = true;
                    document.dispatchEvent(this.event);
                }
            });
        }
    }
    /**
     * Add the navigation buttons to the `target` element, assigning the
     * `className`, if given, to the buttons.
     */
    addButtons(target, className = '') {
        target.append(this.firstButton);
        target.append(this.previousButton);
        target.append(this.nextButton);
        target.append(this.lastButton);
        if (className) {
            this.firstButton.className = className;
            this.previousButton.className = className;
            this.nextButton.className = className;
            this.lastButton.className = className;
        }
    }
}
/**
 * Radio Buttons
 *
 * Construct an object from an array of buttons, to be laid out horizontally or
 * vertically or in a matrix. These will, I expect, all share the same class so
 * that CSS can decorate them consistently. They should behave like classic
 * radio buttons, when one is clicked all other are disabled. An object
 * attribute is set to the value of the group (the currently active button's
 * value).
 */
// export type RadioSelection = (activeButton: string) => void;
export class RadioButtons {
    constructor(classNames, activeClass, event) {
        this.buttons = [];
        if (Array.isArray(classNames))
            this.classNames = classNames;
        else
            this.classNames = [classNames];
        this.activeClass = activeClass;
        this.activeButton = '';
        this.event = event;
    }
    addButton(text, active = false) {
        const button = document.createElement('button');
        button.innerText = text;
        button.value = text;
        /** always activate the first button added (will be overridden if
         * subsequent buttons are explicitly made active)
         */
        if (!this.buttons.length) {
            button.classList.add(this.activeClass);
            this.activeButton = button.value;
        }
        if (active) {
            /** make previously added buttons inactive and activate this button */
            for (let button of this.buttons)
                button.classList.remove(this.activeClass);
            button.classList.add(this.activeClass);
        }
        for (let className of this.classNames)
            button.classList.add(className);
        this.buttons.push(button);
        button.addEventListener('click', () => {
            if (button.value != this.activeButton) {
                for (let button of this.buttons)
                    button.classList.remove(this.activeClass);
                button.classList.add(this.activeClass);
                this.activeButton = button.value;
                document.dispatchEvent(this.event); /* a button has become active */
            }
        });
    }
}
// export class Checkbox { // used in `camp`, `test-yaml`
// 	checkbox: HTMLInputElement;
// 	label: HTMLLabelElement;
// 	classNames: string[];
// 	event: Event;
// 	constructor(id: string, label: string, classNames: string|string[], event: Event, checked = false) {
// 		this.checkbox = document.createElement('input');
// 		this.label = document.createElement('label');
// 		if (Array.isArray(classNames)) this.classNames = classNames;
// 		else this.classNames = [classNames];
// 		this.event = event;
// 		this.checkbox.id = id;
// 		this.checkbox.type = 'checkbox';
// 		this.checkbox.checked = checked;
// 		this.label.htmlFor = this.checkbox.id;
// 		this.label.innerText = label;
// 		for (let className of this.classNames) this.label.classList.add(className);
// 		this.label.append(this.checkbox);
// 		this.checkbox.addEventListener('change', () => {
// 			document.dispatchEvent(this.event);
// 		})
// 	}
// }
/* ### not ready
Tables = document.createElement('div');
Tables.className = 'iching-selection';
const Table1 = createTable(3, 4, 1, 'iching')
const Table2 = createTable(3, 4, 1, 'iching')
const Table3 = createTable(3, 4, 1, 'iching')
Tables.append(Table1);
Tables.append(Table2);
Tables.append(Table3);
ThisPage.content.append(Tables);
*/
/**
 * A matrix, in this context, is a group of cells in columns and rows. Each cell
 * represents a unique selection; when one cell is selected, all the other cells
 * in the group are deselected.
 *
 * `id` is assigned as the ID of the HTMLTableElement, and is used as the prefix
 * of the HTMLTableRowElement classes (the suffix being '-row') and as the
 * prefix of the HTMLTableCellElement classes (the suffix being '-cell'). 'rows'
 * and 'columns' are the number of rows and columns to be created in the table.
 * The 'values' array will be used as the inner text of the cell elements; if
 * fewer values are supplied than the number of cells, cell text is set to: '1'
 * through `${number of cells}`;
 */
// export class Matrix {
// 	readonly element: HTMLTableElement;
// 	readonly cellValues: string[];
// 	readonly selectedValue: string;
// 	constructor(id: string, rows: number, columns: number, values: string[] = []) {
// 		this.element = document.createElement('table');
// 		this.element.id = id;
// 		this.cellValues = [];
// 		this.selectedValue = '';
// 		for (let row = 0; row < rows; row += 1) {
// 			const newRow = this.element.insertRow();
// 			newRow.className = `${this.element.id}-row`;
// 			for (let column = 0; column < columns; column += 1) {
// 				const newCell = newRow.insertCell(column);
// 				newCell.className = `${this.element.id}-cell`;
// 				const cellNumber = (row * columns) + column;
// 				newCell.id = `${this.element.id}-${cellNumber}`;
// 				if (values.length == rows * columns) newCell.innerText = values[cellNumber];
// 				else newCell.innerText = `${cellNumber + 1}`;
// 				this.cellValues.push(newCell.innerText);
// 			}
// 		}
// 	}
// 	/**
// 	 * When a cell is clicked, a method here should be called to set (or
// 	 * clear--set to null) this.selectedValue.
// 	 */
// }
