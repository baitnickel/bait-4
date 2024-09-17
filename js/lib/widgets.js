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
        this.firstButton.innerText = '|<';
        this.previousButton.innerText = '<';
        this.nextButton.innerText = '>';
        this.lastButton.innerText = '>|';
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
