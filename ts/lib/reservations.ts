export type Reservation = {
	site: string;
	arrival: string;
	days: number;
	account: string;
};

export type AccountColors = {
	[account: string]: string;
};

type ExpandedReservation = {
	site: number;
	arrivalDate: Date;
	days: number;
	account: string;
	column: number;
};	

type SiteReservations = {
	[site: string]: ExpandedReservation[];
};	

export function displayReservationTable(
	tableElement: HTMLTableElement,
	thisYear: number,
	reservations: Reservation[],
	accountColors: AccountColors
) {
	let siteReservations: SiteReservations = {};
	let beginDate: Date|null = null;
	let endDate: Date|null = null;
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
		if (arrivalYear == thisYear) { /** selection criteria */
			let lastDay = new Date(arrival);
			lastDay.setDate(lastDay.getDate() + (reservation.days - 1));
			if (beginDate === null || beginDate > arrival) beginDate = new Date(arrival.getTime());
			if (endDate === null || endDate < lastDay) endDate = new Date(lastDay.getTime());
			let expandedReservation: ExpandedReservation = {
				site: numericSite(`${reservation.site}`),
				arrivalDate: new Date(arrival.getTime()),
				days: reservation.days,
				account: reservation.account,
				/** because we've sorted reservations by arrival date above, we
				 * know that 'beginDate' has been set and can already calculate
				 * the table column in which this reservation belongs
				 */
				column: Math.round((arrival.getTime() - beginDate!.getTime()) / (1000 * 60 * 60 * 24)),
			};
			if (!siteReservations[reservation.site]) {
				/** initialize siteReservations entry */
				siteReservations[reservation.site] = [];
			}
			siteReservations[reservation.site].push(expandedReservation);
		}
	}

	writeTableHeadings(tableElement, beginDate!, endDate!)
	writeTableRows(tableElement, siteReservations, accountColors);
}

function writeTableHeadings(tableElement: HTMLTableElement, beginDate: Date, endDate: Date) {
	const Days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	let columnHeadings: string[] = [];
	columnHeadings.push('Site');
	let headingDate = new Date(beginDate.getTime());
	while (headingDate <= endDate) {
		let headingDateMonth = headingDate.getMonth() + 1;
		let headingDateDate = headingDate.getDate();
		let headingDateDay = Days[headingDate.getDay()];
		columnHeadings.push(`${headingDateDay} ${headingDateMonth}/${headingDateDate}`)
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

function writeTableRows(tableElement: HTMLTableElement, siteReservations: SiteReservations, accountColors: AccountColors) {
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
			let account = siteReservations[site][reservation].account;
			let days = siteReservations[site][reservation].days;
			let color = 'lightgray'; /** default color when account color is not found */
			if (accountColors[account]) color = accountColors[account];

			/** insert a (spanned) column representing unreserved date(s) before this reservation */
			if (column > nextColumn) {
				let unreservedDays = column - nextColumn;
				siteItemElement = document.createElement('td');
				siteItemElement.innerText = '';
				if (unreservedDays > 1) siteItemElement.colSpan = unreservedDays;
				siteRowElement.append(siteItemElement);
				nextColumn += unreservedDays;
			}

			/** add reservation item */
			siteItemElement = document.createElement('td');
			siteItemElement.innerText = account;
			if (days > 1) siteItemElement.colSpan = days;
			siteItemElement.style.backgroundColor = color;
			siteItemElement.style.textAlign = 'center';
			siteRowElement.append(siteItemElement);
			nextColumn += days;
		}
		tableElement.append(siteRowElement);
	}
}

function numericSite(site: string) {
	/** convert site from string ('J26') to number (26), removing non-digit characters */
	let siteNumber = 0;
    site = site.replace(/\D/g, '');
    if (site) siteNumber = Number(site);
	return siteNumber;
}

function sortReservations(reservations: Reservation[]){
	/** sort by arrival date, days */
	reservations.sort((a, b) => {
		if (a.arrival < b.arrival) return -1;
		else if (a.arrival > b.arrival) return 1;
		else if (a.days < b.days) return -1;
		else if (a.days > b.days) return 1;
		return 0;
	});
}

function sortSiteReservations(siteReservations: SiteReservations) {
	/** sort by arrival date, days, site number */
	let siteKeys = Object.keys(siteReservations);
	siteKeys.sort((a, b) => {
		if (siteReservations[a][0].arrivalDate < siteReservations[b][0].arrivalDate) return -1;
		else if (siteReservations[a][0].arrivalDate > siteReservations[b][0].arrivalDate) return 1;
		else if (siteReservations[a][0].days < siteReservations[b][0].days) return -1;
		else if (siteReservations[a][0].days > siteReservations[b][0].days) return 1;
		else if (siteReservations[a][0].site < siteReservations[b][0].site) return -1;
		else if (siteReservations[a][0].site > siteReservations[b][0].site) return 1;
		return 0;
	});
	return siteKeys;
}
