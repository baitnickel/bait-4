export type CampCosts = {
	year: number;
	site: number; /* per-night campsite cost */
	cabin: number; /* per-night cabin cost */
	reservation: number; /* per-site reservation fee */
	cancellation: number; /* per-site cancellation fee */
	modification: number; /* per-site reservation modification fee */
}
export type CampAdjustment = {
	year: number;
	group: string;
	amount: number;
	for: string;
}
export type CampGroup = {
	name: string; /* name of reservation account holder */
	color: string; /* color associated with account */
}
export type Reservation = { 
	site: string|number;
	arrival: string; /* pseudo Date: YYYY-MM-DD */
	reserved: number; /* nights reserved */
	cancelled: number; /* nights cancelled */
	modified: number; /* number of times reservation has been modified */
	purchaser: string; /* key for Account record, optionally followed by "/<alias>" */
	occupants: string; /* "<account-key>/<occupant-names>" or "?", "none", "main site", etc. */
}
export type Campsite = { /* array structure under Campground.sites */
	site: string|number;
	category: string;
	type: string;
	size: string;
	tents: number;
	table: string;
	comment: string;
}
export type Campground = { /* structure keyed by Park name */
	map: string; /* uri */
	comments: string[];
	sites: Campsite[];
}

type Costs = {
	site: number; /* per-night campsite cost */
	cabin: number; /* per-night cabin cost */
	reservation: number; /* per-site reservation fee */
	cancellation: number; /* per-site cancellation fee */
	modification: number; /* per-site reservation modification fee */
}

type Transaction = {from: string, to: string, amount: number; purpose: string };

/** need a new YAML file? These are all shared expenses */
export type Expense = {
	type: 'SITE'|'STORAGE'|'RESERVE'|'CANCEL'|'MODIFY';
	amount: number;
}

/** to be the body of a Map keyed by single letter `host` ID (as used in YAML (reservations and adjustments) */
export type Host = {
	name: string;
	color: string; /** used in reservation display table */
	expenses: Expense[];
	transactions: Transaction[];
}

export class Bookings {
	year: number;
	costs: Costs;
	reservations: Reservation[]; /**### do we need this? */
	hosts: Host[];

	constructor(year: number) {
		this.year = year;
		this.costs = { site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
		this.reservations = [];
		this.hosts = [];
	}

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