import * as Fetch from './fetch.js';
/********************************************************************************************** */
const REPOSITORY = 'bait-4';
const site = `${window.location.origin}/${REPOSITORY}`;
const campData = {
    park: 'smitty',
    campgrounds: `${site}/data/camp/campgrounds.yaml`,
    reservations: `${site}/data/camp/reservations.yaml`,
    adjustments: `${site}/data/camp/adjustments.yaml`,
    costs: `${site}/data/camp/costs.yaml`,
    hosts: `${site}/data/camp/groups.yaml`,
    finalized: `${site}/data/camp/finalized.yaml`,
};
const campgroundData = await Fetch.map(campData.campgrounds);
const reservationsData = await Fetch.map(campData.reservations);
const adjustmentsData = await Fetch.map(campData.adjustments);
const costsData = await Fetch.map(campData.costs);
const hostsData = await Fetch.map(campData.hosts);
const finalizedData = await Fetch.map(campData.finalized);
/********************************************************************************************** */
export class Bookings {
    constructor(campData) {
        this.park = campData.park;
        this.campground = undefined;
        this.hosts = new Map();
        this.yearlyReservations = [];
        this.yearlyAdjustments = [];
        this.yearlyCosts = [];
        this.finalizedYears = [];
        // // 	this.loadData(campData);
        // // }
        // // async loadData(campData: CampData) {
        // 	const campgroundData = await Fetch.map<T.Campground>(campData.campgrounds);
        // 	const reservationsData = await Fetch.map<T.Reservation[]>(campData.reservations);
        // 	const adjustmentsData = await Fetch.map<T.CampAdjustment[]>(campData.adjustments);
        // 	const costsData = await Fetch.map<T.CampCosts[]>(campData.costs);
        // 	const hostsData = await Fetch.map<T.CampGroup>(campData.hosts);
        // 	const finalizedData = await Fetch.map<number[]>(campData.finalized);
        /** get campground map, comments, and campsite details */
        if (campgroundData.has(campData.park))
            this.campground = campgroundData.get(campData.park);
        /** get array of reservations (for all years) */
        if (reservationsData.has(campData.park))
            this.yearlyReservations = reservationsData.get(campData.park);
        /** get array of adjustments (for all years) */
        if (adjustmentsData.has(campData.park))
            this.yearlyAdjustments = adjustmentsData.get(campData.park);
        /** get array of costs (by year) and sort by years descending */
        if (costsData.has(campData.park)) {
            this.yearlyCosts = costsData.get(campData.park);
            this.yearlyCosts.sort((a, b) => { return b.year - a.year; });
        }
        /** get hosts Map, ensuring that host keys are uppercase and initializing `payments` and `debts` arrays */
        for (const key of Array.from(hostsData.keys())) {
            const host = hostsData.get(key);
            if (host)
                this.hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] });
        }
        /** get array of finalized years */
        if (finalizedData.has(campData.park))
            this.finalizedYears = finalizedData.get(campData.park);
    }
    reservations(year) {
        const reservations = [];
        const yearPrefix = `${year}-`;
        for (const yearlyReservation of this.yearlyReservations) {
            if (yearlyReservation.arrival.startsWith(yearPrefix)) {
                // const purchaser = this.slashedValues(yearlyReservation.purchaser)[0];
                // const occupant = this.slashedValues(yearlyReservation.occupants, false)[0];
                // const purchaserAccount = this.slashedValues(yearlyReservation.purchaser)[1];
                // const occupantNames = this.slashedValues(yearlyReservation.occupants, false)[1];
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
    adjustments(year) {
    }
    /**
     * Return the current `costs` object, "current" being the object having the
     * most recent year not greater than the given `year`.
     */
    costs(year) {
        let costs = { site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
        /** We rely here on the fact that this.yearlyCosts has previously been
         * sorted by descending years in the `loadData` method. */
        for (const yearlyCosts of this.yearlyCosts) {
            if (yearlyCosts.year <= year) {
                costs = yearlyCosts;
                break;
            }
        }
        return costs;
    }
    /**
     * Return true if the given year's data has been marked "finalized", else
     * return false.
     */
    isFinalized(year) {
        let finalized = false;
        if (this.finalizedYears.includes(year))
            finalized = true;
        return finalized;
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
