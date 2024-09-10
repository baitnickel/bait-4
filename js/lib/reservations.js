export function displayReservationTable(tableElement, thisYear, reservations, accounts, radioButtons) {
    let adjustedReservations = {};
    let beginDate = null;
    let endDate = null;
    /**
     * Initially, sort reservations chronologically, so that the array of
     * reservations in the 'adjustedReservations' objects will be chronological.
     * Later, we can re-sort the sites if necessary for display.
     */
    sortReservations(reservations);
    const TwoPM = 'T14:00:00.000-07:00'; /** 2:00pm PDT */
    for (let reservation of reservations) {
        let arrival = new Date(reservation.arrival + TwoPM);
        let arrivalYear = arrival.getFullYear();
        if (arrivalYear == thisYear && reservation.reserved > reservation.cancelled) { /** selection criteria */
            let lastDay = new Date(arrival);
            lastDay.setDate(lastDay.getDate() + (reservation.reserved - reservation.cancelled - 1));
            if (beginDate === null || beginDate > arrival)
                beginDate = new Date(arrival.getTime());
            if (endDate === null || endDate < lastDay)
                endDate = new Date(lastDay.getTime());
            let adjustedReservation = {
                site: numericSite(`${reservation.site}`),
                arrivalDate: new Date(arrival.getTime()),
                nightsReserved: reservation.reserved - reservation.cancelled,
                purchaser: reservation.purchaser,
                occupants: reservation.occupants,
                /** because we've sorted reservations by arrival date above, we
                 * know that 'beginDate' has been set and can already calculate
                 * the table column in which this reservation belongs
                 */
                column: Math.round((arrival.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24)),
            };
            if (!adjustedReservations[reservation.site]) {
                /** initialize adjustedReservations entry */
                adjustedReservations[reservation.site] = [];
            }
            adjustedReservations[reservation.site].push(adjustedReservation);
        }
    }
    writeTableHeadings(tableElement, beginDate, endDate);
    writeTableRows(tableElement, adjustedReservations, accounts, radioButtons);
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
function writeTableRows(tableElement, adjustedReservations, accounts, radioButtons) {
    let sites = sortAdjustedReservations(adjustedReservations);
    for (let site of sites) {
        /** add a row for the site and its reservations, with the site number in the first column */
        let siteRowElement = document.createElement('tr');
        let siteItemElement = document.createElement('th');
        siteItemElement.innerText = site;
        siteRowElement.append(siteItemElement);
        let nextColumn = 0; /** use to create empty spanned columns where there are gaps before/after/between reservations */
        for (let reservation in adjustedReservations[site]) {
            let column = adjustedReservations[site][reservation].column;
            let nightsReserved = adjustedReservations[site][reservation].nightsReserved;
            let purchaser = adjustedReservations[site][reservation].purchaser;
            let occupants = adjustedReservations[site][reservation].occupants;
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
            const camperName = (radioButtons.activeButton == 'Purchasers') ? accountName : occupantNames;
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
        else if ((a.reserved - a.cancelled) < (b.reserved - b.cancelled))
            return -1;
        else if ((a.reserved - a.cancelled) > (b.reserved - b.cancelled))
            return 1;
        return 0;
    });
}
function sortAdjustedReservations(adjustedReservations) {
    /** sort by arrival date, nightsReserved, site number */
    let siteKeys = Object.keys(adjustedReservations);
    siteKeys.sort((a, b) => {
        if (adjustedReservations[a][0].arrivalDate < adjustedReservations[b][0].arrivalDate)
            return -1;
        else if (adjustedReservations[a][0].arrivalDate > adjustedReservations[b][0].arrivalDate)
            return 1;
        else if (adjustedReservations[a][0].nightsReserved < adjustedReservations[b][0].nightsReserved)
            return -1;
        else if (adjustedReservations[a][0].nightsReserved > adjustedReservations[b][0].nightsReserved)
            return 1;
        else if (adjustedReservations[a][0].site < adjustedReservations[b][0].site)
            return -1;
        else if (adjustedReservations[a][0].site > adjustedReservations[b][0].site)
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
/**
 *
 */
export function accounting(year, reservations, accounts, costs) {
    console.log(`${year} Accounting Report`);
    /* determine method--shared-equally vs account-occupants (default is shared-equally) */
    const accountKeys = Array.from(accounts.keys());
    const cabinPrefix = 'J';
    /* get cost record for this year--most recent not greater than this year */
    const cost = costs.get('2023'); // hardcoding for now, but: costs.get(`${year}`);
    const payments = new Map();
    let sharedCosts = 0;
    const directPayments = [];
    for (let accountKey of accountKeys)
        payments.set(accountKey, 0); /* initialize all account payments */
    if (cost === undefined)
        console.error(`cannot get ${year} Cost record`);
    else {
        const storagePurchaser = 'P'; //### obviously, shouldn't be hardcoded--how should we store in reservations?
        const storageCost = cost.storage;
        accumulate(storagePurchaser, payments, cost.storage);
        sharedCosts += storageCost;
        /* loop over reservations: */
        for (let reservation of reservations) {
            if (reservation.arrival.startsWith(`${year}`)) {
                const purchaser = slashedValues(reservation.purchaser)[0];
                const occupant = slashedValues(reservation.occupants, false)[0];
                accumulate(purchaser, payments, cost.reservation);
                sharedCosts += cost.reservation;
                if (reservation.cancelled > 0) {
                    accumulate(purchaser, payments, cost.cancellation);
                    sharedCosts += cost.cancellation;
                }
                const costOfSite = cost.site * (reservation.reserved - reservation.cancelled);
                accumulate(purchaser, payments, costOfSite);
                sharedCosts += costOfSite;
                /* add any direct payments (e.g., cabin surcharge) */
                if (reservation.site.toString().startsWith(cabinPrefix) && occupant != purchaser) {
                    const amount = (cost.cabin - cost.site) * (reservation.reserved - reservation.cancelled);
                    const directPayment = { from: occupant, to: purchaser, amount: amount };
                    directPayments.push(directPayment);
                }
            }
        }
        const perPersonCost = sharedCosts / accountKeys.length;
        console.log(`Total shared cost: ${sharedCosts.toFixed(2)} Per person: ${perPersonCost.toFixed(2)}`);
        console.log('Payments:');
        for (let accountKey of accountKeys) {
            const account = accounts.get(accountKey);
            const totalPayments = payments.get(accountKey);
            const overpaid = totalPayments - perPersonCost;
            const label = (totalPayments <= perPersonCost) ? 'underpaid' : 'overpaid';
            console.log(`  ${account.name}: ${totalPayments.toFixed(2)} (${label}: ${Math.abs(overpaid).toFixed(2)})`);
        }
        if (directPayments.length) {
            console.log('Cabin Compensations:');
            for (let directPayment of directPayments) {
                const from = accounts.get(directPayment.from);
                const to = accounts.get(directPayment.to);
                if (from !== undefined && to !== undefined) {
                    console.log(`  ${from.name} owes ${to.name} ${directPayment.amount.toFixed(2)}`);
                }
            }
        }
    }
}
function accumulate(key, map, amount) {
    const currentAmount = map.get(key);
    if (currentAmount !== undefined) {
        map.set(key, currentAmount + amount);
    }
}
