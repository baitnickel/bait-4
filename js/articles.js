import { Page } from './lib/page.js';
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
const Articles = await Fetch.map(ArticlesIndex);
export function render() {
    const pagePath = (ThisPage.parameters.get('path')) ? ThisPage.parameters.get('path') : '';
    const eligiblePaths = [pagePath];
    const topNavigation = ThisPage.appendContent('#top-navigation');
    const articleElement = ThisPage.appendContent('#main-article article');
    /**
     * Read the `articles` index file and add the keys of eligible entries into
     * the `selectedArticles` array. An index key contains the path to the markdown file.
     * Display the initial article, as referenced by `articleIndex` (usually 0).
     */
    const selectedArticles = [];
    for (const path of Articles.keys()) {
        if (eligible(path, eligiblePaths))
            selectedArticles.push(`${ThisPage.site}/${path}`);
    }
    if (selectedArticles.length > 0)
        displayArticle(selectedArticles, 0, articleElement);
    /**
     * Define article navigation buttons and their 'click'
     * event listeners.
     */
    if (selectedArticles.length > 1) {
        const navigator = new Widget.Navigator(displayArticle, selectedArticles, articleElement);
        navigator.addButton(navigator.firstButton, topNavigation, '|<', 'article-navigation-button');
        navigator.addButton(navigator.previousButton, topNavigation, '<', 'article-navigation-button');
        navigator.addButton(navigator.nextButton, topNavigation, '>', 'article-navigation-button');
        navigator.addButton(navigator.lastButton, topNavigation, '>|', 'article-navigation-button');
    }
}
/**
 * A given `path` is eligible if it begins with any of the paths listed in the
 * given `eligiblePaths` array. Returns true or false.
 *
 * For now, we assume that a path that does not end with ".md" or "/" is a
 * directory, and we add a trailing "/".
 */
function eligible(path, eligiblePaths) {
    let eligible = false;
    for (let eligiblePath of eligiblePaths) {
        if (!(eligiblePath.endsWith('.md') || eligiblePath.endsWith('/')))
            eligiblePath += '/';
        if (path.startsWith(eligiblePath)) {
            eligible = true;
            break;
        }
    }
    return eligible;
}
/**
 * Given the `selectedArticles` array and the `index` of the selected article,
 * fetch the corresponding markdown file, mark it up, and display the HTML in
 * the `articleElement`. This function is called by the Widget.Navigator object.
 */
function displayArticle(documents, index, target) {
    const path = documents[index];
    Fetch.text(path).then((fileText) => {
        const markdown = new MarkdownDocument(fileText);
        let title = '';
        if ('title' in markdown.metadata)
            title = markdown.metadata['title'];
        else { /* use file name as title */
            const matches = path.match(/.*\/(.*)\..*$/);
            if (matches !== null)
                title = matches[1];
        }
        const heading = (title) ? `# ${title}\n` : '';
        const article = Markup(heading + markdown.text);
        target.innerHTML = article;
    });
}
