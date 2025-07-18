/**
 * Dialog box (modal or non-modal) with fieldset.
 *
 * The caller will open a modal Dialog with "modal.element.showModal()", and a
 * non-modal Dialog with "modal.element.show()". "modal.element.close()" will
 * close either type of Dialog.
 *
 * Create Widgets using the classes below, then create the Dialog and add the
 * Widgets to it in top-to-bottom order.
 */
export class Dialog {
    constructor(legend) {
        this.element = document.createElement('dialog');
        this.fieldSet = document.createElement('fieldset');
        this.legend = document.createElement('legend');
        this.legend.innerHTML = legend;
        this.fieldSet.append(this.legend);
        this.widgetList = document.createElement('ul');
    }
    /** add a single widget as a list item (li) */
    addWidget(widget) {
        const listItem = document.createElement('li');
        listItem.append(widget);
        this.widgetList.append(listItem);
    }
    /** add an array of widgets to a single list item (li) */
    addWidgets(widgets) {
        const listItem = document.createElement('li');
        for (const widget of widgets)
            listItem.append(widget);
        this.widgetList.append(listItem);
    }
    /** complete dialog element and append to container element */
    appendTo(container) {
        this.fieldSet.append(this.widgetList);
        this.element.append(this.fieldSet);
        container.append(this.element);
    }
}
/**
 * Basic single-line text input widget. The `value` property will hold a string.
 */
export class Text {
    constructor(value, labelHTML) {
        this.element = document.createElement('input');
        this.value = value;
        this.element.value = value;
        this.labelElement = label(this.element, labelHTML);
        this.widget = this.labelElement;
        this.element.addEventListener('change', () => {
            this.value = this.element.value;
        });
    }
}
/**
 * Drop-Down Selection widget. The `value` property will hold a string.
 */
export class Select {
    constructor(labelHTML) {
        this.element = document.createElement('select');
        this.value = '';
        this.labelElement = label(this.element, labelHTML);
        this.widget = this.labelElement;
        this.element.addEventListener('change', (e) => {
            const element = e.target; /** TypeScript requires cast */
            this.value = element.value;
        });
    }
    /**
     * Given an array of `texts`, create an array of Option Elements, each one
     * representing a drop-down value. When a `headerOption` is supplied (e.g.,
     * '--select--'), it will appear as the default (and disabled) initial
     * selection. After any header, option texts will be sorted alphabetically
     * unless the `sorted` option is overridden to false.
     */
    addOptions(texts, headerOption = '', sorted = true) {
        const options = [];
        if (sorted)
            texts.sort((a, b) => a.localeCompare(b));
        if (headerOption) {
            const option = new Option(headerOption, '', true, true);
            option.disabled = true;
            options.push(option);
        }
        for (const text of texts) {
            const option = new Option(text);
            options.push(option);
        }
        this.value = options[0].value;
        for (const option of options)
            this.element.add(option);
    }
}
/**
 * Checkbox widget. The `value` property will hold a boolean.
 */
export class Checkbox {
    constructor(checked, labelHTML) {
        this.element = document.createElement('input');
        this.element.type = 'checkbox';
        this.value = checked;
        this.element.checked = checked;
        this.labelElement = label(this.element, labelHTML);
        this.widget = this.labelElement;
        this.element.addEventListener('change', () => {
            this.value = this.element.checked;
        });
    }
}
/**
 * Range widget. A slider control is created for setting the `value` property (a
 * number between `minimum` and `maximum`, inclusive).
 */
export class Range {
    constructor(value, labelHTML, outputLabel, minimum, maximum, step) {
        this.element = document.createElement('input');
        this.element.type = 'range';
        this.value = value;
        this.element.value = `${value}`;
        this.element.min = `${minimum}`;
        this.element.max = `${maximum}`;
        this.element.step = `${step}`;
        this.labelElement = label(this.element, labelHTML);
        this.widget = this.labelElement;
        this.output = document.createElement('output');
        this.output.innerHTML = `<br>${outputLabel}${this.element.value}`;
        this.labelElement.append(this.output);
        this.element.addEventListener('input', () => {
            this.output.innerHTML = `<br>${outputLabel}${this.element.value}`;
            this.value = Number(this.element.value);
        });
    }
}
/**
 * Button widget. In addition to the button label given in `labelHTML`, an
 * `event` must be provided which will be dispatched when the button is clicked.
 */
export class Button {
    constructor(labelHTML, event) {
        this.element = document.createElement('button');
        this.element.innerHTML = labelHTML;
        this.event = event;
        this.widget = this.element;
        this.element.addEventListener('click', () => {
            document.dispatchEvent(this.event);
        });
    }
}
/**
 * Wrap the label specified in `labelHTML` around the given `element` and return
 * the label element.
 */
function label(element, labelHTML) {
    const labelElement = document.createElement('label');
    labelElement.htmlFor = element.id;
    labelElement.innerHTML = labelHTML;
    labelElement.append(element);
    return labelElement;
}
/** ------------ end of Widgets designed for use in Dialog boxes ------------ */
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
export class Checkbox1 {
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
