export function render() {

	let body = document.querySelector('body');
	if (body) {

		// appendLines(body, '<input type="file" id="input" multiple />');
		// let inputFiles = document.getElementById("input") as FileList;
		// if (inputFiles) {
		// 	const selectedFile = inputFiles.files[0];
		// }

		// appendLines(body, '<input id="fileItem" type="file" />');
		// let inputElement = document.getElementById("fileItem") as HTMLInputElement;
		// if (inputElement && inputElement.files && inputElement.files.length) {
		// 	const file = inputElement.files[0];
		// 	console.log(file);
		// }
		
		let lyrics: string[] = [
			'There’s nothing you can know that isn’t known',
			'Nothing you can see that isn’t shown',
			'Nowhere you can be that isn’t where you’re meant to be',
		];
		appendLines(body, lyrics);

		body.append(smugImage('i-SDpf2qV', 'S'));
		// body.append(smugImage('i-bT23PBf', 'L', 'png'));

		// SVG.appendSVG(body, 'data/jmap7.svg', ['93', '95', '97', '99', '103', '104', 'J105']);
		
		// appendLines(body, youTubePlayer('5FQpeqFmwVk', 560, 315));
		
	}

	function appendLines(body: HTMLElement, lines: string|string[]) {
		let paragraph = document.createElement('p');
		if (typeof lines == 'object') lines = lines.join('<br>');
		paragraph.innerHTML = lines;
		body.append(paragraph);
	}

	function smugImage(id: string, size: string, type: string = 'jpg') {
		let imageElement = new Image();
		const smugMug = 'https://photos.smugmug.com/photos';
		let source = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
		if (size == 'O') source.replace('-O', '');
		imageElement.src = source;
		return imageElement;
	}

	function youTubePlayer(embedID: string, width: number, height:number, options: string[] = []) {
		if (!options.length) {
			let defaultOptions = [
				'title="YouTube video player"',
				'frameborder="0"',
				'allow="accelerometer"',
				'allow="autoplay"',
				'allow="clipboard-write"',
				'allow="encrypted-media"',
				'allow="gyroscope"',
				'allow="picture-in-picture"',
				'allow="web-share"',
				'allowfullscreen',
			]
			options = defaultOptions;
		}
		const source = `https://www.youtube.com/embed/${embedID}`;
		let iFrame = `<iframe width="${width}" height="${height}" src="${source}"`;
		if (options.length) iFrame += ` ${options.join(' ')}`;
		iFrame += '></iframe>';
		return iFrame;
	}
}
