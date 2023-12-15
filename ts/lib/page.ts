import * as T from './types.js';
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

	/**
	 * Retrieve cookies, if any, and display special menus (append them to
	 * the MenuItems array) when cookies associated with special privileges
	 * are present.
	 */
	displayHeader(){
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

	/**
	 * The first child element of <body> is <header> (the menu).
	 * A page heading is added as a new <body> child,
	 * directly below <header>, using tag <h1>...<h6> (based on 'level').
	*/
	addHeading(heading: string, level: number = 1) {
		if (this.header) {
			const tag = (level >= 1 && level <= 6) ? 'h' + level : 'h1';
			const element = document.createElement(tag);
			element.innerText = heading;
			this.header.insertAdjacentElement('afterend', element);
		}
	}

	/**
	 * @todo
	 * In each of the following "append" methods, we cannot assume that
	 * this.content should be the target element--we have to have a way to
	 * override this default. Perhaps this can simply be done through a
	 * parameter that defaults to this.content, but default parameters are
	 * problematic. Another option is to return the finished element, and let
	 * the caller append it to the target element of its choice.
	 */

	appendContent(tagName: string = 'div') {
		const element = document.createElement(tagName);
		this.content.append(element);
		return element;
	}

	/**
	 * Given plain text in a string or string array, create a paragraph element
	 * to hold the text, and append the paragraph to Page.content. The text
	 * line(s) are marked up. Return the paragraph element. When the `text` is
	 * an array, each element will be displayed on separate lines (separated by
	 * <br> elements) within the paragraph.
	 */
	appendParagraph(targetElement: HTMLElement, text: string|string[]) {
		let markedUpText = '';
		if (Array.isArray(text) && text.length) {
			const textLines = text.slice(); /* preserve original text lines */
			for (const i in textLines) textLines[i] = MarkupLine(textLines[i], 'met');
			markedUpText = textLines.join('<br>');
		}
		else if (typeof text === 'string') markedUpText = MarkupLine(text, 'met');
		const paragraph = document.createElement('p');
		paragraph.innerHTML = markedUpText;
		targetElement.append(paragraph);
		return paragraph;
	}

	/**
	 * Append an Image element to Page.content, and fill it by making a call to
	 * SmugMug to retrieve a photo with the given `id`, `size`, and `type`. The
	 * type defaults to "jpg". Return the HTMLImageElement.
	 */
	appendPhoto(targetElement: HTMLElement, id: string, size: string, type: string = 'jpg') {
		const imageElement = new Image();
		const smugMug = 'https://photos.smugmug.com/photos';
		let source = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
		if (size == 'O') source.replace('-O', '');
		imageElement.src = source;
		targetElement.append(imageElement);
		return imageElement;
	}

	/**
	 * Given an `embedID`, obtained from a YouTube URL, and a desired display
	 * `width` and `height`, create an "iframe" element to display the video
	 * using YouTube's API, and append the iframe to Page.content. The `options`
	 * parameter may be used in the future to control display options, but it is
	 * not being used currently. 
	 */
	appendVideo(targetElement: HTMLElement, embedID: string, width: number, height:number, options: string[] = []) {
		const frame = document.createElement('iframe');
		frame.src = `https://www.youtube.com/embed/${embedID}`;
		frame.width = `${width}`;
		frame.height = `${height}`;
		frame.title = 'YouTube video player';
		frame.allowFullscreen = true;
		frame.allow = 'accelerometer,autoplay,clipboard-write,encrypted-media,gyroscope,picture-in-picture,web-share';
		targetElement.append(frame);
		return frame;
	}

	/**
	 * Given a Quote object, format and append the quote to Page.content. Return
	 * the container element.
	 */
	appendQuote(targetElement: HTMLElement, quote: T.Quote) {
		// const container = document.createElement('div');
		// container.className = 'quote';
		// targetElement.append(container);
		targetElement.className = 'quote';

		const textParagraph = document.createElement('p');
		textParagraph.className = 'text';
		textParagraph.innerHTML = MarkupLine(`"${quote.text}"`, 'etm');
		const attributionNote = (quote.note) ? `${quote.attribution} (${quote.note})` : quote.attribution;
		const attributionParagraph = document.createElement('p');
		attributionParagraph.className = 'attribution';
		attributionParagraph.innerHTML = '~ ' + MarkupLine(attributionNote, 'etm');

		targetElement.append(textParagraph);
		targetElement.append(attributionParagraph);
		return targetElement;

		// container.appendChild(textParagraph);
		// container.appendChild(attributionParagraph);
		// return container;
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
