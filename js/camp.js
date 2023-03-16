import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { MarkupLine } from './lib/markup.js';
const CampsiteHeadings = ['Site', 'Type', 'Size', 'Tents', 'Table', 'Comments'];
const ParkId = 1;
const CampgroundId = 1;
const ThisYear = new Date().getFullYear();
const Days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TwoPM = 'T14:00:00.000-07:00'; /** 2:00pm PDT */
const page = new Page();
render(page);
function render(page) {
    page.setTitle('Campsites', 2);
    DB.fetchData('@db/parks.json').then((parks) => {
        let mapFile = '';
        let campsites = [];
        let campgroundComments = [];
        parksLoop: for (let park of parks) {
            if (park.id == ParkId) {
                let campgrounds = park.campgrounds;
                for (let campground of campgrounds) {
                    if (campground.id == CampgroundId) {
                        mapFile = campground.map;
                        campsites = campground.campsites;
                        campgroundComments = campground.comments;
                        break parksLoop;
                    }
                }
                break;
            }
        }
        /** Display the campsites map */
        if (mapFile) {
            let mapElement = document.createElement('img');
            mapElement.setAttribute('src', `images/camp/${mapFile}`);
            mapElement.width = 666;
            mapElement.height = 363;
            page.content.append(mapElement);
        }
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
        displayReservationTable(reservationsTableElement);
        /** Display the campsites table column headings */
        let sitesTableElement = document.createElement('table');
        let rowElement = document.createElement('tr');
        for (let columnHeading of CampsiteHeadings) {
            let rowItemElement = document.createElement('th');
            rowItemElement.innerText = columnHeading;
            rowElement.appendChild(rowItemElement);
        }
        sitesTableElement.appendChild(rowElement);
        /** Display the campsite table rows */
        for (let campsite of campsites) {
            let rowElement = document.createElement('tr');
            if (campsite.category)
                rowElement.classList.add(`${campsite.category}-campsite`);
            let rowItemElement = document.createElement('th');
            rowItemElement.innerText = campsite.site;
            rowElement.appendChild(rowItemElement);
            rowItemElement = document.createElement('td');
            rowItemElement.innerText = campsite.type;
            rowElement.appendChild(rowItemElement);
            rowItemElement = document.createElement('td');
            rowItemElement.innerText = campsite.size;
            rowElement.appendChild(rowItemElement);
            rowItemElement = document.createElement('td');
            if (campsite.tents)
                rowItemElement.innerText = campsite.tents.toString();
            rowElement.appendChild(rowItemElement);
            rowItemElement = document.createElement('td');
            rowItemElement.innerText = campsite.table;
            rowElement.appendChild(rowItemElement);
            rowItemElement = document.createElement('td');
            rowItemElement.innerHTML = MarkupLine(campsite.comments, 'ETM');
            rowElement.appendChild(rowItemElement);
            sitesTableElement.appendChild(rowElement);
        }
        page.content.append(sitesTableElement);
        /** Display the campsite comments */
        for (let campgroundComment of campgroundComments) {
            let element = document.createElement('p');
            element.innerHTML = MarkupLine(campgroundComment, 'ETM');
            element.classList.add('campsite-comments');
            page.content.append(element);
        }
    });
}
// function displayCampsitesTable(tableElement: HTMLTableElement) {
// 	// will need to modularize the fetched data required for map as well as table
// }
function displayReservationTable(tableElement) {
    let siteReservations = {};
    let beginDate = null;
    let endDate = null;
    DB.fetchData('@db/park-accounts.json').then((reservationAccounts) => {
        console.log(reservationAccounts);
        DB.fetchData('@db/park-reservations.json').then((reservations) => {
            /**
             * Initially, sort reservations chronologically, so that the array
             * of reservations in the 'siteReservations' objects will be
             * chronological. Later, we can re-sort the sites if necessary for
             * display.
             */
            reservations.sort((a, b) => {
                if (a.arrival < b.arrival)
                    return -1;
                else if (a.arrival > b.arrival)
                    return 1;
                else if (a.days < b.days)
                    return -1;
                else if (a.days > b.days)
                    return 1;
                return 0;
            });
            for (let reservation of reservations) {
                if (reservation.parkId == ParkId && reservation.campgroundId == CampgroundId) {
                    let arrival = new Date(reservation.arrival + TwoPM);
                    let arrivalYear = arrival.getFullYear();
                    if (arrivalYear == ThisYear) { /** selection criteria */
                        let lastDay = new Date(arrival);
                        lastDay.setDate(lastDay.getDate() + (reservation.days - 1));
                        if (beginDate === null || beginDate > arrival)
                            beginDate = new Date(arrival.getTime());
                        if (endDate === null || endDate < lastDay)
                            endDate = new Date(lastDay.getTime());
                        let expandedReservation = {
                            numericSite: numericSite(reservation.site),
                            arrivalDate: new Date(arrival.getTime()),
                            days: reservation.days,
                            account: reservation.account,
                            /** because we've sorted reservations by arrival
                             * date above, we know that 'beginDate' has been set
                             * and can already calculate the table column in
                             * which this reservation belongs
                             */
                            column: Math.round((arrival.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24)),
                        };
                        if (!siteReservations[reservation.site]) {
                            /** initialize siteReservations entry */
                            siteReservations[reservation.site] = [];
                        }
                        siteReservations[reservation.site].push(expandedReservation);
                    }
                }
            }
            /** Write table column headings */
            let columnHeadings = [];
            columnHeadings.push('Site');
            let headingDate = new Date(beginDate.getTime());
            while (headingDate <= endDate) {
                let headingDateMonth = headingDate.getMonth() + 1;
                let headingDateDate = headingDate.getDate();
                let headingDateDay = Days[headingDate.getDay()];
                columnHeadings.push(`${headingDateDay} ${headingDateMonth}/${headingDateDate}`);
                headingDate.setDate(headingDate.getDate() + 1);
            }
            let headingRowElement = document.createElement('tr');
            for (let columnHeading of columnHeadings) {
                let rowItemElement = document.createElement('th');
                rowItemElement.innerText = columnHeading;
                headingRowElement.appendChild(rowItemElement);
            }
            tableElement.appendChild(headingRowElement);
            /** Write table data rows */
            let sites = sortSites(siteReservations);
            for (let site of sites) {
                /** add a row for the site and its reservations, with the site number in the first column */
                let siteRowElement = document.createElement('tr');
                let siteItemElement = document.createElement('th');
                siteItemElement.innerText = site;
                siteRowElement.append(siteItemElement);
                let nextColumn = 0; /** use to create empty spanned columns where there are gaps before/after/between reservations */
                for (let reservation in siteReservations[site]) {
                    let column = siteReservations[site][reservation].column;
                    let account = siteReservations[site][reservation].account;
                    let days = siteReservations[site][reservation].days;
                    let color = 'lightgray';
                    if (reservationAccounts[account])
                        color = reservationAccounts[account].color;
                    /** insert a (spanned) column representing unreserved date(s) before this reservation */
                    if (column > nextColumn) {
                        let unreservedDays = column - nextColumn;
                        siteItemElement = document.createElement('td');
                        siteItemElement.innerText = '';
                        if (unreservedDays > 1)
                            siteItemElement.colSpan = unreservedDays;
                        siteRowElement.append(siteItemElement);
                        nextColumn += unreservedDays;
                    }
                    /** add reservation item */
                    siteItemElement = document.createElement('td');
                    siteItemElement.innerText = account;
                    if (days > 1)
                        siteItemElement.colSpan = days;
                    siteItemElement.style.backgroundColor = color;
                    siteItemElement.style.textAlign = 'center';
                    siteRowElement.append(siteItemElement);
                    nextColumn += days;
                }
                tableElement.append(siteRowElement);
            }
        });
    });
}
function numericSite(site) {
    let siteNumber = 0;
    for (let character of site) {
        if ('0123456789'.includes(character)) {
            siteNumber = siteNumber * 10 + +character;
        }
    }
    return siteNumber;
}
function sortSites(siteReservations) {
    let siteKeys = Object.keys(siteReservations);
    siteKeys.sort((a, b) => {
        if (siteReservations[a][0].arrivalDate < siteReservations[b][0].arrivalDate)
            return -1;
        else if (siteReservations[a][0].arrivalDate > siteReservations[b][0].arrivalDate)
            return 1;
        else if (siteReservations[a][0].days < siteReservations[b][0].days)
            return -1;
        else if (siteReservations[a][0].days > siteReservations[b][0].days)
            return 1;
        else if (siteReservations[a][0].numericSite < siteReservations[b][0].numericSite)
            return -1;
        else if (siteReservations[a][0].numericSite > siteReservations[b][0].numericSite)
            return 1;
        return 0;
    });
    return siteKeys;
}
