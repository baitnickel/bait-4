import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as Widgets from './lib/widgets.js';

const PAGE = new Page(false, false);
PAGE.header.remove();
PAGE.content.remove();
PAGE.footer.remove();

const html = document.querySelector('html')!;
html.style['backgroundColor'] = '#000';

PAGE.body.style['backgroundColor'] = '#000';
PAGE.body.style['width'] = '100vw';
PAGE.body.style['maxWidth'] = '100vw';
PAGE.body.style['height'] = '100vh';
PAGE.body.style['maxHeight'] = '100vh';
PAGE.body.style['margin'] = '0';
PAGE.body.style['padding'] = '0';
PAGE.body.style['border'] = '0';
PAGE.body.style['gap'] = '0';

let Interval = (PAGE.parameters.has('interval')) ? Number(PAGE.parameters.get('interval')) : 0;
if (isNaN(Interval) || Interval < 0) Interval = 0;
let Shuffle = (PAGE.parameters.has('shuffle')) ? true : false;

const Images = album('lb');

export function render() {
	if (PAGE.parameters.has('interval') || PAGE.parameters.has('shuffle')) runCarousel();
	else modalDialog();
}

function runCarousel() {
	/** create the <div> element that will contain the slides */
	const carousel = document.createElement('div');
	PAGE.body.append(carousel);
	carousel.className = 'carousel';
	carousel.dataset.carousel = '';
	
	/** create the <ul> element to contain all the slides */
	const slides = document.createElement('ul');
	slides.dataset.slides = '';
	carousel.append(slides);
	
	/** create each of the <li> elements representing the slides */
	if (Shuffle) Images.sort(() => Math.random() - .5);
	for (let i = 0; i < Images.length; i += 1) {
		const slide = document.createElement('li');
		slide.className = 'slide';
		if (i == 0) slide.dataset.active = '';
		const image = document.createElement('img');
		image.src = `${Images[i]}`;
		slide.append(image);
		slides.append(slide);
	}

	addExitButton(carousel);

	if (Interval) {
		const changeSlideFunction = () => changeSlide(slides, 1);
		const intervalID = setInterval(changeSlideFunction, Interval * 1000, slides);
	}
	else {
		const buttons = addNavigationButtons(carousel);
		buttons.forEach(button => {
			button.addEventListener('click', () => {
				const offset = button.dataset.carouselButton === 'next' ? 1 : -1;
				changeSlide(slides, offset);
			});
		});
	}
}

function changeSlide(slides: HTMLUListElement, offset: number) {
	const activeSlide: HTMLElement = slides.querySelector('[data-active]')!;
	let newIndex = [...slides.children].indexOf(activeSlide) + offset;
	if (newIndex < 0) newIndex = slides.children.length - 1;
	if (newIndex >= slides.children.length) newIndex = 0;
	const child = slides.children.item(newIndex);
	if (child) {
		const newActiveSlide = child as HTMLElement;
		newActiveSlide.dataset.active = '';
		delete activeSlide.dataset.active; /* remove 'active' attribute from the old slide */
	}
}

