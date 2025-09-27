import { Page } from './lib/page.js';
import * as W from './lib/widgets.js';
import { Park } from './lib/parks.js';
const PAGE = new Page();
const NewReservationsViewEvent = 'bait:update-reservation-view';
const AccountingOptionEvent = 'bait:update-accounting-option';
const ParkName = 'smitty';
export function render() {
    const testing = PAGE.parameters.has('test');
    PAGE.setTitle('Campsites (New)', 1);
    const mapDiv = document.createElement('div');
    const reservationsDiv = document.createElement('div');
    const sitesDiv = document.createElement('div');
    const commentsDiv = document.createElement('div');
    PAGE.content.append(mapDiv);
    PAGE.content.append(reservationsDiv);
    PAGE.content.append(sitesDiv);
    PAGE.content.append(commentsDiv);
    /**
     * Display the campground map, campsites table, and comments.
     */
    const park = new Park(ParkName);
    if (park !== undefined) {
        const campground = park.campground;
        if (campground !== undefined) {
            /* display the map */
            const map = campground.map;
            const mapElement = document.createElement('img');
            mapElement.setAttribute('src', `images/camp/${map}`);
            mapElement.width = 666;
            mapDiv.append(mapElement);
            /* display the campsites information table */
            sitesDiv.append(park.campsitesTable());
            /* display the campground comments */
            const comments = campground.comments;
            commentsDiv.append(createParagraphs(comments));
        }
    }
    /**
     * Display the current year's campsite reservation table.
     */
    // if (ParkReservations !== undefined && ReservationYears[0]) {
    const years = park.reservationYears('descending');
    if (years.length) {
        let showAccounting = false; /* default: uncheck accounting option */
        const newReservationsView = new Event(NewReservationsViewEvent);
        const accountingOptionChanged = new Event(AccountingOptionEvent);
        const reservationParagraph = document.createElement('p');
        const detailsElement = document.createElement('details');
        // detailsElement.open = true;
        const summaryElement = document.createElement('summary');
        const reservationsTableElement = document.createElement('table');
        const buttonsElement = document.createElement('div');
        const yearSelection = document.createElement('select');
        const radioButtons = new W.RadioButtons('radio-button', 'active', newReservationsView);
        const accountingWidget = new W.Checkbox('Show Accounting: ', showAccounting);
        accountingWidget.label.className = 'camp-checkbox';
        accountingWidget.element.addEventListener('change', () => {
            document.dispatchEvent(accountingOptionChanged);
        });
        /* create elements for accounting report */
        const accountingDiv = document.createElement('div');
        const reportParagraph = document.createElement('p');
        accountingDiv.classList.add('framed-text');
        /* render the Details/Summary elements */
        summaryElement.innerText = 'Reservations';
        detailsElement.append(summaryElement);
        /* drop down selection for reservation year */
        // for (const year of ReservationYears) yearSelection.add(new Option(`${year}`, `${year}`));
        for (const year of years)
            yearSelection.add(new Option(`${year}`, `${year}`));
        buttonsElement.append(yearSelection);
        yearSelection.addEventListener('change', () => { document.dispatchEvent(newReservationsView); });
        /* radio buttons to switch between Purchasers and Occupants view */
        radioButtons.addButton('Purchasers');
        radioButtons.addButton('Occupants');
        for (let button of radioButtons.buttons)
            buttonsElement.append(button);
        // const radioGroup = new W.RadioGroup('View', ['Purchasers', 'Occupants'], 'widget-radio-inline');
        // buttonsElement.append(radioGroup.fieldset);
        /* add accounting checkbox option (hidden until event listener verifies finalized year) */
        accountingWidget.label.hidden = true;
        buttonsElement.append(accountingWidget.label);
        detailsElement.append(buttonsElement);
        detailsElement.append(reservationsTableElement);
        reservationParagraph.append(detailsElement);
        reservationsDiv.append(reservationParagraph);
        accountingDiv.append(reportParagraph);
        detailsElement.append(accountingDiv);
        /* listen for reservation view changes and (re)display campsite reservations on change */
        document.addEventListener(NewReservationsViewEvent, () => {
            reportParagraph.innerText = '';
            const year = Number(yearSelection.value);
            const view = (radioButtons.activeButton == 'Purchasers');
            park.reservationsTable(reservationsTableElement, year, view);
            // 		if (ParkFinalizedYears.includes(year) || testing) {
            // 			accountingWidget.label.hidden = false;
            // 			if (showAccounting) {
            // 				/* Generate campsite accounting report */
            // 				const reportLines = Reservations.accounting(year, Groups, ParkReservations, ParkAdjustments, ParkCosts);
            // 				for (const reportLine of reportLines) reportParagraph.append(reportLine);
            // 				accountingDiv.hidden = false;
            // 			}
            // 			else accountingDiv.hidden = true;
            // 		}
            // 		else {
            // 			accountingDiv.hidden = true;
            // 			accountingWidget.label.hidden = true;
            // 		}
        });
        // 	document.addEventListener(AccountingOptionEvent, () => {
        // 		showAccounting = accountingWidget.element.checked;
        // 		document.dispatchEvent(newReservationsView);
        // 	});
        /* on initial rendering, trigger display of campsite reservation info */
        document.dispatchEvent(newReservationsView);
    }
}
function createParagraphs(lines) {
    const divElement = document.createElement('div');
    const paragraphElements = [];
    for (const line of lines) {
        const paragraph = document.createElement('p');
        paragraph.innerText = (line) ? `${line}` : '';
        paragraphElements.push(paragraph);
        divElement.append(paragraphElements[paragraphElements.length - 1]);
    }
    return divElement;
}
