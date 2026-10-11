import { Page } from './lib/page.js';
import * as Media from './lib/media.js';
import * as W from './lib/widgets.js';

const PAGE = new Page();

// ▶️ ⏸ ⏯ ⏹ ⏭ ⏮ ⏩ ⏪ 

export function render() {
	PAGE.setTitle('Test Media.Audio', 1);
	
	const audio = new Media.Audio();
	// const audio = new Audio();
	audio.element.src = '../media/audio/tape-archives/jed-2003/20 Scary Things in the Woods at Night.m4a';
	audio.element.load();
	const playPauseButton = audio.playPauseButton();
	const skipBackButton = audio.skipBackButton();
	const skipBack10Button = audio.skipBackButton(10);
	const skipForward10Button = audio.skipForwardButton(10);
	const skipForwardButton = audio.skipForwardButton();
	const stopButton = audio.stopButton(playPauseButton);
	
	const fileInput = new W.Text('Watts Talk', '');
	fileInput.element.addEventListener('change', () => {
		audio.element.src = `../media/audio/watts/${fileInput.element.value.trim()}`;
		audio.element.load();
	});

	const time = document.createElement('div');
	time.textContent = Media.formatTime(0);
	audio.element.addEventListener('timeupdate', () => {
		time.textContent = Media.formatTime(audio.element.currentTime);
	});
	const duration = document.createElement('div');
	duration.textContent = Media.formatTime(0);
	audio.element.addEventListener('loadedmetadata', () => {
		duration.textContent = Media.formatTime(audio.element.duration);
	});

	/** add 'location' button */
	const locationButton = document.createElement('button');
	locationButton.textContent = '📌'; // 🔆 \u2316 📌 🔖
	// locationButton.className = 'talk-dialog-location';
	locationButton.addEventListener('click', () => {
		const position = audio.element.currentTime; // always returns 0!
		const copyText = (position != 0) ? Media.formatTime(position) : '';
		if (copyText) PAGE.clipboardCopy(copyText);
	});

	const square = document.createElement('canvas');
	square.width = 32;
	square.height = 32;
	const squareContext = square.getContext('2d');
	if (squareContext === null) console.error('cannot define Canvas context');
	else {
		squareContext.fillStyle = 'red';
		squareContext.fillRect(0, 0, 32, 32);
	}
	// square.style.background = '#000';
	// square.style.height = '12';
	// square.style.width = '12';

	PAGE.content.append(audio.element);
	// PAGE.content.append(playButton);
	// PAGE.content.append(pauseButton);
	PAGE.content.append(fileInput.element);
	PAGE.content.append(playPauseButton);
	PAGE.content.append(skipBackButton);
	PAGE.content.append(skipBack10Button);
	PAGE.content.append(skipForward10Button);
	PAGE.content.append(skipForwardButton);
	PAGE.content.append(stopButton);
	PAGE.content.append(locationButton);
	PAGE.content.append(time);
	PAGE.content.append(duration);
	PAGE.content.append(square);
}

/*

<html>
Look at me - I'm a yellow box!
<svg width="20" height="20">
<rect width="20" height="20" style="fill:#E9E612;stroke-width:3;stroke:rgb(0,0,0)" />
</svg>
</html>

*/