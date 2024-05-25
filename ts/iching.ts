import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Markup } from './lib/markup.js';

const ThisPage = new Page();

/** load all the I Ching texts */
const IChingPath = `${ThisPage.site}/data/iching/iching.json`;
const IChing = await Fetch.object<T.IChing>(IChingPath);

export function render() {
	const selectionsDiv = document.createElement('div');
	selectionsDiv.className = 'dice-selection';
	ThisPage.content.append(selectionsDiv);
	const diceDisplayDiv = document.createElement('div');
	diceDisplayDiv.className = 'dice-display';
	ThisPage.content.append(diceDisplayDiv);
	const hexagramDiv = document.createElement('div');
	ThisPage.content.append(hexagramDiv);
	const dice: HTMLSelectElement[] = [];
	for (let i = 0; i < 3; i += 1) {
		dice[i] = dieElement(dice, i, diceDisplayDiv, hexagramDiv);
		selectionsDiv.append(dice[i]);
	}
}

function dieElement(dice: HTMLSelectElement[], index: number, displayDiv: HTMLDivElement, hexagramDiv: HTMLDivElement) {
	const selectElement = document.createElement('select');
	selectElement.id = `die-${index}`;
	selectElement.className = 'die-select';
	/* character codes 9856-9861: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ */
	for (let die = 0; die <= 6; die += 1) {
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
	displayDiv.innerHTML = '';
	for (let die of dice) {
		let characterCode = Number(die.value) + 9855;
		if (characterCode < 9856 || characterCode > 9861) characterCode = 9866; /* represents no die value */
		displayDiv.innerHTML += `${String.fromCharCode(characterCode)} `;
	}
	const dice0 = Number(dice[0].value);
	const dice1 = Number(dice[1].value);
	const dice2 = Number(dice[2].value);
	if (dice0 && dice1 && dice2) {
		const high = ((dice0 - 1) % 2) ? 0 : 36;
		const mid = (dice1 - 1) * 6;
		const low = (dice2 - 1);
		result = high + mid + low;
		if (result > 63) result = Math.floor(Math.random() * 64);
		// displayDiv.innerHTML += `${high} + ${mid} + ${low} = ${result}`;
		// displayDiv.innerHTML += `${result}`;
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
		hexagramGlyph.innerText = `${hexagram.character} Chapter ${hexagram.chapter}`;
		hexagramSummary.append(hexagramGlyph);
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
