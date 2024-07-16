/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined size (e.g., 64--0...63). On instantiation, the caller must
 * provide an HTML workspace (i.e., an HTMLDivElement). The subclasses may
 * create their own divs within this workspace, and must provide methods for
 * initialization, display, etc.
 *
 * Creating a Range object should be rarely done--this is why we have subclasses.
 * Constructors probably don't need arguments--use setters instead. The
 * superclass object is completely dumb, it won't do anything much for you,
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
 * What is the best term for "evenly distributed probablity" (or something like
 * that) ... the `result` method should take an argument indicating the user's
 * desired "fairness". If I want every integer in a range to have an equal
 * chance of appearing, that would be 100% fair. If 90% of the integers had
 * equal weight, we would only see 10% of integers being selected more or less
 * often. Etc.
 */
/**
 * By default, a Range object is a coin toss returning one of two results:
 * - 0 (yin, broken line)
 * - 1 (yang, solid line)
 */
export class Range {
    get size() { return (this.limit - this.start); }
    constructor(items = 1, faces = 2, limit = 2, start = 0, step = 1) {
        this.items = items; /* how many items (coins, dice, etc) will be tossed? */
        this.faces = faces; /* how many different faces does each item have? 2? 6? */
        this.limit = limit; /* non-inclusive integer boundary */
        this.start = start; /* integer */
        this.step = (step >= 1) ? step : 1; // integer--### not implemented yet!
        /**
         * By default, values are shifted by 1. This is because dropdown option
         * 0 typically signifies "no value selected", making actual option
         * values start with 1.
         */
        this.valueOffset = 1;
    }
    displayOption(option) {
        return `${option}`;
    }
    displayValue(value) {
        return `${value}`;
    }
    /** ###
     * first dice should be high order, not low -- fix it in subclasses too.
     * Process `valueArray` in a while loop (until valueArray is empty), doing
     * value = valueArray.pop(). 3 2 1 -> 3**3 + 2**2 + 1**1
     *
     * should be determining underflows and overflows here, instead of in Dice.
     * How do we return values for these error conditions? If they are both
     * null, we might have to set a property to hold an error code (text or
     * number).
     */
    result(values = [], bases = []) {
        /* by default (when no values are supplied), return a random number in range */
        if (!values.length)
            return Math.floor(Math.random() * this.size) + this.start;
        let result = 0;
        console.log(`Values: ${values}`);
        for (let i in values) {
            const position = values.length - 1 - Number(i);
            const base = (bases.length == values.length) ? bases[i] : this.faces;
            const power = base ** position;
            let value = (values[i] - this.valueOffset) % base;
            value = value * power;
            console.log(`i: ${i} Position: ${position} Base: ${base} Power: ${power} Value: ${value}`);
            result += value;
        }
        return result;
    }
    spin(values = []) {
        let spinResult = '';
        const maximumResult = this.faces ** this.items;
        if (maximumResult < this.size)
            spinResult = '-'; /* can't cover range--underflow */
        else {
            const groupings = Math.floor(maximumResult / this.size);
            const spinLimit = (groupings * this.size) - 1;
            let sum = 0;
            for (let i in values) {
                const position = values.length - 1 - Number(i); // if 3 values, position is 2, 1, 0
                const base = this.faces;
                const power = base ** position; // if 6 faces, power is 36, 6, 1
                // let value = (values[i] - this.valueOffset) % base;
                let value = (values[i] - this.valueOffset) * power;
                console.log(`i: ${i} Position: ${position} Base: ${base} Power: ${power} Value: ${value}`);
                sum += value;
            }
            if (sum > spinLimit)
                spinResult = '+'; /* overflows range */
            else {
                // ### what is wrong here??????
                if (sum > this.size)
                    spinResult = (sum % this.size);
                else
                    spinResult = sum;
                spinResult += this.start;
            }
        }
        return spinResult;
    }
}
export class Dice extends Range {
    constructor(items, faces, limit, start = 0) {
        super(items, faces, limit, start);
    }
    displayValue(value) {
        let displayValue = `${value}`;
        if (this.faces == 6) {
            /* character codes 9856-9861: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ */
            let characterCode = value + 9855;
            if (characterCode < 9856 || characterCode > 9861)
                characterCode = 9866; /* represents no die value */
            displayValue = `${String.fromCharCode(characterCode)}`;
        }
        return displayValue;
    }
    result(values) {
        let result = 0;
        /* ### our special cases ... generalize? */
        if (this.items == 3 && this.faces == 12 && this.size == 64) {
            const bases = [4, 4, 4];
            result = super.result(values, bases);
        }
        else if (this.items == 3 && this.faces == 6 && this.size == 64) {
            // const bases = [6,6,6];
            // result = super.result(values, bases);
            result = super.result(values);
        }
        else {
            // ### all a big mess ... what's wrong?
            const maximumResult = this.faces ** this.items;
            if (maximumResult < this.size)
                result = null; /* can't cover range */
            else {
                const groupings = Math.floor(maximumResult / this.size);
                const maximumValidResult = groupings * this.size - 1;
                result = super.result(values);
                if (result > maximumValidResult)
                    result = null; /* overflows range */
                else
                    result %= this.size;
            }
            // if ((this.faces ** this.items) < this.size) {
            // 	/* values cannot express all results in range 0 ... this.size - 1 */
            // 	result = null;
            // }
            // else {
            // 	const base = this.faces;
            // 	result = 0;
            // 	for (let i in values) {
            // 		const power = base ** Number(i);
            // 		let value = (values[i] - 1) % base; /* 1...12 becomes 0...11 */
            // 		value = value * power;
            // 		result += value;
            // 	}
            // 	if (result >= this.items * this.size) result = null;
            // 	else result %= this.size;
            // }
        }
        return result;
    }
}
export class Coins extends Range {
    constructor(items) {
        super(items);
    }
    displayOption(option) {
        let alternate = `${option}`;
        const alternates = ['HEADS', 'TAILS'];
        if (option >= 1 && option <= alternates.length)
            alternate = alternates[option - 1];
        return alternate;
    }
    displayValue(value) {
        let alternate = `${value}`;
        const alternates = ['HEADS', 'TAILS'];
        if (value >= 1 && value <= alternates.length)
            alternate = alternates[value - 1];
        return `${value}`;
    }
    /**
     * Swap HEADS and TAILS values and call the superclass method. The swap is
     * necessary to make the result intuitive--HEADS is positive and TAILS is
     * negative. We are relying on the fact that, by default, HEADS is 1 and
     * TAILS is 2.
     */
    spin(values) {
        const valuesCopy = Array.from(values);
        for (let i in valuesCopy) {
            valuesCopy[i] = (valuesCopy[i] == 1) ? 2 : 1; /* swap values */
        }
        return super.spin(valuesCopy);
    }
}
export class Seasonal extends Range {
    constructor(limit) {
        super(1, 2, limit);
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
         * season calculation (when this.size == 4) gives you:
         * - 0 near winter solstice
         * - 1 near spring equinox
         * - 2 near summer solstice
         * - 3 near autumn equinox
         */
        const season = Math.round(dayOfOrbit / (daysInYear / this.size)) % this.size;
        /**
         * changing this.size can give us many different "seasonal segments",
         * e.g., 2, 4, 8, 12, 16, 32, 64
         */
        return season;
    }
}
// produces 16 invalid out of 144 total (11%)
/*
    const die1 = [0,1,2,3,4,5,6,7,8,9,10,11];
    const die2 = [0,1,2,3,4,5,6,7,8,9,10,11];
    for (let i in die1) {
        for (let j in die2) {
            const product = (die1[i] * 12) + die2[j];
            const result = product % 64;
            console.log(`${result} (${die1[i]}, ${die2[j]})`);
            console.log(`${result} (${die1[i]}, ${die2[j]})`);
        }
    }
*/
