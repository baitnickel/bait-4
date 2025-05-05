import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';

const PAGE = new Page(false, false);
PAGE.header.remove();
PAGE.content.remove();
PAGE.footer.remove();

document.documentElement.style['backgroundColor'] = '#000';

document.body.style['backgroundColor'] = '#000';
document.body.style['width'] = '100vw';
document.body.style['maxWidth'] = '100vw';
document.body.style['height'] = '100vh';
document.body.style['maxHeight'] = '100vh';
document.body.style['margin'] = '0';
document.body.style['padding'] = '0';
document.body.style['border'] = '0';
document.body.style['gap'] = '0';

const MediaImages = `${PAGE.site}/data/test-Data/albums.yaml`;
const Albums = await Fetch.map<string[]>(MediaImages);

export function render() {
	let album = (PAGE.parameters.has('album')) ? PAGE.parameters.get('album')! : 'lb';
	let interval = (PAGE.parameters.has('interval')) ? Number(PAGE.parameters.get('interval')) : 0;
	if (isNaN(interval) || interval < 0) interval = 0;
	let shuffle = (PAGE.parameters.has('shuffle')) ? true : false;
	if (PAGE.parameters.has('interval') || PAGE.parameters.has('shuffle')) runCarousel(album, shuffle, interval);
	else modalDialog(album, shuffle, interval);
}

class ImageSet {
	static index = 0;
	URIs: string[];

	constructor(URIs: string[], shuffle = false) {
		this.URIs = (shuffle) ? randomize(URIs) : URIs;
	}
	activeURI() {
		return this.URIs[ImageSet.index];
	}
}

function runCarousel(album: string, shuffle: boolean, interval: number) {
	const images = albumImages(album);
	if (!images.length) {
		alert('No images have been selected!');
		location.reload();
	}
	else {
		/** create the <div> element that will contain the slides */
		const carousel = document.createElement('div');
		document.body.append(carousel);
		carousel.className = 'carousel';
		carousel.dataset.carousel = '';

		const imageSet = new ImageSet(images, shuffle);
		const slide = document.createElement('div');
		slide.className = 'slide';
		slide.dataset.active = '';
		carousel.append(slide);
		const imageElement = document.createElement('img');
		imageElement.src = imageSet.activeURI();
		slide.append(imageElement);
		// await image.decode(); /** wait till the image is ready to use */
		addExitButton(carousel);
		if (interval) {
			const changeImageFunction = () => changeImage(imageSet, imageElement);
			const intervalID = setInterval(changeImageFunction, interval * 1000, carousel);
		}
		else {
			const buttons = addNavigationButtons(carousel);
			buttons.forEach(button => {
				button.addEventListener('click', () => {
					const reverse = button.dataset.carouselButton === 'prev';
					changeImage(imageSet, imageElement, reverse);
				});
			});
		}
	}
}

function changeImage(imageSet: ImageSet, imageElement: HTMLImageElement, reverse = false) {
	const offset = (reverse) ? -1 : 1;
	ImageSet.index += offset;
	if (ImageSet.index < 0) ImageSet.index = imageSet.URIs.length - 1;
	else if (ImageSet.index >= imageSet.URIs.length) ImageSet.index = 0;
	imageElement.src = imageSet.activeURI();
}

function addNavigationButtons(parent: HTMLElement) {
	const previousButton = document.createElement('button');
	previousButton.className = 'carousel-button prev';
	previousButton.dataset.carouselButton = 'prev';
	previousButton.innerHTML = '&lt;'; // '&larr;';
	parent.append(previousButton);
	const nextButton = document.createElement('button');
	nextButton.className = 'carousel-button next';
	nextButton.dataset.carouselButton = 'next';
	nextButton.innerHTML = '&gt;'; // '&rarr;';
	parent.append(nextButton);
	return [previousButton, nextButton];
}

function addExitButton(parent: HTMLElement) {
	const returnButton = document.createElement('button');
	returnButton.className = 'carousel-button return';
	returnButton.innerHTML = '&times;';
	parent.append(returnButton);
	returnButton.addEventListener('click', () => { window.history.back(); });
}

