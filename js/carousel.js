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
const MediaImages = await Fetch.api(`${PAGE.backend}/media/images`);
const Albums = mediaImagesMap(MediaImages);
let Album = '';
let Shuffle = false;
let Interval = 0;
export function render() {
    if (PAGE.parameters.has('album'))
        Album = PAGE.parameters.get('album');
    if (PAGE.parameters.has('interval'))
        Interval = Number(PAGE.parameters.get('interval'));
    if (isNaN(Interval) || Interval < 0)
        Interval = 0;
    if (PAGE.parameters.has('shuffle'))
        Shuffle = true;
    if (PAGE.parameters.has('interval') || PAGE.parameters.has('shuffle'))
        runCarousel( /* Album, Shuffle, Interval */);
    else if (PAGE.parameters.has('widget'))
        widgetTest();
    else
        modalDialog( /* album, shuffle, interval */);
}
function widgetTest() {
    const textInput = new W.Text('album', '', '', 'Album: ');
    const checkbox = new W.Checkbox2('shuffleOption', '', false, 'Shuffle Slides ');
    const modal = new W.Dialog('', 'carousel-dialog', 'Carousel Options');
    modal.addComponent(textInput.labelElement);
    modal.addComponent(checkbox.labelElement);
    modal.displayModal(document.body);
}
class ImageSet {
    constructor(images, shuffle = false) {
        this.images = [...images];
        this.index = 0;
        this.shuffling = shuffle;
        if (this.shuffling)
            this.shuffle();
    }
    /**
     * Return the next image.
     */
    nextImage(reverse = false) {
        const offset = (reverse) ? -1 : 1;
        this.index += offset;
        if (this.index >= this.images.length) {
            this.index = 0;
            if (this.shuffling)
                this.shuffle();
        }
        else if (this.index < 0) {
            this.index = this.images.length - 1;
            if (this.shuffling)
                this.shuffle();
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
            const randomImage = this.images.splice(randomIndex, 1)[0];
            this.images.push(randomImage);
        }
    }
}
function runCarousel( /* album: string, shuffle: boolean, interval: number */) {
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
        if (Interval) {
            const changeImageFunction = () => imageElement.src = imageSet.nextImage();
            const intervalID = setInterval(changeImageFunction, Interval * 1000, carousel);
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
    }
}
function addNavigationButtons(parent) {
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
function addExitButton(parent) {
    const returnButton = document.createElement('button');
    returnButton.className = 'carousel-button return';
    returnButton.innerHTML = '&times;';
    parent.append(returnButton);
    returnButton.addEventListener('click', () => { /* modalDialog(); */ window.history.back(); });
}
function modalDialog( /* album: string, shuffle: boolean, interval: number */) {
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
    albumSelection.value = Album;
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
    shuffleCheckbox.checked = Shuffle;
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
        Album = albumSelection.value;
    });
    shuffleCheckbox.addEventListener('change', () => {
        Shuffle = shuffleCheckbox.checked;
    });
    intervalSelection.addEventListener('input', () => {
        Interval = Number(intervalSelection.value);
        intervalOutput.innerHTML = `<br>Number of Seconds: ${Interval}`;
    });
    cancelButton.addEventListener('click', () => {
        modal.close();
        window.history.back();
    });
    confirmButton.addEventListener('click', () => {
        modal.close();
        runCarousel( /* album, shuffle, interval */);
    });
}
function albumImages(albumName) {
    let images = [];
    if (Albums.has(albumName)) {
        images = Albums.get(albumName);
        images.forEach((image, i, array) => {
            /** convert SmugMug IDs to URIs */
            if (!image.includes('/'))
                array[i] = smugURI(image);
        });
    }
    for (const image of images)
        console.log(image);
    return images;
}
/**
 * Logged into SmugMug, a photo's URL contains its photo `id`.
 * In the URL below, the `id` is: i-g6HGgRQ
 * https://dand.smugmug.com/Travels/Sierra-Nevada/Yosemite-05/i-g6HGgRQ/A
 */
function smugURI(id, size = 'O', type = 'jpg') {
    const smugMug = 'https://photos.smugmug.com/photos';
    let uri = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
    if (size == 'O')
        uri.replace('-O', '');
    return uri;
}
function mediaImagesMap(mediaImages) {
    const imagesMap = new Map();
    if (mediaImages !== null) {
        for (const mediaImage of mediaImages)
            imagesMap.set(mediaImage.album, mediaImage.filePaths);
    }
    return imagesMap;
}
