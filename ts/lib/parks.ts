import * as Settings from './settings.js';
import * as Fetch from './fetch.js';

/**
 * Constants used in old functions:
 */

/** used in displayReservationTable */
const CheckInTime = '14:00:00.000-07:00'; /** 2:00pm PDT */
/** used in writeTableRows */
const ModificationSymbols = ['†', '‡']; /* symbols indicating reservation modifications--must be as many as ModificationLimit */
const UnknownGroupColor = 'lightgray'; /* default color when group is unknown */

/** used in processReservations */
const CabinSitePattern = new RegExp(/^J/, 'i'); /* campsite IDs starting with "J" or "j" are cabins */
const ModificationLimit = 2; /* maximum allowed reservation modifications (per reservation) */
/** used in processAmountsOwed and createUnderpayerPayments */
const NormalPurpose = '';

/**
 * This group of Types describes the raw data objects stored in our
 * pseudo-database (the YAML or JSON files stored in the ./data/camp directory).
 * Note that these are not exported--they are intended for use within this
 * module only.
 */
type CampgroundDB = { /* structure keyed by Park name */ // was: T.Campground
	map: string; /* uri */
	comments: string[];
	sites: CampsiteDB[];
}
type CampsiteDB = { /* structure within CampgroundDB */ // was: T.Campsite
	site: string|number;
	category: string;
	type: string;
	size: string;
	tents: number;
	table: string;
	comment: string;
}
type HostsDB = { // was: T.CampGroup
	name: string; /* name of reservation account holder */
	color: string; /* color associated with account */
}
type ReservationsDB = {  // was: T.Reservation
	site: string|number;
	arrival: string; /* pseudo Date: YYYY-MM-DD */
	reserved: number; /* nights reserved */
	cancelled: number; /* nights cancelled */
	modified: number; /* number of times reservation has been modified */
	purchaser: string; /* key for Account record, optionally followed by "/<alias>" */
	occupants: string; /* "<account-key>/<occupant-names>" or "?", "none", "main site", etc. */
}
type AdjustmentsDB = { // was: T.CampAdjustment
	year: number;
	group: string;
	amount: number;
	for: string;
}
type CostsDB = { // was: T.CampCosts
	year: number;
	site: number; /* per-night campsite cost */
	cabin: number; /* per-night cabin cost */
	reservation: number; /* per-site reservation fee */
	cancellation: number; /* per-site cancellation fee */
	modification: number; /* per-site reservation modification fee */
}

/**
 * Load the raw data stored in the data files.
 */
const Site = Settings.Site();
const CampgroundFile = `${Site}/data/camp/campgrounds.yaml`;
const ReservationsFile = `${Site}/data/camp/reservations.yaml`;
const AdjustmentsFile = `${Site}/data/camp/adjustments.yaml`;
const CostsFile = `${Site}/data/camp/costs.yaml`;
const HostsFile = `${Site}/data/camp/groups.yaml`;
const FinalizedFile = `${Site}/data/camp/finalized.yaml`;

const CampgroundData = await Fetch.map<CampgroundDB>(CampgroundFile);
const ReservationsData = await Fetch.map<ReservationsDB[]>(ReservationsFile);
const AdjustmentsData = await Fetch.map<AdjustmentsDB[]>(AdjustmentsFile);
const CostsData = await Fetch.map<CostsDB[]>(CostsFile);
const HostsData = await Fetch.map<HostsDB>(HostsFile);
const FinalizedData = await Fetch.map<number[]>(FinalizedFile);

/**
 * Types representing data returned by Park object methods. 
 */

