import { YAML } from './yaml.js';
const JsonFile = /\.json$/i;
const YamlFile = /\.ya?ml$/i;
/**
 * Test the connection to the given `uri`, typically the root API of a backend
 * server.
 */
export async function test(uri) {
    let success = true;
    try {
        const response = await fetch(uri, { method: 'HEAD' });
    }
    catch (error) {
        success = false;
    }
    finally {
        return success;
    }
}
export async function text(uri) {
    let text = '';
    const response = await getResponse(uri);
    if (response !== null)
        text = await response.text();
    return text;
}
export async function json(uri) {
    let textData = await text(uri);
    const data = JSON.parse(textData);
    return data;
}
export async function object(uri, convertYamlStrings = true) {
    let data = {}; /* empty object */
    const response = await getResponse(uri);
    data = await getData(uri, response, convertYamlStrings);
    return data;
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
export async function post(uri, body) {
    const response = await fetch(uri, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    });
    let data;
    if (!response.ok)
        return null;
    else
        data = await response.json();
    return data;
}
/**
 * Perform an API call and return the HTTP status code and response data
 * (formatted in an object).
 *
 * - `route` is the resource (e.g., "http://example.com/rest/api/2/foo")
 * - `parameters` is (an optional object) a string representing a URL query string
 *   (a series of field-value pairs)
 * - `body` is the optional request body to be posted (typically an object)
 *
 * By default, `method` is GET when there is no body (`body` === null) and POST
 * when body is provided.
 */
// type apiResponse = { status: number, statusText: string, responseData: any };
// export async function api(route: string, parameters = '', body: string|object|null = null, method = '') {
export async function api(route, body = null, method = '') {
    let response = new Response();
    // if (parameters) { const queryString = encodeURI(parameters); route += '?' + queryString; }
    // if (typeof body == 'object') body = JSON.stringify(body); /** convert object to JSON string */
    // if (body) body = encodeURI(body); /** convert string to bytes object (valid URI) */
    body = JSON.stringify(body); /** convert object to JSON string */
    const headers = { "Content-type": "application/json; charset=UTF-8" };
    if (!method)
        method = (body) ? 'POST' : 'GET';
    const options = { headers: headers, body: body, method: method };
    const request = new Request(route, options);
    try {
        response = await fetch(request);
    }
    catch (error) {
        console.error(error);
    }
    finally {
        return response;
    }
    // fetch(request).then((response) => {
    // 	try {
    // 		responseData = JSON.stringify(response.body);
    // 		status = response.status;
    // 		statusText = response.statusText;
    // 	}
    // 	catch {
    // 		responseData = {};
    // 		status = 0;
    // 		statusText = 'error';
    // 	}
    // 	return { responseData, status, statusText };
    // });
    // .then((response) => {
    // 	if (!response.ok) throw new Error(`Error: ${response.status} - ${response.statusText}`);
    // 	return response.json();
    // })
    // .catch((error) => {
    // 	console.error(error);
    // });
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
/**
 * Given a Map with string keys of `Type`, convert its keys to uppercase, if
 * necessary. The Map is modified in place, and the order of the Map entries may
 * be affected since any replaced entries will be added after the original
 * entries.
 */
export function uppercaseKeys(map) {
    const keys = Array.from(map.keys());
    for (const key of keys) {
        const newKey = key.toUpperCase();
        if (newKey != key) {
            const mapValue = map.get(key);
            map.delete(key);
            map.set(newKey, mapValue);
        }
    }
}
/** --------------- deprecated functions --------------- */
/**
 * Read the file given in `path` containing data of `type` (default is 'text').
 * JSON files and blobs are handled differently than text files. When no `type`
 * is specified, files will be processed as JSON if they have a '.json'
 * extension. Data of type `any` is returned; on errors, null is returned.
 */
// export async function fetchData(path: string, type: string = 'text') {
// 	try {
// 		const uri = new Request(path);
// 		const response = await fetch(uri);
// 		if (!response.ok) return null;
// 		let data: any;
// 		if (type == 'json' || path.endsWith('.json')) data = await response.json();
// 		else if (type == 'blob') data = await response.blob();
// 		else data = await response.text();
// 		return data;
// 	}
// 	catch(error) {
// 		console.error(error); 
// 		return null;
// 	}
// }
/**
 * Read the JSON file given in `path` and return a Map with string keys and
 * values of type `Value`. On errors, return an empty Map.
 */
// export async function fetchMap<Value>(path: string) {
// 	try {
// 		const uri = new Request(path);
// 		const response = await fetch(uri);
// 		if (!response.ok) throw `cannot fetch ${path}`;
// 		if (!path.toLowerCase().endsWith('.json')) throw `${path} is not a JSON file`;
// 		let data: any = await response.json();
// 		let map = new Map<string, Value>(Object.entries(data));
// 		return map;
// 	}
// 	catch(error) {
// 		console.error(error);
// 		let map = new Map<string, Value>(); /* empty Map */
// 		return map;
// 	}
// }
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
