import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { Document } from './lib/document.js';
import * as Table from './lib/table.js';
import * as Reservations from './lib/reservations.js';
export function render() {
    const ThisYear = new Date().getFullYear();
    const page = new Page();
    page.displayMenu();
    page.setTitle('Campsites', 2);
    const ParkFilePath = `${page.fetchOrigin}/data/park.md`;
    console.log(`origin: ${page.origin}`);
    console.log(`url: ${page.url}`);
    console.log(`parameters: ${page.parameters}`);
    console.log(`path: ${ParkFilePath}`);
    let mapDiv = document.createElement('div');
    page.content.append(mapDiv);
    DB.fetchData(ParkFilePath, 'md').then((parkText) => {
        let obsidian = new Document(parkText);
        if (obsidian.metadata) {
            if ('map' in obsidian.metadata) {
                let mapElement = document.createElement('img');
                mapElement.setAttribute('src', `images/camp/${obsidian.metadata['map']}`);
                mapElement.width = 666;
                mapDiv.append(mapElement);
            }
            if ('accountColors' in obsidian.metadata && 'reservations' in obsidian.metadata) {
                /** Display this year's campsite reservations */
                let reservationParagraph = document.createElement('p');
                let detailsElement = document.createElement('details');
                let summaryElement = document.createElement('summary');
                summaryElement.innerText = `${ThisYear} Reservations`;
                detailsElement.append(summaryElement);
                let reservationsTableElement = document.createElement('table');
                detailsElement.append(reservationsTableElement);
                reservationParagraph.append(detailsElement);
                page.content.append(reservationParagraph);
                Reservations.displayReservationTable(reservationsTableElement, ThisYear, obsidian.metadata['reservations'], obsidian.metadata['accountColors']);
            }
            if ('sites' in obsidian.metadata) {
                /** Generate sites table */
                const tableRows = obsidian.metadata['sites'];
                const tableHeadings = ['Site', 'Type', 'Size', 'Tents', 'Table', 'Comments'];
                const tableElements = ['site', 'type', 'size', 'tents', 'table', 'comment'];
                const tableOptions = {
                    headingCells: ['site'],
                    classPrefix: 'campsite-',
                    classElement: 'category',
                };
                page.content.append(Table.createTable(tableRows, tableHeadings, tableElements, tableOptions));
            }
            if ('comments' in obsidian.metadata) {
                page.content.append(createParagraphs(obsidian.metadata['comments']));
            }
        }
    });
}
function createParagraphs(lines) {
    let divElement = document.createElement('div');
    let paragraphElements = [];
    for (let line of lines) {
        let paragraph = document.createElement('p');
        if (!line)
            line = '';
        paragraph.innerText = `${line}`;
        paragraphElements.push(paragraph);
        divElement.append(paragraphElements[paragraphElements.length - 1]);
    }
    return divElement;
}
