/**
 * Two Times may form an Era, with the earlier Time and the later Time
 * forming the bounds of the era. An Era has a Length, calculated as an Interval,
 * always a positive value.
 * 
 * An Interval is the distance between two Times. Similar to an Era's Length,
 * it is always a positive value. It is used in Time addition, subtraction,
 * etc. at specified levels of granularity. Granularity is key to Interval
 * calculation. Intervals should typically be calculated as real numbers; the
 * code which handles an interval can round it any way it likes.
 * 
 * When juxtaposing two Points in Time, the Tropical Year
 * (https://en.wikipedia.org/wiki/Tropical_year) should be considered. In
 * essence, this means that the day of the year needs to have weight.
 */

type YMD = {year: number; month: number; day: number };

const MonthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const Weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const FullPrecision = 'FULL';
const YearPrecision = 'Y';
const YearMonthPrecision = 'YM';
const YearMonthDayPrecision = 'YMD';
const Years = 'Y';
const Months = 'M';
const Days = 'D';
const Weeks = 'W';
const Hours = 'h';
const Minutes = 'm';
const Seconds = 's';
const AlternateSeparators = ['/'];

/**
 * Time is a custom extension of the standard Date class. The Time constructor
 * accepts all of the parameters valid in the Date constructor, and you may use
 * all Date methods on a Time. A Time object is similar to a Temporal.Instant
 * object.
 * 
 * When a Time object is instantiated using a string of the form '2026',
 * '2026-01', or '2026-01-31', the `precision` property will be set to 'Y',
 * 'YM', or 'YMD', respectively.
 * 
 * A question mark character ('?') may be appended to any of the string
 * constructor patterns, and will identify the Time as an estimate.
 * 
 * The Y element must be four digits, padded on the left with zeros as necessary
 * (0001...0999). The M and D elements must be two digits (also padded with a
 * zero as necessary). Elements must be separated by a hyphen. Note that unlike
 * the Date constructor, M is not an offset--values should be 01...12.
 */
export class Time extends Date {
	static msPerSecond = 1000;
	static msPerMinute = 1000 * 60;
	static msPerHour = 1000 * 60 * 60;
	static msPerDay = 1000 * 60 * 60 * 24;
	static msPerWeek = 1000 * 60 * 60 * 24 * 7;

	valid: boolean;
	precision: string; /** YearPrecision, YearMonthPrecision, YearMonthDayPrecision, or FullPrecision */
	estimate: boolean; /** string values ending with '?' are estimates */

	constructor(parameter: null|Date|number|string = null,
		monthIndex: null|number = null,
		day: null|number = null,
		hours: number = 0,
		minutes: number = 0,
		seconds: number = 0,
		milliseconds: number = 0
	) {
		let precision = FullPrecision;
		let estimate = false;
		if (parameter === null) super();
		else if (parameter instanceof Date) super(parameter.valueOf());
		else if (typeof parameter == 'number') {
			if (monthIndex == null) super(parameter); /** a single numeric parameter is a timestamp */
			else if (day === null) {
				/** only year and monthIndex have been supplied */
				precision = YearMonthPrecision;
				super(parameter, monthIndex);
			}
			else {
				/** year, monthIndex, and day (and possibly time elements) have been supplied */
				if (hours == 0 && minutes == 0 && seconds == 0 && milliseconds == 0) precision = YearMonthDayPrecision;
				super(parameter, monthIndex, day, hours, minutes, seconds, milliseconds);
			}
		}
		else {
			/** parameter is a string--determine estimate and precision */
			parameter = parameter.trim();
			if (parameter.endsWith('?')) {
				estimate = true;
				parameter = parameter.slice(0, -1).trim();
			}
			/** convert alternate separators to ISO-standard hyphens */
			for (const separator of AlternateSeparators) {
				const separatorRegExp = new RegExp(`\\${separator}`, 'g');
				parameter = parameter.replace(separatorRegExp, '-');
			}
			/** determine precision and treat all date-times as local */
			if (/^\d{4}$/.test(parameter)) precision = YearPrecision;
			else if (/^\d{4}-\d{2}$/.test(parameter)) precision = YearMonthPrecision;
			else if (/^\d{4}-\d{2}-\d{2}$/.test(parameter)) precision = YearMonthDayPrecision;
			if (precision != FullPrecision) parameter += 'T00:00:00.000'; /** specify time to convert UTC to local */
			super(parameter);
		}

		if (
			precision == FullPrecision &&
			this.getHours() == 0 &&
			this.getMinutes() == 0 &&
			this.getSeconds() == 0 &&
			this.getMilliseconds() == 0
		) precision = YearMonthDayPrecision;

		this.valid = !isNaN(this.valueOf());
		this.precision = precision;
		this.estimate = estimate;
	}

