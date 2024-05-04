import * as T from './lib/types.js';
import { ContentOrigin } from './lib/settings.js';
import * as DB from './lib/fetch.js'

/**
 * This module is the first and only module called by index.html. We read the
 * URL query parameters, looking for the `page` key. The value of this key
 * should name the module to be loaded (without the ".js" extension). If the
 * `page` key is not present, we assume the `home` module.
 * 
 * If the key's value is not a valid "page" module (one in the same directory as
 * this file and containing a `render` function), the browser will throw a "page
 * not found" (404) error. The URLs are not meant to be entered manually, but
 * constructed via menu selections in the `page` module.
 * 
 * The selected module is loaded dynamically in an async/await clause.
 */
const pagesIndexPath = `${ContentOrigin()}/Indices/pages.json`;
const parameters = new URLSearchParams(document.location.search);
const queryPage = (parameters.get('page')) ? parameters.get('page')! : 'home';
DB.fetchMap<T.FileStats>(pagesIndexPath).then((pagesIndex: Map<string, T.FileStats>) => {
	let pageStats: T.FileStats|null = null;
	if (pagesIndex.has(queryPage)) pageStats = pagesIndex.get(queryPage)!;
	(async () => {
		const module = await import(`./${queryPage}.js`);
		module.render(pageStats);
	})();
});
