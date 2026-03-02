/**
 * Two Instants may form an Era, with the earlier Instant and the later Instant
 * forming the bounds of the era. An Era has a Length, calculated as an Interval,
 * always a positive value.
 * 
 * An Interval is the distance between two Instants. Similar to an Era's Length,
 * it is always a positive value. It is used in Instant addition, subtraction,
 * etc. at specified levels of granularity. Granularity is key to Interval
 * calculation. Intervals should typically be calculated as real numbers; the
 * code which handles an interval can round it any way it likes.
 * 
 * When juxtaposing two Points in Time, the Tropical Year
 * (https://en.wikipedia.org/wiki/Tropical_year) should be considered. In
 * essence, this means that the day of the year needs to have weight.
 */

type InstantComponents = {
	date: Date;
	precision: string;
	approximation: boolean;
}

type YMD = {year: number; month: number; day: number };

const Months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const Weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const FullPrecision = 'YMDhms';
const YearPrecision = 'Y';
const YearMonthPrecision = 'YM';
const YearMonthDayPrecision = 'YMD';
const MonthPrecision = 'M';
const MonthDayPrecision = 'MD';


const D = '\\d+';
const S = '[\\/\\-]';
const InstantString = new RegExp('(^'+D+'$)|(^'+D+S+D+'$)|(^'+D+S+D+S+D+'$)');
const Separator = new RegExp(S);
const ISOFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\S*$/i;

/**
 * Instant is a custom extension of the standard Date class. You may use all
 * Date methods on an Instant. An Instant represents an instant in time with
 * millisecond granularity (similar to a Temporal.Instant object).
 * 
 * Instant supports several custom string constructors (and not the standard
 * Date string constructors), using the following Y(ear), M(onth), D(ay)
 * patterns:
 * 
 * - "Y"   ("1984")
 * - "YM"  ("1984/12")
 * - "YMD" ("1984/12/31")
 * - "M"   ("12")
 * - "MD"  ("12/31")
 * - "MY"  ("12/1984")
 * - "MDY" ("12/31/1984")
 * 
 * Standard ISO Date string constructors can be used, e.g.:
 * 
 * - const instant = new Instant('2020-01-01T00:00:00.000Z');
 * 
 * A question mark character ("?") may be appended to any of the string
 * constructor patterns, and will identify the Instant as an approximation.
 * 
 * The Y element must be three or more digits, padded on the left with zeros as
 * necessary (001...099). The M and D elements must be one or two digits.
 * Elements must be separated by a forward slash or a hyphen. Note that unlike
 * the Date constructor, M is not an offset--values should be 1...12.
 */
export class Instant extends Date {
	valid: boolean;
	precision: string; /** YMDhms, Y, YM, YMD, M, MY, MD, MDY */
	approximation: boolean; /** strings ending with '?' are approximations */

	constructor(initializer: Date|number|string|null = null) {
		let instantComponents: InstantComponents = { date: new Date(NaN), precision: FullPrecision, approximation: false };
		if (initializer === null) super();
		else if (typeof initializer == 'number') super(initializer);
		else if (initializer instanceof Date) super(initializer.valueOf());
		else {
			/** `initializer` is a string */
			instantComponents = Instant.parseDateString(initializer);
			super(instantComponents.date);
		}
		this.valid = !isNaN(this.valueOf());
		this.precision = instantComponents.precision;
		this.approximation = instantComponents.approximation;
	}

