import { YAML } from './yaml.js';

const JsonFile = /\.json$/i;
const YamlFile = /\.ya?ml$/i;

/**
 * Test the connection to the given `uri`, typically the root API of a backend
 * server. Return `true` if the request is successful, otherwise `false`.
 * 
 * Example (from the `page` module):
 * 
 * - if (LOCAL) BACKEND_AVAILABLE = await Fetch.test(`${BACKEND}/`);
 */
export async function test(uri: string) {
	let success = true;
	try { const response = await fetch(uri, { method: 'HEAD'}); }
	catch(error) { success = false; }
	finally { return success; }
}

/**
 * Return text from a plain text resource specified in `uri`. Return an empty
 * string ('') if the request fails.
 * 
 * Examples:
 * 
 * - Fetch.text(articleFullPath).then((fileText) => { ... });
 * - const HomeText = await Fetch.text(HomeTextPath);
 */
export async function text(uri: string) {
	let text = '';
	const response = await getResponse(uri);
	if (response !== null) text = await response.text();
	return text;
}

export async function json<Type>(uri: string) {
	let textData = await text(uri);
	const data: Type = JSON.parse(textData);
	return data;
}

/**
 * Return a complex object from the file specified in `uri` into an object
 * specified in the generic `Type`. The data file specified in `uri` can be
 * either a JSON file or a YAML file; if YAML, numeric and boolean data will be
 * converted to strings by default, but this can be overridden by passing
 * `false` as a second argument. Return an empty object of `Type` if the fetch
 * request fails.
 * 
 * Example:
 *
 * - const IChing = await Fetch.object<T.IChing>(IChingPath);
 */
export async function object<Type>(uri: string, convertYamlStrings = true) {
	let data = <Type>{}; /* empty object */
	const response = await getResponse(uri);
	data = await getData(uri, response, convertYamlStrings);
	return data;
}

/**
 * Return an array from the resource specified in `uri` where the array data is
 * of type `Type`. The data resource can be either JSON or YAML; if YAML,
 * numeric and boolean data will be converted to strings by default, but this
 * can be overridden by passing `false` as a second argument. Return an empty
 * array if the request fails.
 * 
 * Example:
 * 
 * - const records = await Fetch.array<MoonData>(uri);
 */
export async function array<Type>(uri: string, convertYamlStrings = true) {
	let array = new Array<Type>(); /* empty array */
	const response = await getResponse(uri);
	const data = await getData(uri, response, convertYamlStrings);
	if (Array.isArray(data)) array = data;
	else console.error('cannot convert data to array');
	return array;
}

/**
 * Return a Map with a string key and a data type specified in the generic
 * `Type`. The data resource specified in `uri` can be either JSON or YAML; if
 * YAML, numeric and boolean data will be converted to strings by default, but
 * this can be overridden by passing `false` as a second argument. Return an
 * empty Map if the fetch request fails.
 * 
 * For example, where `Articles` is a Map<string, T.FileStats>:
 * 
 * - const Articles = await Fetch.map<T.FileStats>(ArticlesIndex);
 */
export async function map<Type>(uri: string, convertYamlStrings = true) {
	let map: Map<string, Type>;
	const response = await getResponse(uri);
	const data = await getData(uri, response, convertYamlStrings);
	try { map = new Map<string, Type>(Object.entries(data)); }
	catch {
		console.error('cannot convert data to map');
		map = new Map<string, Type>(); /* empty Map */
	}
	return map;
}

/**
 * Return a blob (binary data) from the resource specified in `uri`. Return null
 * if the request fails.
 */
export async function blob(uri: string) {
	let blob = null;
	const response = await getResponse(uri);
	if (response !== null) blob = await response.blob();
	return blob;
}

/**
 * Call the API resource, `uri`, adding the query string
 * (window.location.search), if any, and return JSON data from the call. The
 * query string values can be retrieved by the Express backend using
 * "request.query.<key>"; if the key is not present in the query string, the
 * value will be "undefined". When `body` data is provided, it will be converted
 * to JSON. If a `method` is not provided, we will assume GET unless body data
 * is provided, in which case we will assume POST.
 */
export async function api<Type>(uri: string, body: any = null, method: string = '') {
	if (!method) method = (body) ? 'POST' : 'GET';
	if (body) body = JSON.stringify(body);
	const response = await fetch(uri + window.location.search, {
		method: method,
		body: body,
		headers: { "Content-type": "application/json; charset=UTF-8" }
	});
	let data: Type;
	if (!response.ok) return null;
	else data = await response.json();
	return data;
}

/**
 * Given a Map with string keys of `Type`, convert its keys to uppercase, if
 * necessary. The Map is modified in place, and the order of the Map entries may
 * be affected since any replaced entries will be added after the original
 * entries.
 */
export function uppercaseKeys<Type>(map: Map<string, Type>) {
	const keys = Array.from(map.keys());
	for (const key of keys) {
		const newKey = key.toUpperCase();
		if (newKey != key) {
			const mapValue = map.get(key)!;
			map.delete(key);
			map.set(newKey, mapValue);
		}
	}
}

/**
 * Given a `uri` resource, create a Request object and fetch a Response. If
 * successful, return the Response object. Otherwise return null. 
 */
async function getResponse(uri: string) {
	try {
		const request = new Request(uri);
		const response = await fetch(request);
		if (!response.ok) return null;
		return response;
	}
	catch(error) {
		console.error(error); 
		return null;
	}
}

/**
 * Given a `uri` resource (either a JSON file or a YAML file), a `response`
 * object (or null), and a boolean switch indicating whether or not YAML strings
 * (if any) should be converted to their true types, return the resource data
 * (or null on errors). 
 */
async function getData(uri: string, response: Response | null, convertYamlStrings: boolean) {
	let data = null;
	if (response !== null) {
		if (JsonFile.test(uri)) data = await response.json();
		else if (YamlFile.test(uri)) {
			const text = await response.text();
			const yaml = new YAML(text);
			data = yaml.parse(convertYamlStrings);
		}
	}
	return data;
}
