/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined size (e.g., 64--0...63).
 * 
 * Each subclass establishes its default behavior, its icons, its input process.
 * Every object must return a result constrained by its unique
 * parameters/properties.
 * 
 * The calling program may create multiple objects and blend their results. For
 * example, you want a result 0...63 by rolling three normal dice. The three
 * dice can return such results as 6x6x6 and 3x6x6 and 2x6x6, none of which
 * produce a usable result--but the calling program can also "divine" additional
 * results to refine the dice result, e.g., get a "seasonal" result using the
 * earth's orbit, moon phases, sun time, etc.
 */

/**
 * By default, a Range object is a coin toss returning one of two results:
 * - 0 (yin, broken line)
 * - 1 (yang, solid line)
 */
export class Range {
	items: number; /** number of items, e.g., 3 dice, 6 coins, etc. */
	faces: number; /** number of faces on each item, e.g., 6 die faces, 2 coin faces */
	limit: number;  /** high and low boundaries of result */
	start: number;
	step: number;
	get size() { return (this.limit - this.start) }
	valueOffset: number;

	constructor(items = 1, faces = 2, limit = 2, start = 0, step = 1) {
		this.items = items;    /* how many items (coins, dice, etc) will be tossed? */
		this.faces = faces;    /* how many different faces does each item have? 2? 6? */
		this.limit = limit;    /* non-inclusive integer boundary */
		this.start = start;    /* integer */
		this.step = (step >= 1) ? step : 1; // integer--### not implemented yet!
		/**
		 * By default, values are shifted by 1. This is because dropdown option
		 * 0 typically signifies "no value selected", making actual option
		 * values start with 1.
		 */
		this.valueOffset = 1;
	}

	displayOption(option: number) {
		return `${option}`;
	}

	displayValue(value: number) {
		return `${value}`;
	}

	/**
	 * Given item values (e.g., numbers on each die, HEADS or TAILS on each
	 * coin, etc.) return the `tally`. The tally will be a single number greater
	 * than or equal to 0 and less than this.limit (though this range may be
	 * offset by the value of `this.start`) which the item values represent.
	 * 
	 * If `this.items` and `this.faces` are inadequate to cover the 0...limit
	 * range, return '-'. If the item values produce multiple sets of tallies,
	 * and the tally falls in a set which is incomplete (containing less than
	 * the whole range), return '+'. Otherwise, return the tally as a number.
	 */
	tally(values: number[] = []): number|string {
		let tally: number|string;
		const maximumResult = this.faces ** this.items;
		if (maximumResult < this.limit) tally = '-'; /* can't cover range--underflow */
		else {
			const excess = maximumResult % this.limit
			const largestValidSum = maximumResult - excess - 1;
			let sum = 0;
			for (let i in values) {
				const position = values.length - 1 - Number(i); // if 3 values, position is 2, 1, 0
				const base = this.faces;
				const power = base ** position;                 // if 6 faces, power is 36, 6, 1
				let value = (values[i] - this.valueOffset) * power;
				sum += value;
			}
			if (sum > largestValidSum) tally = '+'; /* overflows range */
			else tally = sum % this.limit;
		}
		return tally;
	}

	/**
	 * ### todo
	 * Given items, faces, and limit, report all possible outcomes by looping
	 * over each combination. Report can be written as an array of strings which
	 * is returned to the caller.
	 */
	dump() {
		const outcomes: string[] = [];
		/**
		 * for each possible set of item values, call tally and push string on `outcomes`.
		 */
		outcomes.push('not yet implemented');
		return outcomes;
	}
}

export class Dice extends Range {

	constructor(items: number, faces: number, limit: number) {
		super(items, faces, limit);
	}

	displayValue(value: number) {
		let displayValue = `${value}`;
		if (this.faces == 6) {
			/* character codes 9856-9861: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅ */
			let characterCode = value + 9855;
			if (characterCode < 9856 || characterCode > 9861) characterCode = 9866; /* represents no die value */
			displayValue = `${String.fromCharCode(characterCode)}`;
		}
		return displayValue;
	}

}

export class Coins extends Range {
	
	constructor(items: number, limit: number) {
		super(items, 2, limit);
	}

	displayOption(option: number) {
		let alternate = `${option}`;
		const alternates = ['HEADS', 'TAILS'];
		if (option >= 1 && option <= alternates.length) alternate = alternates[option - 1];
		return alternate;
	}

	displayValue(value: number) {
		let alternate = `${value}`;
		const alternates = ['HEADS', 'TAILS'];
		if (value >= 1 && value <= alternates.length) alternate = alternates[value - 1];
		return `${value}`;
	}

	/**
	 * Swap HEADS and TAILS values and call the superclass method. The swap is
	 * necessary to make the result intuitive--HEADS is positive and TAILS is
	 * negative. We are relying on the fact that, by default, HEADS is 1 and
	 * TAILS is 2.
	 */
	tally(values: number[]) {
		const valuesCopy = Array.from(values);
		for (let i in valuesCopy) {
			valuesCopy[i] = (valuesCopy[i] == 1) ? 2 : 1; /* swap values */
		}
		return super.tally(valuesCopy);
	}
}

export class Seasonal extends Range { /** ### Calendric? */

	constructor(limit: number) {
		super(1, 2, limit);
	}
	
	tally() {
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
		const dayOfOrbit = (dayOfYear >= dayOfSolstice) ? dayOfYear -  dayOfSolstice : (daysInYear - dayOfSolstice) + dayOfYear;
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
