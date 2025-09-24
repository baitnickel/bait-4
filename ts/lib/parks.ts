import * as Settings from './settings.js';
import * as T from './types.js';
import * as Fetch from './fetch.js';
import * as W from './widgets.js';

/**
 * Constants used in old functions:
 */

/** Constant(s) used in displayReservationTable */
const CheckInTime = '14:00:00.000-07:00'; /** 2:00pm PDT */
/** Constant(s) used in writeTableRows */
const ModificationSymbols = ['†', '‡']; /* symbols indicating reservation modifications--must be as many as ModificationLimit */
const UnknownGroupColor = 'lightgray'; /* default color when group is unknown */

/** Constant(s) used in processReservations */
const CabinSitePattern = new RegExp(/^J/, 'i'); /* campsite IDs starting with "J" or "j" are cabins */
const ModificationLimit = 2; /* maximum allowed reservation modifications (per reservation) */
/** Constant(s) used in processAmountsOwed and createUnderpayerPayments */
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
	siteNumber: number;
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
/** Shared expenses paid by a Host */
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
	hosts: Map<string, Host>;
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
	}
	get campground() {
		return CampgroundDBData.get(this.name);
	}

	/** Given a year, return the year's campsite reservations */
	reservations(year: number) {
		return this.parkReservations.filter((r) => r.year == year);
	}

	/** Given a year, return the year's adjustments (shared expenses other than campsites) */
	adjustments(year: number) {
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

	/** Has the given year's data been marked "finalized"? */
	isFinalized(year: number) {
		let finalized = false;
		if (this.parkFinalizedYears.includes(year)) finalized = true;
		return finalized;
	}

	/** Return an array of years having campsite reservations (ascending or descending) */
	reservationYears(sort: 'ascending'|'descending') {
		const setOfYears = new Set<number>();
		for (const parkReservation of this.parkReservations) setOfYears.add(parkReservation.year);
		const years = Array.from(setOfYears);
		if (sort == 'ascending') years.sort((a, b) => a - b);
		else years.sort((a, b) => b - a);
		return years;
	}

	/**
	 * Return a two-element array of start date and end date, representing the
	 * first reservation date and the last reservation date for the given year.
	 */
	reservationsRange(year: number) {
		let startDate: Date|null = null;
		let endDate: Date|null = null;
		const reservations = this.reservations(year).filter((r) => r.reserved > r.cancelled);
		for (const reservation of reservations) {
			let lastDay = new Date(reservation.arrival);
			lastDay.setDate(lastDay.getDate() + (reservation.reserved - reservation.cancelled - 1));
			if (startDate === null || startDate > reservation.arrival) startDate = new Date(reservation.arrival.getTime());
			if (endDate === null || endDate < lastDay) endDate = new Date(lastDay.getTime());
		}
		return [startDate, endDate];
	}

	reservationsTable(table: HTMLTableElement, year: number) {
		const reservations = this.reservations(year).filter((r) => r.reserved > r.cancelled);
		const [startDate, endDate] = this.reservationsRange(year);
		if (startDate && endDate) {
			/** create headings */
			const headings = ['Site'];
			let headingDate = startDate;
			while (headingDate <= endDate) {
				headings.push(T.DateString(headingDate, 13));
				headingDate.setDate(headingDate.getDate() + 1);
			}
			/** create Map of site reservations */

			/**
			 * Hmm ... As we loop over reservations, we need to build a
			 * structure like {siteNumber, offsetCell, reservation}. Sorting
			 * these, we should be able to construct rows--knowing where we need
			 * to insert empty colSpans.
			 * 
			 * - SiteNumber Offset(arrival-startDate) colSpan(reserved-cancelled) Reservation
			 * 
			 */

			// const siteMap = new Map<number, Reservation[]>();
			// reservations.sort((a,b) => a.siteNumber - b.siteNumber);
			// let priorSiteNumber = 0;
			// for (const reservation of reservations) {
			// 	if (!siteMap.has(reservation.siteNumber)) siteMap.set(reservation.siteNumber, []);
			// }
		}
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
	
	/** Convert site ID from string to number (e.g., 'J26' => 26), removing non-digit characters */
	numericSite(site: string|number) {
		let siteNumber = 0;
		if (typeof site == 'string') {
			site = site.replace(/\D/g, '');
			if (site) siteNumber = Number(site);
		}
		else siteNumber = site;
		return siteNumber;
	}

	/** Load the `hosts` Map from the raw data */
	private loadHosts(hostsDBData: Map<string, HostsDB>) {
		const hosts = new Map<string, Host>();
		for (const key of Array.from(hostsDBData.keys())) {
			const host = HostsDBData.get(key);
			if (host) hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] });
		}
		return hosts;
	}

	/** Load the reservations array from the raw data */
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
					siteNumber: this.numericSite(parkReservationDBData.site),
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

	/** Load the adjustments array from the raw data */
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

	/** Load the costs array from the raw data */
	private loadParkCosts(costsDBData: Map<string, CostsDB[]>) {
		let parkCosts: Costs[] = []; 
		if (costsDBData.has(this.name)) {
			parkCosts = costsDBData.get(this.name)!;
		}
		return parkCosts;
	}

	/** Load the finalized years array from the raw data */
	private loadParkFinalizedYears(finalizedDBData: Map<string, number[]>) {
		let parkFinalizedYears: number[] = [];
		if (finalizedDBData.has(this.name)) {
			parkFinalizedYears = finalizedDBData.get(this.name)!;
		}
		return parkFinalizedYears;
	}
}
