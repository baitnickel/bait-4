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
	groups: Map<string, T.CampGroup>,
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
	writeTableRows(tableElement, adjustedReservations, groups, radioButtons);
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
	groups: Map<string, T.CampGroup>,
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
			const groupKey = purchaserValues[0];
			const group = groups.get(groupKey);
			let groupName = ''; 
			let groupColor = 'lightgray'; /* default color when group is unknown */
			if (group !== undefined) {
				groupName = group.name;
				groupColor = group.color;
			}
			if (purchaserValues[1].length) groupName = purchaserValues[1];
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
			const camperName = (radioButtons.activeButton == 'Purchasers') ? groupName : occupantNames;
			siteItemElement.innerText = camperName;
			if (nightsReserved > 1) siteItemElement.colSpan = nightsReserved;
			siteItemElement.style.backgroundColor = groupColor;
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
 * two values separated by a slash. In both cases, the first value is a Group
 * key. For Purchaser, the second value is a Reservation Group alias (one
 * person may have multiple reservation groups). For Occupants, the second
 * value is a free-form list of occupant names. (Storing two different values in
 * a single field is very bad coding practice! It's being done here merely to
 * simplify the YAML data entry, and might be abandoned once we provide a
 * suitable data entry UI--a rather difficult challenge in static website.)
 * 
 * When a Purchaser field has only one value (no slash), it is taken as a
 * Group key. When an Occupants field has only one value (no slash), it is
 * taken as a free-form list of occupant names (or "Main Site", etc.).
 * 
 * Given a Purchaser or Occupants string, return a two-element array. Element 0
 * contains a Group key or an empty string. For a Purchaser field, Element 1
 * will contain a reservation alias or an empty string. For an Occupants field,
 * Element 1 will contain a free-form string or an empty string. By default, we
 * assume the string is a Purchaser; set the optional `purchaser` parameter to
 * false when processing Occupants.
 */
export function slashedValues(value: string, purchaser = true) {
	const values: string[] = [];
	const separator = '/'
	let groupKey = '';
	let freeForm = '';
	const i = value.indexOf(separator);
	if (i < 0) { /* no slash */
		if (purchaser) groupKey = value;
		else freeForm = value;
	}
	else {
		groupKey = value.slice(0,i);
		freeForm = value.slice(i+1);
	}
	values.push(groupKey.trim());
	values.push(freeForm.trim());
	return values;
}

type Transaction = {from: string, to: string, amount: number; purpose: string };
/**
 * Given the 4-digit `year`, an array of `reservations` for that year, an
 * `groups` map, and a `costs` map, return an array of plain text lines
 * representing an accounting report.
 */
