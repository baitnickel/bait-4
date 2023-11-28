import * as Datasets from './datasets.js';

/**
 * Read the file given in `path` containing data of `type` (default is 'text').
 * JSON files and blobs are handled differently than text files. When no `type`
 * is specified, files will be processed as JSON if they have a '.json'
 * extension. Data of type `any` is returned; on errors, null is returned.
 */
export async function fetchData(path: string, type: string = 'text') {
	try {
		const uri = new Request(path);
		const response = await fetch(uri);
		if (!response.ok) return null;
		let data: any;
		if (type == 'json' || path.endsWith('.json')) data = await response.json();
		else if (type == 'blob') data = await response.blob();
		else data = await response.text();
		return data;
	}
	catch(error) {
		console.error(error); 
		return null;
	}
}

/**
 * Read the JSON file given in `path` and return a Map with string keys and
 * values of type `Value`. On errors, return an empty Map.
 */
export async function fetchMap<Value>(path: string) {
	try {
		const uri = new Request(path);
		const response = await fetch(uri);
		if (!response.ok) throw `cannot fetch ${path}`;
		if (!path.toLowerCase().endsWith('.json')) throw `${path} is not a JSON file`;
		let data: any = await response.json();
		let map = new Map<string, Value>(Object.entries(data));
		return map;
	}
	catch(error) {
		console.error(error);
		let map = new Map<string, Value>(); /* empty Map */
		return map;
	}
}

export async function fetchCollection<Value>(path: string) {
	try {
		const uri = new Request(path);
		const response = await fetch(uri);
		if (!response.ok) throw `cannot fetch ${path}`;
		if (!path.toLowerCase().endsWith('.json')) throw `${path} is not a JSON file`;
		const data: any = await response.json();
		// const map = new Map<string, Value>(Object.entries(data));
		const collection = new Datasets.Collection<Value>(data);
		return collection;
	}
	catch(error) {
		console.error(error);
		let collection = new Datasets.Collection<Value>({}); /* empty Collection */
		return collection;
	}
}
