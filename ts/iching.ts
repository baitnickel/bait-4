import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Dice, Coins } from './lib/chance.js';
import { Markup } from './lib/markup.js';

type ChanceMethod = {
	text: string;
	items: number;
	faces: number;
}

const ThisPage = new Page();

/** load all the I Ching texts */
const IChingPath = `${ThisPage.site}/data/iching/iching.json`;
const IChing = await Fetch.object<T.IChing>(IChingPath);

/** ###
 * Terminology needs to be corrected as it's the source of a lot of confused
 * logic here.
 * 
 * Divination Methods. Cast Off. Cleromancy. Sortition. Oracle. Oracle Bones. 50
 * Yarrow Stalks. Coins. Dice. Playing Cards. Seasonal (Calendric) Time. Place.
 * Position.
 * 
 * see: 
 * - https://en.wikipedia.org/wiki/I_Ching_divination#Coins
 * - https://en.wikipedia.org/wiki/Yarrow_algorithm
 * 
 * 12 * 12 = 144
 * 144 * 4 = 576
 * 576 / 64 = 9
 */

/** Supported Input Methods */
const ChanceMethods = new Map<string, ChanceMethod>();
ChanceMethods.set('D12', {text: '3 Dice (12-sided)', items: 3, faces: 12});
ChanceMethods.set('D6', {text: '3 Dice (Standard)', items: 3, faces: 6});
ChanceMethods.set('C', {text: '6 Coins', items: 6, faces: 2});

/**
 * Using the first ChanceMethod in the list above as the default, we instantiate
 * a Chance object (in this case, a 12-sided Dice object). This object will
 * contain properties that define how a "toss" is recorded and displayed, as
 * well as how a toss identifies the corresponding I Ching chapter.
 * 
 * The Chance object is global, and will be used in the Initialize method below,
 * in both the render function and in appropriate event listeners (changing the
 * input "token" type, clicking a reset button, etc.).
 */
const InputMethods = Array.from(ChanceMethods.keys()); // ['D12', 'D6', 'C'];
const Limit = 64; /* number of Chance values to be returned */
let ChanceMethodKey = initializeInput(InputMethods[0]); /** initialize input method */
let ChanceMethod = ChanceMethods.get(ChanceMethodKey);
let Chance = new Coins(6, Limit);
if (ChanceMethodKey.startsWith('D')) {
	Chance = new Dice(3, 12, Limit);
}

const values = [12,12,12];
console.log(`dice: ${Chance.result(values)}`);

/**
 * Render 4 divisions:
 * - Input Type selection (Dice, Coins, etc.)
 * - Dice/Coin toss recording (select values from dropdowns to match each tossed item)
 * - Display recorded item values (e.g., Dice/Coin face images or numerals)
 * - I Ching text
 */
export function render() {
	/** Create a div for the input type selection (Dice, Coins, etc) */
	const inputMethodDiv = document.createElement('div');
	inputMethodDiv.id = 'iching-method';
	ThisPage.content.append(inputMethodDiv);
	inputMethodSelection(inputMethodDiv);

	/** Create a div for the input option selections */
	/** this should be handled in the Chance object */
	const inputDiv = document.createElement('div');
	inputDiv.className = 'dice-selection';
	ThisPage.content.append(inputDiv);
	
	/** Create a div for the display of the selected input values */
	/** this should be handled in the Chance object */
	const diceDisplayDiv = document.createElement('div');
	diceDisplayDiv.className = 'dice-display';
	ThisPage.content.append(diceDisplayDiv);

	/** Create a div for the I Ching text */
	const hexagramDiv = document.createElement('div');
	ThisPage.content.append(hexagramDiv);

	/**
	 * For each item (Die, Coin, etc) append a Select Element to the Input
	 * Options Selection div created above to allow the user to select the
	 * values found after rolling the dice or tossing the coins, etc.
	 *
	 * 
	 */
	const dice: HTMLSelectElement[] = [];
	for (let i = 0; i < 3; i += 1) {
		dice[i] = dieElement(dice, i, diceDisplayDiv, hexagramDiv);
		inputDiv.append(dice[i]);
	}
}

/**
 * Set up the drop-down selection at the top of the page that will be used to
 * choose the I Ching chapter selection.
 */
function inputMethodSelection(division: HTMLDivElement) {
	const selectElement = document.createElement('select');
	for (let inputMethod of InputMethods) {
		const method = ChanceMethods.get(inputMethod)!;
		const displayedOption = method.text;
		const option = new Option(displayedOption, inputMethod);
		selectElement.add(option);
	}
	selectElement.addEventListener('change', (e: Event) => {
		let inputMethod = selectElement.value
		// console.log(`Input Method: ${inputMethod}`);
		ChanceMethodKey = initializeInput(inputMethod);
	});
	division.append(selectElement);
}

