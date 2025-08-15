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
    // /**### testing--display hostname/IP */
    // PAGE.appendParagraph(ArticleText, window.location.hostname);
    PAGE.displayFooter(revision);
    // PAGE.appendPhoto(Photo, 'i-SDpf2qV', 'S');
    // PAGE.appendParagraph('');
    // PAGE.appendVideo(Video, '9MtLIkk2ihw', 400, 220);
    /** Test logic via URL queries, e.g.: ?page=home&tests=dialog,cookies */
    if (PAGE.local) {
        console.log(`Site: ${PAGE.site}`);
        // gridTest();
        testModal();
        // type tester = () => void;
        // const validTests = new Map<string, tester>();
        // validTests.set('markdown', testMarkdown);
        // validTests.set('yaml', testYaml);
        // validTests.set('map', testMap);
        // validTests.set('dialog', testDialog);
        // validTests.set('cookies', testCookies);
        // validTests.set('radio', testRadio);
        // validTests.set('spinner', testSpinner);
        const testQueries = PAGE.parameters.get('tests');
        if (testQueries) {
            const tests = testQueries.split(/[,\s ]/);
            for (let test of tests) {
                // const testFunction = validTests.get(test.trim().toLowerCase());
                // if (testFunction !== undefined) testFunction;
                test = test.trim().toLowerCase();
                if (test == 'markdown')
                    testMarkdown();
                if (test == 'yaml')
                    testYaml();
                if (test == 'map')
                    testMap();
                if (test == 'dialog')
                    testDialog();
                if (test == 'cookies')
                    testCookies();
                if (test == 'radio')
                    testRadio();
                if (test == 'spinner')
                    testSpinner();
            }
        }
        if (PAGE.backendAvailable) {
            /* Test POST API */
            const buttonDivision = PAGE.appendContent();
            const fetchOutput = PAGE.appendContent();
            const postButton = document.createElement('button');
            // postButton.innerText = 'Test API Post';
            postButton.innerText = 'Test Fetch.api';
            buttonDivision.append(postButton);
            postButton.addEventListener('click', (e) => {
                // fetchOutput.innerText = '';
                // let filePath = prompt('File Path');
                // if (filePath) {
                // 	if (!filePath.match(/\..*$/)) filePath += '.md'; /** assume '.md' if no extension */
                // 	testFetch(filePath, fetchOutput);
                // }
                // const rootPath = prompt('Root Path', 'Content/chapters');
                const rootPath = 'Content/chapters';
                if (rootPath) {
                    getMarkdownFiles(rootPath, fetchOutput);
                }
                // const now = new Date();
                // const milliseconds = now.getTime();
                // const data = { id: milliseconds, name: `Item written ${T.DateString(now, 2)}` };
                // const route = 'items';
                // testPost(data, route, division);
            });
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
    }
}
// 	const testCollection = (tests.includes('collection'));
// 	const TestCollection = PAGE.appendContent('#TestCollection');
// 	const testMap = (tests.includes('map'));
// 	const testMarkdown = (tests.includes('markdown'));
// 	const testYaml = (tests.includes('yaml'));
// 	const testRadio = (tests.includes('radio'));
// 	const testEmail = (tests.includes('email'));
// 	const testIconLink = (tests.includes('iconlink'));
// 	const testCookies = (tests.includes('cookies'));
// 	const testDialog = (tests.includes('dialog'));
// 	const testNode = (tests.includes('node'));
// 	const TestNode = PAGE.appendContent('#TestNode');
// 	const testSpinner = (tests.includes('spinner'));
// 	const TestSpinner = PAGE.appendContent('.spinner'); // .spinner--full-height');
// 	const Photo = PAGE.appendContent('#Photo');
// 	const Video = PAGE.appendContent('#Video');
function testSpinner() {
    /** all done in CSS ... ultimately turn off and on in JavaScript */
    const TestSpinner = PAGE.appendContent('.spinner'); // .spinner--full-height');
    console.log('Spinning...');
}
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
function testRadio() {
    const TestRadio = PAGE.appendContent('#TestRadio');
    const division = PAGE.appendContent();
    const anotherDivision = PAGE.appendContent();
    const event = new Event('change-camper');
    const radioButtons = new W.RadioButtons('radio-button', 'active', event);
    radioButtons.addButton('Purchasers');
    radioButtons.addButton('Occupants');
    radioButtons.addButton('None');
    for (let button of radioButtons.buttons)
        division.append(button);
    document.addEventListener('change-camper', () => {
        anotherDivision.innerText = radioButtons.activeButton;
    });
}
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
// 	function testIconLink() {
// 		// const division = PAGE.appendContent();
// 		const iconButton = document.createElement('button');
// 		// const icon = `${PAGE.site}/images/icons/bluesky.png`;
// 		// iconButton.innerHTML = `<img src="${icon}" />`;
// 		iconButton.id = 'footer-bluesky';
// 		PAGE.footer.append(iconButton);
// 		// division.append(iconButton);
// 	}
function testCookies() {
    const TestCookies = PAGE.appendContent('#TestCookies');
    const output = [];
    output.push('Cookies:');
    for (const cookie of getCookies())
        output.push(cookie);
    PAGE.appendParagraph(TestCookies, output);
}
function testDialog() {
    const TestDialog = PAGE.appendContent('#TestDialog');
    /** add the button used to display the Modal dialog box */
    const openModal = document.createElement('button');
    openModal.innerText = 'Display Modal';
    TestDialog.append(openModal);
    /** dialog element */
    const modal = document.createElement('dialog');
    TestDialog.append(modal);
    /** div element for dialog text */
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = '<p>This is the Modal Dialog</p>';
    modal.append(modalDiv);
    /** button to close dialog */
    const closeModal = document.createElement('button');
    closeModal.innerText = 'Close';
    modal.append(closeModal);
    /** event handlers */
    openModal.addEventListener('click', () => { modal.showModal(); });
    closeModal.addEventListener('click', () => { modal.close(); });
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
// type apiResponse = { status: number, statusText: string, responseData: any };
async function getMarkdownFiles(rootPath, fetchOutput) {
    fetchOutput.innerHTML = '';
    const outputLines = [];
    // const response = await Fetch.api(`${PAGE.backend}/markdown`, {root: rootPath});
    // console.log(response);
    // outputLines.push(`Status ${response.status} ${response.statusText}`);
    // outputLines.push(`OK: ${response.ok}`);
    // outputLines.push(`response.body: ${response.body}`);
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
        PAGE.appendParagraph(fetchOutput, outputLines);
    });
}
function postForm(form, backend = 'http://localhost:3000') {
    console.log(`posted`);
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
    PAGE.content.append(container);
}
function testModal() {
    const modal = createModalDialog();
    const modalButton = document.createElement('button');
    modalButton.innerText = 'Test Modal';
    PAGE.content.append(modalButton);
    modalButton.addEventListener('click', (e) => { modal.open(); });
}
function createModalDialog(rootPath = '', tags = '', tagPrefix = '') {
    const cancelEvent = 'bait:cancel';
    const confirmEvent = 'bait:confirm';
    /** @todo
     * - Select, Text, etc. should take optional last argument: Dialog object to be added to.
     * - Buttons are properties of Dialog and should default to Cancel/Confirm
     *   unless overridden by Dialog method.
     * - It should not be necessary to define button events--they are Dialog
     *   properties/methods.
     */
    const rootDropDown = new W.Select2('Root Path', ['First', 'Second', 'Third*', 'Fourth*']);
    const tagPrefixText = new W.Text2('Optional Tag Prefix', tagPrefix);
    const tagsText = new W.Text2('Space-Separated Tags', tags);
    const cancelButton = new W.Button2('Cancel', cancelEvent);
    const confirmButton = new W.Button2('Confirm', confirmEvent);
    const modal = new W.Dialog2('Query Options');
    modal.element.className = 'threads-dialog';
    modal.addWidget(rootDropDown);
    modal.addWidget(tagPrefixText);
    modal.addWidget(tagsText);
    modal.addWidgets([cancelButton, confirmButton]);
    modal.finish(document.body);
    document.addEventListener(cancelEvent, () => {
        modal.close();
        console.log(`Canceling`);
    });
    document.addEventListener(confirmEvent, () => {
        modal.close();
        console.log(`Confirming`);
    });
    return modal;
}
