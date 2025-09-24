import { Page, getCookies } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as Datasets from './lib/datasets.js';
import * as MD from './lib/md.js';
import { Markup, MarkupLine } from './lib/markup.js';
import * as W from './lib/widgets.js';
import { Moment } from './lib/moments.js';
import { Park } from './lib/parks.js';
const PAGE = new Page();
const IndicesPath = `${PAGE.site}/Indices`;
const Articles = await Fetch.map(`${IndicesPath}/articles.json`);
const QuotesPath = `${PAGE.site}/Indices/quotes.json`;
const HomeTextFile = 'Content/Home.md';
const HomeTextPath = `${PAGE.site}/${HomeTextFile}`;
const Quotes = await Fetch.map(QuotesPath);
const HomeText = await Fetch.text(HomeTextPath);
export function render() {
    PAGE.setTitle('Home');
    /** get a random quote */
    const keys = Array.from(Quotes.keys());
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const randomQuote = Quotes.get(randomKey);
    const quoteElement = document.createElement('div');
    quoteElement.className = 'quote';
    const textParagraph = document.createElement('p');
    textParagraph.className = 'text';
    textParagraph.innerHTML = MarkupLine(`"${randomQuote.text}"`, 'etm');
    const attributionNote = (randomQuote.note) ? `${randomQuote.attribution} (${randomQuote.note})` : randomQuote.attribution;
    const attributionParagraph = document.createElement('p');
    attributionParagraph.className = 'attribution';
    attributionParagraph.innerHTML = '~ ' + MarkupLine(attributionNote, 'etm');
    quoteElement.append(textParagraph);
    quoteElement.append(attributionParagraph);
    quoteElement.addEventListener('click', () => {
        console.log('quoteElement clicked');
        if (window.confirm('Copy quote to clipboard?')) {
            let quote = `"${randomQuote.text}" ~ ${randomQuote.attribution}`;
            if (randomQuote.note)
                quote += ` (${randomQuote.note})`;
            navigator.clipboard.writeText(quote);
        }
    });
    PAGE.content.append(quoteElement);
    const ArticleText = PAGE.appendContent('#Article');
    const markdown = new MD.Markdown(HomeText);
    PAGE.articleID = (markdown.metadata && 'id' in markdown.metadata) ? markdown.metadata['id'] : null;
    /** adding heading above text, below quote */
    ArticleText.innerHTML = Markup('# Home\n' + markdown.text);
    /** display the file's revision date in the footer */
    let revision = null;
    if (Articles.has(HomeTextFile)) {
        const articleProperties = Articles.get(HomeTextFile);
        revision = articleProperties.revision;
    }
    PAGE.displayFooter(revision);
    /**
     * Test functions are enabled when running locally. Tester functions must
     * have one parameter, an HTMLDivElement (as defined in type `TestFunction`)
     * and must return void.
     */
    if (PAGE.local) {
        const testContent = document.createElement('div');
        testContent.id = 'test-content';
        PAGE.content.after(testContent);
        const testButtons = document.createElement('div');
        testButtons.className = 'grid-buttons';
        testContent.append(testButtons);
        const testOutput = document.createElement('div');
        testContent.append(testOutput);
        const testers = [];
        testers.push({ name: 'Table', function: testTable });
        testers.push({ name: 'Park', function: testPark });
        testers.push({ name: 'Moments', function: testMoments });
        testers.push({ name: 'IP', function: testIP });
        testers.push({ name: 'Dialog', function: testDialog });
        testers.push({ name: 'Radio', function: testRadio });
        testers.push({ name: 'Grid', function: gridTest });
        testers.push({ name: 'Spinner', function: testSpinner });
        testers.push({ name: 'Images', function: testImages });
        testers.push({ name: 'Map', function: testMap });
        testers.push({ name: 'Markdown', function: testMarkdown });
        testers.push({ name: 'YAML', function: testYaml });
        testers.push({ name: 'Email', function: testEmail });
        testers.push({ name: 'Cookies', function: testCookies });
        if (PAGE.backendAvailable) {
            testers.push({ name: 'Fetch.api', function: testFetchAPI });
        }
        const recycle = document.createElement('button');
        recycle.innerHTML = '↻';
        recycle.style['backgroundColor'] = '#0000';
        recycle.style['border'] = '0';
        recycle.addEventListener('click', () => { testOutput.innerHTML = ''; });
        testButtons.append(recycle);
        for (const tester of testers) {
            const button = document.createElement('button');
            button.innerText = tester.name;
            button.addEventListener('click', () => {
                PAGE.content.remove();
                testOutput.innerHTML = '';
                tester.function(testOutput);
            });
            testButtons.append(button);
        }
    }
}
function testTable(testOutput) {
    const table = new W.Table(['Col 1', 'Col 2', 'Col 3', 'Col 4'], 0);
    table.addCell('first', '');
    table.addCell('second', '');
    table.addCell('third', 'alert');
    table.addCell('fourth', '');
    table.addRow('');
    table.addCell('one', '');
    const cell = table.addCell('two', '');
    cell.style.color = 'blue';
    cell.colSpan = 2;
    table.addCell('three', '');
    table.addRow('campsite-good');
    table.addCell('uno', '');
    table.addCell('dos', '');
    table.addCell('tres', '');
    table.addCell('quatro', '');
    table.addRow('');
    testOutput.append(table.createTable(''));
}
function testPark(testOutput) {
    const output = [];
    const park = new Park('smitty');
    const years = park.reservationYears('ascending');
    for (const year of years) {
        const finalized = park.isFinalized(year);
        output.push(`${year} is finalized? ${finalized}`);
        const costs = park.costs(year);
        output.push(`year: ${costs.year} site: ${costs.site} cabin: ${costs.cabin} reservation: ${costs.reservation} cancellation: ${costs.cancellation} modification: ${costs.modification}`);
        output.push('Adjustments:');
        const adjustments = park.adjustments(year);
        for (const adjustment of adjustments) {
            output.push(`year: ${adjustment.year} host: ${adjustment.host} amount: ${adjustment.amount} description: ${adjustment.description}`);
        }
        output.push('Reservations:');
        const reservations = park.reservations(year);
        for (const reservation of reservations) {
            const arrivalDay = T.DateString(reservation.arrival, 9);
            output.push(`${reservation.year} ${reservation.site} ${arrivalDay} ${reservation.reserved} ${reservation.cancelled} ${reservation.modified} purchaser: ${reservation.purchaser} ${reservation.purchaserAccount} occupant: ${reservation.occupant} ${reservation.occupantNames}`);
        }
        output.push(`___`);
    }
    output.push('Hosts:');
    const hosts = park.hosts;
    const hostKeys = Array.from(hosts.keys());
    for (const hostKey of hostKeys) {
        const host = hosts.get(hostKey);
        output.push(`key: ${hostKey} name: ${host.name} color: ${host.color} payments: ${host.payments} debts: ${host.debts} `);
    }
    PAGE.appendParagraph(testOutput, output);
}
function testMoments(testOutput) {
    const tests = ['1960', '1961.1.1', '1962/2/29', '3-1963', '21.6.1964', '1965/07/35', '1966/08/0', '1967/0', '1968:11:8', '149'];
    const output = [];
    const moment = new Moment(new Date());
    output.push(`(${moment.precision}) Now: ${moment.formatted()}`);
    for (const test of tests) {
        const moment = new Moment(test);
        if (moment !== null)
            output.push(`(${moment.precision}) ${test}: ${moment.formatted()}`);
    }
    PAGE.appendParagraph(testOutput, output);
}
function testIP(testOutput) {
    const IPList = [];
    IPList.push(`Host: ${PAGE.site}`);
    IPList.push(`Backend: ${PAGE.backend}`);
    PAGE.appendParagraph(testOutput, IPList);
}
function testDialog(testOutput) {
    const dialog = new W.Dialog('Big Test');
    const box1 = dialog.addCheckbox('This Works:', false);
    const box2 = dialog.addCheckbox('This Does Not Work:', true);
    const box3 = dialog.addCheckbox('This Might Work:', false);
    const text1 = dialog.addText('Add some random text:', '');
    const radio = dialog.addRadioGroup('Radio Buttons', ['A Tale of Two Cities', 'To Kill a Mockingbird', 'Much Ado About Nothing']);
    const select1 = dialog.addSelect('Pick One:', ['First', 'Second', 'Third', 'Fourth']);
    const outputTexts = ['Manually', 'Every Second', 'Every %% Seconds'];
    const range = dialog.addRange('Change Slides:', 0, 0, 60, 1, outputTexts);
    document.body.append(dialog.element);
    dialog.element.showModal();
    dialog.cancelButton.addEventListener('click', () => {
        PAGE.appendParagraph(testOutput, 'Cancelled');
    });
    dialog.confirmButton.addEventListener('click', () => {
        PAGE.appendParagraph(testOutput, [
            'Confirmed',
            `box1 checked? ${box1.checked}`,
            `random text: "${text1.value}"`,
            `radio: "${radio.value}"`,
            `selection: "${select1.value}"`,
            `range: ${range.value}`
        ]);
    });
}
function testRadio(testOutput) {
    const paragraph = document.createElement('p');
    const radioGroup = new W.RadioGroup('Radio Group', ['A Tale of Two Cities', 'To Kill a Mockingbird', 'Much Ado About Nothing'], 'widget-radio-group');
    radioGroup.fieldset.className = 'widget-radio-fieldset';
    paragraph.append(radioGroup.fieldset);
    testOutput.append(paragraph);
    const selection = document.createElement('p');
    const value = radioGroup.value;
    selection.innerText = `Selected: ${value}`;
    testOutput.append(selection);
    for (const inputElement of radioGroup.inputElements) {
        inputElement.addEventListener('click', () => {
            const value = radioGroup.value;
            selection.innerText = `Selected: ${value}`;
        });
    }
}
function testImages(testOutput) {
    PAGE.appendPhoto(testOutput, 'i-SDpf2qV', 'S');
    PAGE.appendParagraph(testOutput, '');
    PAGE.appendVideo(testOutput, 'INlBnm_1-sg?si=nJRxtTyUgduZWElR', 400, 220);
}
function testSpinner(testOutput) {
    /** all done in CSS ... ultimately turn off and on in JavaScript */
    const TestSpinner = PAGE.appendContent('.spinner'); // .spinner--full-height');
    console.log('Spinning...');
    const stop = document.createElement('button');
    stop.innerHTML = '🛑 STOP';
    stop.style['backgroundColor'] = '#0000';
    stop.style['border'] = '0';
    stop.addEventListener('click', () => { TestSpinner.remove(); });
    testOutput.append(stop);
}
function testMap(testOutput) {
    const TestMap = PAGE.appendContent('#TestMap', testOutput);
    const songsIndexFile = `${PAGE.site}/Indices/fakesheets.json`;
    Fetch.map(songsIndexFile).then((songsMap) => {
        const dataLines = [];
        const collection = new Datasets.Collection(songsMap);
        let entry = collection.first();
        while (entry !== null) {
            const record = collection.record(entry);
            dataLines.push(`${entry}: ${record.artist} - ${record.title}`);
            entry = collection.next();
        }
        PAGE.appendParagraph(TestMap, dataLines);
    });
}
function testMarkdown(testOutput) {
    const TestMarkdown = PAGE.appendContent('#TestMarkdown', testOutput);
    const testMarkdownFile = 'data/test-markdown.md';
    const testMarkdownPath = `${PAGE.site}/${testMarkdownFile}`;
    Fetch.text(testMarkdownPath).then((fileContent) => {
        if (!fileContent) {
            const errorMessage = `Cannot read file: ${testMarkdownPath}`;
            PAGE.appendParagraph(TestMarkdown, errorMessage);
        }
        else {
            const markdownDocument = new MD.Markdown(fileContent);
            /** replace special braced placeholders in test file text */
            markdownDocument.text = markdownDocument.text.replace('{LINE_NUMBER}', `${markdownDocument.textOffset + 1}`);
            markdownDocument.text = markdownDocument.text.replace('{FILE_NAME}', `${testMarkdownFile}`);
            const html = Markup(markdownDocument.text);
            const paragraph = PAGE.appendParagraph(TestMarkdown, '');
            paragraph.innerHTML = html;
        }
    });
}
function testYaml(testOutput) {
    const TestYaml = PAGE.appendContent('#TestYaml', testOutput);
    const ReservationsPath = `${PAGE.site}/data/camp/reservations.yaml`;
    Fetch.map(ReservationsPath).then((reservations) => {
        const dataLines = [];
        const reserved = reservations.get('smitty');
        if (reserved !== undefined) {
            let limit = 7;
            for (let reservation of reserved) {
                dataLines.push(reservation.occupants);
                limit -= 1;
                if (!limit)
                    break;
            }
        }
        PAGE.appendParagraph(TestYaml, dataLines);
    });
}
function testEmail(testOutput) {
    const division = PAGE.appendContent('', testOutput);
    const emailButton = document.createElement('button');
    emailButton.innerText = 'Send Feedback';
    division.append(emailButton);
    emailButton.addEventListener('click', (e) => {
        if (!PAGE.feedback)
            alert('Don\'t know who to send feedback to!');
        else
            window.location.href = `mailto:${PAGE.feedback}?subject=${PAGE.url}`;
    });
}
function testCookies(testOutput) {
    const TestCookies = PAGE.appendContent('#TestCookies', testOutput);
    const output = [];
    output.push('Cookies:');
    for (const cookie of getCookies())
        output.push(cookie);
    PAGE.appendParagraph(TestCookies, output);
}
async function testFetchAPI(testOutput) {
    const rootPath = 'Content/chapters';
    const outputLines = [];
    Fetch.api(`${PAGE.backend}/markdown`, { root: rootPath }).then((markdownFiles) => {
        if (markdownFiles) {
            for (const markdownFile of markdownFiles) {
                if (markdownFile.file) {
                    outputLines.push(markdownFile.file.path);
                }
            }
        }
        if (!outputLines.length)
            outputLines.push(`no files found in ${rootPath}`);
        PAGE.appendParagraph(testOutput, outputLines);
    });
}
function gridTest(testOutput) {
    const container = document.createElement('div');
    container.className = 'grid-container';
    for (let i = 1; i <= 8; i += 1) {
        const item = document.createElement('div');
        item.className = 'grid-cell';
        let value = `Item Number ${i}`;
        if (i % 2 == 0)
            value += '<br>as Specified in the code';
        item.innerHTML = value;
        container.append(item);
    }
    testOutput.append(container);
}
// /* Form POST */
// const formDivision = PAGE.appendContent();
// const form = document.createElement('form');
// form.action = '/items';
// form.method = 'POST';
// const textInput = document.createElement('input');
// textInput.type = 'text';
// textInput.id = 'text';
// textInput.name = 'text';
// textInput.value = '';
// const textLabel = document.createElement('label');
// textLabel.htmlFor = textInput.id;
// textLabel.innerText = 'Item Description: ';
// textLabel.append(textInput);
// const submit = document.createElement('input');
// submit.type = 'submit';
// submit.value = 'Submit';
// form.append(textLabel);
// form.append(submit);
// formDivision.append(form);
// form.addEventListener('submit', (e) => {
// 	e.preventDefault();
// 	postForm(form);
// })
// function testRadio() {
// 	const TestRadio = PAGE.appendContent('#TestRadio');
// 	const division = PAGE.appendContent();
// 	const anotherDivision = PAGE.appendContent();
// 	const event = new Event('change-camper');
// 	const radioButtons = new W.RadioButtons('radio-button', 'active', event);
// 	radioButtons.addButton('Purchasers');
// 	radioButtons.addButton('Occupants');
// 	radioButtons.addButton('None');
// 	for (let button of radioButtons.buttons) division.append(button);
// 	document.addEventListener('change-camper', () => {
// 		anotherDivision.innerText = radioButtons.activeButton;
// 	});
// }
/*
// https://www.youtube.com/watch?v=DzZXRvk3EGg
const myEvent = new Event('myCustomEvent');
document.addEventListener('myCustomEvent', e => {
    console.log(e);
});
document.dispatchEvent(myEvent);

// with CustomEvents, you can pass data from one place to another
const myCustomEvent = new CustomEvent('myCustomEvent', { detail: { hello: 'World' }});
document.addEventListener('myCustomEvent', e => {
    console.log(e.detail);
});
document.dispatchEvent(myEvent);
*/
// /* https://www.techiedelight.com/create-radio-button-dynamically-javascript/ */
// const division = PAGE.appendContent();
// const purchaserType = document.createElement('input');
// purchaserType.type = 'radio';
// purchaserType.id = 'purchaser';
// purchaserType.name = 'camperTypes'
// const purchaserLabel = document.createElement('label');
// purchaserLabel.htmlFor = 'purchaser';
// purchaserLabel.innerText = 'Purchasers ';
// division.append(purchaserType);
// division.append(purchaserLabel);
// const occupantsType = document.createElement('input');
// occupantsType.type = 'radio';
// occupantsType.id = 'occupants';
// occupantsType.name = 'camperTypes'
// const occupantsLabel = document.createElement('label');
// occupantsLabel.htmlFor = 'occupants';
// occupantsLabel.innerText = 'Occupants';
// division.append(occupantsType);
// division.append(occupantsLabel);
// 	if (testCollection) {
// 		const songsIndexFile = `${PAGE.site}/Indices/fakesheets.json`;
// 		Fetch.map<T.FakesheetLookups>(songsIndexFile).then((songsMap) => {
// 			const songs = new Datasets.Collection<T.FakesheetLookups>(songsMap);
// 			const dataLines: string[] = [];
// 			songs.sort('dt:artist');
// 			// songs.shuffle();
// 			const randomKey = Datasets.RandomKey(songs.keys);
// 			if (randomKey) {
// 				let randomSong = songs.record(randomKey)!;
// 				dataLines.push(`Random Song: ==${randomSong.title}==`);
// 				dataLines.push('');
// 			}
// 			let id = 0;
// 			let key = songs.first(); //songs.last();
// 			while (key) {
// 				id += 1;
// 				const song = songs.record(key)!;
// 				dataLines.push(`${id}: [${songs.preceding}] ${song.artist} - ${song.title} [${songs.succeeding}]`);
// 				key = songs.next(); //songs.previous();
// 			}
// 			dataLines.push('___');
// 			id = 0;
// 			for (const key of songs.keys) {
// 				const song = songs.record(key)!;
// 				if (song.artist == 'Dan' || song.artist.startsWith('Elle')) {
// 					id += 1;
// 					dataLines.push(`${id}: ${song.artist} - ${song.title}`);
// 				}
// 			}
// 			PAGE.appendParagraph(TestCollection, dataLines);
// 		});
// 	}
