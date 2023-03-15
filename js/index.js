import * as SVG from './lib/svg.js';
const smugmug = 'https://photos.smugmug.com/Bait-4';
const photoID = 'i-5FZ7TvW/0/284bbe68';
const photoSize = 'S';
const photoFile = '16-88';
let body = document.querySelector('body');
if (body) {
    let wood = ['I once had a girl—', 'or should I say', 'she once had me?'];
    appendLines(body, wood);
    // Moon.displayMoonData(body);
    let imageElement = new Image();
    // imageElement.src = 'https://photos.smugmug.com/Bait-4/i-5FZ7TvW/0/284bbe68/S/16-88-S.jpg';
    imageElement.src = `${smugmug}/${photoID}/${photoSize}/${photoFile}-${photoSize}.jpg`;
    // if (imageElement.width > 250) imageElement.width = 250;
    body.append(imageElement);
    SVG.appendSVG(body, 'data/jmap7.svg', ['93', '95', '97', '99', '103', '104', 'J105']);
    appendLines(body, '<iframe width="560" height="315" src="https://www.youtube.com/embed/INlBnm_1-sg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>');
}
function appendLines(body, lines) {
    let paragraph = document.createElement('p');
    if (typeof lines == 'object')
        lines = lines.join('<br>');
    paragraph.innerHTML = lines;
    body.append(paragraph);
}
