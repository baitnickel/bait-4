import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as DB from './lib/fetch.js';
import { YAML } from './lib/yaml.js';
import * as Table from './lib/table.js';
import * as Reservations from './lib/reservations.js';

const Park = 'smitty';
const ThisYear = new Date().getFullYear();

export function render(pageStats: T.FileStats) {
	const page = new Page(pageStats);
	page.setTitle('Campsites', 2);

	const campgroundsPath = `${page.contentOrigin}/data/camp/campgrounds.yaml`;
	const campersPath = `${page.contentOrigin}/data/camp/campers.yaml`;
	const reservationsPath = `${page.contentOrigin}/data/camp/reservations.yaml`;

	const mapDiv = document.createElement('div');
	const reservationsDiv = document.createElement('div');
	const sitesDiv = document.createElement('div');
	const commentsDiv = document.createElement('div');
	page.content.append(mapDiv);
	page.content.append(reservationsDiv);
	page.content.append(sitesDiv);
	page.content.append(commentsDiv);

	DB.fetchData(campgroundsPath).then((campgroundsYaml: string) => {
		const campgroundsData = new YAML(campgroundsYaml);
		const campgrounds = campgroundsData.parse();
		if (Park in campgrounds) {
			const campground = campgrounds[Park];
			if ('map' in campground && 'sites' in campground && 'comments' in campground) {
				/* display the SVG map */
				const mapElement = document.createElement('img');
				mapElement.setAttribute('src', `images/camp/${campground['map']}`);
				mapElement.width=666;
				mapDiv.append(mapElement);
				/* display the sites table */
				const tableRows: Table.RowData[] = [];
				for (const site of campground['sites']) {
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
				commentsDiv.append(createParagraphs(campground['comments']));
			}
		}
	});

	DB.fetchData(reservationsPath).then((reservationsYaml: string) => {
		const reservationsData = new YAML(reservationsYaml);
		const reservations = reservationsData.parse();
		if (Park in reservations) {
			DB.fetchData(campersPath).then((campersYaml: string) => {
				const campersData = new YAML(campersYaml);
				const campers = campersData.parse();
				/* display this year's campsite reservations */
				const reservationParagraph = document.createElement('p');
				const detailsElement = document.createElement('details');
				const summaryElement = document.createElement('summary');
				summaryElement.innerText = `${ThisYear} Reservations`;
				detailsElement.append(summaryElement);
				const reservationsTableElement = document.createElement('table');
				detailsElement.append(reservationsTableElement);
				reservationParagraph.append(detailsElement);
				reservationsDiv.append(reservationParagraph);

				Reservations.displayReservationTable(
					reservationsTableElement,
					ThisYear,
					reservations[Park],
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
