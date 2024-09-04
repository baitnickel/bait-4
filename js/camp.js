import { Page } from './lib/page.js';
import * as Settings from './lib/settings.js';
import * as Fetch from './lib/fetch.js';
import * as Table from './lib/table.js';
import * as Reservations from './lib/reservations.js';
const Park = 'smitty';
const ThisYear = new Date().getFullYear();
const Site = Settings.Site();
const CampgroundsPath = `${Site}/data/camp/campgrounds.yaml`;
const ReservationsPath = `${Site}/data/camp/reservations.yaml`;
const CampersPath = `${Site}/data/camp/campers.yaml`;
const AccountsPath = `${Site}/data/camp/accounts.yaml`;
/** Fetch all the data we'll need before rendering the page */
const Campgrounds = await Fetch.map(CampgroundsPath);
const ParkReservations = await Fetch.map(ReservationsPath);
const Campers = await Fetch.map(CampersPath);
const Accounts = await Fetch.map(AccountsPath);
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
        mapElement.width = 666;
        mapDiv.append(mapElement);
        /* display the sites table */
        const tableRows = [];
        for (const site of sites) {
            const map = new Map(Object.entries(site));
            tableRows.push(map);
        }
        const tableElements = ['site', 'type', 'size', 'tents', 'table', 'comment'];
        const tableOptions = {
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
    const reservations = ParkReservations.get(Park);
    if (reservations !== undefined) {
        // const reservations = reservations;
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
        Reservations.displayReservationTable(reservationsTableElement, ThisYear, reservations, Accounts);
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
