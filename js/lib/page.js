import { MarkupLine } from './markup.js';
export class Page {
    constructor() {
        this.url = window.location.origin + window.location.pathname;
        this.parameters = new URLSearchParams(window.location.search);
        this.name = this.parameters.get('page');
        this.options = {};
        this.local = (window.location.hostname == 'localhost');
        this.header = document.createElement('div');
        this.header.id = 'header-menu';
        this.content = document.createElement('div');
        this.content.id = 'page-content';
        this.footer = document.createElement('div');
        this.footer.id = 'footer';
        let body = document.querySelector('body');
        if (body) {
            body.append(this.header);
            body.append(this.content);
            body.append(this.footer);
        }
    }
    setTitle(title, asHeadingLevel = 0) {
        /**
         * (Re)set the title in the HTML head. Optionally, also use the title as
         * a heading line with the specified level.
        */
        document.title = MarkupLine(title, 'et');
        if (asHeadingLevel >= 1 && asHeadingLevel <= 6)
            this.addHeading(document.title, asHeadingLevel);
    }
    addHeading(heading, level = 1) {
        /**
         * The first child element of <body> is <header> (the menu).
         * A page heading is added as a new <body> child,
         * directly below <header>, using tag <h1>...<h6> (based on 'level').
         */
        if (this.header) {
            let tag = (level >= 1 && level <= 6) ? 'h' + level : 'h1';
            let element = document.createElement(tag);
            element.innerText = heading;
            this.header.insertAdjacentElement('afterend', element);
        }
    }
}
