import { Page } from './lib/page.js';
const PAGE = new Page(false, false);
const html = document.querySelector('html');
html.style['backgroundColor'] = '#000';
PAGE.body.style['backgroundColor'] = '#000';
PAGE.header.remove();
PAGE.content.remove();
PAGE.footer.remove();
let Interval = 0;
let Shuffle = false;
const Images = [
    '../media/image/lb/laurel1.jpeg',
    '../media/image/lb/laurel2.jpeg',
    '../media/image/lb/laurel3.jpeg',
    '../media/image/lb/laurel4.jpeg',
    '../media/image/lb/laurel5.jpeg',
    '../media/image/lb/laurel6.jpeg',
];
export function render() {
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
    if (Shuffle)
        Images.sort(() => Math.random() - .5);
    let firstSlide;
    for (let i = 0; i < Images.length; i += 1) {
        const slide = document.createElement('li');
        slide.className = 'slide';
        if (i == 0) {
            firstSlide = slide;
            slide.dataset.active = '';
        }
        const image = document.createElement('img');
        image.src = `${Images[i]}`;
        slide.append(image);
        slides.append(slide);
    }
    if (Interval) {
        // const intervalID = setInterval(changeSlide, Interval * 1000, slides);
        // const slide: HTMLElement = button.closest("[data-carousel]")!.querySelector("[data-slides]")!;
        const changeSlideFunction = () => changeSlide(slides, 1);
        const intervalID = setInterval(changeSlideFunction, Interval * 1000, slides);
    }
    else {
        const buttons = addButtons(carousel);
        buttons.forEach(button => {
            button.addEventListener("click", () => {
                const offset = button.dataset.carouselButton === "next" ? 1 : -1;
                const slide = button.closest("[data-carousel]").querySelector("[data-slides]");
                changeSlide(slides, offset);
                // const activeSlide: HTMLElement = slide.querySelector("[data-active]")!;
                // /* convert "slide.children" elements to array and get the index of the active slide */
                // let newIndex = [...slide.children].indexOf(activeSlide) + offset;
                // if (newIndex < 0) newIndex = slide.children.length - 1;
                // if (newIndex >= slide.children.length) newIndex = 0;
                // const child = slide.children.item(newIndex);
                // if (child) {
                // 	const newActiveSlide = child as HTMLElement;
                // 	newActiveSlide.dataset.active = '';
                // 	delete activeSlide.dataset.active; /* remove "active" attribute from the old slide */
                // }
            });
        });
    }
}
function changeSlide(slides, offset) {
    const activeSlide = slides.querySelector("[data-active]");
    let newIndex = [...slides.children].indexOf(activeSlide) + offset;
    if (newIndex < 0)
        newIndex = slides.children.length - 1;
    if (newIndex >= slides.children.length)
        newIndex = 0;
    const child = slides.children.item(newIndex);
    if (child) {
        const newActiveSlide = child;
        newActiveSlide.dataset.active = '';
        delete activeSlide.dataset.active; /* remove "active" attribute from the old slide */
    }
}
function addButtons(parent) {
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
