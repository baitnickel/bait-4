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
/**
 * Dialog box (modal or non-modal) with fieldset. The caller will open a Dialog
 * with "Dialog.open()" and close it with "Dialog.close()". Create Widgets using
 * the classes below, then create the Dialog and add the Widgets to it in
 * top-to-bottom order.
 */
export class Dialog extends Widget {
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
export class Text extends Widget {
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
export class Select extends Widget {
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
export class Checkbox extends Widget {
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
export class Range extends Widget {
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
export class Button extends Widget {
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