function addNavigationButtons(parent: HTMLElement) {
	const previousButton = document.createElement('button');
	previousButton.className = 'carousel-button prev';
	previousButton.dataset.carouselButton = 'prev';
	previousButton.innerHTML = '&larr;';
	parent.append(previousButton);
	const nextButton = document.createElement('button');
	nextButton.className = 'carousel-button next';
	nextButton.dataset.carouselButton = 'next';
	nextButton.innerHTML = '&rarr;';
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

/**
 * To obtain the URL of a SmugMug photo for use in a web page (also see Obsidian
 * 'SmugMug' note):
 * 
 * - Logon to SmugMug and open the image
 * - Click the Share icon in the left-hand ribbon
 * - Select Embed
 * - Select a Photo Size
 * - Click JPEG
 * - Click COPY JPEG URL
 * 
 * ... or, just grab the ID from the image URL
 * 
 * A SmugMug Embed URL doesn't care where in SmugMug the file has been placed:
 * https://photos.smugmug.com/photos/i-g6HGgRQ/0/Th/i-g6HGgRQ-Th.jpg
 * 
 * In contrast, the plain SmugMug Link contains gallery/folder names:
 * https://dand.smugmug.com/Travels/Sierra-Nevada/Yosemite-05/i-g6HGgRQ/A
 * 
 */
function externalImageURI(id: string, size = 'O', type = 'jpg') {
	const smugMug = 'https://photos.smugmug.com/photos';
	let uri = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
	if (size == 'O') uri.replace('-O', '');
	return uri;
}

function album(albumName: string) {
	let images: string[] = [];
	if (albumName == 'lb') {
		images = [
			'../media/image/lb/laurel1.jpeg',
			'../media/image/lb/laurel2.jpeg',
			'../media/image/lb/laurel3.jpeg',
			'../media/image/lb/laurel4.jpeg',
			'../media/image/lb/laurel5.jpeg',
			'../media/image/lb/laurel6.jpeg',
		];
	}
	else if (albumName == 'smug') {
		images = [
			externalImageURI('i-Tm4DNVx'),
			externalImageURI('i-rwxHxHr'),
			externalImageURI('i-hrkCmFB'),
			externalImageURI('i-ppMDLxx'),
			externalImageURI('i-jKZ2rrF'),
			externalImageURI('i-Rg8PzGG'),
			externalImageURI('i-JNdgjQm'),
			externalImageURI('i-84C2Hsq'),
			externalImageURI('i-wZLVH8D'),
			externalImageURI('i-3Mx7mVm'),
			externalImageURI('i-Csjbz22'),
			externalImageURI('i-BqwT4mg'),
			externalImageURI('i-JM3GNRf'),
			externalImageURI('i-7ttcPm6'),
			externalImageURI('i-9F92fdJ'),
			externalImageURI('i-8QrWQjD'),
			externalImageURI('i-sbg54cH'),
			externalImageURI('i-DHBchVF'),
			externalImageURI('i-RQm3fz2'),
			externalImageURI('i-75TgDZk'),
			externalImageURI('i-ssSgNgH'),
			externalImageURI('i-7gxW9Pr'),
			externalImageURI('i-JfR9mKR'),
			externalImageURI('i-bvdVMgN'),
			externalImageURI('i-dsrkX6K'),
			externalImageURI('i-7XSJ7sc'),
			externalImageURI('i-6HsKBZC'),
			externalImageURI('i-QxjNSDx'),
			externalImageURI('i-PmB4QRK'),
			externalImageURI('i-PzpBr5S'),
			externalImageURI('i-LTzBkj5'),
			externalImageURI('i-ZrLfLgh'),
			externalImageURI('i-ftSVh27'),
			externalImageURI('i-jBWW5mn'),
			externalImageURI('i-BPBwJxL'),
			externalImageURI('i-sCf6xR7'),
			externalImageURI('i-Fs8g2Gw'),
			externalImageURI('i-DChXB5S'),
			externalImageURI('i-G8JbPVs'),
			externalImageURI('i-tGh9dZv'),
			externalImageURI('i-L84NFbF'),
			externalImageURI('i-M7XkjLQ'),
			externalImageURI('i-wgSqRTH'),
			externalImageURI('i-gRMN5z6'),
			externalImageURI('i-24sk7Fn'),
			externalImageURI('i-L22tW7j'),
			externalImageURI('i-LWcdZ7z'),
			externalImageURI('i-m58Jcfm'),
			externalImageURI('i-Q89WJWx'),
			externalImageURI('i-JZPkD7q'),
			externalImageURI('i-xGLMGDC'),
			externalImageURI('i-77Gk4Rn'),
		];
	}
	return images;
}

function modalDialog() {
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

	/** shuffle checkbox */
	const shuffleOption = document.createElement('li');
	const shuffleCheckbox = document.createElement('input');
	shuffleCheckbox.type = 'checkbox';
	shuffleCheckbox.id = 'shuffleOption';
	shuffleCheckbox.checked = true;
	const shuffleLabel = document.createElement('label');
	shuffleLabel.htmlFor = shuffleCheckbox.id;
	shuffleLabel.innerText = 'Randomly Sort Slides ';
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
	intervalOutput.innerHTML = `<br>Value: ${intervalSelection.value}`;
	const intervalLabel = document.createElement('label');
	intervalLabel.htmlFor = 'intervalSelection';
	intervalLabel.innerHTML = 'Interval Between Slides (Seconds):<br>';
	intervalLabel.append(intervalSelection);
	intervalLabel.append(intervalOutput);
	intervalOption.append(intervalLabel);

	// /** create file picker input */
	// const fileOption = document.createElement('input');
	// fileOption.type = 'file';
	// fileOption.id = 'fileOption';
	// fileOption.name = 'fileOption';
	// fileOption.accept = '.jpg, .jpeg, .png';
	// fileOption.multiple = true;

	/** cancel and confirm buttons */
	const buttonsOption = document.createElement('li');
	const cancelButton = document.createElement('button');
	cancelButton.innerText = 'Cancel';
	buttonsOption.append(cancelButton);
	const confirmButton = document.createElement('button');
	confirmButton.innerText = 'Confirm';
	buttonsOption.append(confirmButton);

	/** add list of options to options list and add options list to fieldset */
	optionList.append(shuffleOption);
	optionList.append(intervalOption);
	// optionList.append(fileOption);
	optionList.append(buttonsOption);
	modalFieldSet.append(optionList);

	/** add fieldset to modal and modal to body and display modal */
	modal.append(modalFieldSet);
	PAGE.body.append(modal);
	modal.showModal();

	shuffleCheckbox.addEventListener('change', () => {
		Shuffle = shuffleCheckbox.checked;
	});
	intervalSelection.addEventListener('input', () => {
		Interval = Number(intervalSelection.value);
		intervalOutput.innerHTML = `<br>Value: ${Interval}`;
	});
	// fileOption.addEventListener('change', (event) => {
	// 	for (const file of event.target.files) {
	// 		// images.push(file.name);
	// 		console.log(file);
	// 	}
	// });
	cancelButton.addEventListener('click', () => {
		modal.close()
		window.history.back();
	});
	confirmButton.addEventListener('click', () => {
		modal.close()
		if (Images.length) runCarousel();
		else alert('No images have been selected!');
	});
}