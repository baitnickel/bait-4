import * as T from './types.js';
import * as Widgets from './widgets.js';

/**
 * Special module to support the `camp` module's reservation tables and expense
 * accounting.
 */

const CabinSitePattern = new RegExp(/^J/, 'i'); /* campsite IDs starting with "J" or "j" are cabins */
const UnknownGroupColor = 'lightgray'; /* default color when group is unknown */

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
			let groupColor = UnknownGroupColor; /* default color */
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
	/** convert site from string to number (e.g., 'J26' => 26), removing non-digit characters */
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
	/** 
	 * Determine method--equal shares vs weight of group-occupants (default is
	 * equal shares). This might be determined by a UI switch, so that users can
	 * compare results of each method.
	 * 
	 * Under a weighted-share approach, when a site is purchased by A and
	 * occupied by B's family/friends, the fees should be shared across all
	 * groups, but the number of nights should be added to B's weight. In this
	 * scenario, B's receipts might nullify the shared expenses and lessen B's
	 * weight?
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

	const reportLines: string[] = [];
	const groupKeys = Array.from(groups.keys());
	const participatingGroups: string[] = []; /* keys of valid groups present as purchasers and/or occupants */
	const cost = currentCosts(year, costs);
	const payments = new Map<string, number>(); /* key is groups.key */
	const directPayments: Transaction[] = [];
	const directReceipts: Transaction[] = [];
	let sharedExpenses = 0;

	for (let groupKey of groupKeys) payments.set(groupKey, 0); /* initialize all group payments */
	if (cost === undefined) reportLines.push(`cannot get ${year} Costs\n`);
	else {
		sharedExpenses += processReservations(year, reservations, cost, groupKeys, participatingGroups, payments, directPayments, reportLines);
		sharedExpenses += processAdjustments(year, adjustments, groups, groupKeys, participatingGroups, payments, reportLines);
		processAmountsPaid(groups, participatingGroups, payments, sharedExpenses, reportLines);
		processAmountsOwed(year, sharedExpenses, groups, participatingGroups, payments, adjustments, directPayments, reportLines);
	}
	return reportLines;
}

function processReservations(
	year: number,
	reservations: T.Reservation[],
	cost: T.CampCosts,
	groupKeys: string[],
	participatingGroups: string[],
	payments: Map<string, number>,
	directPayments: Transaction[],
	reportLines: string[],
) {
	let sharedExpenses = 0;
	let sitesReserved = 0;
	let sitesCancelled = 0; /* entire reservation cancelled */
	let sitesPartiallyCancelled = 0;
	let totalNights = 0;
	let siteExpenses = 0;
	let reservationFees = 0;
	let cancellationFees = 0;
	for (let reservation of reservations) {
		if (reservation.arrival.startsWith(`${year}`)) {
			sitesReserved += 1;
			const purchaser = slashedValues(reservation.purchaser)[0];
			const occupant = slashedValues(reservation.occupants, false)[0];
			addParticipant(purchaser, participatingGroups, groupKeys);
			addParticipant(occupant, participatingGroups, groupKeys);
			accumulate(purchaser, payments, cost.reservation);
			reservationFees += cost.reservation;
			sharedExpenses += cost.reservation;
			if (reservation.cancelled > 0) {
				accumulate(purchaser, payments, cost.cancellation);
				cancellationFees += cost.cancellation;
				sharedExpenses += cost.cancellation;
			}
			const nightsUsed = reservation.reserved - reservation.cancelled;
			totalNights += nightsUsed;
			if (nightsUsed == 0) sitesCancelled += 1;
			else if (nightsUsed < reservation.reserved) sitesPartiallyCancelled += 1;
			const costOfSite = cost.site * nightsUsed;
			accumulate(purchaser, payments, costOfSite);
			siteExpenses += costOfSite;
			sharedExpenses += costOfSite;
			/* add any direct payments (e.g., cabin surcharge) */
			if (reservation.site.toString().match(CabinSitePattern) && occupant != purchaser) {
				const amount = (cost.cabin - cost.site) * nightsUsed;
				directPayments.push({from: occupant, to: purchaser, amount: amount, purpose: 'Cabin Surcharge'});
			}
		}
	}
	reportLines.push('Shared Campsite Reservation Expenses:\n');
	reportLines.push(`  Number of Sites Reserved: ${sitesReserved} (${sitesCancelled} completely cancelled, ${sitesPartiallyCancelled} partially cancelled)\n`);
	reportLines.push(`  ${totalNights} nights @ ${dollars(cost.site)}/night: ${dollars(siteExpenses)}\n`);
	reportLines.push(`  Total Reservation Fees: ${dollars(reservationFees)}\n`);
	reportLines.push(`  Total Cancellation Fees: ${dollars(cancellationFees)}\n`);
	return sharedExpenses;
}

