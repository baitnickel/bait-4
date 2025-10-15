/**
 * @todo
 * `id` and `className` probably should not be passed in as parameters. I think
 * they are better managed manually, through methods. Furthermore, a Pane class
 * should probably set a default class during construction--CSS should have some
 * standard formatting for all Articles, for instance (bad example--if Articles
 * are declared using the <article> element, CSS can address them by element
 * rather than by class).
 *
 * It is not the business of a Pane class to handle record selection, sorting,
 * filtering, etc. A Pane.render() method should be handed the markdown text or
 * HTML to be wrapped up, decorated, and presented. This leaves the questions:
 *
 * - where do we handle sorting of Collections?
 * - where do we handle filtering?
 * - where do we handle navigation options?
 *
 * Are there general Collection properties and methods, or are they always
 * specific to the record types?
 *
 * When instantiating a Pane, perhaps we need to pass in an index path (e.g.,
 * "data/journals.json") and an index key (e.g.,
 * "E6685186170A4DA9945B58B764340E0F"); the index key may be empty ("") if
 * processing is to be done against the whole Collection. As there may be many
 * different kinds of article collections, how will we tell the methods what
 * exactly needs to be done? Generic types??
 */
export class Pane {
    element;
    set id(x) { this.element.id = x; }
    set className(x) { this.element.className = x; }
    constructor(elementType) {
        this.element = document.createElement(elementType);
    }
}
export class ArticlePane extends Pane {
    constructor() {
        super('article');
    }
}
export class ImagePane extends Pane {
    constructor() {
        super('div'); /* or 'figure' containing an 'img' and possible 'caption' */
    }
}
export class QuotePane extends Pane {
    constructor() {
        super('q'); /* or 'blockquote'? */
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

constructor:
    this.articleElement = document.createElement('div');
    this.articleElement.id = 'home-article';
    this.content.append(this.articleElement);
render:
    this.addArticleHTML(this.articleElement);

addArticleHTML(element: HTMLElement) {

    // Select the journal entry that was created closest to today's date
    // We read the journals index file to find the entry with the MMDD
    // closest to the given (today's) MMDD. This becomes the "selectedEntry".

    For each Collection (here, Journals), we need methods for sorting the
    index keys. In this case, we might have a sort by proximity as well as
    a sort by the full created date. This would make it possible
    to do "next" and "previous" navigation.

    We may also want filters, limiting selections to only those records
    meeting some criteria.

    this.fetchData('@db/journals.json').then((journalEntries: JournalEntries) => {
        let selectedEntry: string|null = null;
        let closeProximity: number|null = null;
        let uuids = Object.keys(journalEntries);
        for (let uuid of uuids) {
            let entryDate = new Date(journalEntries[uuid].created);
            let proximity = dateProximity(this.now, entryDate);
            if (closeProximity === null || proximity < closeProximity) {
                closeProximity = proximity;
                selectedEntry = uuid;
            }
        }

        Here, we prepare the Article pane, read the file and convert the markdown,
        and fill the innerHTML of the element.

        if (selectedEntry !== null) {
            let entry = journalEntries[selectedEntry];
            let entryHeader = document.createElement('p');
            entryHeader.classList.add('article-header');
            let entryDate = new Date(entry.created);
            let entryHeaderText = `On This Date Or Thereabouts ... *${this.formatDate(entryDate)}*`;
            if (entry.city) {
                entryHeaderText += ' ◆ ' + entry.city;
                if (entry.state) entryHeaderText += ', ' + entry.state;
            }
            entryHeader.innerHTML = MarkupLine(entryHeaderText, 'ETM');
            element.insertAdjacentElement('beforebegin', entryHeader);
            
            this.fetchData(`@db/journals/${selectedEntry}.md`).then(markdownText => {
                // a little kludge, to force H1 and H2 to H3
                if (markdownText.startsWith('# ')) markdownText = '##' + markdownText;
                else if (markdownText.startsWith('## ')) markdownText = '#' + markdownText;
                let html = Markup(markdownText);
                element.innerHTML = html;
            });
        }
    });
}
*/
