import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
import { Moment } from './lib/moments.js';
import { MarkupLine } from './lib/markup.js';

/**
 * @todo create a version of the timeline with hashtag IDs included in a
 * delimited record. Adding articles to the timeline could simply be merging the
 * articles with the timeline outline.
 */

/** possible options:
 * - approximation radio (all, only approximate, only not approximate)
 * - personal radio (all, only personal, only not personal ... should probably be range, e.g. 0...9)
 * - birthdate (and name)
 * - precision range
 * - file upload (personal events to be merged--file name in cookie?)
 */
type TimelineOptions = {
	fromYear: string;
	untilYear: string;
	keywords: string;
	eventTypes: string
	birthdate: string;
	sortAscending: boolean;
}

const PAGE = new Page(true);
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}

const TimedEvents = await Fetch.api<T.TimedEvent[]>(`${PAGE.backend}/timeline`);
const EventTypes = ['All', 'Historical', 'Personal'];
const Options: TimelineOptions = {
	fromYear: '',
	untilYear: '',
	keywords: '',
	eventTypes: EventTypes[0],
	birthdate: '6/21/1952',
	sortAscending: true,
}
const QueryElement = document.createElement('div');
QueryElement.className = 'timeline-query-element';
const TimelineElement = document.createElement('div');
TimelineElement.className = 'timeline-container';

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

export function render() {
	PAGE.content.append(QueryElement);
	PAGE.content.append(TimelineElement);
	if (!TimedEvents) PAGE.appendParagraph(PAGE.content, 'The timeline API returned nothing!');
	else {
		const dialog = createModalDialog(Options);
		addQueryButton(dialog);
	}
}

function addQueryButton(dialog: W.Dialog) {
	const queryButton = document.createElement('button');
	queryButton.innerText = 'Timeline Query';
	QueryElement.append(queryButton);
	queryButton.addEventListener('click', (e) => {
		dialog.element.showModal();
	});
}

function processTimedEvents(options: TimelineOptions) {
	let timedEvents = TimedEvents!.slice(); /** make a copy of the original */
	if (!(timedEvents && timedEvents.length)) PAGE.appendParagraph(PAGE.content, 'The timeline API returned nothing!');
	else {
		timedEvents = filterEvents(timedEvents, options);
		timedEvents.sort((a,b) => {
			let result = (options.sortAscending) ? a.dateValue - b.dateValue : b.dateValue - a.dateValue;
			if (!result) result = (options.sortAscending) ? a.precision - b.precision : b.precision - a.precision;
			return result;
		});
		const birthdate = new Moment(options.birthdate);
		displayGrid(TimelineElement, timedEvents, birthdate.date);
	}
}

function filterEvents(timedEvents: T.TimedEvent[], options: TimelineOptions) {
	if (options.fromYear) {
		const fromDate = new Date(Number(options.fromYear), 0, 1);
		timedEvents = timedEvents.filter((e) => e.dateValue >= fromDate.valueOf());
	}
	if (options.untilYear) {
		const thruDate = new Date(Number(options.untilYear), 0, 1);
		timedEvents = timedEvents.filter((e) => e.dateValue < thruDate.valueOf());
	}
	if (options.keywords) {
		const keywords = options.keywords.trim().split(/\s+/);
		timedEvents = timedEvents.filter((e) => {
			let eWords = e.description.trim().split(/[\s\W]+/);
			eWords = eWords.map(element => element.toLowerCase())
			let found = false;
			for (const keyword of keywords) {
				if (eWords.includes(keyword.toLowerCase())) {
					found = true;
					break;
				}
			}
			return found;
		});
	}
	if (options.eventTypes != EventTypes[0]) {
		if (options.eventTypes == EventTypes[1]) timedEvents = timedEvents.filter((e) => !e.personal);
		else timedEvents = timedEvents.filter((e) => e.personal);
	}
	return timedEvents;
}

function displayGrid(container: HTMLElement, timedEvents: T.TimedEvent[], birthday: Date|null) {
	container.innerHTML = '';
	for (const timedEvent of timedEvents) {
		const date = new Date(timedEvent.dateValue);
		const dateString = getDateString(date, timedEvent.precision)
		const description = MarkupLine(timedEvent.description, 'met');
		let ageGrade = '';
		if (birthday !== null) {
			const age = getAge(birthday, date);
			const grade = getGrade(birthday, date);
			ageGrade = (grade) ? `${age} (${grade})` : `${age}`;
		}
		const fields = [dateString, description, ageGrade];
		for (let i = 0; i < fields.length; i += 1) {
			const item = document.createElement('div');
			if (i == 0) item.className = 'timeline-date';
			else if (i == 1) item.className = 'timeline-description';
			else item.className = 'timeline-age';
			let value = fields[i];
			item.innerHTML = value;
			container.append(item);
		}
	}
}

