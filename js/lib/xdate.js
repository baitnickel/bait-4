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
const Months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const Weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const D = '\\d+';
const S = '[\\/\\-]'; // do we really need "." and ":"? simplify--just support "/" and "-"
const InstantString = new RegExp('(^' + D + '$)|(^' + D + S + D + '$)|(^' + D + S + D + S + D + '$)');
const Separator = new RegExp(S);
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
 * Standard Date string constructors can be used via Date.parse, e.g.:
 *
 * - const instant = new Instant(Date.parse('2020-01-01T00:00:00.000Z'));
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
    precision; /** YMDhms, Y, YM, YMD, M, MY, MD, MDY */
    approximation; /** strings ending with '?' are approximations */
    constructor(instant = null) {
        let instantComponents = { date: new Date(NaN), precision: 'YMDhms', approximation: false };
        if (instant === null)
            super();
        else if (typeof instant == 'number')
            super(instant);
        else if (instant instanceof Date)
            super(instant.getTime());
        else {
            /** `instant` is a string */
            instantComponents = Instant.parseDateString(instant);
            super(instantComponents.date);
        }
        this.precision = instantComponents.precision;
        this.approximation = instantComponents.approximation;
    }
    /**
     * Return true is this year is a leap year, else return false.
     */
    leapYear() {
        const year = this.getUTCFullYear();
        return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
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
    static parseDateString(dateString) {
        const instantComponents = { date: new Date(NaN), precision: '', approximation: false };
        dateString = dateString.trim();
        if (dateString.endsWith('?')) {
            instantComponents.approximation = true;
            dateString = dateString.slice(0, -1).trim();
        }
        if (!InstantString.test(dateString))
            return instantComponents; /** reject dateString that does not meet test */
        /** having passed the test, we know there are 1-3 components, each a valid integer */
        const components = dateString.split(Separator);
        const segments = [];
        for (const component of components)
            segments.push(Number(component));
        // if (segments[0] > 99) { // Y, YM, YMD (create YMD)
        if (components[0].length >= 3) { // Y, YM, YMD
            if (segments.length == 1)
                segments.push(0); // append 0 month (Y0)
            if (segments.length == 2)
                segments.push(0); // append 0 day (Y00)
        }
        else { // M, MY, MD, MDY (create YMD)
            if (segments.length == 1) { // M
                segments.unshift(0); // insert 0 year (0M)
                segments.push(0); // append 0 day (0M0)
            }
            else if (segments.length == 2) { // MY, MD
                const yearOrDay = segments.pop(); // remove second segment (year or day)
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
                const year = segments.pop(); // remove year (Y)
                segments.unshift(year); // insert year (YMD)
            }
        }
        /**
         * At this point, segments are YMD -- any segment may be 0. A 0 segment
         * indicates that it has not been supplied, and will not be included in
         * the precision. In the Date object, a 0 year will become the year
         * 0000; a 0 month will become January (month offset 0); a 0 day will
         * become * 1. For example, if only a year is provided as '1980', the
         * precision will be 'Y' and the Date will be Jan 1, 1980.
         */
        const year = segments[0];
        const month = segments[1];
        const day = segments[2];
        if (year > 0)
            instantComponents.precision += 'Y';
        if (month > 0)
            instantComponents.precision += 'M';
        if (day > 0)
            instantComponents.precision += 'D';
        /** create a standard UTC Date object -- it will handle overflow months, dates, etc. */
        const YYYY = year.toString().padStart(4, '0');
        const MM = (month == 0) ? '01' : month.toString().padStart(2, '0');
        const DD = (day == 0) ? '01' : day.toString().padStart(2, '0');
        instantComponents.date = new Date(`${YYYY}-${MM}-${DD}T00:00:00.000Z`);
        return instantComponents;
    }
    /**
     * Return a formatted string representing the Instant. When the date has
     * been instantiated using custom formats (such as Y, YM, YMD, MY, and MDY),
     * the formatted string will be adjusted accordingly.
     */
    formatted() {
        const mo = Months[this.getUTCMonth()];
        const d = this.getUTCDate().toString();
        const wd = Weekdays[this.getUTCDay()];
        const year = this.getUTCFullYear().toString().padStart(2, '0');
        let h = this.getUTCHours();
        const amPm = (h < 12) ? 'am' : 'pm';
        if (h > 12)
            h -= 12;
        else if (h == 0)
            h = 12;
        const minute = this.getUTCMinutes().toString().padStart(2, '0');
        const second = this.getUTCSeconds().toString().padStart(2, '0');
        let format;
        if (this.precision == 'Y')
            format = `${year}`; /** year only */
        else if (this.precision == 'YM' || this.precision == 'MY')
            format = `${mo} ${year}`; /** year and month only */
        else if (this.precision == 'YMD' || this.precision == 'MDY')
            format = `${wd} ${mo} ${d}, ${year}`; /** year, month, and day only */
        else if (this.precision == 'M')
            format = `${mo}`; /** month only */
        else if (this.precision == 'MD')
            format = `${mo} ${d}`; /** month and day only */
        else
            format = `${wd} ${mo} ${d}, ${year} ${h}:${minute}:${second}${amPm}`; /** full timestamp */
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
    interval(other, granularity) {
        let interval = 0;
        const thisIsEarlier = this.getTime() < other.getTime();
        const earlierInstant = (thisIsEarlier) ? this : other;
        const laterInstant = (thisIsEarlier) ? other : this;
        const earlier = { year: earlierInstant.getUTCFullYear(), month: earlierInstant.getUTCMonth(), day: earlierInstant.getUTCDate() };
        const later = { year: laterInstant.getUTCFullYear(), month: laterInstant.getUTCMonth(), day: laterInstant.getUTCDate() };
        if (granularity == 'Y') { /** Years */
            const solarDays = 366; //365.24217;  we are treating all years as leap years for our purposes here
            const daysDifferent = laterInstant.ordinal(true) - earlierInstant.ordinal(true);
            if (later.year == earlier.year)
                interval = (laterInstant.ordinal() - earlierInstant.ordinal()) / solarDays;
            else if (daysDifferent >= 0)
                interval = (later.year - earlier.year) + (daysDifferent / solarDays);
            else
                interval = (later.year - earlier.year - 1) + ((solarDays + daysDifferent) / solarDays);
        }
        else if (granularity == 'M') { /** Months */
            const monthsDifferent = later.month - earlier.month;
            const laterDayOffset = (later.day - 1) / 31;
            const earlierDayOffset = (earlier.day - 1) / 31;
            const dayOffset = (laterDayOffset >= earlierDayOffset) ? laterDayOffset - earlierDayOffset : earlierDayOffset - laterDayOffset;
            if (later.year == earlier.year)
                interval = monthsDifferent + dayOffset;
            else
                interval = ((later.year - earlier.year) * 12) + monthsDifferent + dayOffset;
        }
        else {
            let divisor = 1000; /** default: 's' Seconds */
            if (granularity == 'm')
                divisor = 60 * 1000; /** Minutes */
            else if (granularity == 'h')
                divisor = 60 * 60 * 1000; /** Hours */
            else if (granularity == 'D')
                divisor = 24 * 60 * 60 * 1000; /** Days */
            else if (granularity == 'W')
                divisor = 7 * 24 * 60 * 60 * 1000; /** Weeks */
            interval = (this.getTime() / divisor) - (other.getTime() / divisor);
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
    since(earlierDate, granularity = 'Y') {
        let interval = this.interval(earlierDate, granularity);
        if (this.getTime() < earlierDate.getTime())
            interval = -interval;
        return interval;
    }
    /**
     * Given an Instant later than this Instant, return the interval between the
     * two using the specified `granularity` ('Y': years, 'M': months, 'W':
     * weeks, 'D': days, 'h': hours, 'm': minutes, 's': seconds). If `laterDate`
     * is actually earlier than this Instant, the interval returned will be
     * negative.
     */
    until(laterDate, granularity = 'Y') {
        let interval = this.interval(laterDate, granularity);
        if (this.getTime() > laterDate.getTime())
            interval = -interval;
        return interval;
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
