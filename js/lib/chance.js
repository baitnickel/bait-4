/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined limit (e.g., 64--0...63). On instantiation, the caller must
 * provide an HTML workspace (i.e., an HTMLDivElement). The subclasses may
 * create their own divs within this workspace, and must provide methods for
 * initialization, display, etc.
 *
 * Creating a Random object should be rarely done--this is why we have
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
export class Random {
    constructor(limit = 1) {
        this.items = 0; /* how many items (coins, dice, etc) will be tossed? */
        this.faces = 0; /* how many different faces does each item have? 2? 6? */
        this.limit = limit; /* how many different integers do we want? */
        this.minimum = 0; /* what is our starting integer? */
    }
    displayOption(option) {
        return `${option}`;
    }
    displayValue(value) {
        return `${value}`;
    }
    result(values = 0) {
        return Math.floor(Math.random() * this.limit);
    }
}
export class Dice extends Random {
    constructor(items, faces, limit) {
        super();
        this.items = items;
        this.limit = limit;
        this.faces = faces;
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
        let result = null;
        const valuesArray = (Array.isArray(values)) ? values : [values];
        const lastValue = valuesArray[valuesArray.length - 1];
        while (this.faces > valuesArray.length) {
            valuesArray.push(lastValue);
        }
        /**
         * ### our special case ... needs to be generalized
         *
         * I think the only thing that is special about this case is that we are
         * using base 4 instead of base 12 (reducing 12). We might find a
         * formula that does such transformations based on the desired limit and
         * the items and faces.
         */
        if (this.items == 3 && this.faces == 12 && this.limit == 64) {
            const base = 4;
            const values = [];
            result = 0;
            for (let i in valuesArray) {
                /**
                 * valuesArray[i] contains a number 1...12
                 * power is 1, 4, 16
                 * value is face value - 1 raised to the power
                 */
                const power = base ** Number(i);
                let value = (valuesArray[i] - 1) % base; /* 1...12 becomes 0...3 */
                value = value * power;
                result += value;
            }
        }
        else {
            if ((this.faces ** this.items) < this.limit) {
                /* values cannot express all results in range 0 ... this.limit - 1 */
                result = null;
            }
            else {
                const base = this.faces;
                result = 0;
                for (let i in valuesArray) {
                    const power = base ** Number(i);
                    let value = (valuesArray[i] - 1) % base; /* 1...12 becomes 0...11 */
                    value = value * power;
                    result += value;
                }
                if (result >= this.items * this.limit)
                    result = null;
                else
                    result %= this.limit;
            }
        }
        return result;
    }
}
export class Coins extends Random {
    constructor(items, limit) {
        super();
        this.items = items;
        this.limit = limit;
        this.faces = 2;
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
    result(values) {
        const valuesArray = (Array.isArray(values)) ? values : [values];
        const lastValue = valuesArray[valuesArray.length - 1];
        while (this.faces > valuesArray.length) {
            valuesArray.push(lastValue);
        }
        const base = this.faces;
        let result = 0;
        for (let i in valuesArray) {
            const power = base ** Number(i);
            let value = (valuesArray[i] - 1) % base; /* 1...2 becomes 0...1 */
            value = value * power;
            result += value;
        }
        return result;
    }
}
export class Seasonal extends Random {
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
