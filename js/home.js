import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import * as Datasets from './lib/datasets.js';
import { MarkdownDocument } from './lib/md.js';
import { Markup } from './lib/markup.js';
import * as Widgets from './lib/widgets.js';
export function render() {
    const page = new Page();
    const Quote = page.appendContent('#Quote');
    const TestCollection = page.appendContent('#TestCollection');
    const TestMap = page.appendContent('#TestMap');
    const TestMarkdown = page.appendContent('#TestMarkdown');
    const TestYaml = page.appendContent('#TestYaml');
    const TestRadio = page.appendContent('#TestRadio');
    const Lorem = page.appendContent('#Lorem .blue');
    const Photo = page.appendContent('#Photo');
    const Video = page.appendContent('#Video');
    const quotesPath = `${page.site}/Indices/quotes.json`;
    Fetch.map(quotesPath).then((quotes) => {
        const keys = Array.from(quotes.keys());
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const randomQuote = quotes.get(randomKey);
        page.appendQuote(Quote, randomQuote);
        const lorem = `Aliquip deserunt adipisicing id labore nisi ipsum aliqua sunt ex adipisicing velit sint quis nulla. Non ea irure voluptate non. Pariatur proident eu sunt non ullamco excepteur enim in enim reprehenderit eu occaecat occaecat tempor. Veniam aute non dolore tempor ex dolor tempor sint enim proident. Reprehenderit ex anim magna tempor adipisicing consequat ipsum exercitation laborum duis sunt fugiat nostrud. Excepteur aute commodo laboris qui ad enim amet velit. Nulla ex do labore anim ut commodo amet laboris eu dolore est. Ut sunt fugiat labore in sit id qui. Minim voluptate irure ea ea deserunt aliquip eiusmod commodo. Reprehenderit id ex amet quis elit labore et ad amet consequat deserunt anim. Anim ullamco sint elit veniam.`;
        page.appendParagraph(Lorem, lorem);
    });
    // page.appendPhoto(Photo, 'i-SDpf2qV', 'S');
    // page.appendParagraph('');
    // page.appendVideo(Video, '9MtLIkk2ihw', 400, 220);
    if (page.local) {
        const testCollection = false;
        const testMap = false;
        const testMarkdown = true;
        const testYaml = false;
        const testRadio = true;
        const testEmail = true;
        if (testCollection) {
            const songsIndexFile = `${page.site}/Indices/fakesheets.json`;
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
                page.appendParagraph(TestCollection, dataLines);
            });
        }
        if (testMap) {
            const songsIndexFile = `${page.site}/Indices/fakesheets.json`;
            Fetch.map(songsIndexFile).then((songsMap) => {
                const dataLines = [];
                const collection = new Datasets.Collection(songsMap);
                let entry = collection.first();
                while (entry !== null) {
                    const record = collection.record(entry);
                    dataLines.push(`${entry}: ${record.artist} - ${record.title}`);
                    entry = collection.next();
                }
                page.appendParagraph(TestMap, dataLines);
            });
        }
        if (testMarkdown) {
            const testMarkdownFile = `${page.site}/data/test-markdown.md`;
            Fetch.text(testMarkdownFile).then((fileContent) => {
                if (!fileContent) {
                    const errorMessage = `Cannot read file: ${testMarkdownFile}`;
                    page.appendParagraph(TestMarkdown, errorMessage);
                }
                else {
                    const markdownDocument = new MarkdownDocument(fileContent);
                    markdownDocument.text += `\n\nFirst text line is: ${markdownDocument.textOffset + 1}`;
                    const html = Markup(markdownDocument.text);
                    const paragraph = page.appendParagraph(TestMarkdown, '');
                    paragraph.innerHTML = html;
                }
            });
        }
        if (testYaml) {
            const ReservationsPath = `${page.site}/data/camp/reservations.yaml`;
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
                page.appendParagraph(TestYaml, dataLines);
            });
        }
        if (testRadio) {
            const division = page.appendContent();
            const anotherDivision = page.appendContent();
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
            // const division = page.appendContent();
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
            const division = page.appendContent();
            const emailButton = document.createElement('button');
            emailButton.innerText = 'Send Feedback';
            division.append(emailButton);
            emailButton.addEventListener('click', (e) => {
                if (!page.feedback)
                    alert('Don\'t know who to send feedback to!');
                else
                    window.location.href = `mailto:${page.feedback}?subject=${page.url}`;
            });
        }
    }
}