/**
 * Initialize the divisions in the page that are used for:
 * - input type selection (dice, coins, 12-sided dice, etc.)
 * - display
 * - I Ching texts.
 */
function initializeInput(inputMethod: string) {
	let chance: ChanceMethod;
	if (ChanceMethods.has(inputMethod)) {
		chance = ChanceMethods.get(inputMethod)!
		console.log(`inputMethod selected: ${chance.text}`);
	}
	else console.log(`Invalid inputMethod selected: ${inputMethod}`);
	return inputMethod;
}

/**
 * Given an array of HTMLSelectElements (`dice`) and an index number, create a
 * drop-down element and return it. For a 12-sided die, there will be 12 options
 * (1...12) in the drop-down, plus a "none selected" option (the default).
 * Options here are the numbers 1...12, but could be icons. The calling code
 * creates one drop-down for each of the 3 dice (in this case).
 * 
 * Define an event listener associated with this drop-down. The listener is
 * triggered whenever the drop-down value changes, causing the `displayDice`
 * function, and possibly the `displayHexagram` function, to be called.
 */
function dieElement(dice: HTMLSelectElement[], index: number, displayDiv: HTMLDivElement, hexagramDiv: HTMLDivElement) {
	const selectElement = document.createElement('select');
	selectElement.id = `die-${index}`;
	selectElement.className = 'die-select';
	/* character codes 9856-9861: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ */
	for (let die = 0; die <= 12; die += 1) { /* ### hardcoding 12 here! */
		const displayedOption = (die == 0) ? '-' : `${die}`;
		const option = new Option(`${displayedOption}`, `${die}`);
		selectElement.add(option);
	}
	selectElement.addEventListener('change', (e: Event) => {
		let result = displayDice(dice, displayDiv);
		if (result === null) hexagramDiv.innerHTML = '';
		else displayHexagram(result, hexagramDiv);
	});

	return selectElement;
}


function displayDice(dice: HTMLSelectElement[], displayDiv: HTMLDivElement) {
	let result: number|null = null;
	const rejectOverflow = true;
	displayDiv.innerHTML = '';
	const diceValues = [0, 0, 0];
	let dieIndex = 0;
	for (let die of dice) {
		const dieValue = Number(die.value);
		let characterCode = dieValue + 9855;
		if (characterCode < 9856 || characterCode > 9861) characterCode = 9866; /* represents no die value */
		displayDiv.innerHTML += `${String.fromCharCode(characterCode)} `;
		diceValues[dieIndex] = dieValue;
		dieIndex += 1;
		dieIndex %= 3; /* force index into diceValues range (0...2) */
	}
	// const dice0 = Number(dice[0].value);
	// const dice1 = Number(dice[1].value);
	// const dice2 = Number(dice[2].value);
	// if (dice0 && dice1 && dice2) {
	// 	const high = ((dice0 - 1) % 2) ? 0 : 36;
	// 	const mid = (dice1 - 1) * 6;
	// 	const low = (dice2 - 1);
	// 	result = high + mid + low;
	result = diceResult(diceValues);
	if (result !== null && result > 63) {
		if (rejectOverflow) {
			displayDiv.innerHTML += 'overflow - roll again';
			result = null;
		}
		else result = Math.floor(Math.random() * 64);
	}
		// displayDiv.innerHTML += `${high} + ${mid} + ${low} = ${result}`;
		// displayDiv.innerHTML += `${result}`;
	// }
	return result;
}

/**
 * Given an array of three dice values, return a result between 0 and 63
 * inclusive, or null if the result is out of range.
 */
function diceResult(diceValues: number[]) {
	let result: number|null = null;
	if (diceValues[0] && diceValues[1] && diceValues[2]) { /* all die values are valid non-zero numbers */
		for (let i = 0; i < 3; i += 1) {
			const dice0 = diceValues[i % 3];
			const dice1 = diceValues[(i + 1) % 3];
			const dice2 = diceValues[(i + 2) % 3];
			const high = ((dice0 - 1) % 2) ? 0 : 36;
			const mid = (dice1 - 1) * 6;
			const low = (dice2 - 1);
			result = high + mid + low;
			if (result < 64) break;
		}
		/*
		0 1 2
		0 2 1
		1 0 2
		1 2 0
		2 0 1
		2 1 0
		*/
	}
	return result;
}

function displayHexagram(hexagramNumber: number, hexagramDiv: HTMLDivElement) {
	// ThisPage.fadeOut(ThisPage.table, 100)

	hexagramDiv.innerHTML = '';
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

		hexagramDiv.append(hexagramSummary);
		hexagramDiv.append(hexagramCommentary);
		hexagramDiv.append(hexagramImage);
		hexagramDiv.append(hexagramJudgment);
	}
}
