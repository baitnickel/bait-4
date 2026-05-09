import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Range, Dice, Coins } from './lib/ranges.js';
import { Time } from './lib/time.js';
import { Markup } from './lib/markup.js';

/**
 * There should be an option (a simple button) to create the "random" number
 * that selects the I Ching chapter using only "nature world" factors, e.g., the
 * time of day, the lunar phase, the day-of-the-year number (season). Given a
 * time segment of 7.5 minutes (or 450 seconds), there are 192 time segments in
 * a day (twenty-four hours). 192 is evenly divisible by 64. We'll want to
 * assume a fantasy time zone where UTC plus longitude tells us when it's noon
 * and when it's midnight. The day-of-the-year number is not evenly divisible by
 * 64, but the hour-of-the year, or minute-of-the-year, etc. may produce better
 * resolution. Similarly, lunar phases may be divided into hours, minutes,
 * seconds, etc.
 * 
 * We will probably have to provided settings that will establish the time of
 * the next new moon, our longitude (UTC offset) and maybe latitude--to make
 * summer and winter correctly pronounced), etc.
 */

type RangeType = {
	text: string;
	items: number;
	faces: number;
}

const ThisPage = new Page();
let TaoButtonDivision: HTMLDivElement;
let RangeTypeSelection: HTMLDivElement;
let RangeValueSelection: HTMLDivElement;
let RangeValueDisplay: HTMLDivElement;
let IChingDisplay: HTMLDivElement;
let Tables: HTMLDivElement;
const DefaultTitle = 'I Ching';

/** ###
 * Sortition: the action of selecting or determining something by the casting or
 * drawing of lots. See: 
 * - https://en.wikipedia.org/wiki/I_Ching_divination#Coins
 * - https://en.wikipedia.org/wiki/Yarrow_algorithm
 * 
 * 12 * 12 produces a valid answer 89% of the time. 11% of the time, would need
 * to roll a third 12-sided die. 16 invalid: 11 with 9,10,11,12 or 12 with any.
 */

/** load all the I Ching texts */
const IChingPath = `${ThisPage.site}/data/iching/iching.json`;
const NewMoonsPath = `${ThisPage.site}/data/iching/new-moons.txt`;
const IChing = await Fetch.object<T.IChing>(IChingPath);
const NumberOfChapters = 64; /* number of Range values needed (number of I Ching chapters) */
const NewMoonsList = await Fetch.text(NewMoonsPath);
// console.log(NewMoonsList);

/**
 * Supported Range Types. If this list is modified, it might also be necessary to
 * modify the `newRange` function as well.
 */
const RangeTypes = new Map<string, RangeType>();
RangeTypes.set('D12X2', {text: '2 Dice (12-sided)', items: 2, faces: 12});
RangeTypes.set('D12X3', {text: '3 Dice (12-sided)', items: 3, faces: 12});
RangeTypes.set('D6', {text: '3 Dice (Standard)', items: 3, faces: 6});
RangeTypes.set('C', {text: '6 Coins', items: 6, faces: 2});

/**
 * Using the first RangeType in the list above as the default, we instantiate a
 * Range object. This object will contain properties that define how "casting the
 * lot" is recorded and displayed, as well as how the cast identifies the
 * corresponding I Ching chapter.
 */
let range = newRange(Array.from(RangeTypes.keys())[0], NumberOfChapters);
// console.log(`Initialized Range: ${range.items} x ${range.faces}`);


/**
 * Render the 4 global divisions:
 * - Range Type selection (Dice, Coins, etc.)
 * - Range Value Selection (entry of values from Dice, Coin, etc. casting)
 * - Range Value Display (Dice, Coin, etc. face images or numerals)
 * - I Ching Display (texts from chosen I Ching chapter)
 */
