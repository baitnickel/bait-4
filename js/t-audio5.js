import { Page } from './lib/page.js';
import * as Media from './lib/media.js';
const PAGE = new Page();
let AudioFile = `../media/audio/watts/house boat summit.m4a`;
export function render() {
    PAGE.setTitle('Test Media.Audio', 1);
    // PAGE.content.classList.add('media-module');
    const audio = new Media.Audio();
    audio.element.src = AudioFile;
    audio.element.load();
    audio.offset = 60;
    PAGE.content.append(audio.element);
    PAGE.content.append(audio.panel);
    // const playPauseElement = audio.playPauseElement;
    // const skipBackElement = audio.skipToStartElement;
    // const skipBack10Element = audio.skipBackElement;
    // const skipForward10Element = audio.skipForwardElement;
    // const skipForwardElement = audio.skipToEndElement;
    // const stopElement = audio.stopElement;
    // PAGE.content.append(audio.element);
    // const locationElement = document.createElement('span');
    // locationElement.id = 'location';
    // locationElement.textContent = '\u2316'; // 🔆 \u2316 📌 🔖
    // locationElement.addEventListener('click', () => {
    // 	const position = audio.element.currentTime;
    // 	const copyText = (position != 0) ? Media.formatTime(position) : '';
    // 	if (copyText) PAGE.clipboardCopy(copyText);
    // });
    // const progressBar = document.createElement('div');
    // progressBar.id = 'progress-bar';
    // const progressBarFill = document.createElement('div');
    // progressBarFill.id = 'progress-bar-fill';
    // const time = document.createElement('span');
    // time.id = 'current-time';
    // time.textContent = Media.formatTime(0);
    // audio.element.addEventListener('timeupdate', () => {
    // 	time.textContent = Media.formatTime(audio.element.currentTime);
    // 	const barWidth = progressBar.offsetWidth;
    // 	progressBarFill.style.width = `${audio.element.currentTime / audio.element.duration * barWidth}px`;
    // });
    // const duration = document.createElement('span');
    // duration.id = 'duration';
    // duration.textContent = Media.formatTime(0);
    // audio.element.addEventListener('loadedmetadata', () => {
    // 	duration.textContent = Media.formatTime(audio.element.duration);
    // });
    // const titleSection = document.createElement('div');
    // PAGE.content.append(titleSection);
    // const consoleSection = document.createElement('div');
    // consoleSection.id = 'console';
    // PAGE.content.append(consoleSection);
    // consoleSection.append(locationElement);
    // consoleSection.append(time);
    // consoleSection.append(progressBar);
    // consoleSection.append(progressBarFill);
    // consoleSection.append(duration);
    // const controlsSection = document.createElement('div');
    // controlsSection.classList.add('controls');
    // controlsSection.append(playPauseElement);
    // controlsSection.append(skipBackElement);
    // controlsSection.append(skipBack10Element);
    // controlsSection.append(skipForward10Element);
    // controlsSection.append(skipForwardElement);
    // controlsSection.append(stopElement);
    // consoleSection.append(controlsSection);
}
