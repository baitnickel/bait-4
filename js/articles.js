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
const ArticlesIndex = `${ThisPage.site}/Indices/articles.json`;
const Articles = await Fetch.map(ArticlesIndex);
export function render() {
    /** @todo should support multiple paths */
    const pagePath = (ThisPage.parameters.get('path')) ? ThisPage.parameters.get('path') : '';
    const eligiblePaths = [pagePath];
    /** @todo Should float top navigation (buttons) at the top of the window */
    const topNavigation = ThisPage.appendContent('#top-navigation');
    const articleElement = ThisPage.appendContent('#main-article article');
    /**
     * Read the `articles` index file and add the keys of eligible entries into
     * the `paths` array. An index key contains the path to the markdown file.
     * Display the initial article, as referenced by `articleIndex` (usually 0).
     */
    const paths = []; /* will contain a list of eligible article URIs */
    let articleIndex = 0;
    for (const path of Articles.keys()) {
        if (eligible(path, eligiblePaths))
            paths.push(`${ThisPage.site}/${path}`);
    }
    displayArticle(articleElement, paths[articleIndex]);
    if (paths.length > 1) {
        /**
         * Define article navigation buttons and their 'click' event listeners.
         *
         * This section of code needs access to:
         * - articleIndex - is this a showstopper? it must be updated globally in the click listener
         * - topNavigation
         * - articleElement
         * - paths
         * - displayArticle()
         *
         * Instead of each listener calling `displayArticle`, could they not
         * just return a new `articleIndex`?
         */
        const firstButton = addButton(topNavigation, 'First', false);
        const previousButton = addButton(topNavigation, 'Previous', false);
        const nextButton = addButton(topNavigation, 'Next');
        const lastButton = addButton(topNavigation, 'Last');
        firstButton.addEventListener('click', () => {
            if (paths.length) {
                articleIndex = 0;
                firstButton.disabled = true;
                previousButton.disabled = true;
                lastButton.disabled = false;
                nextButton.disabled = false;
                displayArticle(articleElement, paths[articleIndex]);
            }
        });
        previousButton.addEventListener('click', () => {
            if (paths.length && articleIndex > 0) {
                articleIndex -= 1;
                lastButton.disabled = false;
                nextButton.disabled = false;
                if (articleIndex == 0) {
                    firstButton.disabled = true;
                    previousButton.disabled = true;
                }
                displayArticle(articleElement, paths[articleIndex]);
            }
        });
        nextButton.addEventListener('click', () => {
            if (paths.length && articleIndex < paths.length - 1) {
                articleIndex += 1;
                firstButton.disabled = false;
                previousButton.disabled = false;
                if (articleIndex == paths.length - 1) {
                    lastButton.disabled = true;
                    nextButton.disabled = true;
                }
                displayArticle(articleElement, paths[articleIndex]);
            }
        });
        lastButton.addEventListener('click', () => {
            if (paths.length && articleIndex < paths.length - 1) {
                articleIndex = paths.length - 1;
                firstButton.disabled = false;
                previousButton.disabled = false;
                lastButton.disabled = true;
                nextButton.disabled = true;
                displayArticle(articleElement, paths[articleIndex]);
            }
        });
    }
}
function addButton(targetElement, label, enabled = true) {
    const button = document.createElement("button");
    button.disabled = !enabled;
    button.className = 'article-navigation-button';
    button.innerText = label;
    targetElement.append(button);
    return button;
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
