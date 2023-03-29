import { Page } from './lib/page.js';
import * as DB from './lib/fetch.js';
import { Document } from './lib/document.js';
export function render() {
    const page = new Page();
    // appendLines(page.content, '<input type="file" id="input" multiple />');
    // let inputFiles = document.getElementById("input") as FileList;
    // if (inputFiles) {
    // 	const selectedFile = inputFiles.files[0];
    // }
    // appendLines(page.content, '<input id="fileItem" type="file" />');
    // let inputElement = document.getElementById("fileItem") as HTMLInputElement;
    // if (inputElement && inputElement.files && inputElement.files.length) {
    // 	const file = inputElement.files[0];
    // 	console.log(file);
    // }
    let lyrics = [
        'There’s nothing you can know that isn’t known',
        'Nothing you can see that isn’t shown',
        'Nowhere you can be that isn’t where you’re meant to be',
    ];
    appendLines(page.content, lyrics);
    page.content.append(smugImage('i-SDpf2qV', 'S'));
    // page.content.append(smugImage('i-bT23PBf', 'L', 'png'));
    // SVG.appendSVG(page.content, 'data/jmap7.svg', ['93', '95', '97', '99', '103', '104', 'J105']);
    // appendLines(page.content, youTubePlayer('5FQpeqFmwVk', 560, 315));
    let mapDiv = document.createElement('div');
    page.content.append(mapDiv);
    DB.fetchData(`${page.fetchOrigin}/data/park.txt`).then((parkText) => {
        let obsidian = new Document(parkText);
        if (obsidian.metadata) {
            console.log('metadata loaded');
            if ('map' in obsidian.metadata) {
                let mapElement = document.createElement('img');
                // mapElement.setAttribute('src', `./data/${obsidian.metadata['map']}`);
                mapElement.setAttribute('src', `data/${obsidian.metadata['map']}`);
                mapElement.width = 555;
                mapDiv.append(mapElement);
            }
        }
    });
    function appendLines(element, lines) {
        let paragraph = document.createElement('p');
        if (typeof lines == 'object')
            lines = lines.join('<br>');
        paragraph.innerHTML = lines;
        element.append(paragraph);
    }
    function smugImage(id, size, type = 'jpg') {
        let imageElement = new Image();
        const smugMug = 'https://photos.smugmug.com/photos';
        let source = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
        if (size == 'O')
            source.replace('-O', '');
        imageElement.src = source;
        return imageElement;
    }
    function youTubePlayer(embedID, width, height, options = []) {
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
            ];
            options = defaultOptions;
        }
        const source = `https://www.youtube.com/embed/${embedID}`;
        let iFrame = `<iframe width="${width}" height="${height}" src="${source}"`;
        if (options.length)
            iFrame += ` ${options.join(' ')}`;
        iFrame += '></iframe>';
        return iFrame;
    }
}
