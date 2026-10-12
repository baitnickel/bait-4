import { Page } from './lib/page.js';
import * as Media from './lib/media.js';
import * as W from './lib/widgets.js';

const PAGE = new Page();

let AudioFile = '../media/audio/tape-archives/jed-2003/20 Scary Things in the Woods at Night.m4a';

// ▶️ ⏸ ⏯ ⏹ ⏭ ⏮ ⏩ ⏪ 

export function render() {
	PAGE.setTitle('Test Media.Audio', 1);
	PAGE.content.classList.add('media-module');

	const audio = new Media.Audio();
	audio.element.src = AudioFile;
	audio.element.load();
	const playPauseButton = audio.playPauseButton();
	const skipBackButton = audio.skipBackButton();
	const skipBack10Button = audio.skipBackButton(10);
	const skipForward10Button = audio.skipForwardButton(10);
	const skipForwardButton = audio.skipForwardButton();
	const stopButton = audio.stopButton(playPauseButton);
	PAGE.content.append(audio.element);

	const locationButton = document.createElement('button');
	locationButton.id = 'location';
	locationButton.textContent = '📌'; // 🔆 \u2316 📌 🔖
	locationButton.addEventListener('click', () => {
		const position = audio.element.currentTime;
		const copyText = (position != 0) ? Media.formatTime(position) : '';
		if (copyText) PAGE.clipboardCopy(copyText);
	});

	const time = document.createElement('span');
	time.id = 'current-time';
	time.textContent = Media.formatTime(0);
	audio.element.addEventListener('timeupdate', () => {
		time.textContent = Media.formatTime(audio.element.currentTime);
	});

	const pseudoBar = document.createElement('canvas');
	pseudoBar.id = 'progress-bar';
	pseudoBar.width = 320;
	pseudoBar.height = 14;
	const pseudoBarContext = pseudoBar.getContext('2d')!;
	pseudoBarContext.fillStyle = 'gray';
	pseudoBarContext.fillRect(0, 0, 320, 14);

	const duration = document.createElement('span');
	duration.id = 'duration';
	duration.textContent = Media.formatTime(0);
	audio.element.addEventListener('loadedmetadata', () => {
		duration.textContent = Media.formatTime(audio.element.duration);
	});

	const fileInput = new W.Text('Watts Talk', '');
	fileInput.element.addEventListener('change', () => {
		AudioFile = `../media/audio/watts/${fileInput.element.value.trim()}`;
		audio.element.src = AudioFile;
		audio.element.load();
	});

	/*
	--------------- title ---------------
	current time, progress bar, end time
	------------ buttons... -------------
	*/
	const titleSection = document.createElement('div');
	PAGE.content.append(titleSection);

	const consoleSection = document.createElement('div');
	consoleSection.id = 'console';
	PAGE.content.append(consoleSection);
	consoleSection.append(locationButton);
	consoleSection.append(time);
	consoleSection.append(pseudoBar);
	consoleSection.append(duration);
	
	const buttonSection = document.createElement('div');
	buttonSection.classList.add('control-buttons');
	PAGE.content.append(buttonSection);
	buttonSection.append(playPauseButton);
	buttonSection.append(skipBackButton);
	buttonSection.append(skipBack10Button);
	buttonSection.append(skipForward10Button);
	buttonSection.append(skipForwardButton);
	buttonSection.append(stopButton);

	const fileSection = document.createElement('div');
	PAGE.content.append(fileSection);
	fileSection.append(fileInput.element);
}

/*

<html>
Look at me - I'm a yellow box!
<svg width="20" height="20">
<rect width="20" height="20" style="fill:#E9E612;stroke-width:3;stroke:rgb(0,0,0)" />
</svg>
</html>

*/