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
const parameters = new URLSearchParams(document.location.search);
const page = (parameters.get('page')) ? parameters.get('page') : 'home';
(async () => {
	const module = await import(`./${page}.js`);
	module.render();
})();
