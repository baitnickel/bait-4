/**
 * The Widget superclass. The `exposedElement` property holds the subclass HTMLElement
 * which will be rendered; for some widgets, this may be the label that contains
 * the control element.
 *
 * All Widget elements are automatically assigned IDs here--the calling programs
 * should not set element.id, and should only use class selectors in CSS.
 *
 * @todo
 * - .dialog-widget {
 * -   display: grid;
 * -   grid-template-columns: 1fr 1fr 1fr;
 * -   gap: 1em
 * - }
 *
 * Note - "1fr" indicates 1 fractional unit in grid
 */
// type DialogButton = {
// 	name: string;
// 	event: string;
// }
export class Widget {
    constructor(labelHTML) {
        this.exposedElement = null;
        this.labelHTML = labelHTML;
    }
    /**
     * For automatic element.id assignments, get and return the next ID number
     * and increment the odometer.
     */
    nextID() {
        const base = 'widget';
        const suffix = Widget.odometer.toString();
        Widget.odometer += 1;
        return `${base}-${suffix}`;
    }
    /**
     * Wrap the label specified in `labelHTML` around the given `element` and
     * return the label element.
     */
    label(element, labelHTML) {
        const labelElement = document.createElement('label');
        labelElement.id = this.nextID();
        labelElement.htmlFor = element.id;
        labelElement.innerHTML = labelHTML;
        labelElement.append(element);
        return labelElement;
    }
}
Widget.odometer = 0;
/********** v2 - experimental ************************************************************************/
/**
 * Dialog box (modal or non-modal) with fieldset. The caller will open a Dialog
 * with "Dialog.open()" and close it with "Dialog.close()". Create Widgets using
 * the classes below, then create the Dialog and add the Widgets to it in
 * top-to-bottom order.
 */
export class Dialog2 extends Widget {
    // buttons: DialogButton[];
    constructor(legend, buttons = ['Cancel', 'Confirm'], modal = true) {
        super(legend);
        this.element = document.createElement('dialog');
        this.element.id = this.nextID();
        this.modal = modal;
        this.fieldSet = document.createElement('fieldset');
        this.fieldSet.id = this.nextID();
        this.legend = document.createElement('legend');
        this.legend.id = this.nextID();
        this.legend.innerHTML = legend;
        this.fieldSet.append(this.legend);
        this.widgetList = document.createElement('ul');
        this.widgetList.id = this.nextID();
        this.components = [];
        // this.buttons = [];
        for (const button of buttons) {
            // this.buttons.push({name: button, event: `bait:dialog:${button}`});
            /**
             * actually, create button Widgets and add an array of them to the
             * Dialog object, assigning the event name as above. Then, do as
             * we've done using addWidgets to append them to the Dialog
             * FieldSet. I think we still need a method to retrieve button event
             * names from the Button widgets.
             */
        }
    }
    // buttonEvent(buttonName: string) {
    // 	let event = '';
    // 	for (const button of this.buttons) {
    // 		if (button.name == buttonName) {
    // 			event = button.event;
    // 			break;
    // 		}
    // 	}
    // 	return event;
    // }
    /** add component element */
    addComponent(widget) {
        this.components.push(widget);
    }
    /** add a single widget as a list item (li) */
    addWidget(widget) {
        if (widget.exposedElement) {
            const listItem = document.createElement('li');
            listItem.id = this.nextID();
            listItem.append(widget.exposedElement);
            this.widgetList.append(listItem);
        }
    }
    /** add an array of widgets to a single list item (li) */
    addWidgets(widgets) {
        const listItem = document.createElement('li');
        listItem.id = this.nextID();
        let widgetsAdded = 0;
        for (const widget of widgets) {
            if (widget.exposedElement) {
                listItem.append(widget.exposedElement);
                widgetsAdded += 1;
            }
        }
        if (widgetsAdded)
            this.widgetList.append(listItem);
        else
            listItem.remove();
    }
    // /** complete dialog element and append to container element */
    // build(container: HTMLElement) {
    // 	for (const component of this.components)
    // 		this.fieldSet.append(component.exposedElement);
    // }
    /** complete dialog element and append to container element */
    finish(container) {
        this.fieldSet.append(this.widgetList);
        this.element.append(this.fieldSet);
        container.append(this.element);
    }
    open() {
        if (this.modal)
            this.element.showModal();
        else
            this.element.show();
    }
    close() {
        this.element.close();
    }
}
/**
 * Basic single-line text input widget. The `value` property will hold a string.
 */
export class Text2 extends Widget {
    constructor(labelHTML, value, dialog = null) {
        super(labelHTML);
        this.element = document.createElement('input');
        this.element.id = this.nextID();
        this.value = value;
        this.element.value = value;
        this.labelElement = this.label(this.element, labelHTML);
        this.exposedElement = this.labelElement;
        if (dialog)
            dialog.addWidget(this);
        this.element.addEventListener('change', () => {
            this.value = this.element.value;
        });
    }
}
/**
 * Drop-Down Selection widget. The `value` property will hold a string.
 */
