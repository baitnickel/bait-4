import { YAML } from './yaml.js';
const JsonFile = /\.json$/i;
const YamlFile = /\.ya?ml$/i;
export async function text(uri) {
    let text = '';
    const response = await getResponse(uri);
    if (response !== null)
        text = await response.text();
    return text;
}
export async function array(uri, convertYamlStrings = true) {
    let array = new Array(); /* empty array */
    const response = await getResponse(uri);
    const data = await getData(uri, response, convertYamlStrings);
    if (Array.isArray(data))
        array = data;
    else
        console.error('cannot convert data to array');
    return array;
}
export async function map(uri, convertYamlStrings = true) {
    let map;
    const response = await getResponse(uri);
    const data = await getData(uri, response, convertYamlStrings);
    try {
        map = new Map(Object.entries(data));
    }
    catch {
        console.error('cannot convert data to map');
        map = new Map(); /* empty Map */
    }
    return map;
}
export async function blob(uri) {
    let blob = null;
    const response = await getResponse(uri);
    if (response !== null)
        blob = await response.blob();
    return blob;
}
async function getResponse(uri) {
    try {
        const request = new Request(uri);
        const response = await fetch(request);
        if (!response.ok)
            return null;
        return response;
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
async function getData(uri, response, convertYamlStrings) {
    let data = null;
    if (response !== null) {
        if (JsonFile.test(uri))
            data = await response.json();
        else if (YamlFile.test(uri)) {
            const text = await response.text();
            const yaml = new YAML(text);
            data = yaml.parse(convertYamlStrings);
        }
    }
    return data;
}
/** --------------- deprecated functions --------------- */
/**
 * Read the file given in `path` containing data of `type` (default is 'text').
 * JSON files and blobs are handled differently than text files. When no `type`
 * is specified, files will be processed as JSON if they have a '.json'
 * extension. Data of type `any` is returned; on errors, null is returned.
 */
export async function fetchData(path, type = 'text') {
    try {
        const uri = new Request(path);
        const response = await fetch(uri);
        if (!response.ok)
            return null;
        let data;
        if (type == 'json' || path.endsWith('.json'))
            data = await response.json();
        else if (type == 'blob')
            data = await response.blob();
        else
            data = await response.text();
        return data;
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
/**
 * Read the JSON file given in `path` and return a Map with string keys and
 * values of type `Value`. On errors, return an empty Map.
 */
export async function fetchMap(path) {
    try {
        const uri = new Request(path);
        const response = await fetch(uri);
        if (!response.ok)
            throw `cannot fetch ${path}`;
        if (!path.toLowerCase().endsWith('.json'))
            throw `${path} is not a JSON file`;
        let data = await response.json();
        let map = new Map(Object.entries(data));
        return map;
    }
    catch (error) {
        console.error(error);
        let map = new Map(); /* empty Map */
        return map;
    }
}
/**
 * Read the JSON file given in `path` and return a Collection (defined in the
 * custom Datasets module) with string keys and values of type `Value`. On
 * errors, return an empty Collection.
 */
// export async function fetchCollection<Value>(path: string) {
// 	try {
// 		const uri = new Request(path);
// 		const response = await fetch(uri);
// 		if (!response.ok) throw `cannot fetch ${path}`;
// 		if (!path.toLowerCase().endsWith('.json')) throw `${path} is not a JSON file`;
// 		const data: any = await response.json();
// 		const collection = new Datasets.Collection<Value>(data);
// 		return collection;
// 	}
// 	catch(error) {
// 		console.error(error);
// 		let collection = new Datasets.Collection<Value>(); /* empty Collection */
// 		return collection;
// 	}
// }
