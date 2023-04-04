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
