import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { Document } from './lib/document.js';
import * as Reservations from './lib/reservations.js';
// const ThisYear = new Date().getFullYear();
// const ParkFilePath = 'data/park.md';
// const page = new Page();
// render(page);
// export function render(page: Page) {
export function render() {
    const ThisYear = new Date().getFullYear();
    const ParkFilePath = './data/park.md';
    const page = new Page();
    console.log(`origin: ${page.origin}`);
    console.log(`url: ${page.url}`);
    console.log(`parameters: ${page.parameters}`);
    page.setTitle('Campsites', 2);
    let mapDiv = document.createElement('div');
    page.content.append(mapDiv);
    DB.fetchData(ParkFilePath, 'md').then((parkText) => {
        let obsidian = new Document(parkText);
        if (obsidian.metadata) {
            if ('map' in obsidian.metadata) {
                let mapElement = document.createElement('img');
                mapElement.setAttribute('src', `./data/${obsidian.metadata['map']}`);
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
                let tableRows = obsidian.metadata['sites'];
                let tableHeadings = ['Site', 'Type', 'Size', 'Tents', 'Table', 'Comments'];
                let tableElements = ['site', 'type', 'size', 'tents', 'table', 'comment'];
                page.content.append(createTable(tableRows, tableHeadings, tableElements));
            }
            if ('comments' in obsidian.metadata) {
                page.content.append(createParagraphs(obsidian.metadata['comments']));
            }
        }
    });
}
function createTable(rows, headings, elements) {
    // rows must be an array of key:value objects, key is a string, value is string, number, or null
    let tableElement = document.createElement('table');
    if (headings.length) {
        let rowElement = document.createElement('tr');
        for (let heading of headings) {
            let rowItemElement = document.createElement('th');
            rowItemElement.innerText = heading;
            rowElement.appendChild(rowItemElement);
        }
        tableElement.appendChild(rowElement);
    }
    for (let row of rows) {
        let rowElement = document.createElement('tr');
        for (let element of elements) {
            let rowItemElement = document.createElement('td');
            let value = (element in row) ? row[element] : '';
            if (value === null)
                value = '';
            rowItemElement.innerText = `${value}`;
            rowElement.appendChild(rowItemElement);
        }
        tableElement.appendChild(rowElement);
    }
    return tableElement;
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
