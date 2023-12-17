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
 * File Information is read from the OS file data and YAML metadata. These are
 * used determine how to sync files between the source and target systems.
*/
export const AccessKey = 'Access';
/**
 * Fakesheet files contain special YAML metadata, some of which is used in
 * lookup functionality in the frontend.
 */
export const SongTitleKey = 'title';
export const SongArtistKey = 'artist';
