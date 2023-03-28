export async function fetchData(path: string, type: string = 'text') {
	try {
		const uri = new Request(path);
		const response = await fetch(uri, {mode: 'same-origin'});
		var data: any;
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
