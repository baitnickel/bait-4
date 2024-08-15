import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { Markup } from './lib/markup.js';
import { MarkdownDocument } from './lib/md.js';
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
const ThisPage = new Page();
export function render() {
    // const page = new Page();
    const articlesIndex = `${ThisPage.site}/Indices/articles.json`;
    /** @todo should support multiple paths */
    const pagePath = (ThisPage.parameters.get('path')) ? ThisPage.parameters.get('path') : '';
    const eligiblePaths = [pagePath];
    /** @todo Should float top navigation (buttons) at the top of the window */
    const topNavigation = ThisPage.appendContent('#top-navigation');
    const articleElement = ThisPage.appendContent('#main-article article');
    const firstButton = addButton(topNavigation, 'First');
    const previousButton = addButton(topNavigation, 'Previous');
    const nextButton = addButton(topNavigation, 'Next');
    const lastButton = addButton(topNavigation, 'Last');
    const paths = []; /* will contain a list of eligible map keys */
    let articleIndex = 0;
    /**
     * Define the button 'click' event listeners
     *
     * These buttons are quite simple and primitive--there's room for much improvement here, in terms of a nice UI.
     *
     * The buttons need to be more readily available--maybe a mouse-over/popup
     * menu somewhere, maybe just appearing both above and below the article.
     *
     * We need to simplify the structures here--can we create a Map of button
     * objects, with keys such as 'first', 'previous', etc.?
     */
    firstButton.addEventListener('click', () => {
        if (paths.length) {
            articleIndex = 0;
            displayArticle(articleElement, paths[articleIndex]);
        }
    });
    previousButton.addEventListener('click', () => {
        if (articleIndex > 0) {
            articleIndex -= 1;
            displayArticle(articleElement, paths[articleIndex]);
        }
    });
    nextButton.addEventListener('click', () => {
        if (articleIndex < paths.length - 1) {
            articleIndex += 1;
            displayArticle(articleElement, paths[articleIndex]);
        }
    });
    lastButton.addEventListener('click', () => {
        if (articleIndex < paths.length - 1) {
            articleIndex = paths.length - 1;
            displayArticle(articleElement, paths[articleIndex]);
        }
    });
    /**
     * Read the `articles` index file and add the keys of eligible entries into
     * the `paths` array. An index key contains the path to the markdown file.
     * Display the initial article, as referenced by `articleIndex` (usually 0).
     */
    Fetch.map(articlesIndex).then((articles) => {
        for (const path of articles.keys()) {
            if (eligible(path, eligiblePaths))
                paths.push(`${ThisPage.site}/${path}`);
        }
        displayArticle(articleElement, paths[articleIndex]);
    });
}
function addButton(targetElements, label) {
    const button = document.createElement("button");
    button.innerText = label;
    targetElements.append(button);
    return button;
}
/**
 * A given `path` is eligible if it begins with any of the paths listed in the
 * given `eligiblePaths` array. Returns true or false.
 */
function eligible(path, eligiblePaths) {
    let eligible = false;
    for (let eligiblePath of eligiblePaths) {
        if (!eligiblePath.endsWith('/'))
            eligiblePath += '/';
        if (path.startsWith(eligiblePath)) {
            eligible = true;
            break;
        }
    }
    return eligible;
}
/**
 * Given a `path`, fetch the corresponding markdown file, mark it up, and
 * display the HTML in the given `targetElement`.
 */
function displayArticle(targetElement, path) {
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
        targetElement.innerHTML = article;
    });
}
