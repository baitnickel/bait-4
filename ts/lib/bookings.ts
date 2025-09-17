import * as Fetch from './fetch.js';
import * as T from './types.js';

export type Configuration = {
	campgrounds: string; /** configuration file path */
	reservations: string; /** configuration file path */
	adjustments: string; /** configuration file path */
	costs: string; /** configuration file path */
	hosts: string; /** configuration file path */
	finalized: string; /** configuration file path */
}

/** These types are for the static campground information, used in the display
 * of the campsite map and general info, and the campsite info details. */
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

export type CampCosts = {
	year: number;
	site: number; /* per-night campsite cost */
	cabin: number; /* per-night cabin cost */
	reservation: number; /* per-site reservation fee */
	cancellation: number; /* per-site cancellation fee */
	modification: number; /* per-site reservation modification fee */
}
export type Adjustment = {
	host: string;
	amount: number;
	for: string;
}
// export type CampGroup = {
// 	name: string; /* name of reservation account holder */
// 	color: string; /* color associated with account */
// }
export type Reservation = { 
	site: string|number;
	arrival: string; /* pseudo Date: YYYY-MM-DD */
	reserved: number; /* nights reserved */
	cancelled: number; /* nights cancelled */
	modified: number; /* number of times reservation has been modified */
	purchaser: string; /* key for Account record, optionally followed by "/<alias>" */
	occupants: string; /* "<account-key>/<occupant-names>" or "?", "none", "main site", etc. */
}

type Costs = {
	site: number; /* per-night campsite cost */
	cabin: number; /* per-night cabin cost */
	reservation: number; /* per-site reservation fee */
	cancellation: number; /* per-site cancellation fee */
	modification: number; /* per-site reservation modification fee */
}

/** Payments are entered between hosts to handle cabin surcharges and
 * underpayments. */
type Debt = {
	from: string;
	to: string;
	amount: number;
	purpose: string;
}

/** These are all shared expenses. Reimbursement from a non-host to a host
 * should appear as a negative SITE expense. */
export type Payment = {
	type: 'SITE'|'STORAGE'|'RESERVE_FEE'|'CANCEL_FEE'|'MODIFY_FEE';
	amount: number;
}

/** to be the body of a Map keyed by single letter `host` ID (as used in YAML (reservations and adjustments) */
export type Host = {
	name: string;
	color: string; /** used in reservation display table */
	payments: Payment[]; /** dollars paid for shared expenses */
	debts: Debt[]; /** dollars owed by one host to another host */
}

export class Bookings {
	static Campgrounds: Map<string, T.Campground>;
	static Reservations: Map<string, T.Reservation[]>;
	static Adjustments: Map<string, T.CampAdjustment[]>;
	static Costs: Map<string, T.CampCosts[]>;
	static Hosts: Map<string, T.CampGroup>;
	static Finalized: Map<string, number[]>;

	park: string;
	year: number;
	finalized: boolean;
	costs: Costs;
	reservations: Reservation[];
	adjustments: Adjustment[];
	hosts: Map<string, Host>;

	constructor(park: string, year: number) {
		this.park = park;
		this.year = year;
		this.finalized = this.isFinalized();
		this.costs = this.currentCosts();
		this.reservations = [];
		this.adjustments = [];
		this.hosts = this.currentHosts();
	}

	static async LoadConfiguration(configuration: Configuration) {
		Bookings.Campgrounds = await Fetch.map<T.Campground>(configuration.campgrounds);
		Bookings.Reservations = await Fetch.map<T.Reservation[]>(configuration.reservations);
		Bookings.Adjustments = await Fetch.map<T.CampAdjustment[]>(configuration.adjustments);
		Bookings.Costs = await Fetch.map<T.CampCosts[]>(configuration.costs);
		Bookings.Hosts = await Fetch.map<T.CampGroup>(configuration.hosts);
		Bookings.Finalized = await Fetch.map<number[]>(configuration.finalized);
	}

	/**
	 * Return the current `costs` object, "current" meaning the object having the
	 * most recent year not greater than the given `year`.
	 */
	currentCosts() {
		let currentCosts: Costs = { site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
		const costs = Bookings.Costs.get(this.park);
		if (costs && costs.length >= 1) {
			costs.sort((a, b) => { return b.year - a.year }); /* sort by years descending */
			for (const cost of costs) {
				if (cost.year <= this.year) {
					currentCosts = cost;
					break;
				}
			}
		}
		return currentCosts;
	}
	
	currentHosts() {
		let currentHosts = new Map<string, Host>();
		const keys = Array.from(Bookings.Hosts.keys());
		for (const key of keys) {
			const host = Bookings.Hosts.get(key);
			if (host) currentHosts.set(key, { name: host.name, color: host.color, payments: [], debts: [] })
		} 
		return currentHosts;
	}

	isFinalized() {
		let finalized = false;
		const finalizedYears = Bookings.Finalized.get(this.park);
		if (finalizedYears && finalizedYears.includes(this.year)) finalized = true;
		return finalized;
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