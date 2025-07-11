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

let Album = '';
let Shuffle = false;
let Interval = 0;

const Confirm = 'bait:confirm';
const ConfirmEvent = new Event(Confirm);
const Cancel = 'bait:cancel';
const CancelEvent = new Event(Cancel);
const ExitCarousel = 'bait:exit-carousel';
const ExitCarouselEvent = new Event(ExitCarousel);

export function render() {
	if (PAGE.parameters.has('album')) Album = PAGE.parameters.get('album')!;
	if (PAGE.parameters.has('interval')) Interval = Number(PAGE.parameters.get('interval'));
	if (isNaN(Interval) || Interval < 0) Interval = 0;
	if (PAGE.parameters.has('shuffle')) Shuffle = true;
	if (PAGE.parameters.has('interval') || PAGE.parameters.has('shuffle')) runCarousel();
	else modalDialog();
}

function modalDialog() {
	const textInput = new W.Text('album', '', Album, 'Album: ');
	const checkbox = new W.Checkbox2('shuffleOption', '', Shuffle, 'Shuffle Slides ');
	const range = new W.Range('intervalSelection', '', Interval, 'Interval Between Slides:', 'Seconds: ', 0, 60, 1);
	const cancelButton = new W.Button('', '', 'Cancel', CancelEvent);
	const confirmButton = new W.Button('', '', 'Confirm', ConfirmEvent);

	const modal = new W.Dialog('', 'carousel-dialog', 'Carousel Options');
	modal.addComponents(textInput.labelElement); // textInput.component or widget
	modal.addComponents(checkbox.labelElement);
	modal.addComponents(range.labelElement);
	modal.addComponents([cancelButton.element, confirmButton.element]);
	modal.displayModal(document.body);

	document.addEventListener(Cancel, () => {
		modal.element.close();
		window.history.back();
	});

	document.addEventListener(Confirm, () => {
		modal.element.close();
		Album = textInput.value;
		Shuffle = checkbox.value;
		Interval = range.value;
		runCarousel();
	});
}

function runCarousel() {
	const images = albumImages(Album);
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

		const imageSet = new ImageSet(images, Shuffle);
		const slide = document.createElement('div');
		slide.className = 'slide';
		slide.dataset.active = '';
		carousel.append(slide);
		const imageElement = document.createElement('img');
		imageElement.src = imageSet.images[imageSet.index];
		slide.append(imageElement);
		// await image.decode(); /** wait till the image is ready to use */
		addExitButton(carousel);
		let intervalID = 0;
		if (Interval) {
			const changeImageFunction = () => imageElement.src = imageSet.nextImage();
			intervalID = setInterval(changeImageFunction, Interval * 1000, carousel);
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
		
		/** stop the RunCarousel loop and clear the slide div */
		document.addEventListener(ExitCarousel, () => {
			if (intervalID) clearInterval(intervalID);
			carousel.remove();
			// modalDialog(); // doesn't work, a closure problem?
			window.location.reload();
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
	// returnButton.addEventListener('click', () => { /* xModalDialog(); */ window.history.back(); });
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

	/**
	 * Return the next image.
	 */
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
	// for (const image of images) console.log(image);
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
		for (const mediaImage of mediaImages) imagesMap.set(mediaImage.album, mediaImage.filePaths);
	}
	return imagesMap;
}