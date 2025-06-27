import { Page } from './lib/page.js';
import { Markup } from './lib/markup.js';
import * as Fetch from './lib/fetch.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
// const Passages = await Fetch.json<Thread.Passage[]>(`${PAGE.backend}/threads?tags=era+`);
const Query = {
    root: 'Content/chapters',
    prefix: '',
    tags: ['era197+', 'era196+'],
};
const Passages = await Fetch.post(`${PAGE.backend}/threads`, Query);
export function render() {
    const lines = [];
    if (!Passages)
        lines.push('No threads found');
    else {
        sortPassages(Passages);
        let priorTag = '';
        for (const passage of Passages) {
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
    PAGE.content.innerHTML = markup;
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
