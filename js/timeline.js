import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
import { Time } from './lib/time.js';
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
const TimelineOptions = {
    source: '',
    from: '',
    until: '',
    keywords: '',
    accessTypes: '',
    birthdate: '',
    sortAscending: true,
};
const Options = TimelineOptions;
const Moments = await Fetch.api(`${PAGE.backend}/moments`);
const QueryButtonElement = document.createElement('div');
QueryButtonElement.classList.add('timeline-query-button');
const QueryElement = document.createElement('div');
// QueryElement.className = 'timeline-query-element';
const TimelineElement = document.createElement('div');
TimelineElement.className = 'timeline-element';
export function render() {
    PAGE.content.append(QueryButtonElement);
    PAGE.content.append(TimelineElement);
    PAGE.content.append(QueryElement);
    const dialog = createModalDialog(Options);
    addQueryButton(dialog);
    // dialog.element.showModal();
    getMoments();
    // /** for testing: */
    // Options.from = '1962';
    // Options.until = '1963';
    // Options.keywords = '';
    // Options.accessTypes = '';
    // Options.birthdate = '';
    // Options.sortAscending = true;
    // getMoments();
}
function createModalDialog(Options) {
    const dialog = new W.Dialog('Timeline Options');
    const fromYear = dialog.addText('From Year:', Options.from);
    const untilYear = dialog.addText('Until Year:', Options.until);
    const keywords = dialog.addText('Search Keywords:', Options.keywords);
    const accessTypes = dialog.addRadioGroup('Event Types', T.AccessTypes);
    const birthdate = dialog.addText('Birthdate (M/D/Y):', Options.birthdate);
    const sortAscending = dialog.addCheckbox('Sort Ascending:', Options.sortAscending);
    dialog.confirmButton.addEventListener('click', () => {
        Options.from = fromYear.value;
        Options.until = untilYear.value;
        Options.keywords = keywords.value;
        Options.accessTypes = accessTypes.value;
        Options.birthdate = Time.reformatMDY(birthdate.value); /** convert M/D/Y to YYYY-MM-DD */
        Options.sortAscending = sortAscending.checked;
        getMoments();
    });
    return dialog;
}
function addQueryButton(dialog) {
    const queryButton = document.createElement('button');
    // queryButton.classList.add('timeline-query-button');
    queryButton.innerText = 'Timeline Query';
    QueryButtonElement.append(queryButton);
    queryButton.addEventListener('click', (e) => {
        dialog.element.showModal();
    });
}
/*
    Note that the backend API will receive the T.TimelineOptions object, as defined
    in types.ts, via the `request` parameter:

    app.post('/events', (request, response) => {
        const options: T.TimelineOptions = request.body;
        const events = E.events(options);
        response.json(events);
    });
*/
function getMoments() {
    // Fetch.api<T.Event[]>(`${PAGE.backend}/${ApiRoute}`, Options).then((events) => {
    // 	displayTable(TimelineElement, events);
    // });
    if (Moments) {
        const moments = filterMoments(Moments, Options);
        displayTable(TimelineElement, moments);
    }
}
function displayTable(container, moments) {
    container.innerHTML = '';
    if (moments === null || !moments.length) {
        PAGE.appendParagraph(PAGE.content, 'The timeline API returned nothing!');
        return;
    }
    const headings = ['', 'Date', 'Description'];
    if (Options.birthdate)
        headings.push('Age (Grade)');
    const table = new W.Table(headings, 1);
    for (const moment of moments) {
        const time = new Time(moment.id);
        const description = MarkupLine(moment.description, 'met');
        table.addRow();
        table.addCell(accessType(moment), 'class:timeline-access');
        const date = (moment.circa) ? `c. ${time.formatted()}` : time.formatted();
        table.addCell(date, 'class:timeline-date');
        table.addCell(description, '', true);
        let ageGrade = '';
        if (Options.birthdate) {
            const birthTime = new Time(Options.birthdate);
            const age = birthTime.until(time);
            let grade = '';
            /** for efficiency, assume that grades only apply in the age range 4...22 */
            if (age >= 4 && age <= 22)
                grade = getGrade(time, birthTime);
            ageGrade = formattedAgeGrade(age, grade);
        }
        if (ageGrade)
            table.addCell(ageGrade, 'class:timeline-age');
    }
    table.fillTable();
    container.append(table.element);
}
function filterMoments(moments, options) {
    const fromTime = (options.from) ? new Time(options.from) : null;
    const untilTime = (options.until) ? new Time(options.until) : null;
    // moments = moments.filter((moment) => { moment.id == '1962-01'} );
    moments = moments.filter((moment) => {
        if (fromTime !== null && moment.value < fromTime.valueOf())
            return false;
        if (untilTime !== null && moment.value >= untilTime.valueOf())
            return false;
        if (options.keywords) {
            const keywords = options.keywords.trim().split(/\s+/);
            let descriptionWords = moment.description.trim().split(/[\s\W]+/);
            descriptionWords = descriptionWords.map(element => element.toLowerCase());
            let eligible = false;
            for (const keyword of keywords) {
                if (descriptionWords.includes(keyword.toLowerCase())) {
                    eligible = true;
                    break;
                }
            }
            if (!eligible)
                return false;
        }
        if (options.accessTypes != T.AccessTypes[0]) {
            if (options.accessTypes == T.AccessTypes[1] && (moment.access < 2))
                return false;
            if (options.accessTypes == T.AccessTypes[2] && moment.access != 1)
                return false;
            if (options.accessTypes == T.AccessTypes[3] && moment.access != 0)
                return false;
        }
        return true;
    });
    return moments;
}
/**
 * Given a `birthday`, return the school grade that a person born on this
 * date would typically be attending at the time of this event. We make
 * quite a few assumptions here--we assume the person started Kindergarten
 * at age 5 and did not repeat or skip any grades all the way through four
 * years of college. (To be more exact would require passing in a profile
 * containing dates for each grade.)
 */
function getGrade(momentTime, birthday) {
    let grade = '';
    const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'FR', 'SO', 'JR', 'SR'];
    /** using kindergarten cutoff date: Sep 1 */
    const cutoffYear = momentTime.getUTCFullYear();
    const cutoffMonth = '09';
    const cutoffDay = '01';
    /** get the most recently past cutoff date */
    let cutoff = new Time(`${cutoffYear}-${cutoffMonth}-${cutoffDay}`);
    if (cutoff.valueOf() > momentTime.valueOf()) {
        /** this year's cutoff date is in the future; use last year's cutoff date */
        cutoff = new Time(`${cutoffYear - 1}-${cutoffMonth}-${cutoffDay}`);
    }
    const ageAtCutoff = Math.floor(birthday.until(cutoff));
    const delta = 5;
    const ageDelta = ageAtCutoff - delta;
    if (ageDelta >= 0 && ageDelta < grades.length)
        grade = grades[ageDelta];
    return grade;
}
function formattedAgeGrade(age, grade) {
    let ageGrade = '';
    const decimalPlaces = (age == Math.round(age)) ? 0 : 1;
    const fixedAge = age.toFixed(decimalPlaces);
    ageGrade = (grade) ? `${fixedAge} (${grade})` : `${fixedAge}`;
    return ageGrade;
}
const TypeIcons = ['🟢', '🟡', '🔴']; /** correspond to '-', '=', '+'  and T.AccessTypes[1], [2], [3] */
function accessType(moment) {
    let accessType = TypeIcons[0];
    if (moment.access == 1)
        accessType = TypeIcons[1];
    else if (moment.access == 0)
        accessType = TypeIcons[2];
    return accessType;
}
