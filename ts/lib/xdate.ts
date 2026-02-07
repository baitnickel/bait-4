type Units = 'years'|'months'|'weeks'|'days'|'hours'|'minutes'|'seconds'|'milliseconds';


const D = '\\d+';
const S = '[\\/\\-\\.:]'; // do we really need "." and ":"? simplify--just support "/" and "-"
const XDateString = new RegExp('(^'+D+'$)|(^'+D+S+D+'$)|(^'+D+S+D+S+D+'$)');
const Separator = new RegExp(S);

/**
 * XDate is a custom extension of the standard Date class. You may use all Date
 * methods on an XDate. An XDate represents an instant in time with millisecond
 * granularity (similar to a Temporal.Instant object).
 * 
 * XDate supports several custom string constructors, using the following
 * Y(ear), M(onth), D(ay) patterns:
 * - "Y"   ("1984")
 * - "YM"  ("1984/12")
 * - "YMD" ("1984/12/31")
 * - "MY"  ("12/1984")
 * - "MDY" ("12/31/1984")
 * 
 * The value of the Y element must be greater than 99, and the M and D elements
 * must be one or two digits. Elements must be separated by a forward slash or a
 * hyphen. Note that M is not an offset--values should be 1...12.
 */
export class XDate extends Date {
	precision: number; /** for string date, the number of YMD elements provided; else 6 */
	leapYear: boolean;
	daysIntoYear: number;

	constructor(...args: any[]) {
		let precision = 6;
		const numberArgs = args.filter((arg) => !isNaN(arg));
		if (numberArgs.length > 1) {
			const yyyy = Number(numberArgs[0]);
			const monthIndex = (numberArgs.length > 1) ? Number(numberArgs[1]) : 0;
			const day = (numberArgs.length > 2) ? Number(numberArgs[2]) : 1;
			const hours = (numberArgs.length > 3) ? Number(numberArgs[3]) : 0;
			const minutes = (numberArgs.length > 4) ? Number(numberArgs[4]) : 0;
			const seconds = (numberArgs.length > 5) ? Number(numberArgs[5]) : 0;
			const milliseconds = (numberArgs.length > 6) ? Number(numberArgs[6]) : 0;
			super(yyyy, monthIndex, day, hours, minutes, seconds, milliseconds);
		}
		else if (args.length > 0)
			if (typeof args[0] == 'string') {
				const segments = XDate.parseDate(args[0]);
				if (segments.length) {
					precision = segments.length;
					if (precision < 2) segments.push(0); /** add default monthOffset */
					if (precision < 3) segments.push(1); /** add default day */
					super(segments[0], segments[1], segments[2]);
				}
				else super(args[0]);
			}
			else super(args[0]);
		else super();
		this.precision = precision;
		const year = this.getFullYear();
		this.leapYear = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
		this.daysIntoYear = (Date.UTC(year, this.getMonth(), this.getDate()) - Date.UTC(year, 0, 0)) / 24 / 60 / 60 / 1000;
	}

	/**
	 * Given a Date, return a number representing the time difference between
	 * this Date and the given Date. The difference is positive if the other
	 * Date is before this Date, and negative if after ("this - other"). The
	 * difference is expressed in the given Units (default is years).
	 */
	since(otherDate: Date, units: Units = 'years') {
		const milliseconds = this.valueOf() - otherDate.valueOf();
		return this.difference(milliseconds, otherDate, units);
	}

	until(otherDate: Date, units: Units = 'years') {
		const milliseconds = otherDate.valueOf() - this.valueOf();
		return this.difference(milliseconds, otherDate, units);
	}

	private difference(milliseconds: number, otherDate: Date, units: Units = 'years') {
		if (units == 'milliseconds') return milliseconds;
		const seconds = milliseconds / 1000;
		if (units == 'seconds') return seconds;
		const minutes = seconds / 60;
		if (units == 'minutes') return minutes;
		const hours = minutes / 60;
		if (units == 'hours') return hours;
		const days = hours / 24;
		if (units == 'days') return days;
		const weeks = (this.getDay() == otherDate.getDay()) ? Math.round(days / 7) : days / 7;
		if (units == 'weeks') { return weeks; }
		const sameDay = this.getDate() == otherDate.getDate();
		const months = (sameDay) ? Math.round(days / 30.4375) : days / 30.4375; /** average number of days in a month */
		if (units == 'months') return months;
		const sameDate = this.getMonth() == otherDate.getMonth() && this.getDate() == otherDate.getDate();
		const years = (sameDate) ? Math.round(days / 365.25) : days / 365.25; /** average number of days in a year */
		return years;
	}