	/**
	 * Return a copy of this Time with the same properties.
	 */
	clone() {
		let clone: Time;
		clone = new Time(this);
		clone.valid = this.valid;
		clone.precision = this.precision;
		clone.estimate = this.estimate;
		return clone;
	}

	/**
	 * Return true if this year is a leap year, else return false.
	 */
	leapYear() {
		return Time.isLeapYear(this.getFullYear());
	}
	
	/** Return true if this Time is in Daylight Saving Time (DST), else return false. */
	DST() {
		return this.DSTOffset() != 0;
	}

	/**
	 * Return a number representing the number of milliseconds difference
	 * between this time and the same time without Daylight Saving Time (DST).
	 * Return 0 if DST is not in effect for this time).
	 */
	DSTOffset() {
		const january = new Date(this.getFullYear(), 0);
		const offset = (january.getTimezoneOffset() - this.getTimezoneOffset()) * Time.msPerMinute;
		return offset;
	}

	/**
	 * Return the number of milliseconds since midnight for this Time.
	 */
	midnightOffset() {
		let offset = 0;
		offset += this.getHours() * Time.msPerHour;
		offset += this.getMinutes() * Time.msPerMinute;
		offset += this.getSeconds() * Time.msPerSecond;
		offset += this.getMilliseconds();
		return offset;
	}

	/**
	 * Return a new Time, rounding its value down to the nearest second,
	 * minute, or hour, stripping off lower-order milliseconds.
	 */
	trunc(resolution: 'second'|'minute'|'hour') {
		let milliseconds = Time.msPerSecond;
		if (resolution == 'minute') milliseconds = Time.msPerMinute;
		else if (resolution == 'hour') milliseconds = Time.msPerHour;
		const time = this.getTime();
		return new Date(time - (time % milliseconds));
	}

	/**
	 * Return the ordinal day of the year. e.g., 1 for Jan 1 and 32 for Feb 1.
	 * When `leap` is true, we treat every year as a leap year, ensuring that
	 * dates after Feb 28 return the same ordinal day regardless of the year.
	 */
	ordinalDay(leap = false) {
		const year = (leap) ? 2000 : this.getFullYear();
		const january1 = new Date(year, 0);
		const thisDay = new Date(year, this.getMonth(), this.getDate())
		return (thisDay.getTime() - january1.getTime()) / Time.msPerDay;
	}
	
	/**
	 * Return a Time representing this Time in Standard Time (as if there
	 * were no Daylight Savings Time). The new Time's noon will always occur
	 * when the sun is at its zenith, and its midnight will always occur when
	 * the sun is at its nadir.
	 */
	standardTime() {
		const time = this.clone();
		const january = new Date(this.getFullYear(), 0);
		const offsetMinutes = january.getTimezoneOffset() - this.getTimezoneOffset();
		if (offsetMinutes) time.setTime(time.getTime() - (offsetMinutes * Time.msPerMinute));
		return time;
	}

	/**
	 * Return a formatted string representing the Time. When the time has been
	 * instantiated using custom formats (such as Y, YM, YMD), the formatted
	 * string will be adjusted accordingly. Passing a `precision` argument will
	 * temporarily override the Time's precision property.
	 */
	formatted(precision = '') {
		if (!precision) precision = this.precision;
		const mo = MonthNames[this.getMonth()];
		const d = this.getDate().toString();
		const wd = Weekdays[this.getDay()];
		const year = this.getFullYear().toString().padStart(2, '0');
		let h = this.getHours();
		const amPm = (h < 12) ? 'am' : 'pm';
		if (h > 12) h -= 12;
		else if (h == 0) h = 12;
		const minute = this.getMinutes().toString().padStart(2, '0');
		const second = this.getSeconds().toString().padStart(2, '0');

		let format: string;
		if (precision == YearPrecision) format = `${year}`;
		else if (precision == YearMonthPrecision) format = `${mo} ${year}`;
		else if (precision == YearMonthDayPrecision) format = `${wd} ${mo} ${d}, ${year}`;
		else format = `${wd} ${mo} ${d}, ${year} ${h}:${minute}:${second}${amPm}`; /** full timestamp */
		return format;
	}

