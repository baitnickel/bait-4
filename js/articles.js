import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { Markup } from './lib/markup.js';
import { MarkdownDocument } from './lib/md.js';
export function render() {
    const page = new Page();
    const articlesIndex = `${page.fetchOrigin}/Indices/articles.json`;
    /** @todo should support multiple paths */
    const pagePath = (page.parameters.get('path')) ? page.parameters.get('path') : '';
    const eligiblePaths = [pagePath];
    /** @todo Should float top navigation (buttons) at the top of the window */
    const topNavigation = page.appendContent('#top-navigation');
    const articleElement = page.appendContent('#main-article article');
    const firstButton = addButton(topNavigation, 'First');
    const previousButton = addButton(topNavigation, 'Previous');
    const nextButton = addButton(topNavigation, 'Next');
    const lastButton = addButton(topNavigation, 'Last');
    const paths = []; /* will contain a list of eligible map keys */
    let articleIndex = 0;
    /**
     * Define the button 'click' event listeners
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
    DB.fetchMap(articlesIndex).then((articles) => {
        for (const path of articles.keys()) {
            if (eligible(path, eligiblePaths))
                paths.push(path);
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
    DB.fetchData(path).then((fileText) => {
        let heading = '';
        const matches = path.match(/.*\/(.*)\..*$/);
        if (matches !== null)
            heading = `# ${matches[1]}\n`;
        const markdownDocument = new MarkdownDocument(fileText);
        const article = Markup(heading + markdownDocument.text);
        targetElement.innerHTML = article;
    });
}
