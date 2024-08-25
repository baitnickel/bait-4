export type DisplayFunction = (documents: string[], index: number, target: HTMLElement) => void;

export class Navigator {
	index: number;
	readonly documents: string[];
	displayFunction: DisplayFunction;
	firstButton: HTMLButtonElement;
	previousButton: HTMLButtonElement;
	nextButton: HTMLButtonElement;
	lastButton: HTMLButtonElement;

	constructor(displayFunction: DisplayFunction, documents: string[], target: HTMLElement) {
		this.index = 0;
		this.documents = documents;
		this.displayFunction = displayFunction;
		this.firstButton = document.createElement("button");
		this.previousButton = document.createElement("button");
		this.nextButton = document.createElement("button");
		this.lastButton = document.createElement("button");

		if (this.documents.length > 1) {
			this.firstButton.disabled = true;
			this.previousButton.disabled = true;

			this.firstButton.addEventListener('click', () => {
				this.index = 0;
				this.firstButton.disabled = true;
				this.previousButton.disabled = true;
				this.lastButton.disabled = false;
				this.nextButton.disabled = false;
				this.displayFunction(documents, this.index, target);
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
					this.displayFunction(documents, this.index, target);
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
					this.displayFunction(documents, this.index, target);
				}
			});

			this.lastButton.addEventListener('click', () => {
				if (this.index < this.documents.length - 1) {
					this.index = this.documents.length - 1;
					this.firstButton.disabled = false;
					this.previousButton.disabled = false;
					this.lastButton.disabled = true;
					this.nextButton.disabled = true;
					this.displayFunction(documents, this.index, target);
				}
			});
		}
	}

	/**
	 * Add the given `button` to the `targetElement`, assigning the given
	 * `label` and class name to the button.
	 */
	addButton(button: HTMLButtonElement, targetElement: HTMLElement, label: string, className: string) {
		button.innerText = label;
		button.className = className;
		targetElement.append(button);
	}
}
