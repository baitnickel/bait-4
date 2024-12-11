/**
 * General Type definitions used by both command line scripts and website code.
 * Also contains functions--it is not to be regarded as merely a type
 * declarations file.
 *
 * @todo
 * - define `uri` as an extension of string, enforce valid URI
 */
/**
 * Given any data object, return its type as a string:
 * 'null', 'undefined', 'string', 'number', 'boolean',
 * 'bigint', 'symbol', 'function', 'object', 'array',
 * 'map'.
 */
export function Type(data) {
    let type;
    if (data === null)
        type = 'null';
    else if (Array.isArray(data))
        type = 'array';
    else if (data instanceof Map)
        type = 'map';
    else
        type = typeof data;
    return type.toLowerCase();
}
/**
 * Given an array of object property values, converted to strings if necessary,
 * return a "key" string. Represent missing values with the empty string ('').
 * Properties should be selected for the purpose of generating unique keys.
 *
 * E.g.: songKey = ObjectKey([song.title, song.artist]);
 */
export function ObjectKey(properties) {
    const keySegments = [];
    const connector = '+';
    for (let property of properties) {
        let keySegment = '';
        property = property.replace(/\'/g, ''); /* remove apostrophes */
        let words = property.split(/[\s\W_]/); /* break words on space and non-alphanumeric */
        words.forEach(word => {
            word = word.toLowerCase().trim();
            if (word) {
                word = word[0].toUpperCase() + word.substring(1);
                keySegment += word;
            }
        });
        keySegments.push(keySegment);
    }
    return keySegments.join(connector);
}
/**
 * File types (based on extensions).
 */
const MarkdownExtension = /\.md$/i;
const JsonExtension = /\.json$/i;
const YamlExtension = /\.ya?ml$/i;
export function IsMarkdownFile(pathName) {
    return MarkdownExtension.test(pathName);
}
export function IsJsonFile(pathName) {
    return JsonExtension.test(pathName);
}
export function IsYamlFile(pathName) {
    return YamlExtension.test(pathName);
}
/**
 * Given a `date` (and an optional `format`) return a string representing the
 * date. The default format is 0.
 *
 * Formats:
 * - 0: 2024-02-01T22:35:51.175Z  (toISOString)
 * - 1: Thu Feb 01 2024 14:35:51 GMT-0800 (Pacific Standard Time)  (toString)
 * - 2: 2024-02-01 14:35:51
 * - 3: 2024-02-01 14:35
 * - 4: Thursday, February 1, 2024 2:35pm
 * - 5: February 1, 2024 2:35pm
 * - 6: Thu Feb 1, 2024 2:35pm
 * - 7: Feb 1, 2024 2:35pm */
export function DateString(date, format = 0) {
    if (format == 0)
        return date.toISOString();
    if (format == 1)
        return date.toString();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mon = months[date.getMonth()];
    const weekday = weekdays[date.getDay()];
    const year = date.getFullYear().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString();
    const month = m.padStart(2, '0');
    const d = date.getDate().toString();
    const day = d.padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    if (format == 2)
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    if (format == 3)
        return `${year}-${month}-${day} ${hour}:${minute}`;
    let h = date.getHours();
    const amPm = (h < 12) ? 'am' : 'pm';
    if (h > 12)
        h -= 12;
    else if (h == 0)
        h = 12;
    if (format == 4)
        return `${weekday}, ${mon} ${d}, ${year} ${h}:${minute}${amPm}`;
    if (format == 5)
        return `${mon} ${d}, ${year} ${h}:${minute}${amPm}`;
    if (format == 6)
        return `${weekday.slice(0, 3)} ${mon.slice(0, 3)} ${d}, ${year} ${h}:${minute}${amPm}`;
    if (format == 7)
        return `${mon.slice(0, 3)} ${d}, ${year} ${h}:${minute}${amPm}`;
    return date.toISOString(); // default
}