function processAdjustments(
	year: number,
	adjustments: T.CampAdjustment[],
	groups: Map<string, T.CampGroup>,
	groupKeys: string[],
	participatingGroups: string[],
	payments: Map<string, number>,
	reportLines: string[],
) {
	let sharedExpenses = 0;
	let foundAdjustments = false;
	for (const adjustment of adjustments) {
		const uppercaseGroup = adjustment.group.toUpperCase(); /* group keys are uppercase */
		/* only adjustments with amounts greater than 0 are included as shared expenses */
		if (adjustment.year == year && adjustment.amount > 0 && groups.get(uppercaseGroup) !== undefined) {
			if (!foundAdjustments) {
				foundAdjustments = true;
				reportLines.push('\nOther Shared Expenses:\n');
			}
			const adjustmentGroup = groups.get(uppercaseGroup)!;
			reportLines.push(`  ${adjustmentGroup.name} paid ${dollars(Math.abs(adjustment.amount))} for ${adjustment.for}\n`);
			addParticipant(uppercaseGroup, participatingGroups, groupKeys);
			accumulate(uppercaseGroup, payments, adjustment.amount);
			sharedExpenses += adjustment.amount;
		}
	}
	if (foundAdjustments) reportLines.push('\n');
	return sharedExpenses;
}

function processAmountsPaid(
	groups: Map<string, T.CampGroup>,
	participatingGroups: string[],
	payments: Map<string, number>,
	sharedExpenses: number,
	reportLines: string[],
) {
	const perGroupShare = sharedExpenses / participatingGroups.length;
	reportLines.push(`Total Shared Expenses: ${dollars(sharedExpenses)}\n`);
	reportLines.push(`  1/${participatingGroups.length} share: ${dollars(perGroupShare)}\n`);
	reportLines.push('\nAmounts Paid:\n');
	participatingGroups.sort((a, b) => {
		const aPayments = payments.get(a)!;
		const bPayments = payments.get(b)!;
		return bPayments - aPayments; /* sort largest payment to smallest payment */
	});
	for (let groupKey of participatingGroups) {
		const group = groups.get(groupKey)!;
		const totalPayments = payments.get(groupKey)!;
		const overpaid = totalPayments - perGroupShare;
		const label = (totalPayments <= perGroupShare) ? 'underpaid' : 'overpaid';
		reportLines.push(`  ${group.name}: ${dollars(totalPayments)} (${label}: ${dollars(Math.abs(overpaid))})\n`);
	}
}

