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
 * Load the raw data stored in the data files.
 */
const Site = Settings.Site();
const CampgroundFile = `${Site}/data/camp/campgrounds.yaml`;
const ReservationsFile = `${Site}/data/camp/reservations.yaml`;
const AdjustmentsFile = `${Site}/data/camp/adjustments.yaml`;
const CostsFile = `${Site}/data/camp/costs.yaml`;
const HostsFile = `${Site}/data/camp/groups.yaml`;
const FinalizedFile = `${Site}/data/camp/finalized.yaml`;
const CampgroundDBData = await Fetch.map(CampgroundFile);
const ReservationsDBData = await Fetch.map(ReservationsFile);
const AdjustmentsDBData = await Fetch.map(AdjustmentsFile);
const CostsDBData = await Fetch.map(CostsFile);
const HostsDBData = await Fetch.map(HostsFile);
const FinalizedDBData = await Fetch.map(FinalizedFile);
export class Park {
    constructor(parkName) {
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
    reservations(year) {
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
    adjustments(year) {
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
    costs(year) {
        let costs = { year: 0, site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
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
    isFinalized(year) {
        let finalized = false;
        if (this.parkFinalizedYears.includes(year))
            finalized = true;
        return finalized;
    }
    reservationYears(sort) {
        const setOfYears = new Set();
        for (const parkReservation of this.parkReservations)
            setOfYears.add(parkReservation.year);
        const years = Array.from(setOfYears);
        if (sort == 'ascending')
            years.sort((a, b) => a - b);
        else
            years.sort((a, b) => b - a);
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
    slashedValues(value, purchaser = true) {
        const values = [];
        const separator = '/';
        let hostKey = '';
        let freeForm = '';
        const i = value.indexOf(separator);
        if (i < 0) { /* no slash */
            if (purchaser)
                hostKey = value;
            else
                freeForm = value;
        }
        else {
            hostKey = value.slice(0, i);
            freeForm = value.slice(i + 1);
        }
        values.push(hostKey.trim().toUpperCase());
        values.push(freeForm.trim());
        return values;
    }
    numericSite(site) {
        /** convert site from string to number (e.g., 'J26' => 26), removing non-digit characters */
        let siteNumber = 0;
        if (typeof site == 'string') {
            site = site.replace(/\D/g, '');
            if (site)
                siteNumber = Number(site);
        }
        else
            siteNumber = site;
        return siteNumber;
    }
    loadHosts(hostsDBData) {
        const hosts = new Map();
        for (const key of Array.from(hostsDBData.keys())) {
            const host = HostsDBData.get(key);
            if (host)
                hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] });
        }
        return hosts;
    }
    loadParkReservations(reservationsDBData) {
        const parkReservations = [];
        if (reservationsDBData.has(this.name)) {
            const parkReservationsDBData = reservationsDBData.get(this.name);
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
    loadParkAdjustments(adjustmentsDBData) {
        const parkAdjustments = [];
        if (adjustmentsDBData.has(this.name)) {
            const parkAdjustmentsDBData = adjustmentsDBData.get(this.name);
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
    loadParkCosts(costsDBData) {
        let parkCosts = [];
        if (costsDBData.has(this.name)) {
            const parkCosts = costsDBData.get(this.name);
        }
        return parkCosts;
    }
    loadParkFinalizedYears(finalizedDBData) {
        let parkFinalizedYears = [];
        if (finalizedDBData.has(this.name)) {
            parkFinalizedYears = finalizedDBData.get(this.name);
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
