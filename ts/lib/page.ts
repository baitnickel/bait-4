import * as T from './types.js';
import { Session, Site } from './settings.js';
import * as Fetch from './fetch.js';
import { MarkupLine } from './markup.js';

const NOW = new Date();
const COPYRIGHT_YEAR = NOW.getFullYear().toString();
const COPYRIGHT_HOLDER = 'D.Dickinson';

type MenuItem = {
	module: string, /** from `page` parameter */
	parameters: string[], /** additional query parameters */
	text: string,
	icon: string,
};

const MenuItems: MenuItem[] = [
	{module: 'home', parameters: [], text: String.fromCodePoint(0x1f3e0), icon: 'home.svg'},
	{module: 'iching', parameters: [], text: '\u262f', icon: ''},
	{module: 'camp', parameters: [], text: '\u26fa', icon: 'camp.svg'},
	{module: 'articles', parameters: ['path=Content/drafts'], text: String.fromCodePoint(0x1f4da), icon: ''},
	{module: 'songbook', parameters: [], text: '\u266b', icon: 'songbook.svg'},
	{module: 'articles', parameters: ['path=README.md'], text: '\u24d8', icon: ''},
];

const Pages = await Fetch.map<T.FileStats>(`${Site()}/Indices/pages.json`);

export class Page {
	name: string|null;                  /** name of requested page (via query 'page=<name>') */
	encryption: number;
	encryptPrefix: number;
	origin: string;
	url: string;                        /** URL origin + pathname (full URL without '?query') */
	parameters: URLSearchParams;        /** URL query parameters */
	options: Map<string, string>;       /** Map of options */
	local: boolean;                     /** is the server 'localhost'? */
	access: number;                     /** access number (permission/authorization) */
	revision: number;                   /** revision date (milliseconds since 1/1/1970 UTC) */
	site: string;              /** root URL for content fetch operations */
	header: HTMLDivElement;
	content: HTMLDivElement;
	footer: HTMLDivElement;

	feedback: string;

