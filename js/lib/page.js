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
        this.options = {};
        this.local = (window.location.hostname == 'localhost');
        this.header = document.createElement('div');
        this.header.id = 'header-menu';
        this.content = document.createElement('div');
        this.content.id = 'page-content';
        this.footer = document.createElement('div');
        this.footer.id = 'footer';
        /** 'body' must be defined in index.html */
        let body = document.querySelector('body');
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
        let uListElement = document.createElement('ul');
        uListElement.id = 'menu';
        this.header.append(uListElement);
        for (let menuItem of MenuItems) {
            let listElement = document.createElement('li');
            uListElement.append(listElement);
            let anchor = document.createElement('a');
            anchor.href = `${this.url}?page=${menuItem.module}`;
            anchor.innerText = menuItem.text;
            listElement.append(anchor);
        }
    }
    displayFooter() {
        let footerLines = [];
        let updateDate = new Date(document.lastModified).toDateString(); /** HTML file modification date */
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
            let tag = (level >= 1 && level <= 6) ? 'h' + level : 'h1';
            let element = document.createElement(tag);
            element.innerText = heading;
            this.header.insertAdjacentElement('afterend', element);
        }
    }
}
