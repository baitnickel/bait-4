import * as Settings from './settings.js';
import * as T from './types.js';
import * as Fetch from './fetch.js';
import * as W from './widgets.js';

/**
 * Constants
 */
const CheckInTime = '14:00:00.000-07:00'; /** 2:00pm PDT--used in loadParkReservations */
const ModifiedSymbols = ['†', '‡']; /* symbols indicating number of reservation modifications */
const UnknownGroupColor = 'lightgray'; /* default color when host is unknown */
const CabinSitePattern = new RegExp(/^J/, 'i'); /* campsite IDs starting with "J" or "j" are cabins */

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
}
type Reservation = {
	site: string;
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
/** Amounts owed by one Host to another (cabin surcharges, underpayments, etc.) */
type Debt = {
	from: string;
	to: string;
	amount: number;
	purpose: string;
}
/** Table cell data for presentation of Reservations */
type ReservationCell = {
	offset: number; /** days offset from earliest reservation date */
	site: string;
	siteNumber: number;
	reserved: number; /** number of nights reserved */
	modified: number;
	purchaser: string;
	purchaserAccount: string;
	occupantNames: string;
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
	 * Create and return the campsites information HTML table from the
	 * `campground.sites` data.
	 */
	campsitesTable() {
		const headings = ['Site', 'Type', 'Size', 'Tents', 'Table', 'Comment'];
		const table = new W.Table(headings, 1);
		if (this.campground) {
			for (const campsite of this.campground.sites) {
				const className = (campsite.category) ? `campsite-${campsite.category}` : '';
				table.addRow(`class: ${className}`);
				table.addCell(`${campsite.site}`);
				table.addCell(campsite.type);
				table.addCell(campsite.size);
				const tents = (campsite.tents) ? `${campsite.tents}` : '';
				table.addCell(tents);
				table.addCell(campsite.table);
				table.addCell(campsite.comment);
			}
		}
		table.fillTable();
		return table.element;
	}
	
	/**
	 * Fill the given `tableElement` with rows and columns, data selected from
	 * Reservations in the given `year` (and having a valid reservation--not
	 * completely cancelled). The data will be tailored to the `purchaserView`
	 * by default, showing the reservation account names associated with the
	 * reservations; setting this option to "false" tailors the data to the
	 * (expected/proposed) occupants view.
	 */
	reservationsTable(tableElement: HTMLTableElement, year: number, purchaserView = true) {
		tableElement.innerHTML = '';
		const reservations = this.reservations(year).filter((r) => r.reserved > r.cancelled);
		const [startDate, endDate] = this.reservationsRange(reservations);
		if (startDate && endDate) {

			/** sort reservations by arrival Date, then number of reserved nights */
			reservations.sort((a,b) => {
				const aTime = a.arrival.getTime();
				const bTime = b.arrival.getTime();
				if (aTime != bTime) return aTime - bTime;
				const aReserved = a.reserved - a.cancelled;
				const bReserved = b.reserved - b.cancelled;
				return aReserved - bReserved;
			});

			/** create headings */
			const headings = ['Site'];
			let headingDate = new Date(startDate.getTime()); /** clone startDate object */
			while (headingDate <= endDate) {
				headings.push(T.DateString(headingDate, 13));
				headingDate.setDate(headingDate.getDate() + 1);
			}

			/** create reservation cell details */
			const cells = this.createReservationCells(reservations, startDate);

			/** create site-keyed map of cells */
			const siteMap = new Map<number, ReservationCell[]>();
			for (const cell of cells) {
				if (siteMap.has(cell.siteNumber)) {
					const siteCells = siteMap.get(cell.siteNumber)!;
					siteCells.push(cell);
					siteMap.set(cell.siteNumber, siteCells);
				}
				else siteMap.set(cell.siteNumber, [cell]);
			}
			/**
			 * Create an array of siteMap keys--the sorted reservation data is
			 * preserved. Using the Map merely folds multiple reservations for
			 * the same site into the first occurrence of the site.
			 */
			const siteNumbers = Array.from(siteMap.keys());

			/** fill the table element */
			const table = new W.Table(headings, 1);	
			for (const siteNumber of siteNumbers) {
				/** start of new table row */
				const siteCells = siteMap.get(siteNumber)!;
				table.addRow();
				table.addCell(siteCells[0].site);
				let nextColumn = 0;
				for (const cell of siteCells) {
					if (cell.offset > nextColumn) {
						/** insert an empty cell to represent unreserved days */
						let unreservedDays = cell.offset - nextColumn;
						let attribute = ''
						if (unreservedDays > 1) attribute = `colSpan: ${unreservedDays}`;
						table.addCell('', attribute);
						nextColumn += unreservedDays;
					}
					let camperName = (purchaserView) ? cell.purchaserAccount : cell.occupantNames;
					if (cell.modified >= ModifiedSymbols.length) camperName += ` ${ModifiedSymbols[ModifiedSymbols.length - 1]}`;
					else if (cell.modified > 0) camperName += ` ${ModifiedSymbols[cell.modified - 1]}`;
					const attributes: string[] = [];
					if (cell.reserved > 1) attributes.push(`colSpan: ${cell.reserved}`);
					attributes.push(`textAlign: center`, `backgroundColor: ${this.hostColor(cell.purchaser)}`);
					table.addCell(camperName, attributes);
					nextColumn += cell.reserved;
				}
			}
			table.fillTable(tableElement);
		}
	}

	/** create reservation cell details */
	createReservationCells(reservations: Reservation[], startDate: Date) {
		const cells: ReservationCell[] = [];
		const milliseconds = 1000 * 60 * 60 * 24; /** milliseconds per day */
		for (const reservation of reservations) {
			cells.push({
				offset: Math.round((reservation.arrival.getTime() - startDate.getTime()) / milliseconds),
				site: reservation.site,
				siteNumber: reservation.siteNumber,
				reserved: reservation.reserved - reservation.cancelled,
				modified: reservation.modified,
				purchaser: reservation.purchaser,
				purchaserAccount: (reservation.purchaserAccount) ? reservation.purchaserAccount : this.hostName(reservation.purchaser),
				occupantNames: reservation.occupantNames,
			});
		}
		return cells;
	}

	/**
	 * Return a two-element array of start date and end date, representing the
	 * first reservation date and the last reservation date for the given year.
	 */
	reservationsRange(reservations: Reservation[]) {
		let startDate: Date|null = null;
		let endDate: Date|null = null;
		for (const reservation of reservations) {
			let lastDay = new Date(reservation.arrival);
			lastDay.setDate(lastDay.getDate() + (reservation.reserved - reservation.cancelled - 1));
			if (startDate === null || startDate > reservation.arrival) startDate = new Date(reservation.arrival.getTime());
			if (endDate === null || endDate < lastDay) endDate = new Date(lastDay.getTime());
		}
		return [startDate, endDate];
	}

	/**
	 * Given a `year`, create the year's accounting report. Return an array of
	 * strings representing the report.
	 */
	accounting(year: number) {
		const output: string[] = [];
		const costs = this.costs(year);
		const debts: Debt[] = [];
		const hostPayments = this.hostPayments(year);
		let reservations = 0;
		let nightsReserved = 0;
		let cancellations = 0;
		let modifications = 0;
		let sharedExpenses = 0;

		for (const reservation of this.reservations(year)) {
			reservations += 1;
			const nights = reservation.reserved - reservation.cancelled;
			if (nights > 0) nightsReserved += nights;
			else cancellations += 1;
			modifications += reservation.modified;

			/** cabin surcharge */
			if (nights && reservation.site.match(CabinSitePattern) && reservation.occupant && reservation.occupant != reservation.purchaser) {
				const amount = (costs.cabin - costs.site) * nights;
				debts.push({from: reservation.occupant, to: reservation.purchaser, amount: amount, purpose: `Cabin ${reservation.site} Surcharge`})
			}

			/** accumulate payments made by purchasing host */
			let payments = hostPayments.get(reservation.purchaser);
			if (payments !== undefined) {
				payments += (nights) ? nights * costs.site : costs.cancellation;
				payments += costs.reservation;
				payments += reservation.modified * costs.modification;
				hostPayments.set(reservation.purchaser, payments);
			}
		}
		output.push('Shared Campsite Reservation Expenses:\n');
		output.push(`  Number of Sites Reserved: ${reservations} (${cancellations} cancelled, ${modifications} modifications)\n`);
		output.push(`  ${nightsReserved} nights @ ${T.Dollars(costs.site)}/night: ${T.Dollars(nightsReserved * costs.site)}\n`);
		output.push(`  Total Reservation Fees: ${T.Dollars(reservations * costs.reservation)}\n`);
		output.push(`  Total Cancellation Fees: ${T.Dollars(cancellations * costs.cancellation)}\n`);
		output.push(`  Total Modification Fees: ${T.Dollars(modifications * costs.modification)}\n`);
		sharedExpenses += nightsReserved * costs.site;
		sharedExpenses += reservations * costs.reservation;
		sharedExpenses += cancellations * costs.cancellation;
		sharedExpenses += modifications * costs.modification;
		
		output.push('\nOther Shared Expenses:\n');
		let none = true;
		for (const adjustment of this.adjustments(year)) {
			let payments = hostPayments.get(adjustment.host);
			if (payments !== undefined) {
				none = false;
				const hostName = this.hostName(adjustment.host);
				output.push(`  ${hostName} paid ${T.Dollars(adjustment.amount)} for ${adjustment.description}\n`);
				sharedExpenses += adjustment.amount;
				payments += adjustment.amount;
				hostPayments.set(adjustment.host, payments);
			}
		}
		if (none) output.push(`  (none)\n`);
		
		const purchasers = hostPayments.size;
		const share = sharedExpenses / purchasers;
		output.push(`\nTotal Shared Expenses: ${T.Dollars(sharedExpenses)}\n`);
		output.push(`  1/${purchasers} share: ${T.Dollars(share)}\n`);

		output.push('\nAmounts Paid:\n');
		const hostKeys = Array.from(hostPayments.keys());
		hostKeys.sort((a,b) => hostPayments.get(b)! - hostPayments.get(a)!);
		for (const hostKey of hostKeys) {
			const paid = hostPayments.get(hostKey)!;
			const difference = paid - share;
			let overUnder = '';
			if (difference > 0) overUnder = `(overpaid: ${T.Dollars(difference)})`;
			else if (difference < 0) overUnder = `(underpaid: ${T.Dollars(Math.abs(difference))})`;
			output.push(`  ${this.hostName(hostKey)}: ${T.Dollars(paid)} ${overUnder}\n`);
		}

		output.push('\nAmounts Owed:\n');
		this.addDebts(share, hostPayments, debts);
		debts.sort((a,b) => {
			let result = (a.from + a.to).localeCompare(b.from + b.to);
			if (!result) result = a.purpose.localeCompare(b.purpose);
			return result;
		})
		for (const debt of debts) {
			const purpose = (!debt.purpose) ? '' : `(${debt.purpose})`;
			output.push(`  ${this.hostName(debt.from)} owes ${this.hostName(debt.to)}: ${T.Dollars(debt.amount)} ${purpose}\n`);
		}

		return output;
	}

	/**
	 * Given the `share` of shared expenses each host is responsible for, and
	 * the amounts of shared `payments` each host has made, add entries in the
	 * `debts` map as needed to reconcile accounts.
	 */
	addDebts(share: number, payments: Map<string, number>, debts: Debt[]) {
		const hostKeys = Array.from(payments.keys());
		const adjustments = new Map<string, number>(); /** key is host, value is payments in cents */
		const creditors: string[] = []; /** hosts who have paid more than their share */
		const debtors: string[] = []; /** hosts who have paid less than their share */

		/**
		 * Sort host keys by the largest to smallest contributors. For each
		 * host, create a Map of `adjustments`. The adjustments are initially
		 * host payments, but converted from floating point dollars to integer
		 * cents to avoid floating point oddities. Adjustments will be modified
		 * below as we perform reconcilliations. Also, create two arrays--one of
		 * creditors (having a positive contribution) and one of debtors (having
		 * a negative contribution).
		 */
		hostKeys.sort((a,b) => payments.get(b)! - payments.get(a)!);
		for (const hostKey of hostKeys) {
			const adjustment = Math.round((payments.get(hostKey)! - share) * 100); /** cents */
			adjustments.set(hostKey, adjustment);
			if (adjustment > 0) creditors.push(hostKey);
			else if (adjustment < 0) debtors.push(hostKey);
		}

		/**
		 * For each debtor, create one or more Debt records, indicating payments
		 * needed to creditors.
		 */
		for (const debtor of debtors) {
			const debt = Math.abs(adjustments.get(debtor)!);
			for (const creditor of creditors) {
				const credit = adjustments.get(creditor)!;
				if (!credit) continue; /** skip creditor who's been "paid off" */
				/** determine the debt amount, converting back to dollars */
				const amount = (debt <= credit) ? debt / 100 : credit / 100;
				/** determine new adjustment amounts for both the debtor and the creditor */
				const newDebt = (debt <= credit) ? 0 : credit - debt;
				const newCredit = (debt <= credit) ? credit - debt : 0;
				adjustments.set(debtor, newDebt);
				adjustments.set(creditor, newCredit);
				debts.push({from: debtor, to: creditor, amount: amount, purpose: ''});
			}
		}
	}

	/**
	 * Given a `year`, return a Map keyed by hosts present in the reservations
	 * and adjustments data, as either purchasers or occupants, for the given
	 * year. Initialize the Map value (payments made) to 0.
	 */
	hostPayments(year: number) {
		const hostKeys = new Set<string>();
		for (const reservation of this.reservations(year)) {
			if (reservation.purchaser) hostKeys.add(reservation.purchaser);
			/** add occupants only for reservations that have not been wholly cancelled */
			if (reservation.occupant && reservation.reserved > reservation.cancelled) hostKeys.add(reservation.occupant);
		}
		for (const adjustment of this.adjustments(year)) hostKeys.add(adjustment.host);
		const hostPayments = new Map<string, number>();
		for (const hostKey of Array.from(hostKeys)) hostPayments.set(hostKey, 0);
		return hostPayments;
	}

	hostName(hostKey: string) {
		let hostName = `${hostKey}?`;
		const host = this.hosts.get(hostKey);
		if (host) hostName = host.name;
		return hostName;
	}

	hostColor(hostKey: string) {
		let hostColor = UnknownGroupColor;
		const host = this.hosts.get(hostKey);
		if (host) hostColor = host.color;
		return hostColor;
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
	 * Element 0 contains a Host key, trimmed and converted to uppercase, or an
	 * empty string. For a Purchaser field, Element 1 will contain a trimmed
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
	
	/** Convert site from string to number (e.g., 'J26' => 26), removing non-digit characters */
	numericSite(site: string) {
		let siteNumber = 0;
		site = site.replace(/\D/g, '');
		if (!isNaN(Number(site))) siteNumber = Number(site);
		return siteNumber;
	}

	/** Load the `hosts` Map from the raw data */
	private loadHosts(hostsDBData: Map<string, HostsDB>) {
		const hosts = new Map<string, Host>();
		for (const key of Array.from(hostsDBData.keys())) {
			const host = HostsDBData.get(key);
			if (host) hosts.set(key.toUpperCase(), { name: host.name, color: host.color });
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
				const site = parkReservationDBData.site.toString();
				const siteNumber = this.numericSite(site);
				parkReservations.push({
					site: site,
					siteNumber: siteNumber,
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
