import { Page, getCookies } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import * as Datasets from './lib/datasets.js';
import * as MD from './lib/md.js';
import { Markup } from './lib/markup.js';
import * as W from './lib/widgets.js';
const PAGE = new Page();
const IndicesPath = `${PAGE.site}/Indices`;
const Articles = await Fetch.map(`${IndicesPath}/articles.json`);
const QuotesPath = `${PAGE.site}/Indices/quotes.json`;
const HomeTextFile = 'Content/Home.md';
const HomeTextPath = `${PAGE.site}/${HomeTextFile}`;
const Quotes = await Fetch.map(QuotesPath);
const HomeText = await Fetch.text(HomeTextPath);
const TestButtons = document.createElement('div');
const TestOutput = document.createElement('div');
export function render() {
    PAGE.setTitle('Home');
    const Quote = PAGE.appendContent('#Quote');
    const keys = Array.from(Quotes.keys());
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const randomQuote = Quotes.get(randomKey);
    PAGE.appendQuote(Quote, randomQuote);
    Quote.addEventListener('click', () => {
        if (window.confirm('Copy quote to clipboard?')) {
            let quote = `"${randomQuote.text}" ~ ${randomQuote.attribution}`;
            if (randomQuote.note)
                quote += ` (${randomQuote.note})`;
            navigator.clipboard.writeText(quote);
        }
    });
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
    // PAGE.appendParagraph(ArticleText, window.location.hostname); /* display hostname/IP */
    PAGE.displayFooter(revision);
    /**
     * Test functions
     *
     * Tester functions must have no parameters must return void, and they
     * should typically initialize the test output before writing new output,
     * e.g.:
     *
     * - TestOutput.innerHTML = '';
     */
    if (PAGE.local) {
        PAGE.content.append(TestButtons);
        TestButtons.className = 'grid-buttons';
        PAGE.content.append(TestOutput);
        TestOutput.style['margin'] = '1em';
        const testers = [];
        testers.push({ name: 'Test Dialog', function: testDialog });
        // testers.push( {name: 'Test Modal', function: testModal } );
        testers.push({ name: 'Test Grid', function: gridTest });
        // testers.push( {name: 'Test Spinner', function: testSpinner } );
        // testers.push( {name: 'Test Images', function: testImages } );
        if (PAGE.backendAvailable) {
            testers.push({ name: 'Test Fetch.api', function: getMarkdownFiles });
        }
        for (const tester of testers) {
            const button = document.createElement('button');
            button.innerText = tester.name;
            button.addEventListener('click', () => { tester.function(); });
            TestButtons.append(button);
        }
    }
}
function testDialog() {
    TestOutput.innerHTML = '';
    const dialog = new W.Dialog('Big Test');
    const box1 = dialog.addCheckbox('This Works:', false);
    const box2 = dialog.addCheckbox('This Does Not Work:', true);
    const box3 = dialog.addCheckbox('This Might Work:', false);
    const text1 = dialog.addText('Add some random text:', '');
    const select1 = dialog.addSelect('Pick One:', ['First', 'Second', 'Third', 'Fourth']);
    const outputTexts = ['Manually', 'Every Second', 'Every %% Seconds'];
    const range = dialog.addRange('Change Slides:', 0, 0, 60, 1, outputTexts);
    document.body.append(dialog.element);
    dialog.element.showModal();
    dialog.cancelButton.addEventListener('click', () => {
        PAGE.appendParagraph(TestOutput, 'Cancelled');
    });
    dialog.confirmButton.addEventListener('click', () => {
        PAGE.appendParagraph(TestOutput, [
            'Confirmed',
            `box1 checked? ${box1.checked}`,
            `random text: ${text1.value}`,
            `selection: |${select1.value}|`,
            `range: ${range.value}`,
        ]);
    });
}
// function testModal() {
// 	let rootPath = '';
// 	let tags = '';
// 	let tagPrefix = '';
// 	const cancelEvent = 'bait:cancel';
// 	const confirmEvent = 'bait:confirm';
// 	const modal = new W2.Dialog('Test Dialog')
// 	modal.element.className = 'threads-dialog';
// 	const rootDropDown = new W2.Select('Root Path', ['First','Second','Third*','Fourth*'], modal);
// 	const tagPrefixText = new W2.Text('Optional Tag Prefix', tagPrefix, modal);
// 	const tagsText = new W2.Text('Space-Separated Tags', tags, modal);
// 	/**
// 	 * modal.addButtons(['Cancel', 'Confirm']) (or add in constructor)
// 	 * (creates buttons array in modal object, assigning Event names)
// 	 * (modal.event('Cancel') retrieves Event name for addEventListener)
// 	 */
// 	const cancelButton = new W2.Button('Cancel', cancelEvent, modal);
// 	const confirmButton = new W2.Button('Confirm', confirmEvent, modal);
// 	modal.finish(document.body);
// 	modal.open();
// 	cancelButton.element.addEventListener('click', () => {
// 		modal.close();
// 		console.log(`Canceling`);
// 	});
// 	confirmButton.element.addEventListener('click', () => {
// 		modal.close();
// 		console.log(`Confirming`);
// 	});
// }
function testImages() {
    TestOutput.innerHTML = '';
    PAGE.appendPhoto(TestOutput, 'i-SDpf2qV', 'S');
    PAGE.appendParagraph(TestOutput, '');
    PAGE.appendVideo(TestOutput, 'INlBnm_1-sg?si=nJRxtTyUgduZWElR', 400, 220);
}
function testSpinner() {
    /** all done in CSS ... ultimately turn off and on in JavaScript */
    const TestSpinner = PAGE.appendContent('.spinner'); // .spinner--full-height');
    console.log('Spinning...');
}
function testMap() {
    const TestMap = PAGE.appendContent('#TestMap');
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
function testMarkdown() {
    const TestMarkdown = PAGE.appendContent('#TestMarkdown');
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
function testYaml() {
    const TestYaml = PAGE.appendContent('#TestYaml');
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
function testEmail() {
    const division = PAGE.appendContent();
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
function testCookies() {
    const TestCookies = PAGE.appendContent('#TestCookies');
    const output = [];
    output.push('Cookies:');
    for (const cookie of getCookies())
        output.push(cookie);
    PAGE.appendParagraph(TestCookies, output);
}
/**
* Post data to backend
* see:
* - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
* - https://www.javascripttutorial.net/web-apis/javascript-fetch-api/
*/
function testPost(data, route, division, backend = 'http://localhost:3000') {
    fetch(`${backend}/${route}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json; charset=UTF-8" },
    })
        /**
         * If the response contains JSON data, you can use the json() method of the
         * Response object to parse it. The json() method returns a Promise. (Other
         * Response methods: arrayBuffer(), blob(), bytes(), clone(), formData(),
         * text())
         */
        .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
        /**
         * The json() Promise resolves with the full "any" contents of the fetched
         * resource, allowing access to the JSON data.
         */
        .then((json) => {
        const text = ` ID: ${json.id} ${json.name}`;
        PAGE.appendParagraph(division, text);
        console.log(json);
    });
}
function testFetch(filePath, fetchOutput) {
    filePath = `${PAGE.backend}/${filePath}`;
    Fetch.text(filePath).then((fileText) => {
        if (filePath.endsWith('.md')) {
            const markdown = new MD.Markdown(fileText);
            const markedUpText = Markup(markdown.text);
            fetchOutput.innerHTML = markedUpText;
        }
        else {
            const fileLines = fileText.split('\n');
            PAGE.appendParagraph(fetchOutput, fileLines);
        }
    });
}
async function getMarkdownFiles() {
    const rootPath = 'Content/chapters';
    TestOutput.innerHTML = '';
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
        PAGE.appendParagraph(TestOutput, outputLines);
    });
}
function gridTest() {
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
    TestOutput.innerHTML = '';
    TestOutput.append(container);
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