function processAmountsOwed(
	year: number,
	sharedExpenses: number,
	groups: Map<string, T.CampGroup>,
	participatingGroups: string[],
	payments: Map<string, number>,
	adjustments: T.CampAdjustment[],
	directPayments: Transaction[],
	reportLines: string[],
) {
	/**
	 * Get receipt adjustments and create direct payments for each one found. In
	 * the shared expenses method, receipts are distributed to all participants
	 * (other than the receiver, themselves) in equal amounts.
	 */
	for (const adjustment of adjustments) {
		const uppercaseGroup = adjustment.group.toUpperCase(); /* group keys must be uppercase */
		/* adjustments with amounts less than 0 are receipts and must create direct payments to all other groups */
		if (adjustment.year == year && adjustment.amount < 0 && groups.get(uppercaseGroup) !== undefined) {
			const amount = Math.abs(adjustment.amount) / participatingGroups.length;
			for (const participatingGroup of participatingGroups) {
				if (participatingGroup != uppercaseGroup) {
					directPayments.push({from: uppercaseGroup, to: participatingGroup, amount: amount, purpose: adjustment.for});
				}
			}
		}
	}

	/**
	 * Calculate each group's share of the expenses and create two arrays:
	 * - underpayers: Group Keys that owe money
	 * - overpayers: Group Keys the are owed money
	 */
	const perGroupShare = sharedExpenses / participatingGroups.length;
	const underpayers: string[] = [] /* underpayer group keys */
	const overpayers: string[] = [] /* overpayer group keys */
	for (const [group, payment] of payments) {
		if (payment - perGroupShare < 0) underpayers.push(group);
		else overpayers.push(group)
	}

	/**
	 * Create direct payments from underpayers to overpayers. We will
	 * "bubble-up" payments here. Each underpayer pays the next underpayer the
	 * accumulated amount of the underpayments. When the last underpayer is
	 * reached, he or she pays all of the overpayers what they are owed. This
	 * method ensures that only one underpayer needs to pay more than one
	 * person.
	 */
	let totalUnderpayments = 0;
	for (let i = 0; i < underpayers.length; i += 1) {
		totalUnderpayments += payments.get(underpayers[i])!;
		if ((i + 1) < underpayers.length) {
			/* there are more underpayers; pass the totalPayments to the next one */
			directPayments.push({from: underpayers[i], to: underpayers[i + 1], amount: totalUnderpayments, purpose: ''});
		}
		else {
			/* there are no more underpayers; pay all the overpayers everything they're owed */
			for (const overpayer of overpayers) {
				const overpayment = payments.get(overpayer)! - perGroupShare;
				directPayments.push({from: underpayers[i], to: overpayer, amount: overpayment, purpose: ''});
			}
		}
	}

	reportLines.push('\nAmounts Owed:\n');
	directPayments.sort((a, b) => {
		if (a.from < b.from) return -1;
		if (a.from > b.from) return 1;
		if (a.to < b.to) return -1;
		if (a.to > b.to) return 1;
		if (a.purpose < b.purpose) return -1;
		if (a.purpose > b.purpose) return 1;
		return (b.amount - a.amount);
	});

	/** ###
	 * Create an array of footnotes from the purposes encountered above. For
	 * each non-blank purpose within a from/to set, add a footnoteID to a list
	 * of footnoteIDs (for this from/to). Display the footnoteIDs (if any) for
	 * each reportLine below. Finally, display the footnotes beneath the
	 * "Amounts Owed" section.
	 */
	let sum = 0;
	for (let i = 0; i < directPayments.length; i += 1) {
		
		/* first from/to */
		if (i == 0
			|| directPayments[i].from != directPayments[i - 1].from
			|| directPayments[i].to != directPayments[i - 1].to
		) {
			sum = 0;
		}

		sum += directPayments[i].amount;

		/* last from/to */
		if (i == directPayments.length - 1
			|| directPayments[i].from != directPayments[i + 1].from
			|| directPayments[i].to != directPayments[i + 1].to
		) {
			const fromAccount = groups.get(directPayments[i].from)!;
			const toAccount = groups.get(directPayments[i].to)!;
			reportLines.push(`  ${fromAccount.name} owes ${toAccount.name} ${dollars(sum)}\n`);
		}
	}
}

/**
 * Return the current `costs` object, "current" meaning the object having the
 * most recent year not greater than the given `year`.
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
 * options for number formatting, e.g., to add thousands commas.
 */
function dollars(number: number) {
	// Might also use Unicode's small dollar sign ('\uFE69'),
	// but this appears to force monospace fonts.
	return '$' + number.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
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
 * contains a Group key or an empty string, trimmed and converted to uppercase.
 * For a Purchaser field, Element 1 will contain a trimmed reservation alias or
 * an empty string. For an Occupants field, Element 1 will contain a trimmed
 * free-form string or an empty string. By default, we assume the string is a
 * Purchaser; set the optional `purchaser` parameter to false when processing
 * Occupants.
 */
function slashedValues(value: string, purchaser = true) {
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
	values.push(groupKey.trim().toUpperCase());
	values.push(freeForm.trim());
	return values;
}
