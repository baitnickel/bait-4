/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined size (e.g., 64--0...63). On instantiation, the caller must
 * provide an HTML workspace (i.e., an HTMLDivElement). The subclasses may
 * create their own divs within this workspace, and must provide methods for
 * initialization, display, etc.
 * 
 * Creating a Lot object should be rarely done--this is why we have subclasses.
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

type Range = {
	high: number;
	low: number;
}

/**
 * By default, a Lot object is a coin toss returning one of two results:
 * - 0 (yin, broken line)
 * - 1 (yang, solid line)
 */
export class Lot {
	items: number; /** number of items, e.g., 3 dice, 6 coins, etc. */
	faces: number; /** number of faces on each item, e.g., 6 die faces, 2 coin faces */
	range: Range;
	get size() { return this.range.high - this.range.low + 1 };


	constructor(high = 1, low = 0) {
		this.items = 1;    /* how many items (coins, dice, etc) will be tossed? */
		this.faces = 2;    /* how many different faces does each item have? 2? 6? */
		this.range = { high: high, low: low };
	}

	displayOption(option: number) {
		return `${option}`;
	}

	displayValue(value: number) {
		return `${value}`;
	}

	/** ###
	 * create super `result` method using base (or bases)
	 */
	/** ###
	 * first dice should be high order, not low -- fix it in subclasses too.
	 * Process `valueArray` in a while loop (until valueArray is empty), doing
	 * value = valueArray.pop().
	 */
	result(values: number|number[] = 0): number|null {
		return Math.floor(Math.random() * this.size);
	}

	/**
	 * In addition to `result`, we should have a `returnCode` method that can be
	 * called when `result` returns null. Possible return codes: 0 (all good),
	 * 1: (insufficient items * faces for size) 2: (result out of bounds).
	 * 
	 * Maybe we can avoid null returns by returning 0 on errors and setting
	 * returnCode!
	 */
}

export class Dice extends Lot {

	constructor(items: number, faces: number, high: number, low = 0) {
		super(high, low);
		this.items = items;
		this.faces = faces;
		this.range = { high: high, low: low };
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

	result(values: number|number[]) {
		let result: number|null = null;
		const valuesArray = (Array.isArray(values)) ? values : [values];
		// const lastValue = valuesArray[valuesArray.length - 1];
		// while (this.faces > valuesArray.length) {
		// 	valuesArray.push(lastValue);
		// }
		/**
		 * ### our special case ... needs to be generalized
		 * 
		 * I think the only thing that is special about this case is that we are
		 * using base 4 instead of base 12 (reducing 12). We might find a
		 * formula that does such transformations based on the desired size and
		 * the items and faces.
		 */
		if (this.items == 3 && this.faces == 12 && this.size == 64) {
			const base = 4;
			const values: number[] = [];
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
			if ((this.faces ** this.items) < this.size) {
				/* values cannot express all results in range 0 ... this.size - 1 */
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
				if (result >= this.items * this.size) result = null;
				else result %= this.size;
			}
		}
		return result;
	}
}

export class Coins extends Lot {
	
	constructor(items: number, high = 1, low = 0) {
		super(high, low);
		this.items = items;
		this.faces = 2;
		this.range = { high: high, low: low };
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

	// ### need to swap heads and tails to make meanings more intuitive
	/** ###
	 * We need some sort of `transform` method ... object could name a
	 * function to be called between certain steps in calculating the result.
	 * The function could do such things as flip coin faces--make all heads
	 * tails and vice versa. But don't get too fancy--why not just have some
	 * class methods?
	 */
	result(values: number|number[]): number|null {
		const valuesArray = (Array.isArray(values)) ? values : [values];
		// const lastValue = valuesArray[valuesArray.length - 1];
		// while (this.faces > valuesArray.length) {
		// 	valuesArray.push(lastValue);
		// }
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

export class Seasonal extends Lot { /** ### Calendric? */

	constructor(high = 3, low = 0) {
		super(high, low);
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