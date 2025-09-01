const D = '\\d+';
const S = '[\\/\\-\\.]';
const MomentString = new RegExp('(^' + D + '$)|(^' + D + S + D + '$)|(^' + D + S + D + S + D + '$)');
const Separator = new RegExp(S);
/**
 * The Moment class is essentially an extension of the Date class. A Moment object may be created from either a Date object or a string. If a string, the format must be one of the following:
 *
 * - Y
 * - YM
 * - YMD
 * - MY
 * - DMY
 *
 * where the Y element must be three or more digits and elements are separated by "/", "-", or ".".
 */
export class Moment {
    constructor(date) {
        let year = 0;
        let monthOffset = 0;
        let day = 1;
        this.precision = 3; /** YMD or DMY */
        if (typeof date == 'object')
            this.date = date;
        else {
            date = date.trim();
            if (!MomentString.test(date)) {
                this.date = null;
                this.precision = 0;
            }
            else {
                const components = date.split(Separator);
                this.precision = components.length;
                const lastComponent = components[components.length - 1];
                if (this.precision == 1)
                    year = Number(components[0]); /** year-only */
                else { /** YM, YMD or MY, DMY */
                    /** when Y is last, reverse array to give YM or YMD (not supporting: MDY) */
                    if (lastComponent.length > 2)
                        components.reverse();
                    /** YM or YMD */
                    year = Number(components[0]);
                    monthOffset = Number(components[1]) - 1;
                    if (this.precision == 3)
                        day = Number(components[2]);
                    if (monthOffset < 0 || monthOffset >= 12) {
                        this.precision = 1; /** only the year is valid */
                        monthOffset = 0;
                        day = 1;
                    }
                    if (this.precision == 3 && !this.validDay(year, monthOffset, day)) {
                        this.precision = 2;
                        day = 1;
                    }
                }
                this.date = new Date(year, monthOffset, day);
            }
        }
    }
    validDay(year, monthOffset, day) {
        let valid = false;
        let month = monthOffset + 1;
        let leapYear = (year % 4 == 0 && year % 400 != 0);
        if (month == 2) {
            if (day <= 28 || (leapYear && day <= 29))
                valid = true;
        }
        else if ([4, 6, 9, 11].includes(month) && day <= 30)
            valid = true;
        else if (day <= 31)
            valid = true;
        return valid;
    }
}
