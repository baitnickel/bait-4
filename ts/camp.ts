import { Page } from './lib/page.js';
import * as Settings from './lib/settings.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as Table from './lib/table.js';
import * as Reservations from './lib/reservations.js';
import * as Widgets from './lib/widgets.js';

const Site = Settings.Site();
const NewViewEvent = 'bait:update-reservation-view';
const AccountingOptionEvent = 'bait:update-accounting-option';
const Park = 'smitty';

const CampgroundsPath = `${Site}/data/camp/campgrounds.yaml`;
const GroupsPath = `${Site}/data/camp/groups.yaml`;
const ReservationsPath = `${Site}/data/camp/reservations.yaml`;
const AdjustmentsPath = `${Site}/data/camp/adjustments.yaml`;
const CostsPath = `${Site}/data/camp/costs.yaml`;

/** Fetch all the data we'll need before rendering the page */
const Campgrounds = await Fetch.map<T.Campground>(CampgroundsPath);
const Groups = await Fetch.map<T.CampGroup>(GroupsPath);
const AllReservations = await Fetch.map<T.Reservation[]>(ReservationsPath);
const AllAdjustments = await Fetch.map<T.CampAdjustment[]>(AdjustmentsPath);
const AllCosts = await Fetch.map<T.CampCosts[]>(CostsPath);

const ParkReservations = AllReservations.get(Park);
const ParkAdjustments = (AllAdjustments.get(Park) !== undefined) ? AllAdjustments.get(Park)! : [];
const ParkCosts = (AllCosts.get(Park) !== undefined) ? AllCosts.get(Park)! : [];
const ReservationYears = reservationYears(ParkReservations);

export function render() {
	const page = new Page();
	page.setTitle('Campsites', 2);

	const mapDiv = document.createElement('div');
	const reservationsDiv = document.createElement('div');
	const sitesDiv = document.createElement('div');
	const commentsDiv = document.createElement('div');
	page.content.append(mapDiv);
	page.content.append(reservationsDiv);
	page.content.append(sitesDiv);
	page.content.append(commentsDiv);

	/**
	 * Display the campground map, campsites table, and comments.
	 */
	const campground = Campgrounds.get(Park);
	if (campground !== undefined) {
		/* display the map */
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
		/* display the campground comments */
		commentsDiv.append(createParagraphs(comments));
	}

	/**
	 * Display the current year's campsite reservation table.
	 */
	if (ParkReservations !== undefined && ReservationYears[0]) {
		const testAccounting = page.local; //###
		let showAccounting = false //### unchecked option by default
		const newReservationsView = new Event(NewViewEvent);
		const accountingOptionChanged = new Event(AccountingOptionEvent);
		const reservationParagraph = document.createElement('p');
		const detailsElement = document.createElement('details');
		const summaryElement = document.createElement('summary');
		const reservationsTableElement = document.createElement('table');
		const buttonsElement = document.createElement('div');
		const yearSelection = document.createElement('select');
		const radioButtons = new Widgets.RadioButtons('radio-button', 'active', newReservationsView);
		const accountingOption = new Widgets.Checkbox('accounting', 'Show Accounting: ', 'camp-checkbox', accountingOptionChanged, showAccounting);

		const accountingDiv = document.createElement('div')
		const reportParagraph = document.createElement('p');
		accountingDiv.classList.add('framed-text');
		
		/* render the Details/Summary elements */
		summaryElement.innerText = 'Reservations';
		detailsElement.append(summaryElement);

		/* listen for reservation view changes and (re)display campsite reservations on change */
		document.addEventListener(NewViewEvent, () => {
			reservationsTableElement.innerHTML = '';
			reportParagraph.innerText = '';
			const year = Number(yearSelection.value);
			/* Generate campsite reservation table */
			Reservations.displayReservationTable(
				reservationsTableElement,
				year,
				ParkReservations,
				Groups,
				radioButtons,
			);
			if (showAccounting) {
				/* Generate campsite accounting report */
				const reportLines = Reservations.accounting(year, Groups, ParkReservations, ParkAdjustments, ParkCosts);
				for (const reportLine of reportLines) reportParagraph.append(reportLine);
				accountingDiv.hidden = false;
			}
			else accountingDiv.hidden = true;
		});

		document.addEventListener(AccountingOptionEvent, () => {
			showAccounting = accountingOption.checkbox.checked;
			document.dispatchEvent(newReservationsView);
		});

		/* drop down selection for reservation year */
		for (const year of ReservationYears) yearSelection.add(new Option(`${year}`, `${year}`));
		buttonsElement.append(yearSelection);
		yearSelection.addEventListener('change', () => { document.dispatchEvent(newReservationsView); });

		/* radio buttons to switch between Purchasers and Occupants view */
		radioButtons.addButton('Purchasers');
		radioButtons.addButton('Occupants');
		for (let button of radioButtons.buttons) buttonsElement.append(button);

		/* checkbox option */
		if (testAccounting) buttonsElement.append(accountingOption.label);

		detailsElement.append(buttonsElement);
		detailsElement.append(reservationsTableElement);
		reservationParagraph.append(detailsElement);
		reservationsDiv.append(reservationParagraph);

		accountingDiv.append(reportParagraph);
		detailsElement.append(accountingDiv);

		/* on initial rendering, trigger display of campsite reservation info */
		document.dispatchEvent(newReservationsView);
	}
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

function reservationYears(parkReservations: T.Reservation[]|undefined) {
	if (parkReservations === undefined) return [0];
	const years: number[] = [];
	for (const reservation of parkReservations!) {
		const arrival = new Date(reservation.arrival);
		const year = arrival.getFullYear();
		if (!years.includes(year)) years.push(year);
	}
	years.sort((a, b) => { return b - a }); /* sort years descending */
	return years;
}