function getDateString(date: Date, precision: number) {
	if (typeof date == 'number') date = new Date(date);
	let dateString = '?';
	let format = 0;
	if (precision == 1) format = 11;
	else if (precision == 2) format = 10;
	else if (precision == 3) format = 9;
	if (format) dateString = T.DateString(date, format);
	return dateString;
}

/**
 * Given a `birthDate` and a `targetDate` (such as the current date), return a
 * string representing the age of the person whose birth date you've entered.
 * Age is returned as a string--an integer if the target month and day is the
 * same as the birth month and day, otherwise a number with a single, unrounded
 * decimal place (.0 to .9).
 */
function getAge(birthDate: Date, targetDate: Date) {
	let age = '';
	const targetMonth = targetDate.getMonth();
	const targetDay = targetDate.getDate();
	const targetYear = targetDate.getFullYear();
	const birthMonth = birthDate.getMonth();
	const birthDay = birthDate.getDate();
	const birthYear = birthDate.getFullYear();

	const yearsDifference = targetYear - birthYear;
	/** calculate days into year for both dates, pretending they are in the same leap year */
	const dailyMilliseconds = 24 * 60 * 60 * 1000;
	const startOfYear = Date.UTC(2000, 0, 0);
	const targetDayNumber = (Date.UTC(2000, targetMonth, targetDay) - startOfYear) / dailyMilliseconds;
	const birthDayNumber = (Date.UTC(2000, birthMonth, birthDay) - startOfYear) / dailyMilliseconds;
	const daysDifferent = targetDayNumber - birthDayNumber;
	if (daysDifferent == 0) age = `${yearsDifference}`; /** exact birthday */
	else if (daysDifferent < 0) { /** target is earlier than birthday */
		const fraction = ((366 - Math.abs(daysDifferent)) / 366).toString().substring(1, 3);
		age = `${yearsDifference - 1}${fraction}`;
	}
	else { /** target is later than birthday */
		const fraction = (daysDifferent / 366).toString().substring(1, 3);
		age = `${yearsDifference}${fraction}`;
	}
	return age;
}

/**
 * Given a `birthDate`, return the school grade that a person born on this
 * date would typically be attending at the time of `this` event. We make
 * quite a few assumptions here--we assume the person started Kindergarten
 * at age 5 and did not repeat or skip any grades all the way through four
 * years of college. (To be more exact would require passing in a profile
 * containing dates for each grade.)
 */
function getGrade(birthDate: Date, targetDate: Date) {
	let grade = '';
	const grades = ['K','1','2','3','4','5','6','7','8','9','10','11','12','FR','SO','JR','SR'];
	/** using kindergarten cutoff date: Sep 1 */
	const cutoffMonth = 8; /** month offset */
	const cutoffDay = 1;
	/** get the most recently past cutoff date */
	let cutoff = new Date(targetDate.getFullYear(), cutoffMonth, cutoffDay);
	if (cutoff.valueOf() > targetDate.valueOf()) {
		/** this year's cutoff date is in the future; use last year's cutoff date */
		cutoff = new Date(targetDate.getFullYear() - 1, cutoffMonth, cutoffDay);
	}
	const ageAtCutoff = Math.floor(Number(getAge(birthDate, cutoff)));
	const delta = 5;
	const ageDelta = ageAtCutoff - delta;
	if (ageDelta >= 0  && ageDelta < grades.length) grade = grades[ageDelta];
	return grade;
}

function createModalDialog(options: TimelineOptions) {
	const dialog = new W.Dialog('Timeline Options')
	const fromYear = dialog.addText('From Year:', options.fromYear);
	const untilYear = dialog.addText('Until Year:', options.untilYear);
	const keywords = dialog.addText('Search Keywords:', options.keywords);
	const eventTypes = dialog.addRadioGroup('Event Types', EventTypes);
	const birthdate = dialog.addText('Birthdate:', options.birthdate);
	const sortAscending = dialog.addCheckbox('Sort Ascending:', options.sortAscending);

	dialog.confirmButton.addEventListener('click', () => {
		options.fromYear = fromYear.value;
		options.untilYear = untilYear.value;
		options.keywords = keywords.value;
		options.eventTypes = eventTypes.value;
		options.birthdate = birthdate.value;
		options.sortAscending = sortAscending.checked;
		processTimedEvents(options)
	});

	return dialog;
}
