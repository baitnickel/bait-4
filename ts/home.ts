import { Page, getCookies } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js'
import * as Datasets from './lib/datasets.js';
import * as MD from './lib/md.js';
import { Markup, MarkupLine } from './lib/markup.js';
import * as Widgets from './lib/widgets.js';

const ThisPage = new Page();
const IndicesPath = `${ThisPage.site}/Indices`;
const Articles = await Fetch.map<T.ArticleProperties>(`${IndicesPath}/articles.json`);
const QuotesPath = `${ThisPage.site}/Indices/quotes.json`;
const HomeTextFile = 'Content/Home.md'
const HomeTextPath = `${ThisPage.site}/${HomeTextFile}`;
const Quotes = await Fetch.map<T.Quote>(QuotesPath);
const HomeText = await Fetch.text(HomeTextPath);

export function render() {
	ThisPage.setTitle('Home');

	const Quote = ThisPage.appendContent('#Quote');
	const keys = Array.from(Quotes.keys());
	const randomKey = keys[Math.floor(Math.random() * keys.length)];
	const randomQuote = Quotes.get(randomKey)!;
	ThisPage.appendQuote(Quote, randomQuote);
	
	const ArticleText = ThisPage.appendContent('#Article');
	const markdown = new MD.Markdown(HomeText);
	ThisPage.articleID = (markdown.metadata && 'id' in markdown.metadata) ? markdown.metadata['id'] : null;

	/** adding heading above text, below quote */
	ArticleText.innerHTML = Markup('# Home\n' + markdown.text);

	/** display the file's revision date in the footer */
	let revision: number|null = null;
	if (Articles.has(HomeTextFile)) {
		const articleProperties = Articles.get(HomeTextFile)!;
		revision = articleProperties.revision;
	}

	/**### testing--display hostname/IP */
	ThisPage.appendParagraph(ArticleText, window.location.hostname);
	
	ThisPage.displayFooter(revision);

	// ThisPage.appendPhoto(Photo, 'i-SDpf2qV', 'S');
	// ThisPage.appendParagraph('');
	// ThisPage.appendVideo(Video, '9MtLIkk2ihw', 400, 220);
	
	/** Test logic via URL queries, e.g.: ?page=home&tests=dialog,cookies */
	if (ThisPage.local) {
		// type tester = () => void;
		// const validTests = new Map<string, tester>();
		// validTests.set('markdown', testMarkdown);
		// validTests.set('yaml', testYaml);
		// validTests.set('map', testMap);
		// validTests.set('dialog', testDialog);
		// validTests.set('cookies', testCookies);
		// validTests.set('radio', testRadio);
		// validTests.set('spinner', testSpinner);
		const testQueries = ThisPage.parameters.get('tests');
		if (testQueries) {
			const tests = testQueries.split(/[,\s ]/);
			for (let test of tests) {
				// const testFunction = validTests.get(test.trim().toLowerCase());
				// if (testFunction !== undefined) testFunction;

				test = test.trim().toLowerCase();
				if (test == 'markdown') testMarkdown();
				if (test == 'yaml') testYaml();
				if (test == 'map') testMap();
				if (test == 'dialog') testDialog();
				if (test == 'cookies') testCookies();
				if (test == 'radio') testRadio();
				if (test == 'spinner') testSpinner();
			}
		}

		/* Test POST API */
		const division = ThisPage.appendContent();
		const postButton = document.createElement('button');
		postButton.innerText = 'Test API Post';
		division.append(postButton);
		postButton.addEventListener('click', (e) => {
			const now = new Date();
			const milliseconds = now.getTime();
			const data = { id: milliseconds, name: `Item written ${T.DateString(now, 2)}` };
			const route = 'items';
			testPost(data, route, division);
		});
		// /* Form POST */
		// const formDivision = ThisPage.appendContent();
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
	// 	const TestCollection = ThisPage.appendContent('#TestCollection');

	// 	const testMap = (tests.includes('map'));

	// 	const testMarkdown = (tests.includes('markdown'));

	// 	const testYaml = (tests.includes('yaml'));

	// 	const testRadio = (tests.includes('radio'));

	// 	const testEmail = (tests.includes('email'));

	// 	const testIconLink = (tests.includes('iconlink'));

	// 	const testCookies = (tests.includes('cookies'));

	// 	const testDialog = (tests.includes('dialog'));

	// 	const testNode = (tests.includes('node'));
	// 	const TestNode = ThisPage.appendContent('#TestNode');

	// 	const testSpinner = (tests.includes('spinner'));
	// 	const TestSpinner = ThisPage.appendContent('.spinner'); // .spinner--full-height');
		
	// 	const Photo = ThisPage.appendContent('#Photo');
	// 	const Video = ThisPage.appendContent('#Video');
	
function testSpinner() {
	/** all done in CSS ... ultimately turn off and on in JavaScript */
	const TestSpinner = ThisPage.appendContent('.spinner'); // .spinner--full-height');
	console.log('Spinning...')
}

	// 	if (testCollection) {
	// 		const songsIndexFile = `${ThisPage.site}/Indices/fakesheets.json`;
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

	// 			ThisPage.appendParagraph(TestCollection, dataLines);
	// 		});
	// 	}

function testMap() {
	const TestMap = ThisPage.appendContent('#TestMap');
	const songsIndexFile = `${ThisPage.site}/Indices/fakesheets.json`;
	Fetch.map<T.FakesheetLookups>(songsIndexFile).then((songsMap) => {
		const dataLines: string[] = [];
		const collection = new Datasets.Collection<T.FakesheetLookups>(songsMap);
		let entry = collection.first();
		while (entry !== null) {
			const record = collection.record(entry);
			dataLines.push(`${entry}: ${record!.artist} - ${record!.title}`);
			entry = collection.next();
		}
		ThisPage.appendParagraph(TestMap, dataLines);
	});
}

function testMarkdown() {
	const TestMarkdown = ThisPage.appendContent('#TestMarkdown');
	const testMarkdownFile = 'data/test-markdown.md';
	const testMarkdownPath = `${ThisPage.site}/${testMarkdownFile}`;
	Fetch.text(testMarkdownPath).then((fileContent) => {
		if (!fileContent) {
			const errorMessage = `Cannot read file: ${testMarkdownPath}`;
			ThisPage.appendParagraph(TestMarkdown, errorMessage);
		}
		else {
			const markdownDocument = new MD.Markdown(fileContent);
			/** replace special braced placeholders in test file text */
			markdownDocument.text = markdownDocument.text.replace('{LINE_NUMBER}', `${markdownDocument.textOffset + 1}`);
			markdownDocument.text = markdownDocument.text.replace('{FILE_NAME}', `${testMarkdownFile}`);
			const html = Markup(markdownDocument.text);
			const paragraph = ThisPage.appendParagraph(TestMarkdown, '');
			paragraph.innerHTML = html;
		}
	});
}

function testYaml() {
	const TestYaml = ThisPage.appendContent('#TestYaml');
	const ReservationsPath = `${ThisPage.site}/data/camp/reservations.yaml`;
	Fetch.map<T.Reservation[]>(ReservationsPath).then((reservations) => {
		const dataLines: string[] = [];
		const reserved = reservations.get('smitty');
		if (reserved !== undefined) {
			let limit = 7;
			for (let reservation of reserved) {
				dataLines.push(reservation.occupants);
				limit -= 1;
				if (!limit) break;
			}
		}
		ThisPage.appendParagraph(TestYaml, dataLines);
	});
}

function testRadio() {
	const TestRadio = ThisPage.appendContent('#TestRadio');
	const division = ThisPage.appendContent();
	const anotherDivision = ThisPage.appendContent();
	const event = new Event('change-camper');
	const radioButtons = new Widgets.RadioButtons('radio-button', 'active', event);
	radioButtons.addButton('Purchasers');
	radioButtons.addButton('Occupants');
	radioButtons.addButton('None');
	for (let button of radioButtons.buttons) division.append(button);

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
	// const division = ThisPage.appendContent();
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
	const division = ThisPage.appendContent();
	const emailButton = document.createElement('button');
	emailButton.innerText = 'Send Feedback';
	division.append(emailButton);

	emailButton.addEventListener('click', (e) => {
		if (!ThisPage.feedback) alert('Don\'t know who to send feedback to!');
		else window.location.href = `mailto:${ThisPage.feedback}?subject=${ThisPage.url}`;
	});
}

// 	function testIconLink() {
// 		// const division = ThisPage.appendContent();
// 		const iconButton = document.createElement('button');
// 		// const icon = `${ThisPage.site}/images/icons/bluesky.png`;
// 		// iconButton.innerHTML = `<img src="${icon}" />`;
// 		iconButton.id = 'footer-bluesky';
// 		ThisPage.footer.append(iconButton);
// 		// division.append(iconButton);
// 	}

function testCookies() {
	const TestCookies = ThisPage.appendContent('#TestCookies');
	const output: string[] = [];
	output.push('Cookies:');
	for (const cookie of getCookies()) output.push(cookie)
	ThisPage.appendParagraph(TestCookies, output);
}

function testDialog() {
	const TestDialog = ThisPage.appendContent('#TestDialog');
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
	openModal.addEventListener('click', () => { modal.showModal() })
	closeModal.addEventListener('click', () => { modal.close() })
}

/**
* Post data to backend
* see:
* - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
* - https://www.javascripttutorial.net/web-apis/javascript-fetch-api/
*/
function testPost(data: any, route: string, division: HTMLElement, backend = 'http://localhost:3000') {
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
		ThisPage.appendParagraph(division, text);
		console.log(json);
	 });
}

function postForm(form: HTMLFormElement, backend = 'http://localhost:3000') {
	console.log(`posted`);
}