function modalDialog(album: string, shuffle: boolean, interval: number) {
	/** open modal dialog to set options */
	const modal = document.createElement('dialog');
	modal.className = 'carousel-dialog';

	/** fieldset */
	const modalFieldSet = document.createElement('fieldset');
	const modalLegend = document.createElement('legend');
	modalLegend.innerText = 'Carousel Options';
	modalFieldSet.append(modalLegend);

	/** create options list */
	const optionList = document.createElement('ul');

	/** album selection */
	const albumOption = document.createElement('li');
	const albumSelection = document.createElement('input');
	albumSelection.id = 'album';
	albumSelection.name = 'album';
	albumSelection.value = album;
	const albumLabel = document.createElement('label');
	albumLabel.htmlFor = albumSelection.id;
	albumLabel.innerText = 'Album: ';
	albumLabel.append(albumSelection);
	albumOption.append(albumLabel);

	/** shuffle checkbox */
	const shuffleOption = document.createElement('li');
	const shuffleCheckbox = document.createElement('input');
	shuffleCheckbox.type = 'checkbox';
	shuffleCheckbox.id = 'shuffleOption';
	shuffleCheckbox.checked = shuffle;
	const shuffleLabel = document.createElement('label');
	shuffleLabel.htmlFor = shuffleCheckbox.id;
	shuffleLabel.innerText = 'Shuffle Slides ';
	shuffleLabel.append(shuffleCheckbox);
	shuffleOption.append(shuffleLabel);

	/** interval seconds */
	const intervalOption = document.createElement('li');
	const intervalSelection = document.createElement('input');
	intervalSelection.type = 'range';
	intervalSelection.id = 'intervalSelection';
	intervalSelection.min = '0';
	intervalSelection.max = '60';
	intervalSelection.step = '1';
	intervalSelection.value = '0';
	const intervalOutput = document.createElement('output');
	intervalOutput.innerHTML = `<br>Number of Seconds: ${intervalSelection.value}`;
	const intervalLabel = document.createElement('label');
	intervalLabel.htmlFor = 'intervalSelection';
	intervalLabel.innerHTML = 'Interval Between Slides:<br>';
	intervalLabel.append(intervalSelection);
	intervalLabel.append(intervalOutput);
	intervalOption.append(intervalLabel);

	/** cancel and confirm buttons */
	const buttonsOption = document.createElement('li');
	const cancelButton = document.createElement('button');
	cancelButton.innerText = 'Cancel';
	buttonsOption.append(cancelButton);
	const confirmButton = document.createElement('button');
	confirmButton.innerText = 'Confirm';
	buttonsOption.append(confirmButton);

	/** add list of options to options list and add options list to fieldset */
	optionList.append(albumOption);
	optionList.append(shuffleOption);
	optionList.append(intervalOption);
	optionList.append(buttonsOption);
	modalFieldSet.append(optionList);

	/** add fieldset to modal and modal to body and display modal */
	modal.append(modalFieldSet);
	document.body.append(modal);
	modal.showModal();

	albumSelection.addEventListener('change', () => {
		album = albumSelection.value;
	});
	shuffleCheckbox.addEventListener('change', () => {
		shuffle = shuffleCheckbox.checked;
	});
	intervalSelection.addEventListener('input', () => {
		interval = Number(intervalSelection.value);
		intervalOutput.innerHTML = `<br>Number of Seconds: ${interval}`;
	});
	cancelButton.addEventListener('click', () => {
		modal.close();
		window.history.back();
	});
	confirmButton.addEventListener('click', () => {
		modal.close();
		runCarousel(album, shuffle, interval);
	});
}

function albumImages(albumName: string) {
	let images: string[] = [];
	if (Albums.has(albumName)) {
		images = Albums.get(albumName)!;
		images.forEach((image, i, array) => {
			/** convert SmugMug IDs to URIs */
			if (!image.includes('/')) array[i] = smugURI(image);
		});
	}
	for (const image of images) console.log(image);
	return images;
}

/**
 * Logged into SmugMug, a photo's URL contains its photo `id`.
 * In the URL below, the `id` is: i-g6HGgRQ 
 * https://dand.smugmug.com/Travels/Sierra-Nevada/Yosemite-05/i-g6HGgRQ/A
 */
function smugURI(id: string, size = 'O', type = 'jpg') {
	const smugMug = 'https://photos.smugmug.com/photos';
	let uri = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
	if (size == 'O') uri.replace('-O', '');
	return uri;
}

/**
 * Given an `array` of strings, return a new array with the elements sorted
 * randomly. The original `array` is unchanged. This function generally produces
 * more random results than: "array.sort(()=>Math.random()-.5)".
 */
function randomize(array: string[]) {
	const newArray: string[] = [];
	const arrayCopy = [...array];
	for (let i = 0; i < array.length; i += 1) {
		const randomElement = Math.floor(Math.random() * (array.length - i));
		newArray.push(arrayCopy[randomElement]);
		arrayCopy.splice(randomElement, 1);
	}
	return newArray;
}
