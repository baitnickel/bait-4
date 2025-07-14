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
const Dots = PAGE.parameters.has('dots');
const Albums = mediaImagesMap(MediaImages, Dots);
const Confirm = 'bait:confirm';
const ConfirmEvent = new Event(Confirm);
const Cancel = 'bait:cancel';
const CancelEvent = new Event(Cancel);
const ExitCarousel = 'bait:exit-carousel';
const ExitCarouselEvent = new Event(ExitCarousel);
export function render() {
    const selection = { album: 'test', shuffle: false, interval: 0 };
    if (PAGE.parameters.has('album'))
        selection.album = PAGE.parameters.get('album');
    if (PAGE.parameters.has('interval'))
        selection.interval = Number(PAGE.parameters.get('interval'));
    if (isNaN(selection.interval) || selection.interval < 0)
        selection.interval = 0;
    if (PAGE.parameters.has('shuffle'))
        selection.shuffle = true;
    if (PAGE.parameters.has('interval') || PAGE.parameters.has('shuffle'))
        runCarousel(selection);
    else
        modalDialog(selection);
}
function modalDialog(selection) {
    const albumNames = Array.from(Albums.keys());
    albumNames.sort((a, b) => b.localeCompare(a));
    // const textInput = new W.Text('album', '', selection.album, 'Album: ');
    const select = new W.Select('album', '', albumNames, 'Album: ');
    const checkbox = new W.Checkbox('shuffleOption', '', selection.shuffle, 'Shuffle Slides ');
    const range = new W.Range('intervalSelection', '', selection.interval, 'Interval Between Slides:', 'Seconds: ', 0, 60, 1);
    const cancelButton = new W.Button('', '', 'Cancel', CancelEvent);
    const confirmButton = new W.Button('', '', 'Confirm', ConfirmEvent);
    const modal = new W.Dialog('', 'carousel-dialog', 'Carousel Options');
    // modal.addComponents(textInput.labelElement); // textInput.component or widget
    modal.addComponents(select.labelElement);
    modal.addComponents(checkbox.labelElement);
    modal.addComponents(range.labelElement);
    modal.addComponents([cancelButton.element, confirmButton.element]);
    modal.displayModal(document.body);
    document.addEventListener(Cancel, () => {
        modal.element.close();
        window.history.back();
    }, { once: true });
    /**
     * modalDialog may be called multiple times. The "once" option ensures that
     * only one Confirm listener at a time will be active.
     */
    document.addEventListener(Confirm, () => {
        modal.element.close();
        // selection.album = textInput.value;
        selection.album = select.value;
        selection.shuffle = checkbox.value;
        selection.interval = range.value;
        runCarousel(selection);
    }, { once: true });
}
function runCarousel(selection) {
    const images = albumImages(selection.album);
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
        const imageSet = new ImageSet(images, selection.shuffle);
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
         * Stop the runCarousel Interval loop (if any) and remove the carousel
         * (and slide) divs to restore the default page background. Then display
         * the modal dialog to allow the user to enter new selection criteria or
         * cancel out of the page. The "once: true" option prevents the system
         * from creating an undesired queue of listeners by ensuring that the
         * listener is removed after each use.
         */
        document.addEventListener(ExitCarousel, () => {
            if (intervalID)
                clearInterval(intervalID);
            carousel.remove();
            modalDialog(selection);
        }, { once: true });
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
    returnButton.addEventListener('click', () => {
        document.dispatchEvent(ExitCarouselEvent);
    });
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
    // for (const image of images) console.log(image);
    return images;
}
/**
 * To find a SmugMug photo's `id`, log into SmugMug and display the photo. The
 * URL will contain the `id`. In the example URL below, the `id` is: i-g6HGgRQ
 *
 * https://dand.smugmug.com/Travels/Sierra-Nevada/Yosemite-05/i-g6HGgRQ/A
 */
function smugURI(id, size = 'O', type = 'jpg') {
    const smugMug = 'https://photos.smugmug.com/photos';
    let uri = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
    if (size == 'O')
        uri.replace('-O', '');
    return uri;
}
function mediaImagesMap(mediaImages, dotDirectories = false) {
    const imagesMap = new Map();
    if (mediaImages !== null) {
        for (const mediaImage of mediaImages) {
            if (dotDirectories || !mediaImage.album.startsWith('.')) {
                imagesMap.set(mediaImage.album, mediaImage.filePaths);
            }
        }
    }
    return imagesMap;
}