	static parseDateString(dateString: string) {
		const instantComponents = { date: new Date(NaN), precision: '', approximation: false};

		dateString = dateString.trim();
		if (dateString.endsWith('?')) {
			instantComponents.approximation = true;
			dateString = dateString.slice(0, -1).trim();
		}

		if (ISOFormat.test(dateString)) {
			const date = new Date(dateString);
			if (!isNaN(date.valueOf())) {
				instantComponents.date = new Date(dateString);
				instantComponents.precision = FullPrecision;
			}
			return instantComponents;
		}
		else if (!InstantString.test(dateString)) return instantComponents; /** reject invalid dateString */
		
		/** having passed the test, we know there are 1-3 components, each a valid integer */
		const components = dateString.split(Separator);
		const segments: number[] = [];
		for (const component of components) segments.push(Number(component));
		// if (segments[0] > 99) { // Y, YM, YMD (create YMD)
		if (components[0].length >= 3) { // Y, YM, YMD
			if (segments.length == 1) segments.push(0); // append 0 month (Y0)
			if (segments.length == 2) segments.push(0); // append 0 day (Y00)
		}
		else { // M, MY, MD, MDY (create YMD)
			if (segments.length == 1) { // M
				segments.unshift(0); // insert 0 year (0M)
				segments.push(0); // append 0 day (0M0)
			}
			else if (segments.length == 2) { // MY, MD
				const yearOrDay = segments.pop()!; // remove second segment (year or day)
				if (components[1].length >= 3) { // MY (yearOrDay is year)
					segments.unshift(yearOrDay); // insert year (YM)
					segments.push(0); // append 0 day (YM0)
				}
				else { /** yearOrDay is D */
					segments.unshift(0); // insert 0 year (0M)
					segments.push(yearOrDay); // MD -- insert day (0MD)
				}
			}
			else { // 3 segments: MDY
				const year = segments.pop()!; // remove year (Y)
				segments.unshift(year); // insert year (YMD)
			}
		}

		/**
		 * At this point, segments are YMD -- any segment may be 0. A 0 segment
		 * indicates that it has not been supplied, and will not be included in
		 * the precision. In the Date object, a 0 year will become the year
		 * 0000; a 0 month will become January (month offset 0); a 0 day will
		 * become * 1. For example, if only a year is provided as '1980', the
		 * precision will be `YearPrecision` and the Date will be Jan 1, 1980.
		 */
		const year = segments[0];
		const month = segments[1];
		const day = segments[2];
		if (year > 0) instantComponents.precision += 'Y';
		if (month > 0) instantComponents.precision += 'M';
		if (day > 0) instantComponents.precision += 'D';

		/** create a standard UTC Date object -- it will handle overflow months, dates, etc. */
		const YYYY = year.toString().padStart(4,'0');
		const MM = (month == 0) ? '01' : month.toString().padStart(2,'0');
		const DD = (day == 0) ? '01' : day.toString().padStart(2,'0');
		instantComponents.date = new Date(`${YYYY}-${MM}-${DD}`); // will be UTC; `T00:00:00.000Z` is not necessary
		return instantComponents;
	}

	/**
	 * Return a copy of this Instant with the same properties.
	 */
	clone() {
		let clone: Instant;
		if (this.precision == FullPrecision) clone = new Instant(this.valueOf());
		else {
			const YYYY = this.getUTCFullYear();
			const MM = this.getUTCMonth() + 1;
			const DD = this.getUTCDate();
			clone = new Instant(`${YYYY}-${MM}-${DD}`)
		}
		clone.valid = this.valid;
		clone.precision = this.precision;
		clone.approximation = this.approximation;
		return clone;
	}

	/**
	 * Return true if this year is a leap year, else return false.
	 */
	leapYear() {
		return Instant.isLeapYear(this.getUTCFullYear());
	}
	
	/**
	 * Return the ordinal day of the year. e.g., 32 for Feb 1. When `leap` is
	 * true, we assume that the year is a leap year, ensuring that dates after
	 * Feb 28 return the same ordinal day regardless of the year.
	 */
	ordinal(leap = false) {
		const year = (leap) ? 2000 : this.getUTCFullYear();
		return (Date.UTC(year, this.getUTCMonth(), this.getUTCDate()) - Date.UTC(year, 0, 0)) / 24 / 60 / 60 / 1000;
	}

	/**
	 * Return a formatted string representing the Instant. When the date has
	 * been instantiated using custom formats (such as Y, YM, YMD, MY, and MDY),
	 * the formatted string will be adjusted accordingly. Passing a `precision`
	 * argument will temporarily override the Instant's precision property.
	 */
	formatted(precision = '') {
		if (!precision) precision = this.precision;
		const mo = Months[this.getUTCMonth()];
		const d = this.getUTCDate().toString();
		const wd = Weekdays[this.getUTCDay()];
		const year = this.getUTCFullYear().toString().padStart(2, '0');
		let h = this.getUTCHours();
		const amPm = (h < 12) ? 'am' : 'pm';
		if (h > 12) h -= 12;
		else if (h == 0) h = 12;
		const minute = this.getUTCMinutes().toString().padStart(2, '0');
		const second = this.getUTCSeconds().toString().padStart(2, '0');

		let format: string;
		if (precision == YearPrecision) format = `${year}`; /** year only */
		else if (precision == YearMonthPrecision) format = `${mo} ${year}`; /** year and month only */
		else if (precision == YearMonthDayPrecision) format = `${wd} ${mo} ${d}, ${year}`; /** year, month, and day only */
		else if (precision == MonthPrecision) format = `${mo}`; /** month only */
		else if (precision == MonthDayPrecision) format = `${mo} ${d}`; /** month and day only */
		else format = `${wd} ${mo} ${d}, ${year} ${h}:${minute}:${second}${amPm}`; /** full timestamp */
		return format;
	}

