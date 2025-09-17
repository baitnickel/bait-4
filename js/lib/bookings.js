import * as Fetch from './fetch.js';
export class Bookings {
    constructor(park, year) {
        this.park = park;
        this.year = year;
        this.finalized = this.isFinalized();
        this.costs = this.currentCosts();
        this.reservations = [];
        this.adjustments = [];
        this.hosts = this.currentHosts();
    }
    static async LoadConfiguration(configuration) {
        Bookings.Campgrounds = await Fetch.map(configuration.campgrounds);
        Bookings.Reservations = await Fetch.map(configuration.reservations);
        Bookings.Adjustments = await Fetch.map(configuration.adjustments);
        Bookings.Costs = await Fetch.map(configuration.costs);
        Bookings.Hosts = await Fetch.map(configuration.hosts);
        Bookings.Finalized = await Fetch.map(configuration.finalized);
    }
    /**
     * Return the current `costs` object, "current" meaning the object having the
     * most recent year not greater than the given `year`.
     */
    currentCosts() {
        let currentCosts = { site: 0, cabin: 0, reservation: 0, cancellation: 0, modification: 0 };
        const costs = Bookings.Costs.get(this.park);
        if (costs && costs.length >= 1) {
            costs.sort((a, b) => { return b.year - a.year; }); /* sort by years descending */
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
        let currentHosts = new Map();
        const keys = Array.from(Bookings.Hosts.keys());
        for (const key of keys) {
            const host = Bookings.Hosts.get(key);
            if (host)
                currentHosts.set(key, { name: host.name, color: host.color, payments: [], debts: [] });
        }
        return currentHosts;
    }
    isFinalized() {
        let finalized = false;
        const finalizedYears = Bookings.Finalized.get(this.park);
        if (finalizedYears && finalizedYears.includes(this.year))
            finalized = true;
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
