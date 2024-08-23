export class Widget {
    constructor(targetElement, type) {
        this.index = 0;
        this.element = document.createElement(type);
        this.element.className = 'article-navigation-button';
        this.element.innerText = 'Widget';
        targetElement.append(this.element);
    }
}
export class FirstButton extends Widget {
    constructor(targetElement) {
        super(targetElement, 'button');
        this.onclick = this.onclick.bind(this);
        this.element.addEventListener('click', this.onclick);
    }
    onclick() {
        this.index = this.index += 1;
        console.log(this.index);
    }
}