	constructor(header = true, footer = true) {
		this.origin = window.location.origin;
		this.site = Site();
		this.local = Session.local;
		this.url = window.location.origin + window.location.pathname;
		this.parameters = new URLSearchParams(window.location.search);
		this.name = this.parameters.get('page');

		this.feedback = '';

		/** get module file statistics from the Pages index map */
		let fileStats: T.FileStats|null = null;
		if (this.name !== null && Pages.has(this.name)) fileStats = Pages.get(this.name)!;

		this.encryption= Session.encryption;
		this.encryptPrefix = Session.encryptPrefix;
		this.options = new Map<string, string>();
		this.access = (fileStats === null) ? 0 : fileStats.access;
		this.revision = (fileStats === null) ? Session.built : fileStats.revision;
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
		/** Add test pages */
		if (this.local) {
			// MenuItems.push({module: 'articles', parameters: ['path=Content/test-redwords'], text: 'Red Words', icon: ''});
			// MenuItems.push({module: 'test-cookies', parameters: [], text: 'Cookies', icon: ''});
			// MenuItems.push({module: 'test-lyrics', parameters: [], text: 'Lyrics', icon: ''});
			// MenuItems.push({module: 'test-file-api', parameters: [], text: 'File API', icon: ''});
			// MenuItems.push({module: 'test-svg', parameters: [], text: 'SVG', icon: ''});
			// MenuItems.push({module: 'test-yaml', parameters: [], text: 'YAML', icon: ''});
			// MenuItems.push({module: 'test-load-data', parameters: [], text: 'Load Data', icon: ''});
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
		for (const menuItem of MenuItems) {
			const listElement = document.createElement('li');
			unorderedList.append(listElement);
			let urlQuery = `page=${menuItem.module}`;
			for (const parameter of menuItem.parameters) {
				urlQuery += `&${parameter}`;
			}
			const anchor = document.createElement('a');
			anchor.href = `${this.url}?${urlQuery}`;
			anchor.innerText = menuItem.text;
			listElement.append(anchor);
		}
		const inputElement = document.createElement('input');
		inputElement.id = 'header-input';
		inputElement.size = 30;
		// inputElement.height = 15;
		/* Event listener */
		// inputElement.addEventListener('change', processInputText);

		inputElement.addEventListener('change', (e) => {
			this.feedback = inputElement.value;
			if (this.feedback) alert(`Feedback will be sent to: ${this.feedback}`);
			inputElement.value = '';
		});

		this.header.append(inputElement);

		/* Event Listener */
		function processInputText() {
			/**
			 * Remove non-word and non-whitespace characters, trim both ends,
			 * and replace all whitespace strings with a single space.
			 */
			// let cleanText = inputElement.value.replace(/[^\w\s]/gi, '');
			// cleanText = cleanText.trim();
			// cleanText = cleanText.replace(/\s+/gi, ' ');
			// alert(`Clean Text: ${cleanText}`);

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

	/**
	 * Given a `revision` date (as milliseconds since Jan 1, 1970), (over)write
	 * the page footer, showing the revision date and copyright year.
	 */
	displayFooter(revision: number|null = null) {
		const footerLines: string[] = [];
		const revisionDate = (revision === null) ? new Date(this.revision) : new Date(revision);
		footerLines.push(`Last updated <span id=footer-date>${T.DateString(revisionDate, 6)}</span>`);
		footerLines.push(`&copy; ${COPYRIGHT_YEAR} ${COPYRIGHT_HOLDER}`);
		this.footer.innerHTML = footerLines.join('<br>');
	}

	/**
	 * (Re)set the title in the HTML head. Optionally, also use the title as
	 * a heading line with the specified level.
	 */
	setTitle(title: string, asHeadingLevel: number = 0) {
		document.title = MarkupLine(title, 'et');
		if (asHeadingLevel >= 1 && asHeadingLevel <= 6) this.addHeading(document.title, asHeadingLevel);
	}

	/**
	 * The first child element of <body> is <header> (the menu).
	 * A page heading is added as a new <body> child,
	 * directly below <header>, using tag <h1>...<h6> (based on 'level').
	*/
	addHeading(heading: string, level: number = 1) {
		// if (this.header) {
		if (this.content) {
			const tag = (level >= 1 && level <= 6) ? 'h' + level : 'h1';
			const element = document.createElement(tag);
			element.innerText = heading;
			// this.header.insertAdjacentElement('afterend', element);
			this.content.append(element);
		}
	}

	/**
	 * @todo
	 * Given `folders`, an array of folder path names (e.g., ['Content/drafts',
	 * 'Content/journals', 'Content/technical']), where the paths all follow the
	 * given `root`, extract the markdown files contained within them and
	 * organize them into a Collection that can be navigated through First,
	 * Previous, Next, Last, &c. directives.
	 * 
	 * We must rely on Indices lest we are forced to read every file in each
	 * folder and examine its metadata--something which is not practical from a
	 * performance standpoint.
	 * 
	 * We will likely need to specify filter or query conditions as a parameter,
	 * or rely on "Collection" markdown files whose metadata provide such
	 * details (perhaps, even including `folders` and `root`--maybe the only
	 * parameter this method needs is the name of a collection.md file).
	 * 
	 * A Collection might be an audio album, an audio playlist, a set of
	 * journals or drafts or chapters, &c.--all described in a collection
	 * document.
	 * 
	 * (Using the language of MDN's article on the "Iterator" object) a
	 * Collection is an object that conforms to the Collection protocol by
	 * providing first(), previous(), next(), and last() methods that return an
	 * Entry result object.
	 */
	renderCollection(folders: string[], root: string = '') {
	}

	/**
	 * Given a string containing element `properties` (explained below), create
	 * a new HTML element and append it to the `targetElement` (this.content by
	 * default, as suggested by the method name). Return the new HTML element
	 * object.
	 * 
	 * The `properties` string may contain three types of space-separated words:
	 * - id: a word starting with "#" (if multiple, only the first is used)
	 * - class list: words starting with "."
	 * - tag name: a word representing a valid HTML element tag (defaults to
	 *   "div"; if multiple, only the first is used)
	 * 
	 * Example:
	 * - const element = page.appendContent('article #blog-1 .bold .pretty');
	 */
	appendContent(properties: string = '', targetElement = this.content) {
		// split properties into terms
		// set tagName, id, classList
		const terms = properties.split(/\s/);
		let tagName = '';
		let id = '';
		const classes: string[] = [];
		for (const term of terms) {
			if (term[0] == '#') {
				if (term.length > 1 && !id) id = term.slice(1);
			}
			else if (term[0] == '.') {
				if (term.length > 1 && !classes.includes(term)) classes.push(term.slice(1));
			}
			else if (!tagName) tagName = term;
		}
		if (!tagName) tagName = 'div';
		const element = document.createElement(tagName);
		if (id) element.id = id;
		if (classes.length) element.className = classes.join(' ');
		targetElement.append(element);
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
			// markedUpText = Markup(textLines);
		}
		else if (typeof text === 'string') {
			markedUpText = MarkupLine(text, 'met');
			// markedUpText = Markup(text);
		}
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

	/**
	 * Given a string of `code` lines (or string array of code lines), return
	 * the string wrapped in "pre" and "code" tags.
	 */
	wrapCode(code: string|string[]) {
		if (Array.isArray(code)) code = code.join('\n');
		return `<pre><code>${code}</code><pre>`;
	}

	/**
	 * Given an array of HTML `elements`, return a single-column HTML table
	 * containing one row for each input control.
	 */
	optionsTable(elements: HTMLElement[], tableClass = 'options-table') {
		const table = document.createElement('table');
		table.className = tableClass;
		for (const element of elements) {
			const row = document.createElement('tr');
			const rowItem = document.createElement('td');
			rowItem.append(element);
			row.append(rowItem);
			table.append(row);
		}
		return table;
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
// export function Coerce<Type>(data: any): Type {
// 	return data;
// }

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
