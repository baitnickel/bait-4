import { Page } from './lib/page.js';
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

type MediaImageData = { album: string; filePaths: string[]; }
const MediaImages = await Fetch.api<MediaImageData[]>(`${PAGE.backend}/media/images`);
const Albums = mediaImagesMap(MediaImages);

type Selection = { album: string, shuffle: boolean, interval: number };

const Confirm = 'bait:confirm';
const ConfirmEvent = new Event(Confirm);
const Cancel = 'bait:cancel';
const CancelEvent = new Event(Cancel);
const ExitCarousel = 'bait:exit-carousel';
const ExitCarouselEvent = new Event(ExitCarousel);

const Carousel = document.createElement('div');
document.body.append(Carousel);
Carousel.className = 'carousel';

export function render() {
	const selection = getQuerySelection();
	const modal = createModalDialog(selection);
	if (selection.album) runCarousel(selection, modal);
	else modal.element.showModal();
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
	const dropDown = new W.Select('Album: ');
	dropDown.element.id = 'album';
	dropDown.addOptions(Array.from(Albums.keys()), '--select--');

	const checkbox = new W.Checkbox(selection.shuffle, 'Shuffle Slides ');
	checkbox.element.id = 'shuffleOption';

	const range = new W.Range(selection.interval, 'Interval Between Slides:', 'Seconds: ', 0, 60, 1);
	range.element.id = 'intervalSelection';

	const cancelButton = new W.Button('Cancel', CancelEvent);
	const confirmButton = new W.Button('Confirm', ConfirmEvent);

	const modal = new W.Dialog('', 'carousel-dialog', 'Carousel Options');
	modal.addComponent(dropDown.labelElement);
	modal.addComponent(checkbox.labelElement);
	modal.addComponent(range.labelElement);
	modal.addComponents([cancelButton.element, confirmButton.element]);
	modal.appendTo(document.body);

	document.addEventListener(Cancel, () => {
		modal.element.close();
		window.history.back();
	});
	document.addEventListener(Confirm, () => {
		modal.element.close();
		selection.album = dropDown.value;
		selection.shuffle = checkbox.value;
		selection.interval = range.value;
		runCarousel(selection, modal);
	});
	return modal;
}

function runCarousel(selection: Selection, modal: W.Dialog) {
	const images = albumImages(selection.album);
	if (!images.length) {
		alert('No images have been selected!');
		modal.element.showModal();
	}
	else {
		const imageSet = new ImageSet(images, selection.shuffle);
		Carousel.dataset.carousel = '';
		const slide = document.createElement('div');
		slide.className = 'slide';
		Carousel.append(slide);
		slide.dataset.active = '';

		const imageElement = document.createElement('img');
		imageElement.src = imageSet.images[imageSet.index];
		slide.append(imageElement);
		// await image.decode(); /** wait till the image is ready to use */
		addExitButton(Carousel);
		let intervalID = 0;
		if (selection.interval) {
			const changeImageFunction = () => imageElement.src = imageSet.nextImage();
			intervalID = setInterval(changeImageFunction, selection.interval * 1000, Carousel);
		}
		else {
			const buttons = addNavigationButtons(Carousel);
			buttons.forEach(button => {
				button.addEventListener('click', () => {
					const reverse = button.dataset.carouselButton === 'prev';
					imageElement.src = imageSet.nextImage(reverse);
				});
			});
		}
		
		/**
		 * Stop the Interval loop (if any) and clear the carousel div. Show the
		 * modal dialog for new selection or cancellation.
		 */
		document.addEventListener(ExitCarousel, () => {
			if (intervalID) clearInterval(intervalID);
			Carousel.innerHTML = '';
			modal.element.showModal();
		});
	}
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
	returnButton.addEventListener('click', () => {
		document.dispatchEvent(ExitCarouselEvent);
	});
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

function mediaImagesMap(mediaImages: MediaImageData[]|null) {
	const imagesMap = new Map<string, string[]>();
	if (mediaImages !== null) {
		for (const mediaImage of mediaImages) {
			imagesMap.set(mediaImage.album, mediaImage.filePaths);
		}
	}
	return imagesMap;
}