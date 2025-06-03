import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { Range, Dice, Coins } from './lib/ranges.js';
import { Markup } from './lib/markup.js';
const ThisPage = new Page();
let RangeTypeSelection;
let RangeValueSelection;
let RangeValueDisplay;
let IChingDisplay;
let Tables;
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
const IChing = await Fetch.object(IChingPath);
const NumberOfChapters = 64; /* number of Range values needed (number of I Ching chapters) */
/**
 * Supported Range Types. If this list is modified, it might also be necessary to
 * modify the `newRange` function as well.
 */
const RangeTypes = new Map();
RangeTypes.set('D12X2', { text: '2 Dice (12-sided)', items: 2, faces: 12 });
RangeTypes.set('D12X3', { text: '3 Dice (12-sided)', items: 3, faces: 12 });
RangeTypes.set('D6', { text: '3 Dice (Standard)', items: 3, faces: 6 });
RangeTypes.set('C', { text: '6 Coins', items: 6, faces: 2 });
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
function newRange(rangeTypeKey, limit) {
    let range = new Range(limit);
    let rangeType = RangeTypes.get(rangeTypeKey);
    if (rangeType !== undefined) {
        if (rangeTypeKey.startsWith('D'))
            range = new Dice(rangeType.items, rangeType.faces, limit);
        else
            range = new Coins(rangeType.items, limit);
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
        const rangeType = RangeTypes.get(rangeTypeKey);
        const displayedOption = rangeType.text;
        const selectOption = new Option(displayedOption, rangeTypeKey);
        selectElement.add(selectOption);
    }
    selectElement.addEventListener('change', (e) => {
        let rangeTypeKey = selectElement.value;
        range = newRange(rangeTypeKey, NumberOfChapters);
        initializeRange(range);
        // console.log(`Updated Range: ${range.items} x ${range.faces}`);
    });
    RangeTypeSelection.append(selectElement);
}
function initializeRange(range) {
    RangeValueDisplay.innerHTML = '';
    IChingDisplay.innerHTML = '';
    ThisPage.setTitle(DefaultTitle);
    RangeValueSelection.innerHTML = ''; /* clear previous selection options, if any */
    /* create Range Value Selection dropdowns and add them to `RangeValueSelection` */
    const dropdowns = [];
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
        selectElement.addEventListener('change', (e) => {
            rangeValueChangeEvent(range, dropdowns);
        });
    }
}
function rangeValueChangeEvent(range, dropdowns) {
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
        else
            displayHexagram(hexagramNumber);
    }
}
function dropDownValues(dropdowns) {
    const values = [];
    for (let dropdown of dropdowns) {
        values.push(Number(dropdown.value));
    }
    return values;
}
/**
 * Given the desired number of `rows` and `columns`, and a `tableClass` name,
 * return an HTMLTableElement.
 */
function createTable(rows, columns, firstId, tableClass) {
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
function displayHexagram(hexagramNumber) {
    // ThisPage.fadeOut(Table, 100);
    IChingDisplay.innerHTML = '';
    ThisPage.setTitle(DefaultTitle);
    const hexagramSummary = document.createElement('div');
    const hexagramCommentary = document.createElement('div');
    const hexagramImage = document.createElement('div');
    const hexagramJudgment = document.createElement('div');
    if (hexagramNumber >= 0 && hexagramNumber < 64) {
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
