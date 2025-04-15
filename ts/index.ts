/**
 * This module is the first and only module called by index.html. We read the
 * URL query parameters, looking for the `page` key. The value of this key
 * names the module to be loaded (without the ".js" extension). If the
 * `page` key is not present, we assume the `home` module.
 * 
 * If the key's value is not a valid "page" module (one in the same directory as
 * this file and containing a `render` function), the browser will throw a "page
 * not found" (404) error. The URLs are not meant to be entered manually, but
 * constructed via menu selections in the `page` module.
 * 
 * The selected page module is loaded dynamically in an async/await clause.
 */
let page = '';
let ids = '';
const urlParameters = new URLSearchParams(document.location.search);
for (const [key, value] of urlParameters.entries()) {
	if (key == 'page') page = value;
	else if (key == 'id') ids = value;
	else if (/^\d/.test(key)) ids = key;
	// console.log(`Key: |${key}| Value: |${value}|`)
}
if (!page && ids) page = 'articles';
else if (!page) page = 'home';

(async () => {
	const module = await import(`./${page}.js`);
	module.render();
})();


// const query = '  1,2    3,4,5  ';
// const regexp = /[\d\s,]*/;
// if (regexp.test(query)) {
//     console.log('yes!');
//     const values = query.trim().split(/[\s,]*/);
//     for (const value of values) console.log(value);
// }
// else console.log('nope');