	/**
	 * Return the interval between this Time and an `other` Time, using
	 * the `granularity` requested ('Y': years, 'M': months, 'W': weeks, 'D':
	 * days, 'h': hours, 'm': minutes, 's': seconds). The interval is always a
	 * positive real number (number of years, number of months, number of days,
	 * etc.).
	 * 
	 * See: https://en.wikipedia.org/wiki/Tropical_year
	 */
	interval(other: Time, granularity: string) {
		let interval = 0;
		const thisIsEarlier = this.valueOf() < other.valueOf();
		const earlierTime = (thisIsEarlier) ? this : other;
		const laterTime = (thisIsEarlier) ? other : this;
		const earlier: YMD = { year: earlierTime.getFullYear(), month: earlierTime.getMonth(), day: earlierTime.getDate() };
		const later: YMD = { year: laterTime.getFullYear(), month: laterTime.getMonth(), day: laterTime.getDate() };
		
		if (granularity == Years) {
			const solarDays = 366; //365.24217;  /** we are treating all years as leap years for our purposes here */
			const daysDifferent = laterTime.ordinalDay(true) - earlierTime.ordinalDay(true);
			if (later.year == earlier.year) interval = (laterTime.ordinalDay() - earlierTime.ordinalDay()) / solarDays;
			else if (daysDifferent >= 0) interval = (later.year - earlier.year) + (daysDifferent / solarDays);
			else interval = (later.year - earlier.year - 1) + ((solarDays + daysDifferent) / solarDays);
		}
		else if (granularity == Months) {
			const monthsDifferent = later.month - earlier.month;
			const laterDayOffset = (later.day - 1) / 31;
			const earlierDayOffset = (earlier.day - 1) / 31;
			const dayOffset = (laterDayOffset >= earlierDayOffset) ? laterDayOffset - earlierDayOffset : earlierDayOffset - laterDayOffset;
			if (later.year == earlier.year) interval = monthsDifferent + dayOffset;
			else interval = ((later.year - earlier.year) * 12) + monthsDifferent + dayOffset;
		} 
		else {
			let divisor = Time.msPerSecond; /** default: Seconds */
			if (granularity == Minutes) divisor = Time.msPerMinute;
			else if (granularity == Hours) divisor = Time.msPerHour;
			else if (granularity == Days) divisor = Time.msPerDay;
			else if (granularity == Weeks) divisor = Time.msPerWeek;
			interval = (this.valueOf() / divisor) - (other.valueOf() / divisor);
		}
		return Math.abs(interval);
	}

	/**
	 * Given a Time earlier than this Time, return the interval between
	 * the two using the specified `granularity` ('Y': years, 'M': months, 'W':
	 * weeks, 'D': days, 'h': hours, 'm': minutes, 's': seconds). If
	 * `earlierDate` is actually later than this Time, the interval returned
	 * will be negative.
	 */
	since(earlierDate: Time, granularity: string = Years) {
		let interval = this.interval(earlierDate, granularity);
		if (this.valueOf() < earlierDate.valueOf()) interval = -interval;
		return interval;
	}

