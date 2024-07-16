import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Range, Dice, Coins } from './lib/ranges.js';
import { Markup } from './lib/markup.js';

type RangeType = {
	text: string;
	items: number;
	faces: number;
}

const ThisPage = new Page();
let RangeTypeSelection: HTMLDivElement;
let RangeValueSelection: HTMLDivElement;
let RangeValueDisplay: HTMLDivElement;
let IChingDisplay: HTMLDivElement;

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
const IChing = await Fetch.object<T.IChing>(IChingPath);
const NumberOfChapters = 64; /* number of Range values needed (number of I Ching chapters) */

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
console.log(`Initialized Range: ${range.items} x ${range.faces}`);


/**
 * Render the 4 global divisions:
 * - Range Type selection (Dice, Coins, etc.)
 * - Range Value Selection (entry of values from Dice, Coin, etc. casting)
 * - Range Value Display (Dice, Coin, etc. face images or numerals)
 * - I Ching Display (texts from chosen I Ching chapter)
 */
export function render() {
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
		else range = new Coins(rangeType.items);
	}
	return range;
}

/**
 * Set up the dropdown selection at the top of the page that will be used to
 * choose the Range Type (Dice, Coins, etc.) for selecting an I Ching chapter.
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
		console.log(`Updated Range: ${range.items} x ${range.faces}`);
	});
	RangeTypeSelection.append(selectElement);
}

function initializeRange(range: Range) {
	RangeValueDisplay.innerHTML = '';
	IChingDisplay.innerHTML = '';
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
	}
	if (someZeroValues) IChingDisplay.innerHTML = '';
	else {
		/* all positive values are supplied */
		// let result = range.result(values);
		let result = range.spin(values);
		RangeValueDisplay.innerHTML = `Result: ${result}`;
		// (re)display RangeValueDisplay using Range methods
		// get result using Range method
		// on invalid result, append message to RangeValueDisplay
		// on valid result displayHexagram(result);

		// displayRangeValues(dropdowns);
		// if (!someZeroValues) {
		// 	const result: number|null = range.result(values);
		// 	if (result === null) {
		// 		RangeValueDisplay.innerHTML += 'invalid roll, try again';
		// 		IChingDisplay.innerHTML = '';
		// 	}
		// 	else displayHexagram(result);
		// }
	}
}

function dropDownValues(dropdowns: HTMLSelectElement[]) {
	const values: number[] = [];
	for (let dropdown of dropdowns) {
		values.push(Number(dropdown.value));
	}
	return values;
}

