export class Widget {
	id: string;
	className: string;

	constructor(id: string, className: string) {
		this.id = id;
		this.className = className;
	}
}

/*
	columns: number;
	constructor() {
		super([TABLE_TAG], true, true);
		this.columns = 0;
	}
*/

/**
 * Dialog box (modal or non-modal), optionally with fieldset.
 */
export class Dialog extends Widget {
	element: HTMLDialogElement;
	fieldSet: HTMLFieldSetElement;
	legend: HTMLLegendElement;
	componentList: HTMLUListElement;

	constructor(id: string, className: string, legend: string) {
		super(id, className);
		this.element = document.createElement('dialog');
		this.element.id = id;
		this.element.className = className;
		this.fieldSet = document.createElement('fieldset');
		this.legend = document.createElement('legend');
		this.legend.innerText = legend;
		this.fieldSet.append(this.legend);
		this.componentList = document.createElement('ul');
	}

	/** called for each component to be added to the dialog */
	addComponent(component: HTMLElement) {
		const listItem = document.createElement('li');
		this.componentList.append(listItem);
	}

	/** complete and return dialog element */
	// modal() {
	// 	this.fieldSet.append(this.componentList);
	// 	return this.element;
	// }

	/** complete and display dialog element in container element */
	displayModal(container: HTMLElement) {
		this.fieldSet.append(this.componentList);
		container.append(this.element);
		this.element.showModal();
	}
}

export class Text extends Widget {

}

export class Checkbox2 extends Widget { // `Checkbox` name conflict

}

export class Range extends Widget {

}

export class Button extends Widget {

}

/**
 * The Navigator class manages a set of buttons (First, Previous, Next, Last)
 * for navigating through a set of documents (an array of file path names).
 */
export class Navigator { // used in `articles`
	index: number;
	readonly documents: string[];
	firstButton: HTMLButtonElement;
	previousButton: HTMLButtonElement;
	nextButton: HTMLButtonElement;
	lastButton: HTMLButtonElement;
	event: Event;

	constructor(documents: string[], event: Event) {
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
	addButtons(target: HTMLElement, className = '') {
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
export class RadioButtons { // used in `camp`, `home`, `reservations`
	buttons: HTMLButtonElement[];
	classNames: string[];
	activeClass: string;
	activeButton: string;
	event: Event;

	constructor(classNames: string|string[], activeClass: string, event: Event) {
		this.buttons = [];
		if (Array.isArray(classNames)) this.classNames = classNames;
		else this.classNames = [classNames];
		this.activeClass = activeClass;
		this.activeButton = '';
		this.event = event;
	}

	addButton(text: string, active = false) {
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
			for (let button of this.buttons) button.classList.remove(this.activeClass);
			button.classList.add(this.activeClass);
		}
		for (let className of this.classNames) button.classList.add(className);
		this.buttons.push(button);

		button.addEventListener('click', () => {
			if (button.value != this.activeButton) {
				for (let button of this.buttons) button.classList.remove(this.activeClass);
				button.classList.add(this.activeClass);
				this.activeButton = button.value;
				document.dispatchEvent(this.event); /* a button has become active */
			}
		});
	}
}

export class Checkbox {
	checkbox: HTMLInputElement;
	label: HTMLLabelElement;
	classNames: string[];
	event: Event;

	constructor(id: string, label: string, classNames: string|string[], event: Event, checked = false) {
		this.checkbox = document.createElement('input');
		this.label = document.createElement('label');
		if (Array.isArray(classNames)) this.classNames = classNames;
		else this.classNames = [classNames];
		this.event = event;

		this.checkbox.id = id;
		this.checkbox.type = 'checkbox';
		this.checkbox.checked = checked;
		this.label.htmlFor = this.checkbox.id;
		this.label.innerText = label;
		for (let className of this.classNames) this.label.classList.add(className);
		this.label.append(this.checkbox);

		this.checkbox.addEventListener('change', () => {
			document.dispatchEvent(this.event);
		})
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
	readonly element: HTMLTableElement;
	readonly cellValues: string[];
	readonly selectedValue: string;

	constructor(id: string, rows: number, columns: number, values: string[] = []) {
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
				if (values.length == rows * columns) newCell.innerText = values[cellNumber];
				else newCell.innerText = `${cellNumber + 1}`;
				this.cellValues.push(newCell.innerText);
			}
		}
	}

	/**
	 * When a cell is clicked, a method here should be called to set (or
	 * clear--set to null) this.selectedValue.
	 */
}
