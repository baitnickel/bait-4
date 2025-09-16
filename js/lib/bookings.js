export class Bookings {
    constructor(year) {
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
