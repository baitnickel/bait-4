import { MarkupLine } from './markup.js';

export class Page {
	name: string|null;                  /** name of requested page (via query 'page=<name>') */
	origin: string;
	url: string;                        /** URL origin + pathname (full URL without '?query') */
	parameters: URLSearchParams;        /** URL query parameters */
	options: {[key: string]: string};   /** associative array of options */
	local: boolean;                     /** is the server 'localhost'? */
	fetchOrigin: string;                /** root URL for fetch operations */
	header: HTMLDivElement;
	content: HTMLDivElement;
	footer: HTMLDivElement;

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
		let body = document.querySelector('body')!;
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

	/** displayMenu() */

	/** displayFooter() */

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
			let tag = (level >= 1 && level <= 6) ? 'h' + level : 'h1';
			let element = document.createElement(tag);
			element.innerText = heading;
			this.header.insertAdjacentElement('afterend', element);
		}
	}

}
