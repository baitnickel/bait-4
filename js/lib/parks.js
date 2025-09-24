import * as Settings from './settings.js';
import * as Fetch from './fetch.js';
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
    }
    get campground() {
        return CampgroundDBData.get(this.name);
    }
    /** Given a year, return the year's campsite reservations */
    reservations(year) {
        return this.parkReservations.filter((r) => r.year == year);
    }
    /** Given a year, return the year's adjustments (shared expenses other than campsites) */
    adjustments(year) {
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
    /** Has the given year's data been marked "finalized"? */
    isFinalized(year) {
        let finalized = false;
        if (this.parkFinalizedYears.includes(year))
            finalized = true;
        return finalized;
    }
    /** Return an array of years having campsite reservations (ascending or descending) */
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
    /** Convert site ID from string to number (e.g., 'J26' => 26), removing non-digit characters */
    numericSite(site) {
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
    /** Load the `hosts` Map from the raw data */
    loadHosts(hostsDBData) {
        const hosts = new Map();
        for (const key of Array.from(hostsDBData.keys())) {
            const host = HostsDBData.get(key);
            if (host)
                hosts.set(key.toUpperCase(), { name: host.name, color: host.color, payments: [], debts: [] });
        }
        return hosts;
    }
    /** Load the reservations array from the raw data */
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
    /** Load the adjustments array from the raw data */
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
    /** Load the costs array from the raw data */
    loadParkCosts(costsDBData) {
        let parkCosts = [];
        if (costsDBData.has(this.name)) {
            parkCosts = costsDBData.get(this.name);
        }
        return parkCosts;
    }
    /** Load the finalized years array from the raw data */
    loadParkFinalizedYears(finalizedDBData) {
        let parkFinalizedYears = [];
        if (finalizedDBData.has(this.name)) {
            parkFinalizedYears = finalizedDBData.get(this.name);
        }
        return parkFinalizedYears;
    }
}