export function render() {
	ThisPage.setTitle(DefaultTitle);
	ThisPage.addHeading('I Ching: The Book of Changes');

	TaoButtonDivision = document.createElement('div');
	ThisPage.content.append(TaoButtonDivision);
	RangeTypeSelection = document.createElement('div');
	RangeTypeSelection.id = 'iching-range-type';
	ThisPage.content.append(RangeTypeSelection);
	initializeRangeTypeSelection();

	RangeValueSelection = document.createElement('div');
	RangeValueSelection.className = 'iching-range-values';
	ThisPage.content.append(RangeValueSelection);
	
	RangeValueDisplay = document.createElement('div');
	RangeValueDisplay.className = 'iching-range-display';
	ThisPage.content.append(RangeValueDisplay);

	IChingDisplay = document.createElement('div');
	ThisPage.content.append(IChingDisplay);
	
	/* ### not ready
	Tables = document.createElement('div');
	Tables.className = 'iching-selection';
	const Table1 = createTable(3, 4, 1, 'iching')
	const Table2 = createTable(3, 4, 1, 'iching')
	const Table3 = createTable(3, 4, 1, 'iching')
	Tables.append(Table1);
	Tables.append(Table2);
	Tables.append(Table3);
	ThisPage.content.append(Tables);
	*/

	/**
	 * Display the Tao button--the option to generate the hexagon using natural
	 * conditions: the time of day, the lunar phase, the season of the year.
	 */
	createTaoButton();

	/**
	 * Clear the `RangeValueSelection`, `RangeValueDisplay`, and `IChingDisplay`
	 * divisions, and create the widgets in `RangeValueSelection` that will be
	 * used to record the results of the Dice rolls, Coin tosses, etc.
	 */
	initializeRange(range);
}

/**
 * Given a `rangeTypeKey` (the key to a `RangeType`) and the required `limit`
 * (number of random values needed--64 for I Ching), return an initialized Range
 * object (Range if the `rangeTypeKey` is invalid). This function might need to
 * be modified if the global `RangeTypes` map is changed.
 */
function newRange(rangeTypeKey: string, limit: number) {
	let range = new Range(limit);
	let rangeType = RangeTypes.get(rangeTypeKey);
	if (rangeType !== undefined) {
		if (rangeTypeKey.startsWith('D')) range = new Dice(rangeType.items, rangeType.faces, limit);
		else range = new Coins(rangeType.items, limit);
	}
	return range;
}

/**
 * Set up the dropdown selection at the top of the page that will be used to
 * choose the Range Type (Dice, Coins, etc.) for selecting an I Ching chapter.
 * 
 * @todo selection of dice/coin values must be cleaner--use unicode 2460...246B.
 */
function initializeRangeTypeSelection() {
	const selectElement = document.createElement('select');
	for (let rangeTypeKey of Array.from(RangeTypes.keys())) {
		const rangeType = RangeTypes.get(rangeTypeKey)!;
		const displayedOption = rangeType.text;
		const selectOption = new Option(displayedOption, rangeTypeKey);
		selectElement.add(selectOption);
	}
	selectElement.addEventListener('change', (e: Event) => {
		let rangeTypeKey = selectElement.value
		range = newRange(rangeTypeKey, NumberOfChapters);
		initializeRange(range);
		// console.log(`Updated Range: ${range.items} x ${range.faces}`);
	});
	RangeTypeSelection.append(selectElement);
}

function initializeRange(range: Range) {
	RangeValueDisplay.innerHTML = '';
	IChingDisplay.innerHTML = '';
	ThisPage.setTitle(DefaultTitle);

	RangeValueSelection.innerHTML = ''; /* clear previous selection options, if any */
	/* create Range Value Selection dropdowns and add them to `RangeValueSelection` */
	const dropdowns: HTMLSelectElement[] = [];
	for (let rangeItem = 0; rangeItem < range.items; rangeItem += 1) {
		const selectElement = document.createElement('select');
		selectElement.id = `iching-range-item-${rangeItem}`;
		selectElement.className = 'iching-range-item-select';
		/* define one dropdown option per Dice/Coin face, plus the "none selected" default: '-' */
		for (let option = 0; option <= range.faces; option += 1) {
			const displayedOption = (option == 0) ? '-' : range.displayOption(option);
			const selectOption = new Option(`${displayedOption}`, `${option}`);
			selectElement.add(selectOption);
		}
		dropdowns.push(selectElement);
		RangeValueSelection.append(selectElement);

		selectElement.addEventListener('change', (e: Event) => {
			rangeValueChangeEvent(range, dropdowns);
		});
	}
}

