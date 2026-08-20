import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
console.log('v26.08.19.11.19');
const AudioDataset = await Fetch.api(`${PAGE.backend}/media/talks`);
export function render() {
    PAGE.setTitle('Talks List');
    if (AudioDataset === null) {
        window.alert(`Cannot get AudioDatset data`);
        window.history.back();
    }
    const records = AudioDataset.data;
    records.sort((a, b) => a.lastPlayed - b.lastPlayed);
    const outputLines = [];
    for (const record of records) {
        const lastPlayedDate = new Date(record.lastPlayed);
        let line = T.DateString(lastPlayedDate, 3);
        line += ` ... ${record.title}`;
        outputLines.push(line);
    }
    PAGE.appendParagraph(PAGE.content, outputLines);
}
