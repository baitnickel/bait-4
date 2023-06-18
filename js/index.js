"use strict";
const parameters = new URLSearchParams(document.location.search);
const page = (parameters.get('page')) ? parameters.get('page') : 'home';
(async () => {
    const module = await import(`./${page}.js`);
    module.render();
})();
