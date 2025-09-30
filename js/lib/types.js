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
 * - 7: Feb 1, 2024 2:35pm
 * - 8: Feb 1, 2024
 * - 9: Thu Feb 1, 2024
 * - 10: Feb 2024
 * - 11: 2024
 * - 12: Thu Feb 1, 2024 2:35:51pm
 * - 13: Thu 2/1
 */
export function DateString(date, format = 0) {
    if (format == 0)
        return date.toISOString();
    if (format == 1)
        return date.toString();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mon = months[date.getMonth()];
    const mo = mon.slice(0, 3);
    const weekday = weekdays[date.getDay()];
    const wd = weekday.slice(0, 3);
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
        return `${wd} ${mo} ${d}, ${year} ${h}:${minute}${amPm}`;
    if (format == 7)
        return `${mo} ${d}, ${year} ${h}:${minute}${amPm}`;
    if (format == 8)
        return `${mo} ${d}, ${year}`;
    if (format == 9)
        return `${wd} ${mo} ${d}, ${year}`;
    if (format == 10)
        return `${mo} ${year}`;
    if (format == 11)
        return `${year}`;
    if (format == 12)
        return `${wd} ${mo} ${d}, ${year} ${h}:${minute}:${second}${amPm}`;
    if (format == 13)
        return `${wd} ${m}/${d}`;
    return date.toISOString(); // default
}
/**
 * Given a string of `text`, return the text in the form of a title, where case
 * (upper/lower) is adjusted according to standard rules (as defined here).
 *
 * - Capitalize the first word and the last word
 * - Capitalize nouns, pronouns, adjectives, verbs, adverbs, subordinating conjunctions
 * - Do not capitalize articles, prepositions, coordinating conjunctions
 * - (Capitalize words of 4 or more characters ... ignoring this rule for now)
 *
 * If `sortable` is true, remove leading "a", "an", or "the" and convert text to
 * lowercase.
 */
export function Title(text, sortable = false) {
    let title = '';
    const lowerWords = ['a', 'an', 'and', 'at', 'nor', 'of', 'or', 'the', 'with'];
    const words = text.trim().split(/\s+/);
    if (sortable && ['a', 'an', 'the'].includes(words[0].toLowerCase()))
        words.shift();
    const adjustedWords = [];
    for (let i = 0; i < words.length; i += 1) {
        let word = words[i];
        const firstWord = (i == 0);
        const lastWord = (i == (words.length - 1));
        const lowerWord = lowerWords.includes(word);
        const letters = word.split('');
        let firstLetter = letters[0];
        if (firstWord || lastWord || !lowerWord)
            firstLetter = firstLetter.toUpperCase();
        word = firstLetter + word.substring(1);
        adjustedWords.push(word);
    }
    title = adjustedWords.join(' ');
    if (sortable)
        title = title.toLowerCase();
    return title;
}
/**
 * Alternative to `number.toFixed(2)`. Use the host default language with
 * options for number formatting, e.g., to add thousands commas.
 */
export function Dollars(number) {
    /* Might also use Unicode's small dollar sign ('\uFE69'), but this appears to force monospace fonts. */
    return '$' + number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