	/**
	 * Return the interval between this Instant and an `other` Instant, using
	 * the `granularity` requested ('Y': years, 'M': months, 'W': weeks, 'D':
	 * days, 'h': hours, 'm': minutes, 's': seconds). The interval is always a
	 * positive real number (number of years, number of months, number of days,
	 * etc.).
	 * 
	 * See: https://en.wikipedia.org/wiki/Tropical_year
	 */
	interval(other: Instant, granularity: string) {
		let interval = 0;
		const thisIsEarlier = this.valueOf() < other.valueOf();
		const earlierInstant = (thisIsEarlier) ? this : other;
		const laterInstant = (thisIsEarlier) ? other : this;
		const earlier: YMD = { year: earlierInstant.getUTCFullYear(), month: earlierInstant.getUTCMonth(), day: earlierInstant.getUTCDate() };
		const later: YMD = { year: laterInstant.getUTCFullYear(), month: laterInstant.getUTCMonth(), day: laterInstant.getUTCDate() };
		
		if (granularity == 'Y') { /** Years */
			const solarDays = 366; //365.24217;  we are treating all years as leap years for our purposes here
			const daysDifferent = laterInstant.ordinal(true) - earlierInstant.ordinal(true);
			if (later.year == earlier.year) interval = (laterInstant.ordinal() - earlierInstant.ordinal()) / solarDays;
			else if (daysDifferent >= 0) interval = (later.year - earlier.year) + (daysDifferent / solarDays);
			else interval = (later.year - earlier.year - 1) + ((solarDays + daysDifferent) / solarDays);
		}
		else if (granularity == 'M') { /** Months */
			const monthsDifferent = later.month - earlier.month;
			const laterDayOffset = (later.day - 1) / 31;
			const earlierDayOffset = (earlier.day - 1) / 31;
			const dayOffset = (laterDayOffset >= earlierDayOffset) ? laterDayOffset - earlierDayOffset : earlierDayOffset - laterDayOffset;
			if (later.year == earlier.year) interval = monthsDifferent + dayOffset;
			else interval = ((later.year - earlier.year) * 12) + monthsDifferent + dayOffset;
		} 
		else {
			let divisor = 1000; /** default: 's' Seconds */
			if (granularity == 'm') divisor = 60 * 1000; /** Minutes */
			else if (granularity == 'h') divisor = 60 * 60 * 1000; /** Hours */
			else if (granularity == 'D') divisor = 24 * 60 * 60 * 1000; /** Days */
			else if (granularity == 'W') divisor = 7 * 24 * 60 * 60 * 1000; /** Weeks */
			interval = (this.valueOf() / divisor) - (other.valueOf() / divisor);
		}
		return Math.abs(interval);
	}

	/**
	 * Given an Instant earlier than this Instant, return the interval between
	 * the two using the specified `granularity` ('Y': years, 'M': months, 'W':
	 * weeks, 'D': days, 'h': hours, 'm': minutes, 's': seconds). If
	 * `earlierDate` is actually later than this Instant, the interval returned
	 * will be negative.
	 */
	since(earlierDate: Instant, granularity: string = 'Y') {
		let interval = this.interval(earlierDate, granularity);
		if (this.valueOf() < earlierDate.valueOf()) interval = -interval;
		return interval;
	}

	/**
	 * Given an Instant later than this Instant, return the interval between the
	 * two using the specified `granularity` ('Y': years, 'M': months, 'W':
	 * weeks, 'D': days, 'h': hours, 'm': minutes, 's': seconds). If `laterDate`
	 * is actually earlier than this Instant, the interval returned will be
	 * negative.
	 */
	until(laterDate: Instant, granularity: string = 'Y') {
		let interval = this.interval(laterDate, granularity);
		if (this.valueOf() > laterDate.valueOf()) interval = -interval;
		return interval;
	}

