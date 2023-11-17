/**
 * General Type definitions used by both command line scripts and website code.
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
 * File types (based on extensions).
 */
export function IsMarkdownFile(pathName) {
    const markdownExtension = /\.md$/i;
    return markdownExtension.test(pathName);
}
export function IsJsonFile(pathName) {
    const jsonExtension = /\.json$/i;
    return jsonExtension.test(pathName);
}
export function IsYamlFile(pathName) {
    const yamlExtension = /\.ya?ml$/i;
    return yamlExtension.test(pathName);
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
