import { Page } from './lib/page.js';
const PAGE = new Page(false, false);
const body = document.querySelector('body');
body.className = 'blackback';
let Interval = 0;
let Shuffle = true;
const Images = [
    '../media/image/die-12.png',
    '../media/image/duet-settings.png',
    // '/Users/dan/Documents/development/carousel/lb/laurel1.jpeg',
    // '/Users/dan/Documents/development/carousel/lb/laurel2.jpeg',
    // '/Users/dan/Documents/development/carousel/lb/laurel3.jpeg',
    // '/Users/dan/Documents/development/carousel/lb/laurel4.jpeg',
    // '/Users/dan/Documents/development/carousel/lb/laurel5.jpeg',
    // '/Users/dan/Documents/development/carousel/lb/laurel6.jpeg',
];
export function render() {
    if (Shuffle)
        Images.sort(() => Math.random() - .5);
    /** create the <div> element that will contain the slides */
    // const carousel = document.createElement('div');
    // carousel.className = 'carousel';
    // carousel.dataset.carousel = '';
    // body.append(carousel);
    const carousel = PAGE.content;
    carousel.className = 'carousel';
    carousel.dataset.carousel = '';
    /** create the <ul> element to contain all the slides */
    const slides = document.createElement('ul');
    slides.dataset.slides = '';
    carousel.append(slides);
    /** create each of the <li> elements representing the slides */
    for (let i = 0; i < Images.length; i += 1) {
        const slide = document.createElement('li');
        slide.className = 'slide';
        if (i == 0)
            slide.dataset.active = '';
        const image = document.createElement('img');
        image.src = `${Images[i]}`;
        slide.append(image);
        slides.append(slide);
    }
    if (Interval) {
        const intervalID = setInterval(changeSlide, Interval * 1000, slides);
    }
    else {
        /** no Interval--create the previous/next navigation buttons */
        const previousButton = document.createElement('button');
        previousButton.className = 'carousel-button prev';
        previousButton.dataset.carouselButton = 'prev';
        previousButton.innerHTML = '&larr;';
        carousel.append(previousButton);
        const nextButton = document.createElement('button');
        nextButton.className = 'carousel-button next';
        nextButton.dataset.carouselButton = 'next';
        nextButton.innerHTML = '&rarr;';
        carousel.append(nextButton);
        const buttons = [previousButton, nextButton];
        buttons.forEach(button => {
            button.addEventListener("click", () => {
                const offset = button.dataset.carouselButton === "next" ? 1 : -1;
                const slide = button.closest("[data-carousel]").querySelector("[data-slides]");
                const activeSlide = slide.querySelector("[data-active]");
                /* convert "slide.children" elements to array and get the index of the active slide */
                let newIndex = [...slide.children].indexOf(activeSlide) + offset;
                if (newIndex < 0)
                    newIndex = slide.children.length - 1;
                if (newIndex >= slide.children.length)
                    newIndex = 0;
                const child = slide.children.item(newIndex);
                if (child) {
                    const newActiveSlide = child;
                    newActiveSlide.dataset.active = '';
                    delete activeSlide.dataset.active; /* remove "active" attribute from the old slide */
                }
            });
        });
    }
}
function changeSlide(slide) {
    const offset = 1;
    const activeSlide = slide.querySelector("[data-active]");
    /* convert "slide.children" elements to array and get the index of the active slide */
    let newIndex = [...slide.children].indexOf(activeSlide) + offset;
    if (newIndex < 0)
        newIndex = slide.children.length - 1;
    if (newIndex >= slide.children.length)
        newIndex = 0;
    const child = slide.children.item(newIndex);
    if (child) {
        const newActiveSlide = child;
        newActiveSlide.dataset.active = '';
        delete activeSlide.dataset.active; /* remove "active" attribute from the old slide */
    }
}