	/**
	 * Add or subtract an `interval` of a given `granularity` to or from this
	 * Instant, and return a new Instant. With the exception of seconds (s),
	 * only integer intervals are supported. Valid granularities are: Y, M, W,
	 * D, h, m, s. Given an invalid granularity, we return a clone of this
	 * Instant.
	 */
	private adjustment(interval: number, granularity: string, addition: boolean) {
		if (interval < 0) addition = !addition;
		interval = Math.abs(interval);
		if (granularity != 's') interval = Math.floor(interval);
		if (!addition) interval = -interval;

		let instant: Instant;
		if (granularity == 'Y' || granularity == 'M') { /** Years or Months */
			const yearOffset = (granularity == 'Y') ? interval : Math.floor((this.getUTCMonth() + interval) / 12);
			const monthOffset = (granularity == 'Y') ? this.getUTCMonth() : (this.getUTCMonth() + interval) % 12;
			const year = this.getUTCFullYear() + yearOffset;
			let lastDayOfMonth = MonthDays[monthOffset];
			if (monthOffset == 1 && Instant.isLeapYear(year)) lastDayOfMonth += 1; /** Feb 29 */
			const day = (this.getUTCDate() <= lastDayOfMonth) ? this.getUTCDate() : lastDayOfMonth;
			const YYYY = year.toString().padStart(4,'0');
			const MM = (monthOffset + 1).toString().padStart(2,'0');
			const DD = day.toString().padStart(2,'0');
			let initializer = `${YYYY}-${MM}-${DD}`;
			const timeString = this.toISOString().split('T')[1];
			if (this.precision == FullPrecision) initializer += `T${timeString}`;
			instant = new Instant(initializer);
		}
		else {
			let multiplier = 0;
			if (granularity == 's') multiplier = 1000; /** default: 's' Seconds */
			else if (granularity == 'm') multiplier = 60 * 1000; /** Minutes */
			else if (granularity == 'h') multiplier = 60 * 60 * 1000; /** Hours */
			else if (granularity == 'D') multiplier = 24 * 60 * 60 * 1000; /** Days */
			else if (granularity == 'W') multiplier = 7 * 24 * 60 * 60 * 1000; /** Weeks */
			interval *= multiplier;
			instant = new Instant(this.valueOf() + interval);
		}
		return instant;
	}

	/**
	 * `add` and `subtract` could take a single string that conforms to a
	 * Temporal.Duration, e.g. 'P1Y1M1DT1H1M1.1S'. We would then parse this
	 * string into an array of intervals and granularities, and call
	 * `this.adjustment` in a loop. We would need to parse the string, ensuring
	 * that it starts with 'P' (Period), breaking it into date values and time
	 * values (splitting on 'T'), extracting each interval/granularity (ignoring
	 * any invalid entries). Is there a need for this, though?
	 */

	/**
	 * Given an `interval` and a `granularity` (unit of measure), return a new
	 * later Instant representing this Instant plus the interval. Valid
	 * granularities are: Y, M, W, D, h, m, s.
	 */
	add(interval: number, granularity: string) {
		return this.adjustment(interval, granularity, true);
	}

	/**
	 * Given an `interval` and a `granularity` (unit of measure), return a new
	 * earlier Instant representing this Instant minus the interval. Valid
	 * granularities are: Y, M, W, D, h, m, s.
	 */
	subtract(interval: number, granularity: string) {
		return this.adjustment(interval, granularity, false);
	}

	/**
	 * Given `instant1` and `instant2`, return a number (-1, 0, or 1) indicating
	 * whether `instant1` comes before, is the same as, or comes after
	 * `instant2`
	 */
	static compare(instant1: Instant, instant2: Instant) {
		const difference = instant1.valueOf() - instant2.valueOf();
		if (difference == 0) return 0;
		return (difference > 0) ? 1 : -1;
	}

	/**
	 * Given a number representing a `year`, return true if the year is a leap
	 * year, else return false.
	 */
	static isLeapYear(year: number) {
		return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
	}

	/**
	 * Return an Instant inconceivably far into the future (for all practical
	 * purposes).
	 */
	static futureDate() {
		return new Instant('9999');
	}

	/**
	 * Given a year, a month, and a day, return true if these represent a valid
	 * date, otherwise return false.
	 */
	static validDay(year: number, month: number, day: number) {
		let validity = false;
		if (month < 1 || month > 12 || day < 1 || day > 31) return validity;
		let leapYear = Instant.isLeapYear(year);
		if (month == 2) {
			if (day <= 28 || (leapYear && day <= 29)) validity = true;
		}
		else if ([4,6,9,11].includes(month) && day <= 30) validity = true;
		else if (day <= 31) validity = true;
		return validity;
	}
}