function rangeValueChangeEvent(range: Range, dropdowns: HTMLSelectElement[]) {
	const values = dropDownValues(dropdowns);
	const someZeroValues = values.includes(0);
	const somePositiveValues = values.some((value) => value != 0);
	if (!somePositiveValues) {
		RangeValueDisplay.innerHTML = '';
		IChingDisplay.innerHTML = '';
		ThisPage.setTitle(DefaultTitle);
	}
	if (someZeroValues) {
		IChingDisplay.innerHTML = '';
		ThisPage.setTitle(DefaultTitle);
	}
	else {
		/* all positive values are supplied */
		let hexagramNumber = Number(range.tally(values));
		if (isNaN(hexagramNumber)) {
			IChingDisplay.innerHTML = `<p><h2>Invalid - Try Again</h2></p>`;
			ThisPage.setTitle(DefaultTitle);
		}
		else displayHexagram(hexagramNumber);
	}
}

function dropDownValues(dropdowns: HTMLSelectElement[]) {
	const values: number[] = [];
	for (let dropdown of dropdowns) {
		values.push(Number(dropdown.value));
	}
	return values;
}

/**
 * Create the Tao Button.
 */
function createTaoButton() {
	const taoButton = document.createElement('button');
	taoButton.className = 'iching-tao-button';
	taoButton.innerHTML = '🌎 🌙 ⭐️';
	TaoButtonDivision.append(taoButton)
	taoButton.addEventListener('click', () => {
		const value = taoValue();
		displayHexagram(value);
	});
}

/**
 * These functions might belong in a library--make sure they remain black boxes.
 */
// ******************************************************************************

type NumberRange = { first: number, last: number };
const HexagramRange: NumberRange = { first: 0, last: 127 }; /** 127 rather than 63 to support wrapped ranges */

/**
 * Give an `oldNumber` belonging to an `oldRange`, return the corresponding new
 * number in a `newRange`. For example, if the old number is 2 in a range of
 * 1...3, the corresponding new number in a range 2...8 will be 5--the old
 * number and the new number are both 50% through their ranges. When `wrap` is
 * set to true, halfway through the new range, numbers will count down to the
 * first number in the range, e.g.: 0,1,2,3,3,2,1,0.
 * 
 * A NumberRange defines the first entry and last entry in a set of consecutive
 * integers.
 * 
 * @todo
 * What happens when the old range is the same length or smaller than the new
 * range?
 */
function recalibrate(oldNumber: number, oldRange: NumberRange, newRange: NumberRange, wrap = false) {
	oldNumber = Math.round(oldNumber); /** make it an integer */
	const oldRangeLength = (oldRange.last - oldRange.first) + 1;
	const newRangeLength = (newRange.last - newRange.first) + 1;
	const percentage = (oldNumber - oldRange.first) / oldRangeLength;
	let newNumber = Math.floor((percentage * newRangeLength) + newRange.first);
	if (wrap) newNumber = wrapRange(newNumber, newRange);
	return newNumber;
}

/** Wrap a range of consecutive numbers back upon itself. For example:
 * - 0,1,2,3,4,5,6,7 => 0,1,2,3,3,2,1,0
 * 
 * @todo
 * This is working well for a range that contains an even number of entries, but
 * should be confirmed for ranges with an odd number of entries.
 */
function wrapRange(number: number, numberRange: NumberRange) {
	const rangeLength = (numberRange.last - numberRange.first) + 1;
	if (number < numberRange.first) number = Math.abs(number);
	else if (number >= (Math.floor(rangeLength / 2))) number = numberRange.last - number;
	return number;
}

