import { YAML } from './yaml.js';

const JsonFile = /\.json$/i;
const YamlFile = /\.ya?ml$/i;

/**
 * Test the connection to the given `uri`, typically the root API of a backend
 * server. On no response, alert the user and go back to the previously loaded
 * page.
 */
export async function test(uri: string) {
	const response = await getResponse(uri);
	if (response) console.log(response);
	else {
		window.alert(`Cannot connect to: ${uri}`);
		window.history.back();
	}
}

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

export async function object<Type>(uri: string, convertYamlStrings = true) {
	let data = <Type>{}; /* empty object */
	const response = await getResponse(uri);
	data = await getData(uri, response, convertYamlStrings);
	return data;
}

export async function array<Type>(uri: string, convertYamlStrings = true) {
	let array = new Array<Type>(); /* empty array */
	const response = await getResponse(uri);
	const data = await getData(uri, response, convertYamlStrings);
	if (Array.isArray(data)) array = data;
	else console.error('cannot convert data to array');
	return array;
}

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

export async function blob(uri: string) {
	let blob = null;
	const response = await getResponse(uri);
	if (response !== null) blob = await response.blob();
	return blob;
}

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
