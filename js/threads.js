import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as Fetch from './lib/fetch.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
export function render() {
    const query = document.createElement('div');
    const output = document.createElement('div');
    PAGE.content.append(query);
    PAGE.content.append(output);
    getPassages(query, output);
}
function getPassages(queryDivision, outputDivision) {
    const queryButton = document.createElement('button');
    queryButton.innerText = 'Enter Query';
    queryDivision.append(queryButton);
    let queryString = '';
    queryButton.addEventListener('click', (e) => {
        const response = window.prompt('Enter root, (prefix-), tags...', queryString);
        if (response !== null && response.trim()) {
            queryString = response.trim();
            const query = parseQueryString(queryString);
            Fetch.post(`${PAGE.backend}/threads`, query).then((passages) => {
                displayPassages(passages, outputDivision);
            });
        }
    });
}
function parseQueryString(queryString) {
    let query;
    const components = queryString.split(/\s+/);
    const root = components.shift();
    let prefix = '';
    if (components.length && components[0].length > 1 && components[0].endsWith('-')) {
        prefix = components[0].slice(0, -1);
        components.shift();
    }
    const tags = [];
    for (const component of components) {
        tags.push(prefix + component);
    }
    query = { root: root, tags: tags };
    return query;
}
function displayPassages(passages, division) {
    const lines = [];
    division.innerHTML = '';
    if (!passages)
        lines.push('No threads found');
    else {
        sortPassages(passages);
        let priorTag = '';
        for (const passage of passages) {
            if (passage.tag != priorTag)
                lines.push(`# ${passage.tag}`);
            const fileName = (passage.file === null) ? '(none)' : `${passage.file.name}(${passage.section})`;
            lines.push(`## File: ${fileName}:`);
            lines.push(passage.text);
            lines.push('___');
            priorTag = passage.tag;
        }
    }
    const text = lines.join('\n');
    const markup = Markup(lines);
    division.innerHTML = markup;
}
function sortPassages(passages) {
    passages.sort((a, b) => {
        let result = 0;
        result = a.tag.localeCompare(b.tag);
        if (!result && a.file !== null && b.file !== null) {
            result = a.file.path.localeCompare(b.file.path);
            // const aModified = a.file.modified as Date;
            // const bModified = b.file.modified as Date;
            // const aTime = aModified.getTime();
            // const bTime = bModified.getTime();
            // result = aTime - bTime;
            // console.log('a:', a.file.modified.getTime());
            // console.log('b:', b.file.modified.getTime());
            // if (a.file.modified !== undefined && b.file.modified !== undefined) {
            // 	const aTime = a.file.modified.getTime();
            // 	const bTime = b.file.modified.getTime();
            // 	result = aTime - bTime;
            // }
        }
        if (!result)
            result = a.section - b.section;
        return result;
    });
}