/**
 * Given `now`, a Time, return a number between 0 and 63, where 0 is
 * midnight and 63 is noon. The number should climb to 63 as the AM hours move
 * forward, and then descend to 0 as the PM hours return to midnight.
 */
function taoValue() {
	const now = new Time();
	console.log('now:', now);
	const values: number[] = [];
	values.push(timeValue(now));
	values.push(lunationValue(now));
	values.push(orbitalValue(now));
	/** set taoButton's value to the average of all the values */
	let sum = 0;
	for (const value of values) sum += value;
	const value = Math.round(sum / values.length);
	return value;
}
/**
 * Determine the current time range (the date/time of the most recent midnight
 * and the date/time of the next midnight). Determine where `now` falls within
 * this range and return its value as an integer in 0...63. We make adjustments
 * for Daylight Saving Time, ensuring that 0 is always returned when the sun is at its
 * lowest and 63 is always returned when the sun is at its highest.
 */
function timeValue(now: Time) {
	const timeRange: NumberRange = { first: 0, last: Time.msPerDay };
	const trueMidnight = (now.getTime() - now.midnightOffset()) + now.DSTOffset();
	const midnightOffset = now.getTime() - trueMidnight;
	const value = recalibrate(midnightOffset, timeRange, HexagramRange, true);
	console.log('time:', value);
	return value;
}
/**
 * Determine the current lunation range (the date/time of the most recent new
 * moon and the date/time of the next new moon). Determine where `now` falls
 * within this range, and return its value as an integer in 0...63 (where 0 is a
 * new moon and 63 is a full moon--approximately).
 */
function lunationValue(now: Time) {
	let value = 0;
	const nowISO = now.toISOString();
	const newMoons = NewMoonsList.split('\n');
	let priorNewMoon = nowISO; 
	for (const nextNewMoon of newMoons) {
		if (nowISO < nextNewMoon) {
			const priorMoon = new Time(priorNewMoon);
			const nextMoon = new Time(nextNewMoon);
			const lunationRange: NumberRange = { first: priorMoon.getTime(), last: nextMoon.getTime() };
			value = recalibrate(now.getTime(), lunationRange, HexagramRange, true);
			break;
		}
		priorNewMoon = nextNewMoon;
	}
	console.log('moon:', value);
	return value;
}
/**
 * Determine the current orbital range (the date/time of the most recent winter
 * solstice and the date/time of the next winter solstice). Determine where
 * `now` falls within this range, and return its value as an integer in 0...63.
 */
function orbitalValue(now: Time) {
	const leapYearDays = 366;
	const daysBeforeNewYear = 11; /** number of days solstice occurs before New Year */
	const solsticeOffset = (now.ordinalDay(true) + daysBeforeNewYear) % leapYearDays;
	const orbitalRange: NumberRange = { first: 0, last: leapYearDays - 1 };
	const value = recalibrate(solsticeOffset, orbitalRange, HexagramRange, true);
	console.log('season:', value);
	return value;
}
/**
 * Given an `array` of any type of elements, return a new array, created by
 * rotating the elements of the original array to the left (negative `count`) or
 * to the right (positive `count`.) If `count` equals zero the new array will be
 * a copy of the original `array`. The absolute value of `count` may be greater
 * than the length of the array; the rotation will continue around the array
 * circle (count becomes count modulo the array length).
 */
function rotate(array: any[], count: number) {
	const newArray = array.slice();
	const left = count < 0;
	const shiftCount = Math.abs(count) % newArray.length;
	if (shiftCount && shiftCount < newArray.length) {
		for (let i = 0; i < shiftCount; i += 1) {
			if (left) newArray.push(newArray.shift()!);
			else newArray.unshift(newArray.pop()!);
		}
	}
	return newArray;
}

// ******************************************************************************

/**
 * Given the desired number of `rows` and `columns`, and a `tableClass` name,
 * return an HTMLTableElement.
 */
