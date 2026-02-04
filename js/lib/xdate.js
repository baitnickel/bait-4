const D = '\\d+';
const S = '[\\/\\-\\.:]'; // do we really need "." and ":"? simplify--just support "/" and "-"
const XDateString = new RegExp('(^' + D + '$)|(^' + D + S + D + '$)|(^' + D + S + D + S + D + '$)');
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
    precision; /** for string date, the number of YMD elements provided; else 6 */
    leapYear;
    daysIntoYear;
    constructor(...args) {
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
                    if (precision < 2)
                        segments.push(0); /** add default monthOffset */
                    if (precision < 3)
                        segments.push(1); /** add default day */
                    super(segments[0], segments[1], segments[2]);
                }
                else
                    super(args[0]);
            }
            else
                super(args[0]);
        else
            super();
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
    since(otherDate, units = 'years') {
        const milliseconds = this.valueOf() - otherDate.valueOf();
        return this.difference(milliseconds, otherDate, units);
    }
    until(otherDate, units = 'years') {
        const milliseconds = otherDate.valueOf() - this.valueOf();
        return this.difference(milliseconds, otherDate, units);
    }
    difference(milliseconds, otherDate, units = 'years') {
        if (units == 'milliseconds')
            return milliseconds;
        const seconds = milliseconds / 1000;
        if (units == 'seconds')
            return seconds;
        const minutes = seconds / 60;
        if (units == 'minutes')
            return minutes;
        const hours = minutes / 60;
        if (units == 'hours')
            return hours;
        const days = hours / 24;
        if (units == 'days')
            return days;
        const weeks = (this.getDay() == otherDate.getDay()) ? Math.round(days / 7) : days / 7;
        if (units == 'weeks') {
            return weeks;
        }
        const sameDay = this.getDate() == otherDate.getDate();
        const months = (sameDay) ? Math.round(days / 30.4375) : days / 30.4375; /** average number of days in a month */
        if (units == 'months')
            return months;
        const sameDate = this.getMonth() == otherDate.getMonth() && this.getDate() == otherDate.getDate();
        const years = (sameDate) ? Math.round(days / 365.25) : days / 365.25; /** average number of days in a year */
        return years;
    }
    /**
     * Given a `duration` of the specified `units` add the duration to this
     * XDate and return the resulting XDate. A negative duration subtracts the
     * duration from the date.
     */
    add(duration, units = 'years') {
        const newDate = new XDate(this.valueOf()); /** clone this date */
        if (units == 'milliseconds')
            newDate.setTime(newDate.getTime() + duration);
        else if (units == 'seconds')
            newDate.setSeconds(newDate.getSeconds() + duration);
        else if (units == 'minutes')
            newDate.setMinutes(newDate.getMinutes() + duration);
        else if (units == 'hours')
            newDate.setHours(newDate.getHours() + duration);
        else if (units == 'days')
            newDate.setDate(newDate.getDate() + duration);
        else if (units == 'weeks')
            newDate.setDate(newDate.getDate() + (duration * 7));
        else if (units == 'months')
            newDate.setMonth(newDate.getMonth() + duration);
        else
            newDate.setFullYear(newDate.getFullYear() + duration);
        return newDate;
    }
    /**
     * Return a formatted string representing the XDate. When the date has been
     * instantiated using custom formats (such as Y, YM, YMD, MY, and MDY), the
     * formatted string will be adjusted accordingly.
     */
    formatted() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const mo = months[this.getMonth()];
        const d = this.getDate().toString();
        const wd = weekdays[this.getDay()];
        const year = this.getFullYear().toString().padStart(2, '0');
        let h = this.getHours();
        const amPm = (h < 12) ? 'am' : 'pm';
        if (h > 12)
            h -= 12;
        else if (h == 0)
            h = 12;
        const minute = this.getMinutes().toString().padStart(2, '0');
        const second = this.getSeconds().toString().padStart(2, '0');
        let format;
        if (this.precision == 1)
            format = `${year}`; /** year only */
        else if (this.precision == 2)
            format = `${mo} ${year}`; /** year and month only */
        else if (this.precision == 3)
            format = `${wd} ${mo} ${d}, ${year}`; /** year, month, and day only */
        else
            format = `${wd} ${mo} ${d}, ${year} ${h}:${minute}:${second}${amPm}`; /** full timestamp */
        return format;
    }
    /**
     * Given a `dateString` (as in the XDate constructor), return a `segments`
     * array of length 0...3. A zero-length array indicates an invalid custom
     * dateString. Otherwise, segments[0] is the year, segments[1] (if it
     * exists) is the month, and segments[2] (if it exists) is the day.
     */
    static parseDate(dateString) {
        let segments = [];
        dateString = dateString.trim();
        if (!XDateString.test(dateString))
            return segments;
        const components = dateString.split(Separator);
        const lastComponent = components[components.length - 1];
        if (components.length == 1)
            segments.push(Number(components[0])); /** year */
        else { /** 2 or 3 components: YM, YMD, MY, or MDY */
            if (lastComponent.length > 2) { /** Y is last, rearrange array to force YM or YMD */
                const year = components.pop();
                components.unshift(year);
            }
            segments.push(Number(components[0])); /** year */
            segments.push(Number(components[1]) - 1); /** monthOffset */
            if (segments[1] < 0 || segments[1] >= 12)
                segments.pop(); /** remove invalid monthOffset */
            else if (components.length == 3) {
                segments.push(Number(components[2])); /** day */
                if (!XDate.validDay(segments[0], segments[1] + 1, segments[2]))
                    segments.pop(); /** remove invalid day */
            }
        }
        return segments;
    }
    /**
     * Given a year, a month, and a day, return true if these represent a valid
     * date, otherwise return false.
     */
    static validDay(year, month, day) {
        let validity = false;
        if (month < 1 || month > 12 || day < 1 || day > 31)
            return validity;
        let leapYear = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
        if (month == 2) {
            if (day <= 28 || (leapYear && day <= 29))
                validity = true;
        }
        else if ([4, 6, 9, 11].includes(month) && day <= 30)
            validity = true;
        else if (day <= 31)
            validity = true;
        return validity;
    }
    /** Return a date far in the future */
    static futureDate() {
        return new Date(9999, 0);
    }
}
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
