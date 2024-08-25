import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Markup } from './lib/markup.js';
import { MarkdownDocument } from './lib/md.js';
import * as Widget from './lib/widgets.js';

/**
 * Example: http://localhost/bait-4/index.html?page=articles&path=Content/drafts
 * 
 * The `path` argument should be a list of URIs. (Advice to user: simplify your
 * content file structure before complicating the value of `path`.) Each URI
 * represents a single Article document or a folder; if it's a folder, add all
 * the (eligible) Article documents to the Batch list. When the Batch contains
 * multiple Articles, add navigation elements to the page.
 * 
 * Optionally, render a "feedback" button--email link; include article metadata
 * in email subject/body (article URI, revision, etc.).
 */

/**
 * Define the Page object, and global types required, and any global objects
 * required. For example:
 *		type RangeType = {
 *			text: string;
 *			items: number;
 *			faces: number;
 *		}
 *		const ThisPage = new Page();
 *		let RangeTypeSelection: HTMLDivElement;
 *		let RangeValueSelection: HTMLDivElement;
 *		let RangeValueDisplay: HTMLDivElement;
 *		let IChingDisplay: HTMLDivElement;
 */

/** @todo perhaps support multiple paths in the URL query? */
/** @todo perhaps float top navigation (buttons) at the top of the window? */

const ThisPage = new Page();
const ArticlesIndex = `${ThisPage.site}/Indices/articles.json`;
const Articles = await Fetch.map<T.FileStats>(ArticlesIndex);

export function render() {
	const pagePath = (ThisPage.parameters.get('path')) ? ThisPage.parameters.get('path') : ''; 
	const eligiblePaths = [pagePath!];
	const topNavigation = ThisPage.appendContent('#top-navigation'); 
	const articleElement = ThisPage.appendContent('#main-article article');

	/**
	 * Select Articles (documents) from the full list of Articles. If at least
	 * one Article is selected, display the first article.
	 */
	const selectedArticles = selectDocuments(Array.from(Articles.keys()), eligiblePaths);
	if (selectedArticles.length > 0) displayDocument(selectedArticles, 0, articleElement);

	/**
	 * When there are multiple Articles to be displayed, define navigation buttons.
	 */
	if (selectedArticles.length > 1) {
		const navigator = new Widget.Navigator(displayDocument, selectedArticles, articleElement);
		navigator.addButton(navigator.firstButton, topNavigation, '|<', 'article-navigation-button');
		navigator.addButton(navigator.previousButton, topNavigation, '<', 'article-navigation-button');
		navigator.addButton(navigator.nextButton, topNavigation, '>', 'article-navigation-button');
		navigator.addButton(navigator.lastButton, topNavigation, '>|', 'article-navigation-button');
	}
}

/**
 * Only markdown (`.md`) files and directories (folders) are eligible, and only
 * those whose path names start with one of the given `eligiblePaths`.
 */
function selectDocuments(paths: string[], eligiblePaths: string[]) {
	const selectedDocuments: string[] = [];
	for (let path of paths) {
		for (let eligiblePath of eligiblePaths) {
			if (!(path.endsWith('.md') || path.endsWith('/'))) path += '/';
			if (path.startsWith(eligiblePath)) selectedDocuments.push(`${ThisPage.site}/${path}`);
		}
	}
	return selectedDocuments;
}

/**
 * Given the `documents` array and the `index` of a selected document, fetch the
 * corresponding markdown file, mark it up, and display the HTML in the `target`
 * HTML element. This function is most often called by the event listeners in
 * the Widget.Navigator object.
 */
function displayDocument(documents: string[], index: number, target: HTMLElement) {
	const path = documents[index];
	Fetch.text(path).then((fileText) => {
		const markdown = new MarkdownDocument(fileText);
		let title = '';
		if ('title' in markdown.metadata) title = markdown.metadata['title'];
		else { /* use file name as title */
			const matches = path.match(/.*\/(.*)\..*$/);
			if (matches !== null) title = matches[1];
		}
		const heading = (title) ? `# ${title}\n` : ''
		const markedUpText = Markup(heading + markdown.text);
		target.innerHTML = markedUpText;
	});
}