/** Structure of a Map keyed by single letter `host` ID */
type Host = {
	name: string;
	color: string; /** used in reservation display table */
	payments: Payment[]; /** dollars paid for shared expenses */
	debts: Debt[]; /** dollars owed by one host to another host */
}
type Reservation = {
	site: string|number;
	arrival: string; /* pseudo Date as "YYYY-MM-DD" string */
	reserved: number; /* nights reserved */
	cancelled: number; /* nights cancelled */
	modified: number; /* number of times reservation has been modified */
	purchaser: string; /* key for Host paying for site */
	occupant: string; /* key for Host responsible for site/occupants, or '' if shared */
	purchaserAccount: string; /* reservation system account, or '' if purchaser default or unknown */
	occupantNames: string; /* info only--actual occupant names, '?', 'main site', etc. (free form) */
}
/** Used in displayReservationTable */
type AdjustedReservation = {
	site: number|string;
	arrivalDate: Date;
	nightsReserved: number; //### why not use "reserved" as in Reservation, above?
	modified: number;
	purchaser: string; //### Host.name?
	occupants: string; //### occupantNames?
	column: number;
};	
//### used in displayReservationTable, writeTableRows, sortAdjustedReservations ... this should be a Map!
// type AdjustedReservations = {
// 	[site: string]: AdjustedReservation[];
// };	
type Adjustment = {
	host: string;
	amount: number;
	description: string;
}
type Costs = {
	site: number; /* per-night campsite cost */
	cabin: number; /* per-night cabin cost */
	reservation: number; /* per-site reservation fee */
	cancellation: number; /* per-site cancellation fee */
	modification: number; /* per-site reservation modification fee */
}
/** Shared expenses incurred by a Host */
type Payment = {
	type: 'SITE'|'STORAGE'|'RESERVE_FEE'|'CANCEL_FEE'|'MODIFY_FEE';
	amount: number;
}
/** Amounts owed by one Host to another (cabin surcharges, underpayments, etc.) */
type Debt = {
	from: string;
	to: string;
	amount: number;
	purpose: string;
}

export class Park {
	name: string;
	private hosts: Map<string, Host>;
	private yearlyReservations: ReservationsDB[];
	private yearlyAdjustments: AdjustmentsDB[];
	private yearlyCosts: CostsDB[];
	private finalizedYears: number[];