export function accounting(
	year: number,
	groups: Map<string, T.CampGroup>,
	reservations: T.Reservation[],
	adjustments: T.CampAdjustment[],
	costs: T.CampCosts[],
) {
	const reportLines: string[] = [];

	/** 
	 * Determine method--equal shares vs weight of group-occupants (default is
	 * equal shares). This might be determined by a UI switch, so that users can
	 * compare results of each method.
	 * 
	 * This suggests the need for an `{group: ID, share: percentage}`
	 * object, where entries are set dynamically once the method is
	 * determined and the purchaser/occupants is known.
	 * 
	 * There are probably too many different maps keyed by group ID; it might
	 * make sense to create one dynamic object representing all the group data
	 * we collect here: name, share, payments, receipts, etc. It might be nice
	 * to create multiple functions to fill in these various data--modularize to
	 * simplify the main thread here.
	 */
	const groupKeys = Array.from(groups.keys());
	const participatingGroups: string[] = []; /* keys of valid groups present as purchasers and/or occupants */
	const cabinPrefix = 'J';
	const cost = currentCosts(year, costs);
	const payments = new Map<string, number>(); /* key is groups.key */
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
	 * groups, but the number of nights should be added to B's weight. In this
	 * scenario, B's receipts might nullify the shared expenses and lessen B's
	 * weight?
	 */
	for (let groupKey of groupKeys) payments.set(groupKey, 0); /* initialize all group payments */
	if (cost === undefined) reportLines.push(`cannot get ${year} Costs\n`);
	else {

		/* loop over reservations: */ //### sort by group/site/arrival so we can report transactions here
		// report (e.g.): Pete: 6 reservations, 32 nights total, $1,200 total 
		for (let reservation of reservations) {
			if (reservation.arrival.startsWith(`${year}`)) {
				const purchaser = slashedValues(reservation.purchaser)[0];
				const occupant = slashedValues(reservation.occupants, false)[0];
				addParticipant(purchaser, participatingGroups, groupKeys);
				addParticipant(occupant, participatingGroups, groupKeys);
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

		// const storagePurchaser = 'P'; //### obviously, shouldn't be hardcoded--how should we store in reservations?
		// const storageCost = 356 //### cost.storage;
		// addParticipant(storagePurchaser, participatingGroups, groupKeys);
		// accumulate(storagePurchaser, payments, storageCost);
		// sharedExpenses += storageCost;

		/* process and report adjustments */
		/**
		 * ###
		 * paid is easily handled - add it to the payer's payments
		 * received is tricky ... we can reduce the receivers payments (as we're doing below),
		 * but I don't think that's correct
		 * should it be paid to the purchaser of the site in question? we don't have the data!
		 * the receiver owes direct payments to the other groups ... we can add these here,
		 * but we need to know all the participating groups (and the group count, to divide
		 * the money evenly).
		 */
		let foundAdjustments = false;
		for (const adjustment of adjustments) {
			if (adjustment.year == year && adjustment.amount != 0 && groups.get(adjustment.group) !== undefined) {
				if (!foundAdjustments) {
					foundAdjustments = true;
					reportLines.push('Adjustments:\n');
				}
				const adjustmentGroup = groups.get(adjustment.group)!;
				const paidOrReceived = (adjustment.amount >= 0) ? 'paid' : 'received';
				reportLines.push(`  ${adjustmentGroup.name} ${paidOrReceived} ${dollars(Math.abs(adjustment.amount))} for ${adjustment.for}\n`);
				addParticipant(adjustment.group, participatingGroups, groupKeys);
				accumulate(adjustment.group, payments, adjustment.amount);
				sharedExpenses += adjustment.amount;
			}
		}
		if (foundAdjustments) reportLines.push('\n');

		const perAccountShare = sharedExpenses / groupKeys.length;
		// reportLines.push(`Total shared expenses: ${sharedExpenses.toFixed(2)}\n`);
		reportLines.push(`Total Shared Expenses: ${dollars(sharedExpenses)}\n`);
		reportLines.push(`  1/${participatingGroups.length} share: ${dollars(perAccountShare)}\n`);
		reportLines.push('\nPayments:\n');
		for (let groupKey of groupKeys) {
			const group = groups.get(groupKey)!;
			const totalPayments = payments.get(groupKey)!;
			const overpaid = totalPayments - perAccountShare;
			const label = (totalPayments <= perAccountShare) ? 'underpaid' : 'overpaid';
			reportLines.push(`  ${group.name}: ${dollars(totalPayments)} (${label}: ${dollars(Math.abs(overpaid))})\n`);
		}

		// /** At this point, the only `directPayments` are cabin surcharge payments */
		// if (directPayments.length) {
		// 	reportLines.push('Cabin Compensations:\n');
		// 	for (let directPayment of directPayments) {
		// 		const from = groups.get(directPayment.from);
		// 		const to = groups.get(directPayment.to);
		// 		if (from !== undefined && to !== undefined) {
		// 			reportLines.push(`  ${from.name} owes ${to.name} ${directPayment.amount.toFixed(2)}\n`);
		// 		}
		// 	}
		// }

		/**
		 * We will only perform this bit of accounting when there are exactly 3
		 * groups involved. Writing a generic function may be very complex,
		 * and our 3-group assumption is pretty safe for now.
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
			const underpayers: string[] = []/* underpayer group keys */
			const overpayers: string[] = []/* overpayer group keys */
			for (const [group, payment] of payments) {
				if (payment - perAccountShare < 0) underpayers.push(group);
				else overpayers.push(group)
			}
			if (underpayers.length == 1) { /*   + + -: Dp(c, a, a.overpayment); Dp(c, b, b.overpayment); */
				/* underpayer group owes each overpayer group each overpayer amount */
				for (const overpayer of overpayers) {
					const overpaidAmount = payments.get(overpayer)! - perAccountShare;
					directPayments.push({from: underpayers[0], to: overpayer, amount: overpaidAmount, purpose: ''});
				}
			}
			else if (underpayers.length == 2) { /*   + - -: Dp(b, a, b.underpayment); Dp(c, a, c.underpayment); */
				/* each underpayer group owes the overpayer group each underpayment amount */
				for (const underpayer of underpayers) {
					const underpaidAmount = perAccountShare - payments.get(underpayer)!;
					directPayments.push({from: underpayer, to: overpayers[0], amount: underpaidAmount, purpose: ''});
				}
			}
			// else { /* each group owes 0 */ }
			
			/**
			 * write "Bottom Line" heading line
			 * sort directPayments by from/to
			 * loop over and accumulate amounts for same from/to
			 *     report each from/to
			 */
			reportLines.push('\nAmounts Owed:\n');
			for (const directPayment of directPayments) {
				const fromAccount = groups.get(directPayment.from)!;
				const toAccount = groups.get(directPayment.to)!;
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
function currentCosts(year: number, costs: T.CampCosts[]) {
	let currentCosts: T.CampCosts = { year: 0, site: 0, cabin: 0, reservation: 0, cancellation: 0 };
	if (costs.length >= 1) {
		costs.sort((a, b) => { return b.year - a.year }); /* sort by years descending */
		for (const cost of costs) {
			if (cost.year <= year) {
				currentCosts = cost;
				break;
			}
		}
	}
	return currentCosts;
}

function accumulate(key: string, map: Map<string, number>, amount: number) {
	const currentAmount = map.get(key);
	if (currentAmount !== undefined) {
		map.set(key, currentAmount + amount);
	}
}

function addParticipant(groupKey: string, participatingGroups: string[], groupKeys: string[]) {
	if (groupKeys.includes(groupKey) && !participatingGroups.includes(groupKey)) {
		participatingGroups.push(groupKey);
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