import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import * as Datasets from './lib/datasets.js';
import { MarkdownDocument } from './lib/md.js';
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
    const Photo = ThisPage.appendContent('#Photo');
    const Video = ThisPage.appendContent('#Video');
    const keys = Array.from(Quotes.keys());
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const randomQuote = Quotes.get(randomKey);
    ThisPage.appendQuote(Quote, randomQuote);
    const markdown = new MarkdownDocument(HomeText);
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
        const testCollection = false;
        const testMap = false;
        const testMarkdown = true;
        const testYaml = false;
        const testRadio = true;
        const testEmail = true;
        const testIconLink = false;
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
            const testMarkdownFile = `${ThisPage.site}/data/test-markdown.md`;
            Fetch.text(testMarkdownFile).then((fileContent) => {
                if (!fileContent) {
                    const errorMessage = `Cannot read file: ${testMarkdownFile}`;
                    ThisPage.appendParagraph(TestMarkdown, errorMessage);
                }
                else {
                    const markdownDocument = new MarkdownDocument(fileContent);
                    markdownDocument.text += `\n\nFirst text line is: ${markdownDocument.textOffset + 1}`;
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
    }
}
// function markedUpText(markdownText: string) {
// 	const markdown = new MarkdownDocument(markdownText);
// 	const markedUpText = Markup(markdown.text);
// 	return markedUpText;
// }