function createTable(rows: number, columns: number, firstId: number, tableClass: string) {
	const tableElement = document.createElement('table');
	tableElement.className = tableClass;
	let cellNumber = firstId;
	for (let row = 0; row < rows; row += 1) {
		let newRow = tableElement.insertRow();
		newRow.className = `${tableClass}-row`;
		for (let column = 0; column < columns; column += 1) {
			const tableCell = newRow.insertCell(column);
			tableCell.id = `${tableClass}-${cellNumber}`;
			tableCell.className = `${tableClass}-data`;
			tableCell.innerText = `${cellNumber}`;
			cellNumber += 1;
		}
	}
	return tableElement;
}

function displayHexagram(hexagramNumber: number) {
	// ThisPage.fadeOut(Table, 100);
	IChingDisplay.innerHTML = '';
	ThisPage.setTitle(DefaultTitle);
	const hexagramSummary = document.createElement('div');
	const hexagramCommentary = document.createElement('div');
	const hexagramImage = document.createElement('div');
	const hexagramJudgment = document.createElement('div');

	if (hexagramNumber >= 0 && hexagramNumber < 64) {
		console.log('Hex Number:', hexagramNumber);

		const hexagram = IChing.hexagrams[hexagramNumber];
		ThisPage.setTitle(`${DefaultTitle} ${hexagram.character} Chapter ${hexagram.chapter}`);

		const hexagramGlyph = document.createElement('span');
		hexagramGlyph.classList.add('iching-hexagram');
		hexagramGlyph.innerText = `${hexagram.character}`;
		const hexagramChapterName = document.createElement('span');
		hexagramChapterName.classList.add('iching-hexagram-chapter-name');
		hexagramChapterName.innerText = ` Chapter ${hexagram.chapter}`;
		hexagramSummary.append(hexagramGlyph);
		hexagramSummary.append(hexagramChapterName);
		const breakElement = document.createElement('br');
		hexagramSummary.append(breakElement);
		const hexagramChapter = document.createElement('span');
		hexagramChapter.classList.add('iching-heading');
		hexagramChapter.innerText = `${hexagram.name.chinese} (${hexagram.name.english})`;
		hexagramSummary.append(hexagramChapter);
		ThisPage.content.append(hexagramSummary);

		/** Main Commentary */
		hexagramCommentary.innerHTML = Markup(hexagram.commentary.join('\n\n'));
		ThisPage.content.append(hexagramCommentary);

		/** Image: Verse, Commentary */
		const imageHeading = document.createElement('p');
		imageHeading.classList.add('iching-heading');
		imageHeading.innerText = 'Image';
		hexagramImage.append(imageHeading);
		const imageVerse = document.createElement('div');
		imageVerse.classList.add('iching-verse');
		imageVerse.innerHTML = Markup(hexagram.image.verse.join('\n'));
		hexagramImage.append(imageVerse);
		const imageCommentary = document.createElement('div');
		imageCommentary.innerHTML = Markup(hexagram.image.commentary.join('\n\n'));
		hexagramImage.append(imageCommentary);
		ThisPage.content.append(hexagramImage);

		/** Judgment: Verse, Commentary */
		const judgmentHeading = document.createElement('p');
		judgmentHeading.classList.add('iching-heading');
		judgmentHeading.innerText = 'Judgment';
		hexagramJudgment.append(judgmentHeading);
		const judgmentVerse = document.createElement('div');
		judgmentVerse.classList.add('iching-verse');
		judgmentVerse.innerHTML = Markup(hexagram.judgment.verse.join('\n'));
		hexagramJudgment.append(judgmentVerse);
		const judgmentCommentary = document.createElement('div');
		judgmentCommentary.innerHTML = Markup(hexagram.judgment.commentary.join('\n\n'));
		hexagramJudgment.append(judgmentCommentary);
		ThisPage.content.append(hexagramJudgment);

		IChingDisplay.append(hexagramSummary);
		IChingDisplay.append(hexagramCommentary);
		IChingDisplay.append(hexagramImage);
		IChingDisplay.append(hexagramJudgment);
	}
}
