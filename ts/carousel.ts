import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';

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

if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}

const MediaImages = await Fetch.api<T.MediaImageData[]>(`${PAGE.backend}/media/images`);
const Albums = mediaImagesMap(MediaImages);

type Selection = { album: string, shuffle: boolean, interval: number };

export function render() {
	const selection = getQuerySelection();
	const dialog = createModalDialog(selection);
	document.body.append(dialog.element);
	if (selection.album) runCarousel(selection, dialog);
	else dialog.element.showModal();
}

/**
 * Get selection criteria from URL query, if any.
 */
function getQuerySelection() {
	const selection: Selection = { album: '', shuffle: false, interval: 0 };
	if (PAGE.parameters.has('album')) selection.album = PAGE.parameters.get('album')!;
	if (PAGE.parameters.has('interval')) selection.interval = Number(PAGE.parameters.get('interval'));
	if (isNaN(selection.interval) || selection.interval < 0) selection.interval = 0;
	if (PAGE.parameters.has('shuffle')) selection.shuffle = true;
	return selection;	
}

function createModalDialog(selection: Selection) {
	const dialog = new W.Dialog('Carousel Options');
	const albumDropDown = dialog.addSelect('Album:', Array.from(Albums.keys()));
	const shuffleCheckbox = dialog.addCheckbox('Shuffle Slides:', selection.shuffle);
	const outputTexts = ['Manually', 'Every Second', 'Every %% Seconds'];
	const intervalRange = dialog.addRange('Change Slides:<br>', selection.interval, 0,60,1, outputTexts);

	dialog.cancelButton.addEventListener('click', () => {
		window.history.back();
	});
	dialog.confirmButton.addEventListener('click', () => {
		selection.album = albumDropDown.value;
		selection.shuffle = shuffleCheckbox.checked;
		selection.interval = Number(intervalRange.value);
		runCarousel(selection, dialog);
	});
	return dialog;
}

function runCarousel(selection: Selection, dialog: W.Dialog) {
	const images = albumImages(selection.album);
	if (!images.length) {
		alert('No images have been selected!');
		dialog.element.showModal();
	}
	else {
		const imageSet = new ImageSet(images, selection.shuffle);
		const carousel = document.createElement('div');
		document.body.append(carousel);
		carousel.className = 'carousel';
		carousel.dataset.carousel = '';
		const slide = document.createElement('div');
		slide.className = 'slide';
		carousel.append(slide);
		slide.dataset.active = '';

		const imageElement = document.createElement('img');
		imageElement.src = imageSet.images[imageSet.index];
		slide.append(imageElement);
		// await image.decode(); /** wait till the image is ready to use */
		const flagButton = addButton(carousel, '\u2690', 'carousel-button flag');
		const exitButton = addButton(carousel, '&times;', 'carousel-button return');
		let intervalID = 0;
		if (selection.interval) {
			const changeImageFunction = () => imageElement.src = imageSet.nextImage();
			intervalID = setInterval(changeImageFunction, selection.interval * 1000, carousel);
		}
		else {
			const buttons = addNavigationButtons(carousel);
			buttons.forEach(button => {
				button.addEventListener('click', () => {
					const reverse = button.dataset.carouselButton === 'prev';
					imageElement.src = imageSet.nextImage(reverse);
				});
			});
		}

		/**
		 * Flag the currently displayed image, i.e., call the API to add an
		 * entry to server log, recording basic image info.
		 */
		flagButton.addEventListener('click', () => {
			const text = `Flagged Image: ${imageSet.images[imageSet.index]}`;
			const logEntry: T.LogEntry = { text: text };
			Fetch.api<T.LogEntry>(`${PAGE.backend}/log/`, logEntry).then((response) => { console.log(response)});
		});
		
		/**
		 * Stop the Interval loop (if any) and remove the carousel div. Show the
		 * modal dialog for new selection or cancellation.
		 */
		exitButton.addEventListener('click', () => {
			if (intervalID) clearInterval(intervalID);
			carousel.remove();
			dialog.element.showModal();
		});
	}
}

function addNavigationButtons(parent: HTMLElement) {
	const previousButton = navigationButton(parent, 'prev', '&lt;');
	const nextButton = navigationButton(parent, 'next', '&gt;');
	return [previousButton, nextButton];
}

function navigationButton(parent: HTMLElement, direction: 'prev'|'next', character: string) {
	const button = document.createElement('button');
	button.innerHTML = character;
	button.className = `carousel-button ${direction}`;
	button.dataset.carouselButton = direction;
	parent.append(button);
	return button;
}

function addButton(parent: HTMLElement, innerHTML: string, className: string) {
	const button = document.createElement('button');
	button.innerHTML = innerHTML;
	button.className = className;
	parent.append(button);
	return button;
}

class ImageSet {
	images: string[];
	index: number;
	shuffling: boolean;

	constructor(images: string[], shuffle = false) {
		this.images = [...images];
		this.index = 0;
		this.shuffling = shuffle;
		if (this.shuffling) this.shuffle();
	}

	/** Return the next image */
	nextImage(reverse = false) {
		const offset = (reverse) ? -1 : 1;
		this.index += offset;
		if (this.index >= this.images.length) {
			this.index = 0;
			if (this.shuffling) this.shuffle();
		}
		else if (this.index < 0) {
			this.index = this.images.length - 1;
			if (this.shuffling) this.shuffle();
		}
		return this.images[this.index];
	}

	/**
	 * Randomly sort the object's images. This method seems to produce more random
	 * results than: "this.images.sort(()=>Math.random()-.5)".
	 */
	shuffle() {
		let count = this.images.length;
		for (let i = 0; i < count; i += 1) {
			const randomIndex = Math.floor(Math.random() * (count - i));
			const randomImage = this.images.splice(randomIndex, 1)[0]
			this.images.push(randomImage);
		}
	}
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
	return images;
}

/**
 * To find a SmugMug photo's `id`, log into SmugMug and display the photo. The
 * URL will contain the `id`. In the example URL below, the `id` is: i-g6HGgRQ
 * 
 * https://dand.smugmug.com/Travels/Sierra-Nevada/Yosemite-05/i-g6HGgRQ/A
 */
function smugURI(id: string, size = 'O', type = 'jpg') {
	const smugMug = 'https://photos.smugmug.com/photos';
	let uri = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
	if (size == 'O') uri.replace('-O', '');
	return uri;
}

function mediaImagesMap(mediaImages: T.MediaImageData[]|null) {
	const imagesMap = new Map<string, string[]>();
	if (mediaImages !== null) {
		for (const mediaImage of mediaImages) {
			imagesMap.set(mediaImage.album, mediaImage.filePaths);
		}
	}
	return imagesMap;
}