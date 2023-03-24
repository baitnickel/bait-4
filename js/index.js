"use strict";
const pageParameter = 'page';
let params = new URLSearchParams(document.location.search);
let moduleSpecifier = params.get(pageParameter);
if (!moduleSpecifier)
    moduleSpecifier = 'home';
(async () => {
    const module = await import(`./${moduleSpecifier}.js`);
    module.render();
})();