function displayHexagram(hexagramNumber: number) {
	// ThisPage.fadeOut(ThisPage.table, 100)
	IChingDisplay.innerHTML = '';
	const hexagramSummary = document.createElement('div');
	const hexagramCommentary = document.createElement('div');
	const hexagramImage = document.createElement('div');
	const hexagramJudgment = document.createElement('div');

	if (hexagramNumber >= 0 && hexagramNumber < 64) {
		const hexagram = IChing.hexagrams[hexagramNumber];

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





/**
 * Given an array of HTMLSelectElements (`dropdowns`) and an index number, create a
 * dropdown element and return it. For a 12-sided die, there will be 12 options
 * (1...12) in the drop-down, plus a "none selected" selectOption (the default).
 * Options here are the numbers 1...12, but could be icons. The calling code
 * creates one dropdown for each of the 3 dice (in this case).
 * 
 * Define an event listener associated with this dropdown. The listener is
 * triggered whenever the dropdown value changes, causing the `displayRangeValues`
 * function, and possibly the `displayHexagram` function, to be called.
 */
// function rangeDropDown(range: Range, dropdowns: HTMLSelectElement[], index: number) {
// 	const selectElement = document.createElement('select');
// 	selectElement.id = `iching-range-item-${index}`;
// 	selectElement.className = 'iching-range-item-select';
// 	for (let option = 0; option <= range.faces; option += 1) {
// 		const displayedOption = (option == 0) ? '-' : `${option}`;
// 		const selectOption = new Option(`${displayedOption}`, `${option}`);
// 		selectElement.add(selectOption);
// 	}
// 	selectElement.addEventListener('change', (e: Event) => {
// 		let result = displayRangeValues(dropdowns);
// 		if (result === null) IChingDisplay.innerHTML = '';
// 		else displayHexagram(result);
// 	});
// 	return selectElement;
// }


// function displayRangeValues(dropdowns: HTMLSelectElement[]) {
// 	let result: number|null = null;
// 	const rejectOverflow = true;
// 	RangeValueDisplay.innerHTML = '';
// 	const diceValues = [0, 0, 0];
// 	let dieIndex = 0;
// 	for (let dropdown of dropdowns) {
// 		const dieValue = Number(dropdown.value);
// 		/* character codes 9856-9861: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ */
// 		let characterCode = dieValue + 9855;
// 		if (characterCode < 9856 || characterCode > 9861) characterCode = 9866; /* represents no dropdown value */
// 		RangeValueDisplay.innerHTML += `${String.fromCharCode(characterCode)} `;
// 		diceValues[dieIndex] = dieValue;
// 		dieIndex += 1;
// 		dieIndex %= 3; /* force index into diceValues range (0...2) */
// 	}
// 	// const dice0 = Number(dice[0].value);
// 	// const dice1 = Number(dice[1].value);
// 	// const dice2 = Number(dice[2].value);
// 	// if (dice0 && dice1 && dice2) {
// 	// 	const high = ((dice0 - 1) % 2) ? 0 : 36;
// 	// 	const mid = (dice1 - 1) * 6;
// 	// 	const low = (dice2 - 1);
// 	// 	result = high + mid + low;
// 	result = rangeResult(diceValues); // ## instead, get result from Range.result()
// 	if (result !== null && result > 63) {
// 		if (rejectOverflow) {
// 			RangeValueDisplay.innerHTML += 'overflow - roll again';
// 			result = null;
// 		}
// 		else result = Math.floor(Math.random() * 64);
// 	}
// 		// RangeValueDisplay.innerHTML += `${high} + ${mid} + ${low} = ${result}`;
// 		// RangeValueDisplay.innerHTML += `${result}`;
// 	// }
// 	return result;
// }

/**
 * Given an array of three dice values, return a result between 0 and 63
 * inclusive, or null if the result is out of range.
 */
// function rangeResult(diceValues: number[]) {
// 	let result: number|null = null;
// 	if (diceValues[0] && diceValues[1] && diceValues[2]) { /* all dice values are valid non-zero numbers */
// 		for (let i = 0; i < 3; i += 1) {
// 			const dice0 = diceValues[i % 3];
// 			const dice1 = diceValues[(i + 1) % 3];
// 			const dice2 = diceValues[(i + 2) % 3];
// 			const high = ((dice0 - 1) % 2) ? 0 : 36;
// 			const mid = (dice1 - 1) * 6;
// 			const low = (dice2 - 1);
// 			result = high + mid + low;
// 			if (result < 64) break;
// 		}
// 	}
// 	return result;
// }

/**
 * Executed after the one-time rendering of the main page divisions, and
 * whenever the Range Type is changed, clear the contents of `RangeValueDisplay` and
 * `IChingDisplay` and initialize the Range Value dropdowns. The dropdown event
 * listeners are defined here, which can trigger `RangeValueDisplay` and
 * `IChingDisplay` updates.
 * 
 * ### way too complicated! break it up
 */
// function initializeRange1(range: Range) {
// 	RangeValueDisplay.innerHTML = '';
// 	IChingDisplay.innerHTML = '';
// 	RangeValueSelection.innerHTML = ''; /* clear previous selection options, if any */
// 	/* create Range Value Selection dropdowns and add them to `RangeValueSelection` */
// 	const dropdowns: HTMLSelectElement[] = [];
// 	for (let rangeItem = 0; rangeItem < range.items; rangeItem += 1) {
// 		// dropdowns[rangeItem] = rangeDropDown(range, dropdowns, rangeItem);
// 		// RangeValueSelection.append(dropdowns[rangeItem]);
// 		const selectElement = document.createElement('select');
// 		selectElement.id = `iching-range-item-${rangeItem}`;
// 		selectElement.className = 'iching-range-item-select';
// 		for (let option = 0; option <= range.faces; option += 1) {
// 			const displayedOption = (option == 0) ? '-' : `${option}`;
// 			const selectOption = new Option(`${displayedOption}`, `${option}`);
// 			selectElement.add(selectOption);
// 		}
// 		// ### dropdowns isn't being updated!
// 		dropdowns.push(selectElement);
// 		RangeValueSelection.append(selectElement);
// 		selectElement.addEventListener('change', (e: Event) => {
// 			const values = dropDownValues(dropdowns);
// 			const nonZeroValues = values.some((value) => value != 0);
// 			if (nonZeroValues) {
// 				displayRangeValues(dropdowns);
// 				const zeroValues = values.includes(0);
// 				if (!zeroValues) {
// 					const result: number|null = range.result(values);
// 					if (result === null) {
// 						RangeValueDisplay.innerHTML += 'invalid roll, try again';
// 						IChingDisplay.innerHTML = '';
// 					}
// 					else displayHexagram(result);
// 				}
// 			}
// 			else {
// 				RangeValueDisplay.innerHTML = '';
// 				IChingDisplay.innerHTML = '';
// 			}
// 			// let result = displayRangeValues(dropdowns);
// 			// if (result === null) IChingDisplay.innerHTML = '';
// 			// else displayHexagram(result);
// 		});
// 	}
// }

