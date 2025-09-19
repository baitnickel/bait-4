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
const CampgroundData = await Fetch.map(CampgroundFile);
const ReservationsData = await Fetch.map(ReservationsFile);
const AdjustmentsData = await Fetch.map(AdjustmentsFile);
const CostsData = await Fetch.map(CostsFile);
const HostsData = await Fetch.map(HostsFile);
const FinalizedData = await Fetch.map(FinalizedFile);
export class Park {
    constructor(parkName) {
        this.name = parkName;
        this.hosts = new Map();
        this.yearlyReservations = [];
        this.yearlyAdjustments = [];
        this.yearlyCosts = [];
        this.finalizedYears = [];
        if (ReservationsData.has(parkName))
            this.yearlyReservations = ReservationsData.get(parkName);
        if (AdjustmentsData.has(parkName))
            this.yearlyAdjustments = AdjustmentsData.get(parkName);
        if (CostsData.has(parkName)) {
            this.yearlyCosts = CostsData.get(parkName);
            this.yearlyCosts.sort((a, b) => { return b.year - a.year; });
        }
        for (const key of Array.from(HostsData.keys())) {
            const host = HostsData.get(key);
            if (host)
                this.hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] });
        }
        if (FinalizedData.has(parkName))
            this.finalizedYears = FinalizedData.get(parkName);
    }
    campground() {
        return CampgroundData.get(this.name);
    }
    reservations(year) {
        const reservations = [];
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
    adjustments(year) {
        const adjustments = [];
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
    costs(year) {
        let costs = { site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
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
    isFinalized(year) {
        let finalized = false;
        if (this.finalizedYears.includes(year))
            finalized = true;
        return finalized;
    }
    reservationYears(sort) {
        const years = [];
        for (const yearlyReservation of this.yearlyReservations) {
            const year = Number(yearlyReservation.arrival.slice(0, 4));
            if (!years.includes(year))
                years.push(year);
        }
        if (sort == 'ascending')
            years.sort((a, b) => a - b);
        else
            years.sort((a, b) => b - a);
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