	/**
	 * Given a `duration` of the specified `units` add the duration to this
	 * XDate and return the resulting XDate. A negative duration subtracts the
	 * duration from the date.
	 */
	add(duration: number, units: Units = 'years') {
		const newDate = new XDate(this.valueOf()); /** clone this date */
		if (units == 'milliseconds') newDate.setTime(newDate.getTime() + duration);
		else if (units == 'seconds') newDate.setSeconds(newDate.getSeconds() + duration);
		else if (units == 'minutes') newDate.setMinutes(newDate.getMinutes() + duration);
		else if (units == 'hours') newDate.setHours(newDate.getHours() + duration);
		else if (units == 'days') newDate.setDate(newDate.getDate() + duration);
		else if (units == 'weeks') newDate.setDate(newDate.getDate() + (duration * 7));
		else if (units == 'months') newDate.setMonth(newDate.getMonth() + duration);
		else newDate.setFullYear(newDate.getFullYear() + duration);
		return newDate;
	}

	/**
	 * Return a formatted string representing the XDate. When the date has been
	 * instantiated using custom formats (such as Y, YM, YMD, MY, and MDY), the
	 * formatted string will be adjusted accordingly.
	 */
	formatted() {
		const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		const mo = months[this.getMonth()];
		const d = this.getDate().toString();
		const wd = weekdays[this.getDay()];
		const year = this.getFullYear().toString().padStart(2, '0');
		let h = this.getHours();
		const amPm = (h < 12) ? 'am' : 'pm';
		if (h > 12) h -= 12;
		else if (h == 0) h = 12;
		const minute = this.getMinutes().toString().padStart(2, '0');
		const second = this.getSeconds().toString().padStart(2, '0');

		let format: string;
		if (this.precision == 1) format = `${year}`; /** year only */
		else if (this.precision == 2) format = `${mo} ${year}`; /** year and month only */
		else if (this.precision == 3) format = `${wd} ${mo} ${d}, ${year}`; /** year, month, and day only */
		else format = `${wd} ${mo} ${d}, ${year} ${h}:${minute}:${second}${amPm}`; /** full timestamp */
		return format;
	}

	/**
	 * Given a `dateString` (as in the XDate constructor), return a `segments`
	 * array of length 0...3. A zero-length array indicates an invalid custom
	 * dateString. Otherwise, segments[0] is the year, segments[1] (if it
	 * exists) is the month, and segments[2] (if it exists) is the day.
	 */
	static parseDate(dateString: string) {
		let segments: number[] = [];
		dateString = dateString.trim();
		if (!XDateString.test(dateString)) return segments;

		const components = dateString.split(Separator);
		const lastComponent = components[components.length - 1];
		if (components.length == 1) segments.push(Number(components[0])); /** year */ 
		else { /** 2 or 3 components: YM, YMD, MY, or MDY */
			if (lastComponent.length > 2) { /** Y is last, rearrange array to force YM or YMD */
				const year = components.pop()!;
				components.unshift(year);
			}
			segments.push(Number(components[0])); /** year */
			segments.push(Number(components[1]) - 1); /** monthOffset */
			if (segments[1] < 0 || segments[1] >= 12) segments.pop(); /** remove invalid monthOffset */
			else if (components.length == 3) {
				segments.push(Number(components[2])); /** day */
				if (!XDate.validDay(segments[0], segments[1] + 1, segments[2])) segments.pop(); /** remove invalid day */
			} 
		}
		return segments;
	}

	/**
	 * Given a year, a month, and a day, return true if these represent a valid
	 * date, otherwise return false.
	 */
	static validDay(year: number, month: number, day: number) {
		let validity = false;
		if (month < 1 || month > 12 || day < 1 || day > 31) return validity;
		let leapYear = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
		if (month == 2) {
			if (day <= 28 || (leapYear && day <= 29)) validity = true;
		}
		else if ([4,6,9,11].includes(month) && day <= 30) validity = true;
		else if (day <= 31) validity = true;
		return validity;
	}

	/** Return a date far in the future */
	static futureDate() {
		return new Date(9999, 0);
	}
}

