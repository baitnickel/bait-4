import { Session } from './settings.js';
import { MarkupLine } from './markup.js';

const NOW = new Date();
const COPYRIGHT_YEAR = NOW.getFullYear().toString();
const COPYRIGHT_HOLDER = 'D.Dickinson';

type MenuItem = {
	module: string,
	text: string,
	icon: string,
};

const MenuItems: MenuItem[] = [
	{module: 'home', text: 'Home', icon: 'home.svg'},
	{module: 'camp', text: 'Camping', icon: 'camp.svg'},
	{module: 'songbook', text: 'Song Book', icon: 'songbook.svg'},
];

export class Page {
	name: string|null;                  /** name of requested page (via query 'page=<name>') */
	encryption: number;
	encryptPrefix: number;
	origin: string;
	url: string;                        /** URL origin + pathname (full URL without '?query') */
	parameters: URLSearchParams;        /** URL query parameters */
	options: Map<string, string>;       /** Map of options */
	local: boolean;                     /** is the server 'localhost'? */
	fetchOrigin: string;                /** root URL for fetch operations */
	header: HTMLDivElement;
	content: HTMLDivElement;
	footer: HTMLDivElement;

	constructor(header = true, footer = true) {
		this.origin = window.location.origin;
		this.url = window.location.origin + window.location.pathname;
		this.parameters = new URLSearchParams(window.location.search);
		this.name = this.parameters.get('page');
		this.encryption= Session.encryption;
		this.encryptPrefix = Session.encryptPrefix;
		this.options = new Map<string, string>();
		this.local = (window.location.hostname == 'localhost');
		this.header = document.createElement('div');
		this.header.id = 'header-menu';
		this.content = document.createElement('div');
		this.content.id = 'page-content';
		this.footer = document.createElement('div');
		this.footer.id = 'footer';
		/** 'body' must be defined in index.html */
		const body = document.querySelector('body')!;
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
		/** Add test pages */
		if (this.local) {
			MenuItems.push({module: 'test-cookies', text: 'Cookies', icon: ''});
			MenuItems.push({module: 'test-lyrics', text: 'Lyrics', icon: ''});
			MenuItems.push({module: 'test-file-api', text: 'File API', icon: ''});
			MenuItems.push({module: 'test-svg', text: 'SVG', icon: ''});
			MenuItems.push({module: 'test-yaml', text: 'YAML', icon: ''});
		}
		if (header) this.displayHeader();
		if (footer) this.displayFooter();
	}

	displayHeader(){
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
		// inputElement.height = 15;
		/* Event listener */
		inputElement.addEventListener('change', processInputText);
		this.header.append(inputElement);

		/* Event Listener */
		function processInputText() {
			/**
			 * Remove non-word and non-whitespace characters, trim both ends,
			 * and replace all whitespace strings with a single space.
			 */
			let cleanText = inputElement.value.replace(/[^\w\s]/gi, '');
			cleanText = cleanText.trim();
			cleanText = cleanText.replace(/\s+/gi, ' ');
			alert(`Clean Text: ${cleanText}`);
			/**
			 * Rather than simply display an alert, what we need to do here is
			 * write cookies containing the encrypted version of the text
			 * entered, and update the available menus accordingly.
			 */
			// if (cleanText == 'Jed') {
			// 	MenuItems.push({module: 'camp', text: 'Camping', icon: 'camp.svg'});
			// 	window.location.reload();
			// 	// inputElement.value = '';
			// }
		}
	}

	displayFooter() {
		const footerLines: string[] = [];
		// const buildDate = new Date(document.lastModified).toDateString(); /** HTML file modification date */
		footerLines.push(`Last updated <span id=footer-date>${Session.built.toDateString()}</span>`);
		footerLines.push(`&copy; ${COPYRIGHT_YEAR} ${COPYRIGHT_HOLDER}`);
		this.footer.innerHTML = footerLines.join('<br>');
	}

	setTitle(title: string, asHeadingLevel: number = 0) {
		/**
		 * (Re)set the title in the HTML head. Optionally, also use the title as
		 * a heading line with the specified level.
		 */
		document.title = MarkupLine(title, 'et');
		if (asHeadingLevel >= 1 && asHeadingLevel <= 6) this.addHeading(document.title, asHeadingLevel);
	}

	addHeading(heading: string, level: number = 1) {
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
export function Coerce<Type>(data: any): Type {
	return data;
}

// async function sha256(message: string) {
// 	// encode as UTF-8
// 	const msgBuffer = new TextEncoder().encode(message);

// 	// hash the message
// 	const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

// 	// convert ArrayBuffer to Array
// 	const hashArray = Array.from(new Uint8Array(hashBuffer));

// 	// convert bytes to hex string
// 	const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
// 	console.log(hashHex);
// 	return hashHex;
// }
