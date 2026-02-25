import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
import { Instant } from './lib/xdate.js';
import { MarkupLine } from './lib/markup.js';
/**
 * @todo create a version of the timeline with hashtag IDs included in a
 * CSV record. Adding articles to the timeline could simply be merging the
 * articles with the timeline outline.
 *
 * possible options:
 * - approximation radio (all, only approximate, only not approximate)
 * - personal radio (all, only personal, only not personal ... should probably be range, e.g. 0...9)
 * - birthdate (and name)
 * - precision range
 * - file upload (personal events to be merged--file name in cookie?)
 */
/**
 * @todo Scroll through an expand/collapse list of eras in the timeline,
 * highlight entries that have article references (index file required) and
 * display the article thread on click. Transitions might stay in a single page,
 * toggling sections using their `hide` property. (Must support browser back and
 * forth as well as in-page navigation). Save breadcrumbs in local storage as
 * necessary to support user's Resume request, as well as navigation.
 */
/**
 * @todo if a timeline entry contains a title at the beginning of its
 * description (enclosed in parentheses or braces or quotes or something), we
 * should create a note (e.g., in Content/chapters) using timestamp + title as
 * its name (or maybe just title, with the timestamp in the "tags" metadata).
 */
const PAGE = new Page(true);
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const EventOptions = {
    source: '',
    from: '',
    until: '',
    keywords: '',
    eventTypes: '',
    birthdate: '',
    sortAscending: true,
};
const ApiRoute = 'events';
const Options = EventOptions;
const QueryElement = document.createElement('div');
QueryElement.className = 'timeline-query-element';
const TimelineElement = document.createElement('div');
export function render() {
    PAGE.content.append(QueryElement);
    PAGE.content.append(TimelineElement);
    const dialog = createModalDialog(Options);
    addQueryButton(dialog);
}
function createModalDialog(Options) {
    const dialog = new W.Dialog('Timeline Options');
    const fromYear = dialog.addText('From Year:', Options.from);
    const untilYear = dialog.addText('Until Year:', Options.until);
    const keywords = dialog.addText('Search Keywords:', Options.keywords);
    const eventTypes = dialog.addRadioGroup('Event Types', T.EventTypes);
    const birthdate = dialog.addText('Birthdate:', Options.birthdate);
    const sortAscending = dialog.addCheckbox('Sort Ascending:', Options.sortAscending);
    dialog.confirmButton.addEventListener('click', () => {
        Options.from = fromYear.value;
        Options.until = untilYear.value;
        Options.keywords = keywords.value;
        Options.eventTypes = eventTypes.value;
        Options.birthdate = birthdate.value;
        Options.sortAscending = sortAscending.checked;
        getEvents();
    });
    return dialog;
}
function addQueryButton(dialog) {
    const queryButton = document.createElement('button');
    queryButton.innerText = 'Timeline Query';
    QueryElement.append(queryButton);
    queryButton.addEventListener('click', (e) => {
        dialog.element.showModal();
    });
}
function getEvents() {
    Fetch.api(`${PAGE.backend}/${ApiRoute}`, Options).then((events) => {
        displayTable(TimelineElement, events);
    });
}
function displayTable(container, events) {
    container.innerHTML = '';
    if (events === null || !events.length) {
        PAGE.appendParagraph(PAGE.content, 'The timeline API returned nothing!');
        return;
    }
    const headings = ['', 'Date', 'Description'];
    if (Options.birthdate)
        headings.push('Age');
    const table = new W.Table(headings, 1);
    for (const event of events) {
        const instant = new Instant(event.instantString);
        const description = MarkupLine(event.description, 'met');
        table.addRow();
        table.addCell(event.typeIcon);
        table.addCell(instant.formatted(), 'class:timeline-date');
        table.addCell(description, '', true);
        if (event.ageGrade)
            table.addCell(event.ageGrade, 'class:timeline-age');
    }
    table.fillTable();
    container.append(table.element);
}
