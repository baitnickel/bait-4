import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { YAML } from './lib/yaml.js';
import * as Table from './lib/table.js';
import * as Reservations from './lib/reservations.js';

const Park = 'smitty';
const ThisYear = new Date().getFullYear();

export function render() {
	const page = new Page();
	page.setTitle('Campsites', 2);

	const campgroundsPath = `${page.site}/data/camp/campgrounds.yaml`;
	const campersPath = `${page.site}/data/camp/campers.yaml`;
	const reservationsPath = `${page.site}/data/camp/reservations.yaml`;

	const mapDiv = document.createElement('div');
	const reservationsDiv = document.createElement('div');
	const sitesDiv = document.createElement('div');
	const commentsDiv = document.createElement('div');
	page.content.append(mapDiv);
	page.content.append(reservationsDiv);
	page.content.append(sitesDiv);
	page.content.append(commentsDiv);

	Fetch.map<T.Campground>(campgroundsPath).then((campgrounds) => {
		const campground = campgrounds.get(Park);
		if (campground !== undefined) {
			const map = campground.map;
			const comments = campground.comments;
			const sites = campground.sites;
			const mapElement = document.createElement('img');
			mapElement.setAttribute('src', `images/camp/${map}`);
			mapElement.width=666;
			mapDiv.append(mapElement);
			/* display the sites table */
			const tableRows: Table.RowData[] = [];
			for (const site of sites) {
				const map: Table.RowData = new Map(Object.entries(site));
				tableRows.push(map);
			}
			const tableElements = ['site', 'type', 'size', 'tents', 'table', 'comment'];
			const tableOptions: Table.Options = {
				headingColumns: ['site'],
				classPrefix: 'campsite-',
				classElement: 'category',
			};
			sitesDiv.append(Table.createTable(tableRows, tableElements, tableOptions));
			/* display the park comments */
			commentsDiv.append(createParagraphs(comments));
		}
	});

	Fetch.map<T.Reservation[]>(reservationsPath).then((parkReservations) => {
		const parkReservation = parkReservations.get(Park);
		if (parkReservation !== undefined) {
			const reservations = parkReservation;
			Fetch.map<string>(campersPath).then((campers) => {
				const reservationParagraph = document.createElement('p');
				const detailsElement = document.createElement('details');
				const summaryElement = document.createElement('summary');
				summaryElement.innerText = `${ThisYear} Reservations`;
				detailsElement.append(summaryElement);
				const reservationsTableElement = document.createElement('table');
				detailsElement.append(reservationsTableElement);
				reservationParagraph.append(detailsElement);
				reservationsDiv.append(reservationParagraph);
				
				/* display this year's campsite reservations */
				Reservations.displayReservationTable(
					reservationsTableElement,
					ThisYear,
					reservations,
					campers
				);
			});
		}
	});
}

function createParagraphs(lines: string[]) {
	const divElement = document.createElement('div');
	const paragraphElements: HTMLParagraphElement[] = [];
	for (const line of lines) {
		const paragraph = document.createElement('p');
		paragraph.innerText = (line) ? `${line}` : '';
		paragraphElements.push(paragraph);
		divElement.append(paragraphElements[paragraphElements.length - 1]);
	}
	return divElement;
}
