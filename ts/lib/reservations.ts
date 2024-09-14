import * as T from './types.js';
import * as Widgets from './widgets.js';

/**
 * Special module to support Campsite Reservation tables
 */

type AdjustedReservation = {
	site: number|string;
	arrivalDate: Date;
	nightsReserved: number;
	purchaser: string;
	occupants: string;
	column: number;
};	

type AdjustedReservations = {
	[site: string]: AdjustedReservation[];
};	

export function displayReservationTable(
	tableElement: HTMLTableElement,
	thisYear: number,
	reservations: T.Reservation[],
	accounts: Map<string, T.CampAccount>,
	radioButtons: Widgets.RadioButtons,
) {
	let adjustedReservations: AdjustedReservations = {};
	let beginDate: Date|null = null;
	let endDate: Date|null = null;
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
			if (beginDate === null || beginDate > arrival) beginDate = new Date(arrival.getTime());
			if (endDate === null || endDate < lastDay) endDate = new Date(lastDay.getTime());
			let adjustedReservation: AdjustedReservation = {
				site: numericSite(`${reservation.site}`),
				arrivalDate: new Date(arrival.getTime()),
				nightsReserved: reservation.reserved - reservation.cancelled,
				purchaser: reservation.purchaser,
				occupants: reservation.occupants,
				/** because we've sorted reservations by arrival date above, we
				 * know that 'beginDate' has been set and can already calculate
				 * the table column in which this reservation belongs
				 */
				column: Math.round((arrival.getTime() - beginDate!.getTime()) / (1000 * 60 * 60 * 24)),
			};
			if (!adjustedReservations[reservation.site]) {
				/** initialize adjustedReservations entry */
				adjustedReservations[reservation.site] = [];
			}
			adjustedReservations[reservation.site].push(adjustedReservation);
		}
	}

	writeTableHeadings(tableElement, beginDate!, endDate!)
	writeTableRows(tableElement, adjustedReservations, accounts, radioButtons);
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

function writeTableRows(
	tableElement: HTMLTableElement,
	adjustedReservations: AdjustedReservations,
	accounts: Map<string, T.CampAccount>,
	radioButtons: Widgets.RadioButtons
) {
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
			if (purchaserValues[1].length) accountName = purchaserValues[1];
			const occupantValues = slashedValues(occupants, false);
			const occupantNames = (occupantValues[1].length) ? occupantValues[1] : '';

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
			const camperName = (radioButtons.activeButton == 'Purchasers') ? accountName : occupantNames;
			siteItemElement.innerText = camperName;
			if (nightsReserved > 1) siteItemElement.colSpan = nightsReserved;
			siteItemElement.style.backgroundColor = accountColor;
			siteItemElement.style.textAlign = 'center';
			siteRowElement.append(siteItemElement);
			nextColumn += nightsReserved;
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

function sortReservations(reservations: T.Reservation[]){
	/** sort by arrival date, nightsReserved */
	reservations.sort((a, b) => {
		if (a.arrival < b.arrival) return -1;
		else if (a.arrival > b.arrival) return 1;
		else if ((a.reserved - a.cancelled) < (b.reserved - b.cancelled)) return -1;
		else if ((a.reserved - a.cancelled) > (b.reserved - b.cancelled)) return 1;
		return 0;
	});
}

function sortAdjustedReservations(adjustedReservations: AdjustedReservations) {
	/** sort by arrival date, nightsReserved, site number */
	let siteKeys = Object.keys(adjustedReservations);
	siteKeys.sort((a, b) => {
		if (adjustedReservations[a][0].arrivalDate < adjustedReservations[b][0].arrivalDate) return -1;
		else if (adjustedReservations[a][0].arrivalDate > adjustedReservations[b][0].arrivalDate) return 1;
		else if (adjustedReservations[a][0].nightsReserved < adjustedReservations[b][0].nightsReserved) return -1;
		else if (adjustedReservations[a][0].nightsReserved > adjustedReservations[b][0].nightsReserved) return 1;
		else if (adjustedReservations[a][0].site < adjustedReservations[b][0].site) return -1;
		else if (adjustedReservations[a][0].site > adjustedReservations[b][0].site) return 1;
		return 0;
	});
	return siteKeys;
}

/**
 * In the Reservation Purchaser and Occupants fields, the strings are typically
 * two values separated by a slash. In both cases, the first value is an Account
 * key. For Purchaser, the second value is a Reservation Account alias (one
 * person may have multiple reservation accounts). For Occupants, the second
 * value is a free-form list of occupant names. (Storing two different values in
 * a single field is very bad coding practice! It's being done here merely to
 * simplify the YAML data entry, and might be abandoned once we provide a
 * suitable data entry UI--a rather difficult challenge in static website.)
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
export function slashedValues(value: string, purchaser = true) {
	const values: string[] = [];
	const separator = '/'
	let accountKey = '';
	let freeForm = '';
	const i = value.indexOf(separator);
	if (i < 0) { /* no slash */
		if (purchaser) accountKey = value;
		else freeForm = value;
	}
	else {
		accountKey = value.slice(0,i);
		freeForm = value.slice(i+1);
	}
	values.push(accountKey.trim());
	values.push(freeForm.trim());
	return values;
}

