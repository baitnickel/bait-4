import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Markup } from './lib/markup.js';
import * as MD from './lib/md.js';
import * as W from './lib/widgets.js';

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
/** secondary index */
type ArticleID = 
{
	path: string;
	access: number;
	revision: number;
}
const ArticlesByID = articlesByID(Articles);
const READMETitle = 'About This Site';

export function render() {
	const pagePath = (ThisPage.parameters.has('path')) ? ThisPage.parameters.get('path')! : '';
	const requestedPaths = (pagePath) ? pagePath.split(',') : [];
	const requestedIDs = ThisPage.ids;
	const updateNavigation = new Event(NavigationEvent);

	/**
	 * Select Articles (markdown documents) from the full list of Articles. If
	 * at least one Article is selected, display the first article.
	 */
	const selectedArticles = selectArticles(Array.from(Articles.keys()), requestedPaths, requestedIDs);
	if (selectedArticles.length > 0) displayArticle(selectedArticles, 0);

	/**
	 * When there are multiple Articles to be displayed, define navigation buttons.
	 */
	if (selectedArticles.length > 1) {
		const navigator = new W.Navigator(selectedArticles, updateNavigation);
		navigator.addButtons(NavigationElement, 'article-navigation-button');
		NavigationElement.append(ProgressElement);
		
		/* listen for navigation button clicks and display previous/next article */
		document.addEventListener(NavigationEvent, () => {
			displayArticle(navigator.documents, navigator.index);
		});
	}
}

/**
 * Given `allPaths` (an array of the keys--relative paths--from the articles
 * index, e.g., "Content/Home.md"), `requestedPaths` (an array of zero or more
 * relative paths provided in a "path" URL query), and `requestedIDs` (an array
 * of zero or more article ID numbers provided in This.Page.ids), return an
 * array of relative paths representing the requested articles.
 * 
 * Only markdown (`.md`) files and directories (folders) are eligible, and only
 * those whose path names start with one of the given `requestedPaths` or those
 * with the `requestedIDs`. Return an array of article paths.
 */
function selectArticles(allPaths: string[], requestedPaths: string[], requestedIDs: number[]) {
	const articles: string[] = [];
	const uniquePaths = new Set<string>();
	for (const id of requestedIDs) {
		const article = ArticlesByID.get(id);
		if (article !== undefined && article.path.endsWith('.md')) {
			uniquePaths.add(article.path);
		}
	}
	if (requestedPaths.length) {
		for (let path of allPaths) {
			for (let requestedPath of requestedPaths) {
				if (!(path.endsWith('.md') || path.endsWith('/'))) path += '/';
				if (path.startsWith(requestedPath)) {
					uniquePaths.add(path);
				}
			}
		}
	}
	for (const path of Array.from(uniquePaths)) {
		// articles.push(`${ThisPage.site}/${path}`);
		articles.push(path);
	}
	articles.sort();
	return articles;
}

/**
 * Given `article` (the relative path of an article), expand the relative path
 * to a full path and fetch the corresponding markdown file, mark it up, and
 * display the HTML in the target HTML element. This function is usually called
 * by the event listeners in the W.Navigator object.
 */
// function displayArticle(articles: string[], index: number) {
function displayArticle(articles: string[], index: number) {
	// const article = Articles.get(articles[index]);
	const articleFullPath = `${ThisPage.site}/${articles[index]}`;
	Fetch.text(articleFullPath).then((fileText) => {
		const markdown = new MD.Markdown(fileText);
		let title = '';
		if (markdown.metadata && 'title' in markdown.metadata) title = markdown.metadata['title'];
		else if (articleFullPath == `${ThisPage.site}/README.md`) title = READMETitle;
		else { /* use file name as title */
			const matches = articleFullPath.match(/.*\/(.*)\..*$/);
			if (matches !== null) title = matches[1];
		}
		ThisPage.articleID = (markdown.metadata && 'id' in markdown.metadata) ? markdown.metadata['id'] : null;
		if (title) ThisPage.setTitle(title);
		const heading = (title) ? `# ${title}\n` : ''
		const markedUpText = Markup(heading + markdown.text);
		ArticleElement.innerHTML = markedUpText;
		ProgressElement.innerText = `${index + 1} of ${articles.length}`;
	});
}

/**
 * Given the Articles map, keyed by file path, return a new map as a secondary
 * index to the same data but keyed by Article ID.
 */
function articlesByID(articles: Map<string, T.FileStats>) {
	const articlesByID = new Map<number, ArticleID>();
	const paths = Array.from(articles.keys());
	for (const path of paths) {
		const articleData = articles.get(path);
		if (articleData !== undefined) {
			const data: ArticleID = {
				path: path,
				access: articleData.access,
				revision: articleData.revision
			}
			articlesByID.set(articleData.id, data);
		}
	}
	return articlesByID;
}
