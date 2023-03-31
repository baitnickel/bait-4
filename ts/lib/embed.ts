export function paragraph(text: string|string[]) {
	/** If text is array, separate each array element with <br> */
	let paragraph = document.createElement('p');
	if (Array.isArray(text)) text = text.join('<br>');
	paragraph.innerHTML = text;
	return paragraph;
}

export function smugImage(id: string, size: string, type: string = 'jpg') {
	let imageElement = new Image();
	const smugMug = 'https://photos.smugmug.com/photos';
	let source = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
	if (size == 'O') source.replace('-O', '');
	imageElement.src = source;
	return imageElement;
}

export function youTubeFrame(embedID: string, width: number, height:number, options: string[] = []) {
	const frame = document.createElement('iframe');
	frame.src = `https://www.youtube.com/embed/${embedID}`;
	frame.width = `${width}`;
	frame.height = `${height}`;
	frame.title = 'YouTube video player';
	frame.allowFullscreen = true;
	frame.allow = 'accelerometer,autoplay,clipboard-write,encrypted-media,gyroscope,picture-in-picture,web-share';
	return frame;
}

// export function youTubePlayer(embedID: string, width: number, height:number, options: string[] = []) {
// 	if (!options.length) {
// 		let defaultOptions = [
// 			'title="YouTube video player"',
// 			'frameborder="0"',
// 			'allow="accelerometer"',
// 			'allow="autoplay"',
// 			'allow="clipboard-write"',
// 			'allow="encrypted-media"',
// 			'allow="gyroscope"',
// 			'allow="picture-in-picture"',
// 			'allow="web-share"',
// 			'allowfullscreen',
// 		]
// 		options = defaultOptions;
// 	}
// 	const source = `https://www.youtube.com/embed/${embedID}`;
// 	let iFrame = `<iframe width="${width}" height="${height}" src="${source}"`;
// 	if (options.length) iFrame += ` ${options.join(' ')}`;
// 	iFrame += '></iframe>';
// 	return iFrame;
// }
