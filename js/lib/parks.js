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
    reservationsTable(tableElement, year, purchaserView = true) {
        tableElement.innerHTML = '';
        const reservations = this.reservations(year).filter((r) => r.reserved > r.cancelled);
        const [startDate, endDate] = this.reservationsRange(reservations);
        if (startDate && endDate) {
            /** create headings */
            const headings = ['Site'];
            let headingDate = new Date(startDate.getTime()); /** clone startDate object */
            while (headingDate <= endDate) {
                headings.push(T.DateString(headingDate, 13));
                headingDate.setDate(headingDate.getDate() + 1);
            }
            /** create reservation cell details */
            const cells = this.createReservationCells(reservations, startDate);
            /** fill the table element */
            const table = new W.Table(headings, 1);
            let nextColumn = 0;
            let priorSiteNumber = 0;
            for (const cell of cells) {
                if (cell.siteNumber != priorSiteNumber) {
                    if (priorSiteNumber)
                        table.addRow(''); /** complete prior row */
                    /** start of new table row */
                    table.addCell(`${cell.site}`, '');
                    nextColumn = 0;
                    priorSiteNumber = cell.siteNumber;
                }
                if (cell.offset > nextColumn) {
                    /** insert an empty cell to cover unreserved days */
                    let unreservedDays = cell.offset - nextColumn;
                    const tableCell = table.addCell('', '');
                    if (unreservedDays > 1)
                        tableCell.colSpan = unreservedDays;
                    nextColumn += unreservedDays;
                }
                let camperName = (purchaserView) ? cell.purchaserAccount : cell.occupantNames;
                if (cell.modified >= ModificationSymbols.length)
                    camperName += ` ${ModificationSymbols[ModificationSymbols.length - 1]}`;
                else if (cell.modified > 0)
                    camperName += ` ${ModificationSymbols[cell.modified - 1]}`;
                const tableCell = table.addCell(camperName, '');
                if (cell.reserved > 1)
                    tableCell.colSpan = cell.reserved;
                tableCell.style.textAlign = 'center';
                tableCell.style.backgroundColor = this.hostColor(cell.purchaser);
                nextColumn += cell.reserved;
            }
            table.addRow(''); /** complete last row */
            table.fillTable(tableElement);
        }
    }
    /** create reservation cell details */
    createReservationCells(reservations, startDate) {
        const cells = [];
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
        /**### should be sorting by arrival, reserved, site; requires preprocessing by site (Map) */
        cells.sort((a, b) => {
            if (a.siteNumber != b.siteNumber)
                return a.siteNumber - b.siteNumber;
            else
                return a.offset - b.offset;
        });
        return cells;
    }
    /**
     * Return a two-element array of start date and end date, representing the
     * first reservation date and the last reservation date for the given year.
     */
    reservationsRange(reservations) {
        let startDate = null;
        let endDate = null;
        for (const reservation of reservations) {
            let lastDay = new Date(reservation.arrival);
            lastDay.setDate(lastDay.getDate() + (reservation.reserved - reservation.cancelled - 1));
            if (startDate === null || startDate > reservation.arrival)
                startDate = new Date(reservation.arrival.getTime());
            if (endDate === null || endDate < lastDay)
                endDate = new Date(lastDay.getTime());
        }
        return [startDate, endDate];
    }
    hostName(hostKey) {
        let hostName = `${hostKey}?`;
        const host = this.hosts.get(hostKey);
        if (host)
            hostName = host.name;
        return hostName;
    }
    hostColor(hostKey) {
        let hostColor = UnknownGroupColor;
        const host = this.hosts.get(hostKey);
        if (host)
            hostColor = host.color;
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
