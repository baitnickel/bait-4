export class Pane {
    constructor(elementType, id = '', className = '') {
        this.element = document.createElement(elementType);
        if (id)
            this.element.id = id;
        if (className)
            this.element.className = className; /* space-separated class names */
    }
}
export class ArticlePane extends Pane {
    constructor(id = '', className = '') {
        super('article', id, className);
    }
}
export class ImagePane extends Pane {
    constructor(id = '', className = '') {
        super('div', id, className); /* or 'figure' containing an 'img' and possible 'caption' */
    }
}
export class QuotePane extends Pane {
    constructor(id = '', className = '') {
        super('q', id, className); /* or 'blockquote'? */
    }
}
/*
See "HTML Elements" in sidebar: https://developer.mozilla.org/en-US/docs/Web/HTML

Abbreviation <abbr>
Aside <aside>
Audio <audio>
Footer <footer>
Header <header>
Navigation <nav>, <menu>
Section <section> (rather than <div>)
Table <table>
Video <video>
*/ 
