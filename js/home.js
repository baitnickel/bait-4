import { Page, getCookies } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import * as Datasets from './lib/datasets.js';
import * as MD from './lib/md.js';
import { Markup } from './lib/markup.js';
import * as Widgets from './lib/widgets.js';
const ThisPage = new Page();
const IndicesPath = `${ThisPage.site}/Indices`;
const Articles = await Fetch.map(`${IndicesPath}/articles.json`);
const QuotesPath = `${ThisPage.site}/Indices/quotes.json`;
const HomeTextFile = 'Content/Home.md';
const HomeTextPath = `${ThisPage.site}/${HomeTextFile}`;
const Quotes = await Fetch.map(QuotesPath);
const HomeText = await Fetch.text(HomeTextPath);
export function render() {
    ThisPage.setTitle('Home');
    const Quote = ThisPage.appendContent('#Quote');
    const ArticleText = ThisPage.appendContent('#Article');
    const TestCollection = ThisPage.appendContent('#TestCollection');
    const TestMap = ThisPage.appendContent('#TestMap');
    const TestMarkdown = ThisPage.appendContent('#TestMarkdown');
    const TestYaml = ThisPage.appendContent('#TestYaml');
    const TestRadio = ThisPage.appendContent('#TestRadio');
    const TestCookies = ThisPage.appendContent('#TestCookies');
    const TestDialog = ThisPage.appendContent('#TestDialog');
    const TestNode = ThisPage.appendContent('#TestNode');
    const Photo = ThisPage.appendContent('#Photo');
    const Video = ThisPage.appendContent('#Video');
    const keys = Array.from(Quotes.keys());
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const randomQuote = Quotes.get(randomKey);
    ThisPage.appendQuote(Quote, randomQuote);
    const markdown = new MD.Markdown(HomeText);
    /** adding heading above text, below quote */
    ArticleText.innerHTML = Markup('# Home\n' + markdown.text);
    /** display the file's revision date in the footer */
    let revision = null;
    if (Articles.has(HomeTextFile)) {
        const articleProperties = Articles.get(HomeTextFile);
        revision = articleProperties.revision;
    }
    ThisPage.displayFooter(revision);
    // ThisPage.appendPhoto(Photo, 'i-SDpf2qV', 'S');
    // ThisPage.appendParagraph('');
    // ThisPage.appendVideo(Video, '9MtLIkk2ihw', 400, 220);
    if (ThisPage.local) {
        const tests = [];
        const testQueries = ThisPage.parameters.get('tests');
        if (testQueries) {
            const tmpTests = testQueries.split(/[,\s ]/);
            for (let test of tmpTests) {
                tests.push(test.trim().toLowerCase());
            }
        }
        /** ?page=home&tests=dialog,cookies */
        const testCollection = (tests.includes('collection'));
        const testMap = (tests.includes('map'));
        const testMarkdown = (tests.includes('markdown'));
        const testYaml = (tests.includes('yaml'));
        const testRadio = (tests.includes('radio'));
        const testEmail = (tests.includes('email'));
        const testIconLink = (tests.includes('iconlink'));
        const testCookies = (tests.includes('cookies'));
        const testDialog = (tests.includes('dialog'));
        const testNode = (tests.includes('node'));
        if (testCollection) {
            const songsIndexFile = `${ThisPage.site}/Indices/fakesheets.json`;
            Fetch.map(songsIndexFile).then((songsMap) => {
                const songs = new Datasets.Collection(songsMap);
                const dataLines = [];
                songs.sort('dt:artist');
                // songs.shuffle();
                const randomKey = Datasets.RandomKey(songs.keys);
                if (randomKey) {
                    let randomSong = songs.record(randomKey);
                    dataLines.push(`Random Song: ==${randomSong.title}==`);
                    dataLines.push('');
                }
                let id = 0;
                let key = songs.first(); //songs.last();
                while (key) {
                    id += 1;
                    const song = songs.record(key);
                    dataLines.push(`${id}: [${songs.preceding}] ${song.artist} - ${song.title} [${songs.succeeding}]`);
                    key = songs.next(); //songs.previous();
                }
                dataLines.push('___');
                id = 0;
                for (const key of songs.keys) {
                    const song = songs.record(key);
                    if (song.artist == 'Dan' || song.artist.startsWith('Elle')) {
                        id += 1;
                        dataLines.push(`${id}: ${song.artist} - ${song.title}`);
                    }
                }
                ThisPage.appendParagraph(TestCollection, dataLines);
            });
        }
        if (testMap) {
            const songsIndexFile = `${ThisPage.site}/Indices/fakesheets.json`;
            Fetch.map(songsIndexFile).then((songsMap) => {
                const dataLines = [];
                const collection = new Datasets.Collection(songsMap);
                let entry = collection.first();
                while (entry !== null) {
                    const record = collection.record(entry);
                    dataLines.push(`${entry}: ${record.artist} - ${record.title}`);
                    entry = collection.next();
                }
                ThisPage.appendParagraph(TestMap, dataLines);
            });
        }
        if (testMarkdown) {
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
        if (testYaml) {
            const ReservationsPath = `${ThisPage.site}/data/camp/reservations.yaml`;
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
                ThisPage.appendParagraph(TestYaml, dataLines);
            });
        }
        if (testRadio) {
            const division = ThisPage.appendContent();
            const anotherDivision = ThisPage.appendContent();
            const event = new Event('change-camper');
            const radioButtons = new Widgets.RadioButtons('radio-button', 'active', event);
            radioButtons.addButton('Purchasers');
            radioButtons.addButton('Occupants');
            radioButtons.addButton('None');
            for (let button of radioButtons.buttons)
                division.append(button);
            document.addEventListener('change-camper', () => {
                anotherDivision.innerText = radioButtons.activeButton;
            });
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
        }
        if (testEmail) {
            const division = ThisPage.appendContent();
            const emailButton = document.createElement('button');
            emailButton.innerText = 'Send Feedback';
            division.append(emailButton);
            emailButton.addEventListener('click', (e) => {
                if (!ThisPage.feedback)
                    alert('Don\'t know who to send feedback to!');
                else
                    window.location.href = `mailto:${ThisPage.feedback}?subject=${ThisPage.url}`;
            });
        }
        if (testIconLink) {
            // const division = ThisPage.appendContent();
            const iconButton = document.createElement('button');
            // const icon = `${ThisPage.site}/images/icons/bluesky.png`;
            // iconButton.innerHTML = `<img src="${icon}" />`;
            iconButton.id = 'footer-bluesky';
            ThisPage.footer.append(iconButton);
            // division.append(iconButton);
        }
        if (testCookies) {
            const output = [];
            output.push('Cookies:');
            for (const cookie of getCookies())
                output.push(cookie);
            ThisPage.appendParagraph(TestCookies, output);
        }
        if (testDialog) {
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
        if (testNode) {
            Fetch.json('http://localhost:3000/media/images').then((data) => {
                console.log('Data:');
                console.log(data);
            });
        }
    }
}
// function markedUpText(markdownText: string) {
// 	const markdown = new MD.Markdown(markdownText);
// 	const markedUpText = Markup(markdown.text);
// 	return markedUpText;
// }
