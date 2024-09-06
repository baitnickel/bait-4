export type DisplayFunction = (documents: string[], index: number) => void;
export class Navigator {
	index: number;
	readonly documents: string[];
	displayFunction: DisplayFunction;
	firstButton: HTMLButtonElement;
	previousButton: HTMLButtonElement;
	nextButton: HTMLButtonElement;
	lastButton: HTMLButtonElement;

	constructor(documents: string[], displayFunction: DisplayFunction) {
		this.index = 0;
		this.documents = documents;
		this.displayFunction = displayFunction;
		this.firstButton = document.createElement('button');
		this.previousButton = document.createElement('button');
		this.nextButton = document.createElement('button');
		this.lastButton = document.createElement('button');
		/** default button texts */
		this.firstButton.innerText = '|<';
		this.previousButton.innerText = '<';
		this.nextButton.innerText = '>';
		this.lastButton.innerText = '>|';

		if (this.documents.length > 1) {
			this.firstButton.disabled = true;
			this.previousButton.disabled = true;

			this.firstButton.addEventListener('click', (e) => {
				this.index = 0;
				this.firstButton.disabled = true;
				this.previousButton.disabled = true;
				this.lastButton.disabled = false;
				this.nextButton.disabled = false;
				this.displayFunction(documents, this.index);
			});

			this.previousButton.addEventListener('click', (e) => {
				if (this.index > 0) {
					this.index -= 1;
					if (this.index == 0) {
						this.firstButton.disabled = true;
						this.previousButton.disabled = true;
					}
					this.lastButton.disabled = false;
					this.nextButton.disabled = false;
					this.displayFunction(documents, this.index);
				}
			});

			this.nextButton.addEventListener('click', (e) => {
				if (this.index < this.documents.length - 1) {
					this.index += 1;
					this.firstButton.disabled = false;
					this.previousButton.disabled = false;
					if (this.index == this.documents.length - 1) {
						this.lastButton.disabled = true;
						this.nextButton.disabled = true;
					}
					this.displayFunction(documents, this.index);
				}
			});

			this.lastButton.addEventListener('click', (e) => {
				if (this.index < this.documents.length - 1) {
					this.index = this.documents.length - 1;
					this.firstButton.disabled = false;
					this.previousButton.disabled = false;
					this.lastButton.disabled = true;
					this.nextButton.disabled = true;
					this.displayFunction(documents, this.index);
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
export type RadioSelection = (activeButton: string) => void;
export class RadioButtons {
	buttons: HTMLButtonElement[];
	classNames: string[];
	activeClass: string;
	activeButton: string;
	radioSelection: RadioSelection;

	constructor(classNames: string|string[], activeClass: string, radioSelection: RadioSelection) {
		this.buttons = [];
		if (Array.isArray(classNames)) this.classNames = classNames;
		else this.classNames = [classNames];
		this.activeClass = activeClass;
		this.activeButton = '';
		this.radioSelection = radioSelection;
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
			for (let button of this.buttons) button.classList.remove(this.activeClass);
			button.classList.add(this.activeClass);
			this.activeButton = button.value;
			this.radioSelection(button.value);
		});
	}
}