export class Select2 extends Widget {
    constructor(labelHTML, options, dialog = null) {
        super(labelHTML);
        this.element = document.createElement('select');
        this.element.id = this.nextID();
        this.value = '';
        this.labelElement = this.label(this.element, labelHTML);
        this.exposedElement = this.labelElement;
        this.addOptions(options);
        if (dialog)
            dialog.addWidget(this);
        this.element.addEventListener('change', (e) => {
            const element = e.target; /** TypeScript requires cast */
            this.value = element.value;
        });
    }
    addOptions(options) {
        const optionElements = [];
        const defaultOption = '--select--';
        let activeOption = '';
        // for (let option of options) {
        for (let i = 0; i < options.length; i += 1) {
            let option = options[i];
            if (option.endsWith('*')) {
                options[i] = option.slice(0, -1);
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
            this.value = activeOption;
        for (const optionElement of optionElements)
            this.element.add(optionElement);
    }
}
/**
 * Checkbox widget. The `value` property will hold a boolean.
 */
export class Checkbox2 extends Widget {
    constructor(labelHTML, checked, dialog = null) {
        super(labelHTML);
        this.element = document.createElement('input');
        this.element.id = this.nextID();
        this.element.type = 'checkbox';
        this.value = checked;
        this.element.checked = checked;
        this.labelElement = this.label(this.element, labelHTML);
        this.exposedElement = this.labelElement;
        if (dialog)
            dialog.addWidget(this);
        this.element.addEventListener('change', () => {
            this.value = this.element.checked;
        });
    }
}
/**
 * Range widget. A slider control is created for setting the `value` property (a
 * number between `minimum` and `maximum`, inclusive). `outputTexts` is an array
 * of up to 3 strings used to construct an "output" string (following the slider
 * control). For example, ['<br>Manually', '<br>Every Second', '<br>Every %%
 * Seconds']. The first string is used when Range.value is 0, the second string
 * is used when the value is 1, and the third value is used when the value is
 * more than one. "%%" here is the default wildcard (which may be overridden in
 * `this.outputWildcard`); the Range value will replace the wildcard.
 */
export class Range2 extends Widget {
    constructor(labelHTML, value, minimum, maximum, step, outputTexts, dialog = null) {
        super(labelHTML);
        this.element = document.createElement('input');
        this.element.id = this.nextID();
        this.element.type = 'range';
        this.value = value;
        this.element.value = `${value}`;
        this.element.min = `${minimum}`;
        this.element.max = `${maximum}`;
        this.element.step = `${step}`;
        this.labelElement = this.label(this.element, labelHTML);
        this.outputWildcard = '%%';
        this.outputTexts = outputTexts;
        this.exposedElement = this.labelElement;
        this.output = document.createElement('output');
        this.output.id = this.nextID();
        this.output.innerHTML = `${this.outputText()}`;
        this.labelElement.append(this.output);
        if (dialog)
            dialog.addWidget(this);
        this.element.addEventListener('input', () => {
            this.value = Number(this.element.value);
            this.output.innerHTML = `${this.outputText()}`;
        });
    }
    outputText() {
        let outputText = '';
        while (this.outputTexts.length < 3)
            this.outputTexts.push('');
        if (this.value < 2)
            outputText = this.outputTexts[this.value];
        else
            outputText = this.outputTexts[2];
        outputText = outputText.replace(this.outputWildcard, this.element.value);
        return outputText;
    }
}
/**
 * Button widget. In addition to the button label given in `labelHTML`, an
 * `event` must be provided which will be dispatched when the button is clicked.
 */
export class Button2 extends Widget {
    constructor(labelHTML, eventType, dialog = null) {
        super(labelHTML);
        this.element = document.createElement('button');
        this.element.id = this.nextID();
        this.element.innerHTML = labelHTML;
        this.event = new Event(eventType);
        this.exposedElement = this.element;
        if (dialog)
            dialog.addWidget(this);
        this.element.addEventListener('click', () => {
            document.dispatchEvent(this.event);
        });
    }
}
/*****************************************************************************************************/
/**
 * Dialog box (modal or non-modal) with fieldset. The caller will open a Dialog
 * with "Dialog.open()" and close it with "Dialog.close()". Create Widgets using
 * the classes below, then create the Dialog and add the Widgets to it in
 * top-to-bottom order.
 */
export class Dialog extends Widget {
    constructor(legend, modal = true) {
        super(legend);
        this.element = document.createElement('dialog');
        this.element.id = this.nextID();
        this.modal = modal;
        this.fieldSet = document.createElement('fieldset');
        this.fieldSet.id = this.nextID();
        this.legend = document.createElement('legend');
        this.legend.id = this.nextID();
        this.legend.innerHTML = legend;
        this.fieldSet.append(this.legend);
        this.widgetList = document.createElement('ul');
        this.widgetList.id = this.nextID();
    }
    /** add a single widget as a list item (li) */
    addWidget(widget) {
        if (widget.exposedElement) {
            const listItem = document.createElement('li');
            listItem.id = this.nextID();
            listItem.append(widget.exposedElement);
            this.widgetList.append(listItem);
        }
    }
    /** add an array of widgets to a single list item (li) */
    addWidgets(widgets) {
        const listItem = document.createElement('li');
        listItem.id = this.nextID();
        let widgetsAdded = 0;
        for (const widget of widgets) {
            if (widget.exposedElement) {
                listItem.append(widget.exposedElement);
                widgetsAdded += 1;
            }
        }
        if (widgetsAdded)
            this.widgetList.append(listItem);
        else
            listItem.remove();
    }
    /** complete dialog element and append to container element */
    finish(container) {
        this.fieldSet.append(this.widgetList);
        this.element.append(this.fieldSet);
        container.append(this.element);
    }
    open() {
        if (this.modal)
            this.element.showModal();
        else
            this.element.show();
    }
    close() {
        this.element.close();
    }
}
/**
 * Basic single-line text input widget. The `value` property will hold a string.
 */
export class Text extends Widget {
    constructor(labelHTML, value) {
        super(labelHTML);
        this.element = document.createElement('input');
        this.element.id = this.nextID();
        this.value = value;
        this.element.value = value;
        this.labelElement = this.label(this.element, labelHTML);
        this.exposedElement = this.labelElement;
        this.element.addEventListener('change', () => {
            this.value = this.element.value;
        });
    }
}
/**
 * Drop-Down Selection widget. The `value` property will hold a string.
 */
export class Select extends Widget {
    constructor(labelHTML) {
        super(labelHTML);
        this.element = document.createElement('select');
        this.element.id = this.nextID();
        this.value = '';
        this.labelElement = this.label(this.element, labelHTML);
        this.exposedElement = this.labelElement;
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
export class Checkbox extends Widget {
    constructor(labelHTML, checked) {
        super(labelHTML);
        this.element = document.createElement('input');
        this.element.id = this.nextID();
        this.element.type = 'checkbox';
        this.value = checked;
        this.element.checked = checked;
        this.labelElement = this.label(this.element, labelHTML);
        this.exposedElement = this.labelElement;
        this.element.addEventListener('change', () => {
            this.value = this.element.checked;
        });
    }
}
/**
 * Range widget. A slider control is created for setting the `value` property (a
 * number between `minimum` and `maximum`, inclusive). `outputTexts` is an array
 * of up to 3 strings used to construct an "output" string (following the slider
 * control). For example, ['<br>Manually', '<br>Every Second', '<br>Every %%
 * Seconds']. The first string is used when Range.value is 0, the second string
 * is used when the value is 1, and the third value is used when the value is
 * more than one. "%%" here is the default wildcard (which may be overridden in
 * `this.outputWildcard`); the Range value will replace the wildcard.
 */
export class Range extends Widget {
    constructor(labelHTML, value, minimum, maximum, step, outputTexts) {
        super(labelHTML);
        this.element = document.createElement('input');
        this.element.id = this.nextID();
        this.element.type = 'range';
        this.value = value;
        this.element.value = `${value}`;
        this.element.min = `${minimum}`;
        this.element.max = `${maximum}`;
        this.element.step = `${step}`;
        this.labelElement = this.label(this.element, labelHTML);
        this.outputWildcard = '%%';
        this.outputTexts = outputTexts;
        this.exposedElement = this.labelElement;
        this.output = document.createElement('output');
        this.output.id = this.nextID();
        this.output.innerHTML = `${this.outputText()}`;
        this.labelElement.append(this.output);
        this.element.addEventListener('input', () => {
            this.value = Number(this.element.value);
            this.output.innerHTML = `${this.outputText()}`;
        });
    }
    outputText() {
        let outputText = '';
        while (this.outputTexts.length < 3)
            this.outputTexts.push('');
        if (this.value < 2)
            outputText = this.outputTexts[this.value];
        else
            outputText = this.outputTexts[2];
        outputText = outputText.replace(this.outputWildcard, this.element.value);
        return outputText;
    }
}
/**
 * Button widget. In addition to the button label given in `labelHTML`, an
 * `event` must be provided which will be dispatched when the button is clicked.
 */
export class Button extends Widget {
    constructor(labelHTML, event) {
        super(labelHTML);
        this.element = document.createElement('button');
        this.element.id = this.nextID();
        this.element.innerHTML = labelHTML;
        this.event = event;
        this.exposedElement = this.element;
        this.element.addEventListener('click', () => {
            document.dispatchEvent(this.event);
        });
    }
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
