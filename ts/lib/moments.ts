import * as T from './types.js';

const D = '\\d+';
const S = '[\\/\\-\\.:]';
const MomentString = new RegExp('(^'+D+'$)|(^'+D+S+D+'$)|(^'+D+S+D+S+D+'$)');
const Separator = new RegExp(S);

/**
 * The Moment class is essentially an extension of the Date class. A Moment
 * object may be created from either a Date object or a string. If it's a
 * string, the date elements must follow one of the following Y(ear), M(onth),
 * D(ay) patterns: Y, YM, YMD, MY, or MDY. The value of the Y element must be
 * greater than 99, and the M and D elements must be one or two digits. Elements
 * must be separated, using any combination of: forward slash, hyphen, period,
 * and colon.
 */
export class Moment {
	date: Date|null;
	precision: number; /** for string date, the number of YMD elements provided; else 6 */

	constructor(date: Date|string) {
		this.precision = 6; /** YMDhms */
		if (typeof date == 'object') this.date = date;
		else {
			const segments = Moment.parseDate(date); /** length of `segments` is 0...3 */
			this.precision = segments.length
			if (this.precision == 0) this.date = null;
			else {
				if (this.precision < 2) segments.push(0); /** add default monthOffset */
				if (this.precision < 3) segments.push(1); /** add default day */
				this.date = new Date(segments[0], segments[1], segments[2]);
			}
		}
	}

	/**
	 * Given a `dateString` (as in the Moment constructor), return a `segments`
	 * array of length 0...3. A zero-length array indicates an invalid
	 * dateString. Otherwise, segments[0] is the year, segments[1] (if it
	 * exists) is the month, and segments[2] (if it exists) is the day.
	 */
	static parseDate(dateString: string) {
		let segments: number[] = [];
		dateString = dateString.trim();
		if (!MomentString.test(dateString)) return segments;

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
				if (!Moment.validDay(segments[0], segments[1] + 1, segments[2])) segments.pop(); /** remove invalid day */
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
	 * Given a Date (which may be null) and the desired precision (Y, YM, YMD,
	 * YMDhhmmss), return a formatted string representing the date.
	 */
	formatted() {
		if (this.date == null) return '?';
		else {
			let format = 12; /** full datetime */
			if (this.precision == 1) format = 11; /** only year */
			else if (this.precision == 2) format = 10; /** year and month */
			else if (this.precision == 3) format = 9; /** year, month, and day */
			return T.DateString(this.date, format);
		};
	}
}