type Transaction = {from: string, to: string, amount: number; purpose: string };
/**
 * Given the 4-digit `year`, an array of `reservations` for that year, an
 * `accounts` map, and a `costs` map, return an array of plain text lines
 * representing an accounting report.
 */
export function accounting(
	year: number,
	reservations: T.Reservation[],
	accounts: Map<string, T.CampAccount>,
	costs: Map<string, T.CampCosts>,
) {
	const reportLines: string[] = [];
	// reportLines.push(`${year} Accounting Report\n\n`);

	/** 
	 * Determine method--equal shares vs weight of account-occupants (default is
	 * equal shares). This might be determined by a UI switch, so that users can
	 * compare results of each method.
	 * 
	 * This suggests the need for an `{account: ID, share: percentage}`
	 * object, where entries are set dynamically once the method is
	 * determined and the purchaser/occupants is known.
	 * 
	 * There are probably too many different maps keyed by account ID; it might
	 * make sense to create one dynamic object representing all the account data
	 * we collect here: name, share, payments, receipts, etc. It might be nice
	 * to create multiple functions to fill in these various data--modularize to
	 * simplify the main thread here.
	 */
	const accountKeys = Array.from(accounts.keys());
	const participants: string[] = []; /* keys of valid account groups present as purchasers and/or occupants */
	const cabinPrefix = 'J';
	const cost = currentCosts(year.toString(), costs);
	const payments = new Map<string, number>(); /* key is accounts.key */
	let sharedExpenses = 0;
	const directPayments: Transaction[] = [];
	const directReceipts: Transaction[] = [];
	/**
	 * In addition to directPayments, we need directReceipts. If I invite some
	 * of my friends to join us in a site I haven't booked myself, and I am
	 * reimbursed directly by my friends, what is the proper accounting here,
	 * what are the options? In any case, we need a transaction for receipts.
	 * 
	 * Under a weighted-share approach, when a site is purchased by A and
	 * occupied by B's family/friends, the fees should be shared across all
	 * accounts, but the number of nights should be added to B's weight. In this
	 * scenario, B's receipts might nullify the shared expenses and lessen B's
	 * weight?
	 */
	for (let accountKey of accountKeys) payments.set(accountKey, 0); /* initialize all account payments */
	if (cost === undefined) reportLines.push(`cannot get ${year} Cost record\n`);
	else {

		const storagePurchaser = 'P'; //### obviously, shouldn't be hardcoded--how should we store in reservations?
		const storageCost = cost.storage;
		addParticipant(storagePurchaser, participants, accountKeys);
		accumulate(storagePurchaser, payments, cost.storage);
		sharedExpenses += storageCost;

		/* loop over reservations: */ //### sort by account/site/arrival so we can report transactions here
		for (let reservation of reservations) {
			if (reservation.arrival.startsWith(`${year}`)) {
				const purchaser = slashedValues(reservation.purchaser)[0];
				const occupant = slashedValues(reservation.occupants, false)[0];
				addParticipant(purchaser, participants, accountKeys);
				addParticipant(occupant, participants, accountKeys);
				accumulate(purchaser, payments, cost.reservation);
				sharedExpenses += cost.reservation;
				if (reservation.cancelled > 0) {
					accumulate(purchaser, payments, cost.cancellation);
					sharedExpenses += cost.cancellation;
				}
				const costOfSite = cost.site * (reservation.reserved - reservation.cancelled);
				accumulate(purchaser, payments, costOfSite);
				sharedExpenses += costOfSite;
				/* add any direct payments (e.g., cabin surcharge) */
				if (reservation.site.toString().startsWith(cabinPrefix) && occupant != purchaser) {
					const amount = (cost.cabin - cost.site) * (reservation.reserved - reservation.cancelled);
					// const directPayment = { from: occupant, to: purchaser, amount: amount, purpose: 'Cabin Surcharge' };
					// directPayments.push(directPayment);
					directPayments.push({from: occupant, to: purchaser, amount: amount, purpose: 'Cabin Surcharge'});
				}
			}
		}
		const perAccountShare = sharedExpenses / accountKeys.length;
		// reportLines.push(`Total shared expenses: ${sharedExpenses.toFixed(2)}\n`);
		reportLines.push(`Total shared expenses: ${dollars(sharedExpenses)}\n`);
		reportLines.push(`  1/${participants.length} share: ${dollars(perAccountShare)}\n`);
		reportLines.push('\nPayments:\n');
		for (let accountKey of accountKeys) {
			const account = accounts.get(accountKey)!;
			const totalPayments = payments.get(accountKey)!;
			const overpaid = totalPayments - perAccountShare;
			const label = (totalPayments <= perAccountShare) ? 'underpaid' : 'overpaid';
			reportLines.push(`  ${account.name}: ${dollars(totalPayments)} (${label}: ${dollars(Math.abs(overpaid))})\n`);
		}

		// /** At this point, the only `directPayments` are cabin surcharge payments */
		// if (directPayments.length) {
		// 	reportLines.push('Cabin Compensations:\n');
		// 	for (let directPayment of directPayments) {
		// 		const from = accounts.get(directPayment.from);
		// 		const to = accounts.get(directPayment.to);
		// 		if (from !== undefined && to !== undefined) {
		// 			reportLines.push(`  ${from.name} owes ${to.name} ${directPayment.amount.toFixed(2)}\n`);
		// 		}
		// 	}
		// }

		/**
		 * We will only perform this bit of accounting when there are exactly 3
		 * accounts involved. Writing a generic function may be very complex,
		 * and our 3-account assumption is pretty safe for now.
		 * 
		 * One possibility: use a bubble-up algorithm. sort underpayers by
		 * amount ascending (Fred 1.99, Mary 11.99, Daisy 55.00 ...). Fred sends
		 * all of his underpayment to Mary, Mary sends all of her own
		 * underpayment plus the amount received from Fred to Daisy, Daisy
		 * follows the same approach. When the last underpayer is reached, he or
		 * she pays each of the overpayers' their overpayment amount. Only the
		 * last underpayer needs to make multiple payments, which could be seen
		 * as fitting, since they apparently carried the lightest load in the
		 * reservation process.
		 */
		if (payments.size == 3) {
			const underpayers: string[] = []/* underpayer account keys */
			const overpayers: string[] = []/* overpayer account keys */
			for (const [account, payment] of payments) {
				if (payment - perAccountShare < 0) underpayers.push(account);
				else overpayers.push(account)
			}
			if (underpayers.length == 1) { /*   + + -: Dp(c, a, a.overpayment); Dp(c, b, b.overpayment); */
				/* underpayer account owes each overpayer account each overpayer amount */
				for (const overpayer of overpayers) {
					const overpaidAmount = payments.get(overpayer)! - perAccountShare;
					directPayments.push({from: underpayers[0], to: overpayer, amount: overpaidAmount, purpose: ''});
				}
			}
			else if (underpayers.length == 2) { /*   + - -: Dp(b, a, b.underpayment); Dp(c, a, c.underpayment); */
				/* each underpayer account owes the overpayer account each underpayment amount */
				for (const underpayer of underpayers) {
					const underpaidAmount = perAccountShare - payments.get(underpayer)!;
					directPayments.push({from: underpayer, to: overpayers[0], amount: underpaidAmount, purpose: ''});
				}
			}
			// else { /* each account owes 0 */ }
			
			/**
			 * write "Bottom Line" heading line
			 * sort directPayments by from/to
			 * loop over and accumulate amounts for same from/to
			 *     report each from/to
			 */
			reportLines.push('\nReimbursements:\n');
			for (const directPayment of directPayments) {
				const fromAccount = accounts.get(directPayment.from)!;
				const toAccount = accounts.get(directPayment.to)!;
				const purpose = (directPayment.purpose) ? ` (includes ${directPayment.purpose})` : ''
				reportLines.push(`  ${fromAccount.name} owes ${toAccount.name} ${dollars(directPayment.amount)}${purpose}\n`);
			}
		}
	}
	return reportLines;
}

