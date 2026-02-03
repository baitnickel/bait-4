const D = '\\d+';
const S = '[\\/\\-\\.:]'; // do we really need "." and ":"? simplify--just support "/" and "-"
const XDateString = new RegExp('(^'+D+'$)|(^'+D+S+D+'$)|(^'+D+S+D+S+D+'$)');
const Separator = new RegExp(S);

/**
 * XDate is a custom extension of the standard Date class. You may use all Date
 * methods on an XDate.
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
		let leapYear = (year % 4 == 0 && year % 400 != 0);
		if (month == 2) {
			if (day <= 28 || (leapYear && day <= 29)) validity = true;
		}
		else if ([4,6,9,11].includes(month) && day <= 30) validity = true;
		else if (day <= 31) validity = true;
		return validity;
	}

	/**
	 * Given a `baseDate` and a `targetDate` (such as a birthday and the current
	 * date), return a string representing the number of years between them
	 * (targetDate - baseDate)--an integer if the base month and day is the same
	 * as the target month and day, otherwise a number with a single decimal
	 * place (.0 to .9). When `baseDate` is a person's birth date, the returned
	 * value represents the age of the person as of the `targetDate`.
	 */
	static yearsDifferent(baseDate: Date, targetDate: Date) {
		const dailyMilliseconds = 24 * 60 * 60 * 1000;
		const millisecondsDifferent = targetDate.valueOf() - baseDate.valueOf();
		const daysDifferent = millisecondsDifferent / dailyMilliseconds;
		const yearsDifferent = daysDifferent / 365.25;
		const decimalPlaces = (baseDate.getMonth() == targetDate.getMonth() && baseDate.getDate() == targetDate.getDate()) ? 0 : 1;
		return yearsDifferent.toFixed(decimalPlaces);
	}
}