/**
 * A Duration represents a difference between two time points, which can be used
 * in date/time arithmetic. It is fundamentally represented as a combination of
 * years, months, weeks, days, hours, minutes, seconds, milliseconds. Examples:
 * 
 * - P1Y1M1DT1H1M1.1S (1 yr, 1 mo, 1 day, 1 hr, 1 min, 1 sec, and 100 ms)
 * - P1M (1 month)
 * - PT1M (1 minute)
 * - P40D (40 days)
 * - PT0S (zero)
 * - P0D (zero)
 * - +P40D (ISO extension: plus 40 days)
 * - -P40D (ISO extension: minus 40 days)
 * - P3W1D (ISO extension: 3 weeks and 1 day)
 * 
 * See: https://en.wikipedia.org/wiki/ISO_8601#Durations
 */
export class Duration {
	years: number;
	months: number;
	weeks: number;
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	negative: boolean;

	constructor(value: string) {
		this.years = 0;
		this.months = 0;
		this.weeks = 0;
		this.days = 0;
		this.hours = 0;
		this.minutes = 0;
		this.seconds = 0;
		this.negative = false;
		this.parse(value);
	}

	/**
	 * Parse an ISO duration format string to extract date/time values. The
	 * `durationFormat` string consists of one or two date and time segments
	 * separated by a literal 'T'.
	 */
	parse(durationFormat: string) {
		durationFormat = durationFormat.toUpperCase();
		if (durationFormat[0] == '-' || durationFormat[0] == '+') {
			this.negative = (durationFormat[0] == '-');
			durationFormat = durationFormat.slice(1); /** peel off sign */
		}
		if (durationFormat[0] == 'P') {
			durationFormat = durationFormat.slice(1); /** peel off 'P' */
			const segments = durationFormat.split(/T/);
			/** pattern[0] for the date segment, and pattern[1] for the time segment */
			const patterns = [/(\d+Y)*(\d+M)*(\d+W)*(\d+D)*/g, /(\d+H)*(\d+M)*([\d\.]+S)*/g];
			for (let i = 0; i < 2; i += 1) {
				if (segments[i]) {
					const matches = patterns[i].exec(segments[i]);
					if (matches) {
						for (let j = 1; j < matches.length; j += 1) {
							if (matches[j]) {
								const unit = matches[j].slice(-1);
								const number = matches[j].slice(0, -1);
								if (!isNaN(Number(number))) {
									if (i == 0 && unit == 'Y') this.years = Number(number);
									else if (i == 0 && unit == 'M') this.months = Number(number);
									else if (i == 0 && unit == 'W') this.weeks = Number(number);
									else if (i == 0 && unit == 'D') this.days = Number(number);
									else if (i == 1 && unit == 'H') this.hours = Number(number);
									else if (i == 1 && unit == 'M') this.minutes = Number(number);
									else if (i == 1 && unit == 'S') this.seconds = Number(number);
								}
							}
						}
					}
				}
			}
		}
	}
}

// static yearsDifferent(baseDate: Date, targetDate: Date) {
// 	const dailyMilliseconds = 24 * 60 * 60 * 1000;
// 	const millisecondsDifferent = targetDate.valueOf() - baseDate.valueOf();
// 	const daysDifferent = millisecondsDifferent / dailyMilliseconds;
// 	const yearsDifferent = daysDifferent / 365.25;
// 	const decimalPlaces = (baseDate.getMonth() == targetDate.getMonth() && baseDate.getDate() == targetDate.getDate()) ? 0 : 1;
// 	return yearsDifferent.toFixed(decimalPlaces);
// }

// const birthday = new XDate(1952, 5, 21);
// const afterwards = new XDate(1955, 7, 21);
// console.log(afterwards.since(birthday, 'months').toFixed(1));

// for (let year = 1990; year < 2015; year += 1) {
// 	const xdate = new XDate(year, 11 ,31);
// 	const leap = (xdate.leapYear) ? 'leap' : '';
// 	console.log(xdate.formatted(), xdate.daysIntoYear, leap);
// }

// const xdate = new XDate(2020, 1, 29, 23, 30);
// const adjustedDate = xdate.add(121, 'minutes');
// console.log(`${xdate.formatted()} -> ${adjustedDate.formatted()}`);

/**
 * static futureDate
 * timeline use XDate
 */

// const values = ['P1Y2M3DT4H5M6.7S', 'P1M', 'PT1M', 'P40D', 'PT0S', 'P0D', '+P40D', '-P40D', 'P3W1D', 'X'];
// for (const value of values) {
// 	const duration = new Duration(value);
// 	const negative = (duration.negative) ? '-' : '';
// 	console.log(`${value}: ${negative}${duration.years}Y ${duration.months}M ${duration.weeks}W ${duration.days}D ${duration.hours}H ${duration.minutes}M ${duration.seconds}S `);
// }
