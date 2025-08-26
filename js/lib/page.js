import * as T from './types.js';
import * as Fetch from './fetch.js';
import { MarkupLine } from './markup.js';
const REPOSITORY = 'bait-4';
const USERNAME = 'baitnickel';
const BACKEND = 'http://localhost:3000';
/** @todo if cookie key 'server' is present, change BACKEND to 'http://192.168.' + server value (e.g., '1.70') */
const LOCAL = (window.location.hostname == 'localhost' || window.location.hostname.startsWith('192.'));
let BACKEND_AVAILABLE = false;
if (LOCAL)
    BACKEND_AVAILABLE = await Fetch.test(`${BACKEND}/`);
let SITE = `${window.location.origin}/${REPOSITORY}`;
if (!LOCAL) {
    /* When fetching from GitHub Pages we must use a special "raw content" URL. */
    const rawContent = 'https://raw.githubusercontent.com';
    const branch = 'main';
    SITE = `${rawContent}/${USERNAME}/${REPOSITORY}/${branch}`;
}
const PAGES = await Fetch.map(`${SITE}/Indices/pages.json`);
const NOW = new Date();
const COPYRIGHT_YEAR = NOW.getFullYear().toString();
const COPYRIGHT_HOLDER = 'D.Dickinson';
/** List of Article IDs--list starts and ends with numbers, numbers are separated by commas */
const ID_SEPARATOR = ',';
const ID_SEPARATOR_PATTERN = new RegExp(`${ID_SEPARATOR}+`);
const ID_LIST_PATTERN = new RegExp(`^\\d[\\d${ID_SEPARATOR}]*`);
const MenuItems = [
    { module: 'home', parameters: [], text: 'Home', icon: '' },
    // {module: 'articles', parameters: ['path=Content/drafts'], text: 'Writing', icon: ''},
    { module: 'songbook', parameters: [], text: 'Songs', icon: '' },
    { module: 'iching', parameters: [], text: 'I Ching', icon: '' },
    { module: 'camp', parameters: [], text: 'Camping', icon: 'camp.svg' },
    { module: 'articles', parameters: ['path=README.md'], text: 'About', icon: '' },
    // {module: 'home', parameters: [], text: String.fromCodePoint(0x1f3e0), icon: 'home.svg'},
    // {module: 'iching', parameters: [], text: '\u262f', icon: ''},
    // {module: 'camp', parameters: [], text: '\u26fa', icon: 'camp.svg'},
    // {module: 'articles', parameters: ['path=Content/drafts'], text: String.fromCodePoint(0x1f4da), icon: ''},
    // {module: 'songbook', parameters: [], text: '\u266b', icon: 'songbook.svg'},
    // {module: 'articles', parameters: ['path=README.md'], text: '\u24d8', icon: ''},
];
export class Page {
    constructor(header = true, footer = true) {
        this.origin = window.location.origin;
        this.site = SITE;
        this.local = LOCAL;
        this.backend = BACKEND;
        this.backendAvailable = BACKEND_AVAILABLE;
        this.url = window.location.origin + window.location.pathname;
        /** Note: URLSearchParams decodes percent-encoding */
        this.parameters = new URLSearchParams(window.location.search);
        this.name = '';
        const idLists = [];
        for (const [key, value] of this.parameters.entries()) {
            if (key == 'page')
                this.name = value;
            else if (key == 'id')
                idLists.push(value);
            /** when key starts with a digit, the key *is* the value */
            else if (/^\d/.test(key))
                idLists.push(key);
        }
        this.ids = articleIDs(idLists, ID_LIST_PATTERN, ID_SEPARATOR_PATTERN);
        this.articleID = null; /** set in module that displays article */
        this.feedback = '';
        /** get module file statistics from the PAGES index map */
        let fileStats = null;
        if (this.name !== null && PAGES.has(this.name))
            fileStats = PAGES.get(this.name);
        this.options = new Map();
        this.access = (fileStats === null) ? 0 : fileStats.access;
        this.built = Date.parse(document.lastModified);
        this.revision = (fileStats === null) ? this.built : fileStats.revision;
        /** we assume 'head' and 'body' are defined in index.html */
        this.header = document.createElement('div');
        this.header.id = 'header';
        this.content = document.createElement('div');
        this.content.id = 'content';
        this.footer = document.createElement('div');
        this.footer.id = 'footer';
        document.body.append(this.header);
        document.body.append(this.content);
        document.body.append(this.footer);
        if (this.local) { /** Add test pages */
            MenuItems.push({ module: 'articles', parameters: ['path=Content/drafts'], text: 'Drafts', icon: '' });
            MenuItems.push({ module: 'threads', parameters: [], text: 'Threads', icon: '' });
            MenuItems.push({ module: 'carousel', parameters: [], text: 'Carousel', icon: '' });
            MenuItems.push({ module: 'carousel', parameters: ['album=test'], text: 'Carousel Test', icon: '' });
            // MenuItems.push({module: 'articles', parameters: ['path=Content/test-redwords'], text: 'Red Words', icon: ''});
            // MenuItems.push({module: 'test-cookies', parameters: [], text: 'Cookies', icon: ''});
            // MenuItems.push({module: 'test-lyrics', parameters: [], text: 'Lyrics', icon: ''});
            // MenuItems.push({module: 'test-file-api', parameters: [], text: 'File API', icon: ''});
            // MenuItems.push({module: 'test-svg', parameters: [], text: 'SVG', icon: ''});
            // MenuItems.push({module: 'test-yaml', parameters: [], text: 'YAML', icon: ''});
            // MenuItems.push({module: 'test-load-data', parameters: [], text: 'Load Data', icon: ''});
        }
        if (header)
            this.displayHeader();
        if (footer)
            this.displayFooter();
    }
    /**
     * @todo
     * Both displayHeader and displayFooter should probably being using a
     * Flexbox approach, e.g. for menu bar:
     * - .flex .nav-list {
     * -   display: flex;
     * -   gap: 1em;
     * - }
     */
    /**
     * Retrieve cookies, if any, and display special menus (append them to
     * the MenuItems array) when cookies associated with special privileges
     * are present.
     */
    displayHeader() {
        this.header.innerHTML = ''; /** overwrite whatever was there already */
        const unorderedList = document.createElement('ul');
        unorderedList.id = 'header-menu';
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
        /** top-right corner, menu bar create and initialize Identity button */
        const identityItem = document.createElement('li');
        const identityButton = document.createElement('button');
        identityButton.id = 'identity-button';
        const validIDLabel = 0x2705;
        const invalidIDLabel = 0x26d4;
        const credentials = getCredentials();
        let identityLabel = getIdentityButtonLabel(credentials, validIDLabel, invalidIDLabel);
        identityButton.innerText = String.fromCodePoint(identityLabel);
        identityItem.append(identityButton);
        unorderedList.append(identityItem);
        identityButton.addEventListener('click', (e) => {
            const credentials = getCredentials();
            if (credentials.user && credentials.passphrase) {
                const answer = window.prompt('You\'re logged in.\nDo you want to logout?:', '');
                if (answer && ['y', 'yes'].includes(answer.toLowerCase())) {
                    deleteCookie('user');
                    deleteCookie('passphrase');
                    alert('Credentials deleted');
                    identityButton.innerText = String.fromCodePoint(invalidIDLabel);
                }
            }
            else {
                const user = window.prompt('Enter user name:', '');
                if (user) {
                    const passphrase = window.prompt('Enter pass phrase:', '');
                    if (passphrase) {
                        setCookie('user', user, 365);
                        setCookie('passphrase', passphrase, 365);
                        identityButton.innerText = String.fromCodePoint(validIDLabel);
                    }
                }
            }
        });
        if (BACKEND_AVAILABLE) {
            /** annotate button */
            const annotateItem = document.createElement('li');
            const annotateButton = document.createElement('button');
            annotateButton.id = 'annotate-button';
            const annotateLabel = 0x2055; //0x2606; 0x2020;
            annotateButton.innerText = String.fromCodePoint(annotateLabel);
            annotateItem.append(annotateButton);
            unorderedList.append(annotateItem);
            annotateButton.addEventListener('click', (e) => {
                const annotation = window.prompt('Enter annotation:', '');
                if (annotation) {
                    console.log(`annotation: ${annotation}`);
                    postAnnotation(annotation, this);
                }
            });
        }
    }
    /**
     * Given a `revision` date (as milliseconds since Jan 1, 1970), (over)write
     * the page footer, showing the revision date and copyright year.
     */
    displayFooter(revision = null) {
        this.footer.innerHTML = ''; /** overwrite whatever was there already */
        const infoSection = document.createElement('div');
        const iconSection = document.createElement('div');
        const infoText = [];
        const revisionDate = (revision === null) ? new Date(this.revision) : new Date(revision);
        infoText.push(`Last updated <span id=footer-date>${T.DateString(revisionDate, 6)}</span>`);
        infoText.push(`&copy; ${COPYRIGHT_YEAR} ${COPYRIGHT_HOLDER}`);
        infoSection.innerHTML = infoText.join('<br>');
        const iconAnchor = document.createElement('a');
        iconAnchor.id = 'footer-bluesky-item';
        iconAnchor.href = 'https://bsky.app/profile/baitnickel.bsky.social';
        iconAnchor.title = 'Baitnickel on Bluesky';
        const iconImage = document.createElement('img');
        iconImage.id = 'footer-bluesky-image';
        iconImage.setAttribute('src', `${this.site}/images/icons/bluesky-white.svg`);
        iconAnchor.append(iconImage);
        iconSection.append(iconAnchor);
        this.footer.append(infoSection);
        this.footer.append(iconSection);
    }
    /**
     * (Re)set the title in the HTML head. Optionally, also use the title as
     * a heading line with the specified level.
     */
    setTitle(title, asHeadingLevel = 0) {
        document.title = MarkupLine(title, 'et');
        if (asHeadingLevel >= 1 && asHeadingLevel <= 6)
            this.addHeading(document.title, asHeadingLevel);
    }
    /**
     * The first child element of <body> is <header> (the menu).
     * A page heading is added as a new <body> child,
     * directly below <header>, using tag <h1>...<h6> (based on 'level').
    */
    addHeading(heading, level = 1) {
        if (this.content) {
            const tag = (level >= 1 && level <= 6) ? 'h' + level : 'h1';
            const element = document.createElement(tag);
            element.innerText = heading;
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
    renderCollection(folders, root = '') {
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
    appendContent(properties = '', targetElement = this.content) {
        const terms = properties.split(/\s/);
        let tagName = '';
        let id = '';
        const classes = [];
        for (const term of terms) {
            if (term[0] == '#') {
                if (term.length > 1 && !id)
                    id = term.slice(1);
            }
            else if (term[0] == '.') {
                if (term.length > 1 && !classes.includes(term))
                    classes.push(term.slice(1));
            }
            else if (!tagName)
                tagName = term;
        }
        if (!tagName)
            tagName = 'div';
        const element = document.createElement(tagName);
        if (id)
            element.id = id;
        if (classes.length)
            element.className = classes.join(' ');
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
    appendParagraph(targetElement, text) {
        let markedUpText = '';
        if (Array.isArray(text) && text.length) {
            const textLines = text.slice(); /* preserve original text lines */
            for (const i in textLines)
                textLines[i] = MarkupLine(textLines[i], 'met');
            markedUpText = textLines.join('<br>');
        }
        else if (typeof text === 'string') {
            markedUpText = MarkupLine(text, 'met');
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
    appendPhoto(targetElement, id, size, type = 'jpg') {
        const imageElement = new Image();
        const smugMug = 'https://photos.smugmug.com/photos';
        let source = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
        if (size == 'O')
            source.replace('-O', '');
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
    appendVideo(targetElement, embedID, width, height, options = []) {
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
    appendQuote(targetElement, quote) {
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
    wrapCode(code) {
        if (Array.isArray(code))
            code = code.join('\n');
        return `<pre><code>${code}</code><pre>`;
    }
    /**
     * Given an array of HTML `elements`, return a single-column HTML table
     * containing one row for each input control.
     */
    optionsTable(elements, tableClass = 'options-table') {
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
    fadeOut(element, delay = 50) {
        let initialOpacity = 1;
        let timer = setInterval(() => {
            if (initialOpacity <= 0.1) {
                clearInterval(timer);
                element.style.display = 'none';
            }
            element.style.opacity = initialOpacity.toString();
            element.style.filter = `alpha(opacity=${initialOpacity * 100})`;
            initialOpacity -= initialOpacity * 0.1;
        }, delay);
    }
    fadeIn(element, delay = 10) {
        let initialOpacity = 0.1;
        element.style.display = 'block';
        let timer = setInterval(() => {
            if (initialOpacity >= 1) {
                clearInterval(timer);
            }
            element.style.opacity = initialOpacity.toString();
            element.style.filter = `alpha(opacity=${initialOpacity * 100})`;
            initialOpacity += initialOpacity * 0.1;
        }, delay);
    }
}
/**
 * @todo
 * Many, if not all of these functions could be enclosed in the Page class as
 * static functions. This is probably where a lot of common functions should be
 * put--common to all Pages. Through a module's conformance to Page (basically,
 * just having a 'render' function), it should expect certain functions to be
 * available--even shareable across modules in a single session.
 */
/**
 * Given a `cookieName`, return the cookie in the form "name=value". When called
 * without a `cookieName`, return and array of cookies.
 */
export function getCookies(cookieName = '') {
    const values = [];
    cookieName = cookieName.trim();
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const cookieElements = cookie.split('=', 2);
        if (cookieName && cookieElements[0] == cookieName) {
            values.push(cookie);
            break;
        }
        else
            values.push(cookie);
    }
    return values;
}
/**
 * Given `cookieName`, `value`, and `validityDays`, create or update a cookie
 * with the new value and number of days until it is expired. Return the value
 * assigned to the cookie.
 */
export function setCookie(cookieName, value, validityDays) {
    cookieName = cookieName.trim();
    const date = new Date();
    date.setTime(date.getTime() + (validityDays * 24 * 60 * 60 * 1000));
    const expiration = `expires=${date.toUTCString()}`;
    document.cookie = `${cookieName}=${value}; ${expiration}; path=/;`;
    return value;
}
/**
 * Given `cookieName`, inactivate the cookie by setting its expiration date to
 * the past.
 */
export function deleteCookie(cookieName) {
    cookieName = cookieName.trim();
    const date = new Date(0);
    const expiration = `expires=${date.toUTCString()}`;
    document.cookie = `${cookieName}=; ${expiration}; path=/;`;
}
export function getCredentials() {
    const credentials = { user: '', passphrase: '' };
    let user = '';
    let passphrase = '';
    for (const cookie of getCookies()) {
        const cookieElements = cookie.split('=');
        if (cookieElements.length == 2) {
            const cookieName = cookieElements[0].trim();
            const cookieValue = cookieElements[1].trim();
            if (cookieName == 'user')
                user = cookieValue;
            else if (cookieName == 'passphrase')
                passphrase = cookieValue;
        }
    }
    return { user: user, passphrase: passphrase };
}
export function getIdentityButtonLabel(credentials, validLabel, invalidLabel) {
    let label = invalidLabel;
    if (credentials.user && credentials.passphrase)
        label = validLabel;
    return label;
}
/**
 * Each entry in the `lists` array is a string of one or more article ID numbers
 * matching the `listPattern` regular expression. Invalid lists are ignored.
 * Individual article IDs in each list are separated using the `splitPattern`
 * RegExp. Return a unique set of valid article ID numbers.
 */
function articleIDs(lists, listPattern, splitPattern) {
    const articleIDs = [];
    const idSet = new Set();
    for (const list of lists) {
        if (listPattern.test(list)) {
            for (let idValue of list.trim().split(splitPattern)) {
                if (idValue.trim()) {
                    const id = Number(idValue);
                    if (!isNaN(id))
                        idSet.add(id);
                }
            }
        }
    }
    for (const id of Array.from(idSet))
        articleIDs.push(id);
    return articleIDs;
}
function postAnnotation(annotation, thisPage) {
    const route = 'annotations';
    const data = {
        date: T.DateString(new Date(), 6),
        query: window.location.search,
        title: document.title,
        id: thisPage.articleID,
        note: annotation,
    };
    fetch(`${BACKEND}/${route}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
        .then((response) => console.log(response));
    // .then((response) => response.json())
    // .then((json) => console.log(json));
}
// function backendTest(url: string, imageFile: string) {
// 	let connected = true;
// 	const image = new Image();
// 	image.addEventListener('load', (e) => {
// 		console.log('Image Width:', image.width);
// 	});
// 	image.src = `${url}/${imageFile}`;
// 	return connected;
// }
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
