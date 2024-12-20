import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Markup } from './lib/markup.js';
import { MarkdownDocument } from './lib/md.js';
import * as Widget from './lib/widgets.js';

/**
 * Example: http://localhost/bait-4/index.html?page=articles&path=README.md,Content/drafts
 * 
 * The `path` argument is a list of one or more comma-separated files or
 * folders, relative to the site root directory. (Advice to user: simplify your
 * content file structure before complicating the value of `path`.) Each path
 * item represents a single Article document or a folder; if it's a folder, add
 * all the (eligible) Article documents to the Batch list. When the Batch
 * contains multiple Articles, add navigation elements to the page.
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
ThisPage.setTitle('Articles');
const NavigationEvent = 'bait:navigation-update';
const NavigationElement = ThisPage.appendContent('#top-navigation');
const ArticleElement = ThisPage.appendContent('#main-article article');
const ProgressElement = document.createElement('span');
ProgressElement.className = 'article-navigation-progress';
const ArticlesIndex = `${ThisPage.site}/Indices/articles.json`;
const Articles = await Fetch.map<T.FileStats>(ArticlesIndex);

const READMETitle = 'About This Site';

export function render() {
	const pagePath = (ThisPage.parameters.get('path')) ? ThisPage.parameters.get('path')! : '';
	const eligiblePaths = pagePath.split(',');
	const updateNavigation = new Event(NavigationEvent);

	/**
	 * Select Articles (markdown documents) from the full list of Articles. If
	 * at least one Article is selected, display the first article.
	 */
	const selectedArticles = selectArticles(Array.from(Articles.keys()), eligiblePaths);
	if (selectedArticles.length > 0) displayArticle(selectedArticles, 0);

	/**
	 * When there are multiple Articles to be displayed, define navigation buttons.
	 */
	if (selectedArticles.length > 1) {
		const navigator = new Widget.Navigator(selectedArticles, updateNavigation);
		navigator.addButtons(NavigationElement, 'article-navigation-button');
		NavigationElement.append(ProgressElement);
		
		/* listen for navigation button clicks and display previous/next article */
		document.addEventListener(NavigationEvent, () => {
			displayArticle(navigator.documents, navigator.index);
		});
	}
}

/**
 * Only markdown (`.md`) files and directories (folders) are eligible, and only
 * those whose path names start with one of the given `eligiblePaths`.
 */
function selectArticles(paths: string[], eligiblePaths: string[]) {
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
 * Given the `articles` array and the `index` of a selected article, fetch the
 * corresponding markdown file, mark it up, and display the HTML in the target
 * HTML element. This function is usually called by the event listeners in the
 * Widget.Navigator object.
 */
function displayArticle(articles: string[], index: number) {
	const articlePath = articles[index];
	Fetch.text(articlePath).then((fileText) => {
		const markdown = new MarkdownDocument(fileText);
		let title = '';
		if (markdown.metadata && 'title' in markdown.metadata) title = markdown.metadata['title'];
		else if (articlePath == `${ThisPage.site}/README.md`) title = READMETitle;
		else { /* use file name as title */
			const matches = articlePath.match(/.*\/(.*)\..*$/);
			if (matches !== null) title = matches[1];
		}
		if (title) ThisPage.setTitle(title);
		const heading = (title) ? `# ${title}\n` : ''
		const markedUpText = Markup(heading + markdown.text);
		ArticleElement.innerHTML = markedUpText;
		ProgressElement.innerText = `${index + 1} of ${articles.length}`;
	});
}
