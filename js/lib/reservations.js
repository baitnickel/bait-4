export function displayReservationTable(tableElement, thisYear, reservations, 
// accountColors: Map<string, string>
accounts, radioButtons) {
    let siteReservations = {};
    let beginDate = null;
    let endDate = null;
    /**
     * Initially, sort reservations chronologically, so that the array of
     * reservations in the 'siteReservations' objects will be chronological.
     * Later, we can re-sort the sites if necessary for display.
     */
    sortReservations(reservations);
    const TwoPM = 'T14:00:00.000-07:00'; /** 2:00pm PDT */
    for (let reservation of reservations) {
        let arrival = new Date(reservation.arrival + TwoPM);
        let arrivalYear = arrival.getFullYear();
        if (arrivalYear == thisYear && reservation.reserved > reservation.cancelled) { /** selection criteria */
            let lastDay = new Date(arrival);
            lastDay.setDate(lastDay.getDate() + (reservation.reserved - 1));
            if (beginDate === null || beginDate > arrival)
                beginDate = new Date(arrival.getTime());
            if (endDate === null || endDate < lastDay)
                endDate = new Date(lastDay.getTime());
            let expandedReservation = {
                site: numericSite(`${reservation.site}`),
                arrivalDate: new Date(arrival.getTime()),
                nightsReserved: reservation.reserved,
                nightsCancelled: reservation.cancelled,
                purchaser: reservation.purchaser,
                occupants: reservation.occupants,
                /** because we've sorted reservations by arrival date above, we
                 * know that 'beginDate' has been set and can already calculate
                 * the table column in which this reservation belongs
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
    writeTableHeadings(tableElement, beginDate, endDate);
    // writeTableRows(tableElement, siteReservations, accountColors);
    writeTableRows(tableElement, siteReservations, accounts, radioButtons);
}
function writeTableHeadings(tableElement, beginDate, endDate) {
    const Days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
}
// function writeTableRows(tableElement: HTMLTableElement, siteReservations: SiteReservations, accountColors: Map<string, string>) {
function writeTableRows(tableElement, siteReservations, accounts, radioButtons) {
    let sites = sortSiteReservations(siteReservations);
    for (let site of sites) {
        /** add a row for the site and its reservations, with the site number in the first column */
        let siteRowElement = document.createElement('tr');
        let siteItemElement = document.createElement('th');
        siteItemElement.innerText = site;
        siteRowElement.append(siteItemElement);
        let nextColumn = 0; /** use to create empty spanned columns where there are gaps before/after/between reservations */
        for (let reservation in siteReservations[site]) {
            let column = siteReservations[site][reservation].column;
            let nightsReserved = siteReservations[site][reservation].nightsReserved;
            let purchaser = siteReservations[site][reservation].purchaser;
            let occupants = siteReservations[site][reservation].occupants;
            /** interpret slash-separated values in purchaser and occupants */
            const purchaserValues = slashedValues(purchaser);
            const accountKey = purchaserValues[0];
            const account = accounts.get(accountKey);
            let accountName = '';
            let accountColor = 'lightgray'; /* default color when account is unknown */
            if (account !== undefined) {
                accountName = account.name;
                accountColor = account.color;
            }
            if (purchaserValues[1].length)
                accountName = purchaserValues[1];
            const occupantValues = slashedValues(occupants, false);
            const occupantNames = (occupantValues[1].length) ? occupantValues[1] : '';
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
            // siteItemElement.innerText = purchaser;
            const camperName = (radioButtons.activeButton == 'Purchasers') ? accountName : occupantNames;
            // siteItemElement.innerText = `[${accountName}] ${occupantNames}`;
            siteItemElement.innerText = camperName;
            if (nightsReserved > 1)
                siteItemElement.colSpan = nightsReserved;
            siteItemElement.style.backgroundColor = accountColor;
            siteItemElement.style.textAlign = 'center';
            siteRowElement.append(siteItemElement);
            nextColumn += nightsReserved;
        }
        tableElement.append(siteRowElement);
    }
}
function numericSite(site) {
    /** convert site from string ('J26') to number (26), removing non-digit characters */
    let siteNumber = 0;
    site = site.replace(/\D/g, '');
    if (site)
        siteNumber = Number(site);
    return siteNumber;
}
function sortReservations(reservations) {
    /** sort by arrival date, nightsReserved */
    reservations.sort((a, b) => {
        if (a.arrival < b.arrival)
            return -1;
        else if (a.arrival > b.arrival)
            return 1;
        else if (a.reserved < b.reserved)
            return -1;
        else if (a.reserved > b.reserved)
            return 1;
        return 0;
    });
}
function sortSiteReservations(siteReservations) {
    /** sort by arrival date, nightsReserved, site number */
    let siteKeys = Object.keys(siteReservations);
    siteKeys.sort((a, b) => {
        if (siteReservations[a][0].arrivalDate < siteReservations[b][0].arrivalDate)
            return -1;
        else if (siteReservations[a][0].arrivalDate > siteReservations[b][0].arrivalDate)
            return 1;
        else if (siteReservations[a][0].nightsReserved < siteReservations[b][0].nightsReserved)
            return -1;
        else if (siteReservations[a][0].nightsReserved > siteReservations[b][0].nightsReserved)
            return 1;
        else if (siteReservations[a][0].site < siteReservations[b][0].site)
            return -1;
        else if (siteReservations[a][0].site > siteReservations[b][0].site)
            return 1;
        return 0;
    });
    return siteKeys;
}
/**
 * In the Reservation Purchaser and Occupants fields, the strings are typically
 * two values separated by a slash. In both cases, the first value is an Account
 * key. For Purchaser, the second value is a Reservation Account alias (one
 * person may have multiple reservation accounts). For Occupants, the second
 * value is a free-form list of occupant names.
 *
 * When a Purchaser field has only one value (no slash), it is taken as an
 * Account key. When an Occupants field has only one value (no slash), it is
 * taken as a free-form list of occupant names (or "Main Site", etc.).
 *
 * Given a Purchaser or Occupants string, return a two-element array. Element 0
 * contains an Account key or an empty string. For a Purchaser field, Element 1
 * will contain a reservation alias or an empty string. For an Occupants field,
 * Element 1 will contain a free-form string or an empty string. By default, we
 * assume the string is a Purchaser; set the optional `purchaser` parameter to
 * false when processing Occupants.
 */
export function slashedValues(value, purchaser = true) {
    const values = [];
    const separator = '/';
    let accountKey = '';
    let freeForm = '';
    const i = value.indexOf(separator);
    if (i < 0) { /* no slash */
        if (purchaser)
            accountKey = value;
        else
            freeForm = value;
    }
    else {
        accountKey = value.slice(0, i);
        freeForm = value.slice(i + 1);
    }
    values.push(accountKey.trim());
    values.push(freeForm.trim());
    return values;
}
