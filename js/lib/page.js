import { MarkupLine } from './markup.js';
const NOW = new Date();
const COPYRIGHT_YEAR = NOW.getFullYear().toString();
const COPYRIGHT_HOLDER = 'D.Dickinson';
const MenuItems = [
    { module: 'home', text: 'Home', icon: 'home.svg' },
    { module: 'camp', text: 'Camping', icon: 'camp.svg' },
    { module: 'songbook', text: 'Song Book', icon: 'songbook.svg' },
];
export class Page {
    constructor() {
        this.origin = window.location.origin;
        this.url = window.location.origin + window.location.pathname;
        this.parameters = new URLSearchParams(window.location.search);
        this.name = this.parameters.get('page');
        this.options = new Map();
        this.local = (window.location.hostname == 'localhost');
        this.header = document.createElement('div');
        this.header.id = 'header-menu';
        this.content = document.createElement('div');
        this.content.id = 'page-content';
        this.footer = document.createElement('div');
        this.footer.id = 'footer';
        /** 'body' must be defined in index.html */
        const body = document.querySelector('body');
        body.append(this.header);
        body.append(this.content);
        body.append(this.footer);
        /** We need a special origin when fetching raw files on GitHub Pages */
        const repository = 'bait-4';
        this.fetchOrigin = `${this.origin}/${repository}`;
        if (!this.local) {
            const rawServer = 'https://raw.githubusercontent.com';
            const username = 'baitnickel';
            const branch = 'main';
            this.fetchOrigin = `${rawServer}/${username}/${repository}/${branch}`;
        }
    }
    displayMenu() {
        /**
         * Retrieve cookies, if any, and display special menus (append them to
         * the MenuItems array) when cookies associated with special privileges
         * are present.
         */
        const unorderedList = document.createElement('ul');
        unorderedList.id = 'menu';
        this.header.append(unorderedList);
        for (let menuItem of MenuItems) {
            const listElement = document.createElement('li');
            unorderedList.append(listElement);
            const anchor = document.createElement('a');
            anchor.href = `${this.url}?page=${menuItem.module}`;
            anchor.innerText = menuItem.text;
            listElement.append(anchor);
        }
        const inputElement = document.createElement('input');
        inputElement.id = 'header-input';
        inputElement.size = 30;
        /* Event listener */
        inputElement.addEventListener('change', processInputText);
        this.header.append(inputElement);
        /* Event Listener */
        function processInputText() {
            alert(`Text Entered: ${inputElement.value}`);
            /**
             * Rather than simply display an alert, what we need to do here is
             * write cookies containing the encrypted version of the text
             * entered, and update the available menus accordingly.
             */
            inputElement.value = '';
        }
    }
    displayFooter() {
        const footerLines = [];
        const updateDate = new Date(document.lastModified).toDateString(); /** HTML file modification date */
        footerLines.push(`Last updated <span id=footer-date>${updateDate}</span>`);
        footerLines.push(`&copy; ${COPYRIGHT_YEAR} ${COPYRIGHT_HOLDER}`);
        this.footer.innerHTML = footerLines.join('<br>');
        // if (window.location.protocol == 'https:'
        // 	&& Notification.permission != 'denied'
        // 	&& Notification.permission != 'granted'
        // ) {
        // 	let notifyElement = document.createElement('button');
        // 	notifyElement.innerText = 'Permit Notifications';
        // 	notifyElement.addEventListener('click', (e: Event) => {
        // 		/** 
        // 		 * e.target is the element listened to (selectElement)
        // 		 * e.target.value holds the new value of the element after it's changed (e.g., "Bm")
        // 		 */
        // 		// let element = e.target as HTMLButtonElement; /** "as" type casting required for TypeScript */
        // 		// changeKey(fakesheet, element.value);
        // 		// if (Notification.permission != 'denied' && Notification.permission != 'granted') {
        // 			Notification.requestPermission().then(permission => {
        // 				if (permission == 'granted') {
        // 					this.showNotification('my granted title', 'Notification permission granted');
        // 				}
        // 			});
        // 		// }
        // 	});
        // 	this.footer.append(notifyElement);
        // }
    }
    // showNotification(title: string, body: string) {
    // 	const notification = new Notification(title, {body: 'test notification'});
    // }
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
            const tag = (level >= 1 && level <= 6) ? 'h' + level : 'h1';
            const element = document.createElement(tag);
            element.innerText = heading;
            this.header.insertAdjacentElement('afterend', element);
        }
    }
}
/**
 * General function to coerce data, provided in the argument, to another type.
 * Typically the data is a node in a complex structure, such as an object
 * structure or array of object structures. For example:
 *
 * let personObject = Coerce<Person>(data.person);
 * let personObjects = Coerce<Person[]>(data.persons);
 */
export function Coerce(data) {
    return data;
}
