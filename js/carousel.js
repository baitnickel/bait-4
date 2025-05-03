import { Page } from './lib/page.js';
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
export function render() {
    const images = album('lb');
    let interval = (PAGE.parameters.has('interval')) ? Number(PAGE.parameters.get('interval')) : 0;
    if (isNaN(interval) || interval < 0)
        interval = 0;
    let shuffle = (PAGE.parameters.has('shuffle')) ? true : false;
    if (PAGE.parameters.has('interval') || PAGE.parameters.has('shuffle'))
        runCarousel(images, shuffle, interval);
    else
        modalDialog(images, shuffle, interval);
}
class ImageSet {
    constructor(URIs, shuffle = false) {
        if (shuffle)
            URIs.sort(() => Math.random() - .5);
        this.URIs = URIs;
    }
    activeURI() {
        return this.URIs[ImageSet.index];
    }
}
ImageSet.index = 0;
function runCarousel(images, shuffle, interval) {
    if (!images.length) {
        alert('No images have been selected!');
        window.history.back();
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
function changeImage(imageSet, imageElement, reverse = false) {
    const offset = (reverse) ? -1 : 1;
    ImageSet.index += offset;
    if (ImageSet.index < 0)
        ImageSet.index = imageSet.URIs.length - 1;
    else if (ImageSet.index >= imageSet.URIs.length)
        ImageSet.index = 0;
    imageElement.src = imageSet.activeURI();
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
    returnButton.addEventListener('click', () => { window.history.back(); });
}
function modalDialog(images, shuffle, interval) {
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
    optionList.append(shuffleOption);
    optionList.append(intervalOption);
    // optionList.append(fileOption);
    optionList.append(buttonsOption);
    modalFieldSet.append(optionList);
    /** add fieldset to modal and modal to body and display modal */
    modal.append(modalFieldSet);
    document.body.append(modal);
    modal.showModal();
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
        runCarousel(images, shuffle, interval);
    });
}
function album(albumName) {
    let images = [];
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
    else if (albumName == 'sm') {
        images = [
            externalImageURI('i-Tm4DNVx'),
            externalImageURI('i-rwxHxHr'),
            externalImageURI('i-hrkCmFB'),
            externalImageURI('i-ppMDLxx'),
            externalImageURI('i-jKZ2rrF'),
            externalImageURI('i-Rg8PzGG'),
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
function externalImageURI(id, size = 'O', type = 'jpg') {
    const smugMug = 'https://photos.smugmug.com/photos';
    let uri = `${smugMug}/${id}/0/${size}/${id}-${size}.${type}`;
    if (size == 'O')
        uri.replace('-O', '');
    return uri;
}
