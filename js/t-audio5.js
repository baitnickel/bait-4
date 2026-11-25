import { Page } from './lib/page.js';
import * as Media from './lib/media.js';
const PAGE = new Page();
let AudioFile = `../media/audio/watts/guided meditation.m4a`;
export function render() {
    PAGE.setTitle('Test Media.Audio', 1);
    const audio = new Media.Audio('', true);
    audio.element.src = AudioFile;
    audio.element.load();
    audio.skip = 15;
    PAGE.content.append(audio.element);
    PAGE.content.append(audio.panel);
    // test();
}
function test() {
    const svgLabels = ['play-skip-back', 'play-back', 'play', 'play-forward', 'play-skip-forward', 'stop'];
    for (const svgLabel of svgLabels) {
        const svgImage = document.createElement('img');
        svgImage.setAttribute('src', `images/icons/${svgLabel}-circle-outline.svg`);
        svgImage.width = (svgLabel == 'play') ? 40 : 32; // a width seems to be required?
        const button = document.createElement('button');
        // button.style.marginLeft = '1em';
        button.style.border = 'none'; //'1px solid gray';
        button.style.backgroundColor = 'transparent';
        button.append(svgImage);
        button.addEventListener('click', () => { alert(`${svgLabel}`); });
        PAGE.content.append(button);
    }
}