	constructor(parkName: string) {
		this.name = parkName;
		this.hosts = new Map<string, Host>();
		this.yearlyReservations = [];
		this.yearlyAdjustments = [];
		this.yearlyCosts = [];
		this.finalizedYears = [];

		if (ReservationsData.has(parkName)) this.yearlyReservations = ReservationsData.get(parkName)!
		if (AdjustmentsData.has(parkName)) this.yearlyAdjustments = AdjustmentsData.get(parkName)!
		if (CostsData.has(parkName)) {
			this.yearlyCosts = CostsData.get(parkName)!
			this.yearlyCosts.sort((a, b) => { return b.year - a.year });
		}
		for (const key of Array.from(HostsData.keys())) {
			const host = HostsData.get(key);
			if (host) this.hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] })
		}
		if (FinalizedData.has(parkName)) this.finalizedYears = FinalizedData.get(parkName)!
	}

	campground() {
		return CampgroundData.get(this.name);
	}

	reservations(year: number) {
		const reservations: Reservation[] = [];
		const yearPrefix = `${year}-`;
		for (const yearlyReservation of this.yearlyReservations) {
			if (yearlyReservation.arrival.startsWith(yearPrefix)) {
				const [purchaser, purchaserAccount] = this.slashedValues(yearlyReservation.purchaser);
				const [occupant, occupantNames] = this.slashedValues(yearlyReservation.occupants, false);
				reservations.push({
					site: yearlyReservation.site,
					arrival: yearlyReservation.arrival,
					reserved: yearlyReservation.reserved,
					cancelled: yearlyReservation.cancelled,
					modified: yearlyReservation.modified,
					purchaser: purchaser,
					occupant: occupant,
					purchaserAccount: purchaserAccount,
					occupantNames: occupantNames,
				});
			}
		}
		return reservations;
	}

	adjustments(year: number) {
		const adjustments: Adjustment[] = [];
		for (const yearlyAdjustment of this.yearlyAdjustments) {
			if (yearlyAdjustment.year == year) {
				adjustments.push({
					host: yearlyAdjustment.group,
					amount: yearlyAdjustment.amount,
					description: yearlyAdjustment.for,
				});
			}
		}
		return adjustments;
	}

	/**
	 * Return the current `costs` object, "current" being the object having the
	 * most recent year not greater than the given `year`.
	 */
	costs(year: number) {
		let costs: Costs = { site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
		/** yearlyCosts have previously been sorted by years descending */
		for (const yearlyCosts of this.yearlyCosts) {
			if (yearlyCosts.year <= year) {
				costs = yearlyCosts;
				break;
			}
		}
		return costs;
	}

	/**
	 * Has the given year's data been marked "finalized"?
	 */
	isFinalized(year: number) {
		let finalized = false;
		if (this.finalizedYears.includes(year)) finalized = true;
		return finalized;
	}

	reservationYears(sort: 'ascending'|'descending') {
		const years: number[] = [];
		for (const yearlyReservation of this.yearlyReservations) {
			const year = Number(yearlyReservation.arrival.slice(0, 4));
			if (!years.includes(year)) years.push(year);
		}
		if (sort == 'ascending') years.sort((a, b) => a - b);
		else years.sort((a, b) => b - a);
		return years;
	}

	/**
	 * In the Reservation Purchaser and Occupants fields, the strings are typically
	 * two values separated by a slash. In both cases, the first value is a Host
	 * key. For Purchaser, the second value is a Reservation Account managed by the Host. (one
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
	slashedValues(value: string, purchaser = true) {
		const values: string[] = [];
		const separator = '/'
		let hostKey = '';
		let freeForm = '';
		const i = value.indexOf(separator);
		if (i < 0) { /* no slash */
			if (purchaser) hostKey = value;
			else freeForm = value;
		}
		else {
			hostKey = value.slice(0,i);
			freeForm = value.slice(i+1);
		}
		values.push(hostKey.trim().toUpperCase());
		values.push(freeForm.trim());
		return values;
	}
	
	numericSite(site: string|number) {
		/** convert site from string to number (e.g., 'J26' => 26), removing non-digit characters */
		let siteNumber = 0;
		if (typeof site == 'string') {
			site = site.replace(/\D/g, '');
			if (site) siteNumber = Number(site);
		}
		else siteNumber = site;
		return siteNumber;
	}
	
	//### should this be working with output from method `reservations(year)`?
	// function sortReservations(reservations: ReservationsDB[]){
	// 	/** sort by arrival date, nightsReserved */
	// 	reservations.sort((a, b) => {
	// 		if (a.arrival < b.arrival) return -1;
	// 		else if (a.arrival > b.arrival) return 1;
	// 		else if ((a.reserved - a.cancelled) < (b.reserved - b.cancelled)) return -1;
	// 		else if ((a.reserved - a.cancelled) > (b.reserved - b.cancelled)) return 1;
	// 		return 0;
	// 	});
	// }
	
	//### No! Should be working with a Map
	// function sortAdjustedReservations(adjustedReservations: AdjustedReservations) {
	// 	/** sort by arrival date, nightsReserved, site number */
	// 	let siteKeys = Object.keys(adjustedReservations);
	// 	siteKeys.sort((a, b) => {
	// 		if (adjustedReservations[a][0].arrivalDate < adjustedReservations[b][0].arrivalDate) return -1;
	// 		else if (adjustedReservations[a][0].arrivalDate > adjustedReservations[b][0].arrivalDate) return 1;
	// 		else if (adjustedReservations[a][0].nightsReserved < adjustedReservations[b][0].nightsReserved) return -1;
	// 		else if (adjustedReservations[a][0].nightsReserved > adjustedReservations[b][0].nightsReserved) return 1;
	// 		else if (adjustedReservations[a][0].site < adjustedReservations[b][0].site) return -1;
	// 		else if (adjustedReservations[a][0].site > adjustedReservations[b][0].site) return 1;
	// 		return 0;
	// 	});
	// 	return siteKeys;
	// }

	/******************************************************************************************* */	
	// export function displayReservationTable(
	// 	tableElement: HTMLTableElement,
	// 	thisYear: number,
	// 	reservations: ReservationsDB[],
	// 	groups: Map<string, HostsDB>,
	// 	radioButtons: W.RadioButtons,
	// ) {
	// 	let adjustedReservations: AdjustedReservations = {};
	// 	let beginDate: Date|null = null;
	// 	let endDate: Date|null = null;
	// 	/**
	// 	 * Initially, sort reservations chronologically, so that the array of
	// 	 * reservations in the 'adjustedReservations' objects will be chronological.
	// 	 * Later, we can re-sort the sites if necessary for display.
	// 	 */
	// 	sortReservations(reservations);
	
	// 	for (let reservation of reservations) {
	// 		let arrival = new Date(reservation.arrival + 'T' + CheckInTime);
	// 		let arrivalYear = arrival.getFullYear();
	// 		if (arrivalYear == thisYear && reservation.reserved > reservation.cancelled) { /** selection criteria */
	// 			let lastDay = new Date(arrival);
	// 			lastDay.setDate(lastDay.getDate() + (reservation.reserved - reservation.cancelled - 1));
	// 			if (beginDate === null || beginDate > arrival) beginDate = new Date(arrival.getTime());
	// 			if (endDate === null || endDate < lastDay) endDate = new Date(lastDay.getTime());
	// 			let adjustedReservation: AdjustedReservation = {
	// 				site: numericSite(`${reservation.site}`),
	// 				arrivalDate: new Date(arrival.getTime()),
	// 				nightsReserved: reservation.reserved - reservation.cancelled,
	// 				modified: reservation.modified,
	// 				purchaser: reservation.purchaser,
	// 				occupants: reservation.occupants,
	// 				/** because we've sorted reservations by arrival date above, we
	// 				 * know that 'beginDate' has been set and can already calculate
	// 				 * the table column in which this reservation belongs
	// 				 */
	// 				column: Math.round((arrival.getTime() - beginDate!.getTime()) / (1000 * 60 * 60 * 24)),
	// 			};
	// 			if (!adjustedReservations[reservation.site]) {
	// 				/** initialize adjustedReservations entry */
	// 				adjustedReservations[reservation.site] = [];
	// 			}
	// 			adjustedReservations[reservation.site].push(adjustedReservation);
	// 		}
	// 	}
	
	// 	writeTableHeadings(tableElement, beginDate!, endDate!)
	// 	writeTableRows(tableElement, adjustedReservations, groups, radioButtons);
	// }
	
	// function writeTableHeadings(tableElement: HTMLTableElement, beginDate: Date, endDate: Date) {
	// 	const Days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	// 	let columnHeadings: string[] = [];
	// 	columnHeadings.push('Site');
	// 	let headingDate = new Date(beginDate.getTime());
	// 	while (headingDate <= endDate) {
	// 		let headingDateMonth = headingDate.getMonth() + 1;
	// 		let headingDateDate = headingDate.getDate();
	// 		let headingDateDay = Days[headingDate.getDay()];
	// 		columnHeadings.push(`${headingDateDay} ${headingDateMonth}/${headingDateDate}`)
	// 		headingDate.setDate(headingDate.getDate() + 1);
	// 	}
	// 	let headingRowElement = document.createElement('tr');
	// 	for (let columnHeading of columnHeadings) {
	// 		let rowItemElement = document.createElement('th');
	// 		rowItemElement.innerText = columnHeading;
	// 		headingRowElement.appendChild(rowItemElement);
	// 	}
	// 	tableElement.appendChild(headingRowElement);
	// }
	
	// function writeTableRows(
	// 	tableElement: HTMLTableElement,
	// 	adjustedReservations: AdjustedReservations,
	// 	groups: Map<string, HostsDB>,
	// 	radioButtons: W.RadioButtons
	// ) {
	// 	let sites = sortAdjustedReservations(adjustedReservations);
	// 	for (let site of sites) {
	
	// 		/** add a row for the site and its reservations, with the site number in the first column */
	// 		let siteRowElement = document.createElement('tr');
	// 		let siteItemElement = document.createElement('th');
	// 		siteItemElement.innerText = site;
	// 		siteRowElement.append(siteItemElement);
	
	// 		let nextColumn = 0; /** use to create empty spanned columns where there are gaps before/after/between reservations */
	// 		for (let reservation in adjustedReservations[site]) {
	// 			let column = adjustedReservations[site][reservation].column;
	// 			let nightsReserved = adjustedReservations[site][reservation].nightsReserved;
	// 			let purchaser = adjustedReservations[site][reservation].purchaser;
	// 			let occupants = adjustedReservations[site][reservation].occupants;
	// 			let modified = adjustedReservations[site][reservation].modified;
	
	// 			/** interpret slash-separated values in purchaser and occupants */
	// 			const purchaserValues = slashedValues(purchaser);
	// 			const groupKey = purchaserValues[0];
	// 			const group = groups.get(groupKey);
	// 			let groupName = ''; 
	// 			let groupColor = UnknownGroupColor; /* default color */
	// 			if (group !== undefined) {
	// 				groupName = group.name;
	// 				groupColor = group.color;
	// 			}
	// 			if (purchaserValues[1].length) groupName = purchaserValues[1];
	// 			const occupantValues = slashedValues(occupants, false);
	// 			const occupantNames = (occupantValues[1].length) ? occupantValues[1] : '';
	
	// 			/** insert a (spanned) column representing unreserved date(s) before this reservation */
	// 			if (column > nextColumn) {
	// 				let unreservedDays = column - nextColumn;
	// 				siteItemElement = document.createElement('td');
	// 				siteItemElement.innerText = '';
	// 				if (unreservedDays > 1) siteItemElement.colSpan = unreservedDays;
	// 				siteRowElement.append(siteItemElement);
	// 				nextColumn += unreservedDays;
	// 			}
	
	// 			/** add reservation item */
	// 			siteItemElement = document.createElement('td');
	// 			let camperName = (radioButtons.activeButton == 'Purchasers') ? groupName : occupantNames;
	// 			if (modified > 0 && modified <= ModificationSymbols.length) {
	// 				/* attach reservation modification symbol to camper name */
	// 				camperName += ` ${ModificationSymbols[modified - 1]}`;
	// 			}
	// 			siteItemElement.innerText = camperName;
	// 			if (nightsReserved > 1) siteItemElement.colSpan = nightsReserved;
	// 			siteItemElement.style.backgroundColor = groupColor;
	// 			siteItemElement.style.textAlign = 'center';
	// 			siteRowElement.append(siteItemElement);
	// 			nextColumn += nightsReserved;
	// 		}
	// 		tableElement.append(siteRowElement);
	// 	}
	// }
}

/*
	participatingGroups: hosts present as either purchasers or occupants
	adjustments: host, amount, purpose (constant(s) from YAML, e.g. Storage Unit)
	directPayments (and Receipts): from cabin occupant to purchaser (Cabin Surcharge); Amount Owed or Amount Received
	payments: reservation (* nights), cancellation, modification
	sharedExpenses: number, set in processReservations, processExpenseAdjustments

	hosts: every key found in YAML files (reservations and adjustments)
	expenses: site * nights, storage, reserve fee, cancel fee, modify fee
	receipts: contribution from non-host (to be divided among all hosts)
	surcharge: cabin surcharge (occupant to purchaser) †

	† when one host purchases a cabin, and a different host (family) occupies the cabin
*/
