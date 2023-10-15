import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { MarkdownDocument } from './lib/md.js';
import * as Table from './lib/table.js';
import * as Reservations from './lib/reservations.js';
export function render() {
    const ThisYear = new Date().getFullYear();
    const page = new Page();
    page.setTitle('Campsites', 2);
    const ParkFilePath = `${page.fetchOrigin}/data/park.md`;
    console.log(`origin: ${page.origin}`);
    console.log(`url: ${page.url}`);
    console.log(`parameters: ${page.parameters}`);
    console.log(`path: ${ParkFilePath}`);
    let mapDiv = document.createElement('div');
    page.content.append(mapDiv);
    DB.fetchData(ParkFilePath, 'md').then((parkText) => {
        let markdownDocument = new MarkdownDocument(parkText);
        if (markdownDocument.metadata) {
            if ('map' in markdownDocument.metadata) {
                let mapElement = document.createElement('img');
                mapElement.setAttribute('src', `images/camp/${markdownDocument.metadata['map']}`);
                mapElement.width = 666;
                mapDiv.append(mapElement);
            }
            if ('accountColors' in markdownDocument.metadata && 'reservations' in markdownDocument.metadata) {
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
                Reservations.displayReservationTable(reservationsTableElement, ThisYear, markdownDocument.metadata.reservations, markdownDocument.metadata.accountColors);
            }
            if ('sites' in markdownDocument.metadata) {
                /**
                 * Generate sites table
                 * 'sites' is an array of fieldName:fieldValue maps
                 */
                const tableRows = [];
                for (let site of markdownDocument.metadata.sites) {
                    let map = new Map(Object.entries(site));
                    tableRows.push(map);
                }
                const tableElements = ['site', 'type', 'size', 'tents', 'table', 'comment'];
                const tableOptions = {
                    headingColumns: ['site'],
                    classPrefix: 'campsite-',
                    classElement: 'category',
                };
                page.content.append(Table.createTable(tableRows, tableElements, tableOptions));
            }
            if ('comments' in markdownDocument.metadata) {
                page.content.append(createParagraphs(markdownDocument.metadata.comments));
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
