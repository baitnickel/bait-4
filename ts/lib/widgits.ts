export class Widget {
	element: HTMLElement;
	index: number;
	constructor(targetElement: HTMLElement, type: string) {
		this.index = 0;
		this.element = document.createElement(type);
		this.element.className = 'article-navigation-button';
		this.element.innerText = 'Widget';
		targetElement.append(this.element);
	}
}

export class FirstButton extends Widget {
	constructor(targetElement: HTMLElement) {
		super(targetElement, 'button');
		this.onclick = this.onclick.bind(this);
		this.element.addEventListener('click', this.onclick);
	}
	onclick() {
		this.index = this.index += 1;
		console.log(this.index);
	}
}