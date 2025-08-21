export class Dialog {
    constructor(legendText) {
        this.element = document.createElement('dialog');
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
    nextID() {
        Dialog.odometer += 1;
        const base = 'dialog';
        const suffix = Dialog.odometer.toString();
        return `${base}-${suffix}`;
    }
    addCheckbox(labelHTML, checked) {
        const widget = checkboxElement(labelHTML, checked, this.nextID());
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
    addText(labelHTML, value) {
        const widget = textElement(labelHTML, value, this.nextID());
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
    addRange(labelHTML, value, minimum, maximum, step, outputTexts) {
        const widget = rangeElement(labelHTML, value, minimum, maximum, step, outputTexts, this.nextID());
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
    addSelect(labelHTML, options) {
        const widget = selectElement(labelHTML, options, this.nextID());
        this.controls.append(widget.label, widget.element);
        return widget.element;
    }
}
Dialog.odometer = 0;
export function checkboxElement(labelHTML, checked, id = '') {
    const element = document.createElement('input');
    if (id)
        element.id = id;
    element.type = 'checkbox';
    element.checked = checked;
    const label = labelElement(element, labelHTML);
    const widget = { element: element, label: label };
    return widget;
}
export function textElement(labelHTML, value, id = '') {
    const element = document.createElement('input');
    if (id)
        element.id = id;
    element.value = value;
    const label = labelElement(element, labelHTML);
    const widget = { element: element, label: label };
    return widget;
}
export function rangeElement(labelHTML, value, minimum, maximum, step, outputTexts, id = '') {
    const element = document.createElement('input');
    if (id)
        element.id = id;
    element.type = 'range';
    element.value = value.toString();
    element.min = minimum.toString();
    element.max = maximum.toString();
    element.step = step.toString();
    const label = labelElement(element, labelHTML);
    const output = document.createElement('output');
    output.innerHTML = outputText(element, outputTexts);
    label.append(output);
    const widget = { element: element, label: label };
    element.addEventListener('input', () => {
        // element.value = Number(element.value);
        output.innerHTML = `${outputText(element, outputTexts)}`;
    });
    return widget;
}
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
export function selectElement(labelHTML, options, id = '') {
    const element = document.createElement('select');
    if (id)
        element.id = id;
    element.value = '';
    const label = labelElement(element, labelHTML);
    addOptions(element, options);
    const widget = { element: element, label: label };
    return widget;
}
/**
 * ### attempting to support a default option here (other than the disabled
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
    console.log(element);
    if (activeOption != defaultOption)
        element.value = activeOption;
    for (const optionElement of optionElements)
        element.add(optionElement);
    console.log(element);
}
function labelElement(element, labelHTML) {
    const label = document.createElement('label');
    label.htmlFor = element.id;
    label.innerHTML = labelHTML;
    return label;
}
/********* old code *********************************************************/
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
        // this.firstButton.innerText = '|<';
        // this.previousButton.innerText = '<';
        // this.nextButton.innerText = '>';
        // this.lastButton.innerText = '>|';
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
export class Checkbox {
    constructor(id, label, classNames, event, checked = false) {
        this.checkbox = document.createElement('input');
        this.label = document.createElement('label');
        if (Array.isArray(classNames))
            this.classNames = classNames;
        else
            this.classNames = [classNames];
        this.event = event;
        this.checkbox.id = id;
        this.checkbox.type = 'checkbox';
        this.checkbox.checked = checked;
        this.label.htmlFor = this.checkbox.id;
        this.label.innerText = label;
        for (let className of this.classNames)
            this.label.classList.add(className);
        this.label.append(this.checkbox);
        this.checkbox.addEventListener('change', () => {
            document.dispatchEvent(this.event);
        });
    }
}
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
export class Matrix {
    constructor(id, rows, columns, values = []) {
        this.element = document.createElement('table');
        this.element.id = id;
        this.cellValues = [];
        this.selectedValue = '';
        for (let row = 0; row < rows; row += 1) {
            const newRow = this.element.insertRow();
            newRow.className = `${this.element.id}-row`;
            for (let column = 0; column < columns; column += 1) {
                const newCell = newRow.insertCell(column);
                newCell.className = `${this.element.id}-cell`;
                const cellNumber = (row * columns) + column;
                newCell.id = `${this.element.id}-${cellNumber}`;
                if (values.length == rows * columns)
                    newCell.innerText = values[cellNumber];
                else
                    newCell.innerText = `${cellNumber + 1}`;
                this.cellValues.push(newCell.innerText);
            }
        }
    }
}
