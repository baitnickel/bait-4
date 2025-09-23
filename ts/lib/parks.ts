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

const CampgroundDBData = await Fetch.map<CampgroundDB>(CampgroundFile);
const ReservationsDBData = await Fetch.map<ReservationsDB[]>(ReservationsFile);
const AdjustmentsDBData = await Fetch.map<AdjustmentsDB[]>(AdjustmentsFile);
const CostsDBData = await Fetch.map<CostsDB[]>(CostsFile);
const HostsDBData = await Fetch.map<HostsDB>(HostsFile);
const FinalizedDBData = await Fetch.map<number[]>(FinalizedFile);

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
	year: number;
	arrival: Date;
	reserved: number; /* nights reserved */
	cancelled: number; /* nights cancelled */
	modified: number; /* number of times reservation has been modified */
	purchaser: string; /* key for Host paying for site */
	occupant: string; /* key for Host responsible for site/occupants, or '' if shared */
	purchaserAccount: string; /* reservation system account, or '' if purchaser default or unknown */
	occupantNames: string; /* info only--actual occupant names, '?', 'main site', etc. (free form) */
}
// /** Used in displayReservationTable */
// type AdjustedReservation = {
// 	site: number|string;
// 	arrivalDate: Date;
// 	nightsReserved: number; //### why not use "reserved" as in Reservation, above?
// 	modified: number;
// 	purchaser: string; //### Host.name?
// 	occupants: string; //### occupantNames?
// 	column: number;
// };	
//### used in displayReservationTable, writeTableRows, sortAdjustedReservations ... this should be a Map!
// type AdjustedReservations = {
// 	[site: string]: AdjustedReservation[];
// };	
type Adjustment = {
	year: number;
	host: string;
	amount: number;
	description: string;
}
type Costs = { //### same as CostsDB
	year: number;
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
	private parkReservations: Reservation[];
	private parkAdjustments: Adjustment[];
	private parkCosts: Costs[];
	private parkFinalizedYears: number[];

	constructor(parkName: string) {
		this.name = parkName;
		this.hosts = this.loadHosts(HostsDBData);
		this.parkReservations = this.loadParkReservations(ReservationsDBData);
		this.parkAdjustments = this.loadParkAdjustments(AdjustmentsDBData);
		this.parkCosts = this.loadParkCosts(CostsDBData);
		this.parkFinalizedYears = this.loadParkFinalizedYears(FinalizedDBData);

		// if (ReservationsDBData.has(parkName)) this.yearlyReservations = ReservationsDBData.get(parkName)!
		// if (AdjustmentsDBData.has(parkName)) this.yearlyAdjustments = AdjustmentsDBData.get(parkName)!
		// if (CostsDBData.has(parkName)) {
		// 	this.parkCosts = CostsDBData.get(parkName)!
		// 	this.parkCosts.sort((a, b) => { return b.year - a.year });
		// }
		// for (const key of Array.from(HostsDBData.keys())) {
		// 	const host = HostsDBData.get(key);
		// 	if (host) this.hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] })
		// }
		// if (FinalizedDBData.has(parkName)) this.finalizedYears = FinalizedDBData.get(parkName)!
	}

	campground() {
		return CampgroundDBData.get(this.name);
	}

	reservations(year: number) {
		// let reservations: Reservation[] = [];
		// reservations = this.parkReservations.filter((r) => r.year == year);
		// for (const parkReservation of this.parkReservations) {
		// 	if (parkReservation.year = year) {
		// 		reservations.push({
		// 			site: parkReservation.site,
		// 			arrival: parkReservation.arrival,
		// 			reserved: parkReservation.reserved,
		// 			cancelled: parkReservation.cancelled,
		// 			modified: parkReservation.modified,
		// 			purchaser: purchaser,
		// 			occupant: occupant,
		// 			purchaserAccount: purchaserAccount,
		// 			occupantNames: occupantNames,
		// 		});
		// 	}
		// }
		return this.parkReservations.filter((r) => r.year == year);
	}

	adjustments(year: number) {
		// let adjustments: Adjustment[] = [];
		// for (const yearlyAdjustment of this.yearlyAdjustments) {
		// 	if (yearlyAdjustment.year == year) {
		// 		adjustments.push({
		// 			host: yearlyAdjustment.group,
		// 			amount: yearlyAdjustment.amount,
		// 			description: yearlyAdjustment.for,
		// 		});
		// 	}
		// }
		// return adjustments;
		return this.parkAdjustments.filter((a) => a.year == year);
	}

	/**
	 * Return the current `costs` object, "current" being the object having the
	 * most recent year not greater than the given `year`.
	 */
	costs(year: number) {
		let costs: Costs = { year: 0, site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
		/** sort by years descending to get the most recent qualifying year */
		this.parkCosts.sort((a, b) => b.year - a.year);
		for (const parkCosts of this.parkCosts) {
			if (parkCosts.year <= year) {
				costs = parkCosts;
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
		if (this.parkFinalizedYears.includes(year)) finalized = true;
		return finalized;
	}

	reservationYears(sort: 'ascending'|'descending') {
		const setOfYears = new Set<number>();
		for (const parkReservation of this.parkReservations) setOfYears.add(parkReservation.year);
		const years = Array.from(setOfYears);
		if (sort == 'ascending') years.sort((a, b) => a - b);
		else years.sort((a, b) => b - a);
		return years;
	}

	/**
	 * In the Reservation Purchaser and Occupants fields, the strings are
	 * typically two values separated by a slash. In both cases, the first value
	 * is a Host key. For Purchaser, the second value is a Reservation Account
	 * managed by the Host (one person may use multiple reservation accounts).
	 * For Occupants, the second value is a free-form list of occupant names.
	 * (Storing two different values in a single field is very bad coding
	 * practice! It's being done here merely to simplify the YAML data entry,
	 * and might be abandoned once we provide a suitable data entry UI--a rather
	 * difficult challenge in static website.)
	 * 
	 * When a Purchaser field has only one value (no slash), it is taken as a
	 * Host key. When an Occupants field has only one value (no slash), it is
	 * taken as a free-form list of occupant names (or "Main Site", etc.).
	 * 
	 * Given a Purchaser or Occupants string, return a two-element array.
	 * Element 0 contains a Host key or an empty string, trimmed and converted
	 * to uppercase. For a Purchaser field, Element 1 will contain a trimmed
	 * reservation alias or an empty string. For an Occupants field, Element 1
	 * will contain a trimmed free-form string or an empty string. By default,
	 * we assume the string is a Purchaser; set the optional `purchaser`
	 * parameter to false when processing Occupants.
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

	private loadHosts(hostsDBData: Map<string, HostsDB>) {
		const hosts = new Map<string, Host>();
		for (const key of Array.from(hostsDBData.keys())) {
			const host = HostsDBData.get(key);
			if (host) hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] });
		}
		return hosts;
	}

	private loadParkReservations(reservationsDBData: Map<string, ReservationsDB[]>) {
		const parkReservations: Reservation[] = [];
		if (reservationsDBData.has(this.name)) {
			const parkReservationsDBData = reservationsDBData.get(this.name)!;
			for (const parkReservationDBData of parkReservationsDBData) {
				const arrival = new Date(parkReservationDBData.arrival + 'T' + CheckInTime);
				const [purchaser, purchaserAccount] = this.slashedValues(parkReservationDBData.purchaser);
				const [occupant, occupantNames] = this.slashedValues(parkReservationDBData.occupants, false);
				parkReservations.push({
					site: parkReservationDBData.site,
					year: arrival.getFullYear(),
					arrival: arrival,
					reserved: parkReservationDBData.reserved,
					cancelled: parkReservationDBData.cancelled,
					modified: parkReservationDBData.modified,
					purchaser: purchaser,
					occupant: occupant,
					purchaserAccount: purchaserAccount,
					occupantNames: occupantNames,
				});
			}
		} 
		return parkReservations;
	}

	private loadParkAdjustments(adjustmentsDBData: Map<string, AdjustmentsDB[]>) {
		const parkAdjustments: Adjustment[] = [];
		if (adjustmentsDBData.has(this.name)) {
			const parkAdjustmentsDBData = adjustmentsDBData.get(this.name)!;
			for (const parkAdjustmentDBData of parkAdjustmentsDBData) {
				parkAdjustments.push({
					year: parkAdjustmentDBData.year,
					host: parkAdjustmentDBData.group,
					amount: parkAdjustmentDBData.amount,
					description: parkAdjustmentDBData.for,
				});
			}
		}
		return parkAdjustments;
	}

	private loadParkCosts(costsDBData: Map<string, CostsDB[]>) {
		let parkCosts: Costs[] = []; 
		if (costsDBData.has(this.name)) {
			const parkCosts = costsDBData.get(this.name)!;
		}
		return parkCosts;
	}

	private loadParkFinalizedYears(finalizedDBData: Map<string, number[]>) {
		let parkFinalizedYears: number[] = [];
		if (finalizedDBData.has(this.name)) {
			parkFinalizedYears = finalizedDBData.get(this.name)!;
		}
		return parkFinalizedYears;
	}
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
