/**
 * The Media superclass is similar to the Widget superclass. Obvious extensions
 * are Video and Audio. My immediate goal is to get an Audio Panel that can
 * replace the lame Audio "controls", as well as robust Play methods that can be
 * fed one or more audio files and play them in a sequence (sorted,
 * shuffled...).
 */

export class Media {
	static odometer = 0;
	static idBase = 'Media';

	constructor(element: HTMLElement, id = '') {
		element.id = (id) ? id : Media.nextID();
	}

	static nextID() {
		Media.odometer += 1;
		const base = Media.idBase;
		const suffix = Media.odometer.toString();
		return `${base}-${suffix}`;
	}
}

export class Audio extends Media {
	element: HTMLAudioElement;
	playIcon: string;
	pauseIcon: string;
	playPauseIcon: string;
	startIcon: string;
	backIcon: string;
	forwardIcon: string;
	endIcon: string;
	stopIcon: string;

	constructor(id = '') {
		const element = document.createElement('audio');
		super(element, id);
		this.element = element;
		this.playIcon = '▶️';
		this.pauseIcon = '⏸';
		this.playPauseIcon = '⏯';
		this.startIcon = '⏮';
		this.backIcon = '⏪';
		this.forwardIcon = '⏩';
		this.endIcon = '⏭';
		this.stopIcon = '⏹';

		element.addEventListener('ended', () => {
			element.currentTime = 0;
		});
	}

	playPauseButton() {
		const button = document.createElement('button');
		button.innerText = this.playPauseIcon; // not toggling
		button.addEventListener('click', () => {
			if (this.element.paused) {
				// button.innerText = this.pauseIcon;
				this.element.play();
			}
			else {
				// button.innerText = this.playIcon;
				this.element.pause();
			}
			console.log('playPause currentTime:', this.element.currentTime);
		});
		return button;
	}

	skipBackButton(seconds = 0) {
		const button = document.createElement('button');
		button.innerText = (!seconds) ? this.startIcon : this.backIcon;
		button.addEventListener('click', () => {
			this.element.currentTime = this.newCurrentTime(seconds);
		});
		return button
	}

	skipForwardButton(seconds = 0) {
		const button = document.createElement('button');
		button.innerText = (!seconds) ? this.endIcon : this.forwardIcon;
		button.addEventListener('click', () => {
			this.element.currentTime = this.newCurrentTime(seconds, false);
		});
		return button
	}

	private newCurrentTime(seconds: number, backwards = true) {
		let newCurrentTime = 0;
		if (!seconds && backwards) newCurrentTime = 0;
		else if (!seconds) newCurrentTime = this.element.duration - 10; // go to 10 seconds before the end
		else if (backwards) {
			const beforeStart = this.element.currentTime < seconds;
			newCurrentTime = (beforeStart) ? 0 : this.element.currentTime - seconds;
		}
		else {
			const afterEnd = this.element.currentTime + seconds > this.element.duration;
			newCurrentTime = (afterEnd) ? this.element.duration - 10 : this.element.currentTime + seconds;
		}
		if (backwards) console.log('Back currentTime:', newCurrentTime);
		else console.log('Forward currentTime:', newCurrentTime);
		return newCurrentTime;
	}

	stopButton(playPauseButton: HTMLButtonElement) {
		const button = document.createElement('button');
		button.innerText = this.stopIcon;
		button.addEventListener('click', () => {
			if (!this.element.paused) this.element.pause();
			this.element.currentTime = 0;
			playPauseButton.innerText = this.playPauseIcon; // redundant ... should be playIcon if we're toggling
		});
		return button;
	}
}

/**
 * Given a number of seconds, return a formatted time string ('HH:MM:SS').
 * Return an empty string if seconds is a negative number. Also return an empty
 * string if seconds is 0, unless `show0` is true.
 */
export function formatTime(seconds: number) {
	let formattedTime = '';
	seconds = Math.round(seconds);
	if (seconds >= 0) {
		const hours = Math.floor(seconds/3600)
		seconds -= (hours * 3600);
		const minutes = Math.floor(seconds/60);
		seconds -= (minutes * 60)
		formattedTime = (hours) ? `${hours}:` + `${minutes}`.padStart(2, '0') : `${minutes}`;
		formattedTime += ':' + `${seconds}`.padStart(2, '0');
	}
	return formattedTime;
}


/* Source - https://stackoverflow.com/a/33802690

<div class="hp_slide">
	<div class="hp_range"></div>
</div>

.hp_slide{
	width:100%;
	background:white;
	height:25px;
}
.hp_range{
	width:0;
	background:black;
	height:25px;
}

var player = document.getElementById('player');    
player.addEventListener("timeupdate", function() {
	var currentTime = player.currentTime;
	var duration = player.duration;
	$('.hp_range').stop(true,true).animate({'width':(currentTime +.25)/duration*100+'%'},250,'linear');
});

*/

/*

The approach is to use an input[type="range"] slider to reflect the progress and
allow the user to seek through the track. When the range changes, set the
audio.currentTime attribute, using the slider as a percent (you could also
adjust the max attribute of the slider to match the audio.duration).

In the other direction, I update the slider's progress on timeupdate event
firing.

One corner case is that if the user scrolls around with their mouse down on the
slider, the timeupdate event will keep firing, causing the progress to hop
around between wherever the user's cursor is hovering and the current audio
progress. I use a boolean and the mousedown/mouseup events on the slider to
prevent this from happening.

See also JavaScript - HTML5 Audio / custom player's seekbar and current time for
an extension of this code that displays the time:

https://stackoverflow.com/questions/49814828/javascript-html5-audio-custom-players-seekbar-and-current-time/70638724#70638724

<button>▶️</button>
<input type="range" value="0" min="0" max="100" step="1">

button {
  font-size: 1.5em;
}

const url = "https://upload.wikimedia.org/wikipedia/en/a/a9/Webern_-_Sehr_langsam.ogg";
const audio = new Audio(url);
const playBtn = document.querySelector("button");
const progressEl = document.querySelector('input[type="range"]');
let mouseDownOnSlider = false;

audio.addEventListener("loadeddata", () => {
  progressEl.value = 0;
});
audio.addEventListener("timeupdate", () => {
  if (!mouseDownOnSlider) {
    progressEl.value = audio.currentTime / audio.duration * 100;
  }
});
audio.addEventListener("ended", () => {
  playBtn.textContent = "▶️";
});

playBtn.addEventListener("click", () => {
  audio.paused ? audio.play() : audio.pause();
  playBtn.textContent = audio.paused ? "▶️" : "⏸️";
});

progressEl.addEventListener("change", () => {
  const pct = progressEl.value / 100;
  audio.currentTime = (audio.duration || 0) * pct;
});
progressEl.addEventListener("mousedown", () => {
  mouseDownOnSlider = true;
});
progressEl.addEventListener("mouseup", () => {
  mouseDownOnSlider = false;
});

*/