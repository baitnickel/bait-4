import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const TimedEvents = await Fetch.api(`${PAGE.backend}/timeline`);
export function render() {
    if (!TimedEvents)
        PAGE.appendParagraph(PAGE.content, 'The timeline API returned nothing!');
    else
        processTimedEvents(TimedEvents);
}
function processTimedEvents(timedEvents) {
    const lines = [];
    for (const timedEvent of timedEvents) {
        const dateString = getDateString(timedEvent.dateValue, timedEvent.precision);
        const line = `${dateString}: ${timedEvent.description}`;
        lines.push(line);
    }
    PAGE.appendParagraph(PAGE.content, lines);
}
function getDateString(date, precision) {
    if (typeof date == 'number')
        date = new Date(date);
    let dateString = '?';
    let format = 0;
    if (precision == 1)
        format = 11;
    else if (precision == 2)
        format = 10;
    else if (precision == 3)
        format = 9;
    if (format)
        dateString = T.DateString(date, format);
    return dateString;
}
