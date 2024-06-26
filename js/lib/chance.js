/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined limit (e.g., 64--0...63). On instantiation, the caller must
 * provide an HTML workspace (i.e., an HTMLDivElement). The subclasses may
 * create their own divs within this workspace, and must provide methods for
 * initialization, display, etc.
 *
 * Creating a Chance object should be rarely done--this is why we have
 * subclasses. Constructors probably don't need arguments--use setters instead.
 * The superclass object is completely dumb, it won't do anything much for you,
 * unless you just want a random number >= 0 and < 1. Each subclass establishes
 * its default behavior, its icons, its input process. Every object must return
 * a result constrained by its unique parameters/properties.
 *
 * Calling programs may influence any object by altering its properties to suit
 * their needs. The calling program may, for instance, create multiple objects
 * and blend their results. For example, you want a result 0...63 by rolling
 * three normal dice. The three dice can return such results as 6x6x6 and 3x6x6
 * and 2x6x6, none of which produce a usable result--but the calling program can
 * also "divine" additional results to refine the dice result, e.g., get a
 * "seasonal" result using the earth's orbit, moon phases, sun time, etc.
 *
 * Subclasses may have methods that return one or more HTMLElements, e.g.,
 * elements that the calling program can insert into a DIV to create buttons,
 * drop-downs, etc. for entry of the results of a dice roll or series of coins
 * tosses.
 *
 * What is the best term for "evenly distributed probablity" (or something like
 * that) ... the `result` method should take an argument indicating the user's
 * desired "fairness". If I want every integer in a range to have an equal
 * chance of appearing, that would be 100% fair. If 90% of the integers had
 * equal weight, we would only see 10% of integers being selected more or less
 * often. Etc.
 */
export class Chance {
    constructor(limit = 1) {
        this.items = 0;
        this.faces = [0];
        this.limit = limit;
        this.minimum = 0;
    }
    result() {
        return Math.floor(Math.random() * this.limit);
    }
}
export class Dice extends Chance {
}
export class Coins extends Chance {
}
export class Seasonal extends Chance {
    constructor(limit = 4) {
        super(limit);
    }
    result() {
        const now = new Date();
        const dailyMilliseconds = 24 * 60 * 60 * 1000;
        const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const winterSolstice = Date.UTC(now.getFullYear(), 11, 21);
        const utcStartOfYear = Date.UTC(now.getFullYear(), 0, 0);
        const utcEndOfYear = Date.UTC(now.getFullYear(), 11, 31);
        const daysInYear = (utcEndOfYear - utcStartOfYear) / dailyMilliseconds;
        const dayOfYear = (utcNow - utcStartOfYear) / dailyMilliseconds;
        const dayOfSolstice = (winterSolstice - utcStartOfYear) / dailyMilliseconds;
        /**
         * The day of orbit is 0 on the day of the winter solstice (we assume
         * Dec 21), and 364 (or 365 in a leap year) on the day before the winter
         * solstice. We're ignoring the fact that the solstice and equinox dates
         * can shift about a day due to leap years, and assuming the winter
         * solstice occurs on Dec 21. For our purposes, the imprecision is not
         * critical.
         *
         * Math.round(dayOfOrbit / (daysInYear / 4)) % 4 should give you:
         * - 0 near winter solstice
         * - 1 near spring equinox
         * - 2 near summer solstice
         * - 3 near autumn equinox
         */
        const dayOfOrbit = (dayOfYear >= dayOfSolstice) ? dayOfYear - dayOfSolstice : (daysInYear - dayOfSolstice) + dayOfYear;
        /**
         * season calculation (when this.limit == 4) gives you:
         * - 0 near winter solstice
         * - 1 near spring equinox
         * - 2 near summer solstice
         * - 3 near autumn equinox
         */
        const season = Math.round(dayOfOrbit / (daysInYear / this.limit)) % this.limit;
        /**
         * changing this.limit can give us many different "seasonal segments",
         * e.g., 2, 4, 8, 12, 16, 32, 64
         */
        return season;
    }
}