/**
 * Return the current `costs` object, "current" meaning the most recent year not
 * greater than the given `year`.
 */
function currentCosts(year: string, costs: Map<string, T.CampCosts>) {
	let cost: T.CampCosts = { site: 0, cabin: 0, storage: 0, reservation: 0, cancellation: 0 };
	if (costs.size >= 1) {
		const costYears = Array.from(costs.keys());
		if (costs.size == 1) cost = costs.get(costYears[0])!;
		else {
			/* sort years descending */
			costYears.sort((a, b) => {
				if (a < b) return 1;
				else if (a > b) return -1;
				else return 0
			});
			for (let costYear of costYears) {
				if (costYear <= year) {
					cost = costs.get(costYear)!;
					break;
				}
			}
		}
	}
	return cost;
}

function accumulate(key: string, map: Map<string, number>, amount: number) {
	const currentAmount = map.get(key);
	if (currentAmount !== undefined) {
		map.set(key, currentAmount + amount);
	}
}

function addParticipant(groupKey: string, participants: string[], accountKeys: string[]) {
	if (accountKeys.includes(groupKey) && !participants.includes(groupKey)) {
		participants.push(groupKey);
	}
}

/**
 * Alternative to `number.toFixed(2)`. Use the host default language with
 * options for number formatting.
 */
function dollars(number: number) {
	// Might also use Unicode's small dollar sign ('\uFE69'),
	// but this appears to force monospace fonts.
	return '$' + number.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2,})
}