	/**
	 * Given a Time later than this Time, return the interval between the
	 * two using the specified `granularity` ('Y': years, 'M': months, 'W':
	 * weeks, 'D': days, 'h': hours, 'm': minutes, 's': seconds). If `laterDate`
	 * is actually earlier than this Time, the interval returned will be
	 * negative.
	 */
	until(laterDate: Time, granularity: string = Years) {
		let interval = this.interval(laterDate, granularity);
		if (this.valueOf() > laterDate.valueOf()) interval = -interval;
		return interval;
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
	 * later Time representing this Time plus the interval. Valid
	 * granularities are: Y, M, W, D, h, m, s.
	 */
	add(interval: number, granularity: string) {
		return this.adjustment(interval, granularity, true);
	}

	/**
	 * Given an `interval` and a `granularity` (unit of measure), return a new
	 * earlier Time representing this Time minus the interval. Valid
	 * granularities are: Y, M, W, D, h, m, s.
	 */
	subtract(interval: number, granularity: string) {
		return this.adjustment(interval, granularity, false);
	}

	/**
	 * Does this Time precede `otherDate`. If the two dates are equal, we
	 * will return false.
	 */
	precedes(otherDate: Time|Date) {
		return Time.compare(this, otherDate) < 0;
	}

	/**
	 * Add or subtract an `interval` of a given `granularity` to or from this
	 * Time, and return a new Time. With the exception of seconds (s),
	 * only integer intervals are supported. Valid granularities are: Y, M, W,
	 * D, h, m, s. Given an invalid granularity, we return a clone of this
	 * Time.
	 */
	private adjustment(interval: number, granularity: string, addition: boolean) {
		if (interval < 0) addition = !addition;
		interval = Math.abs(interval);
		if (granularity != Seconds) interval = Math.floor(interval);
		if (!addition) interval = -interval;

		let time: Time;
		if (granularity == Years || granularity == Months) {
			const yearOffset = (granularity == Years) ? interval : Math.floor((this.getMonth() + interval) / 12);
			const monthOffset = (granularity == Years) ? this.getMonth() : (this.getMonth() + interval) % 12;
			const year = this.getFullYear() + yearOffset;
			let lastDayOfMonth = MonthDays[monthOffset];
			if (monthOffset == 1 && Time.isLeapYear(year)) lastDayOfMonth += 1; /** Feb 29 */
			const day = (this.getDate() <= lastDayOfMonth) ? this.getDate() : lastDayOfMonth;
			const YYYY = year.toString().padStart(4,'0');
			const MM = (monthOffset + 1).toString().padStart(2,'0');
			const DD = day.toString().padStart(2,'0');
			let initializer = `${YYYY}-${MM}-${DD}`;
			const timeString = this.toISOString().split('T')[1];
			if (this.precision == FullPrecision) initializer += `T${timeString}`;
			time = new Time(initializer);
		}
		else {
			let multiplier = 0;
			if (granularity == Seconds) multiplier = Time.msPerSecond; /** default: Seconds */
			else if (granularity == Minutes) multiplier = Time.msPerMinute;
			else if (granularity == Hours) multiplier = Time.msPerHour;
			else if (granularity == Days) multiplier = Time.msPerDay;
			else if (granularity == Weeks) multiplier = Time.msPerWeek;
			interval *= multiplier;
			time = new Time(this.valueOf() + interval);
		}
		return time;
	}

	/**
	 * Given `time1` and `time2`, return a number (-1, 0, or 1) indicating
	 * whether `time1` comes before, is the same as, or comes after
	 * `time2`.
	 */
	static compare(time1: Time|Date, time2: Time|Date) {
		const difference = time1.valueOf() - time2.valueOf();
		if (difference == 0) return 0;
		return (difference > 0) ? 1 : -1;
	}
	
	/**
	 * Given a Date or Time, use its UTC (interval) values to create and return
	 * a Time in the local time zone.
	 */
	static convertUTC(date: Date|Time) {
		const year = date.getUTCFullYear();
		const monthIndex = date.getUTCMonth();
		const day = date.getUTCDate();
		const hours = date.getUTCHours();
		const minutes = date.getUTCMinutes();
		const seconds = date.getUTCSeconds();
		const milliseconds = date.getUTCMilliseconds();
		const local = new Time(year, monthIndex, day, hours, minutes, seconds, milliseconds);
		return local;
	}

	/**
	 * Given a number representing a `year`, return true if the year is a leap
	 * year, else return false.
	 */
	static isLeapYear(year: number) {
		return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
	}

	/**
	 * Return a Time inconceivably far into the future (for all practical
	 * purposes).
	 */
	static futureTime() {
		return new Time(9999, 0);
	}

	/**
	 * Given a year, a month, and a day, return true if these represent a valid
	 * date, otherwise return false.
	 */
	static validDay(year: number, month: number, day: number) {
		let validity = false;
		if (month < 1 || month > 12 || day < 1 || day > 31) return validity;
		let leapYear = Time.isLeapYear(year);
		if (month == 2) {
			if (day <= 28 || (leapYear && day <= 29)) validity = true;
		}
		else if ([4,6,9,11].includes(month) && day <= 30) validity = true;
		else if (day <= 31) validity = true;
		return validity;
	}
}
