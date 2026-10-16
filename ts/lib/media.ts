/**
 * The Media superclass is similar to the Widget superclass. Obvious extensions
 * are Video and Audio. My immediate goal is to get an Audio Panel that can
 * replace the lame Audio "controls", as well as robust Play methods that can be
 * fed one or more audio files and play them in a sequence (sorted,
 * shuffled...).
 */

const SVG = 'http://www.w3.org/2000/svg';
type RichText = { value: string, fontSize: number, fontFamily: string };

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
	skip: number;
	panel: HTMLDivElement;

	constructor(id = '') {
		const element = document.createElement('audio');
		super(element, id);
		this.element = element;
		this.skip = 15;
		this.panel = document.createElement('div');

		/** define internal section to hold controls (Play, Pause, etc.) */
		const controlsSection = document.createElement('div');
		controlsSection.style.position = 'absolute';
		controlsSection.style.top = '25px';
		controlsSection.style.left = '35px';

		const playIcon = '▶️';
		const pauseIcon = '⏸';
		const playPauseIcon = '⏯';
		const rewindIcon = '⏮';
		const backIcon = '⏪';
		const forwardIcon = '⏩';
		const endIcon = '⏭';
		const stopIcon = '⏹';
		// const locationIcon = '\u2316'; // 🔆 \u2316 📌 🔖

		const playPause = document.createElement('span');
		const rewind = document.createElement('span');
		const back = document.createElement('span');
		const forward = document.createElement('span');
		const end = document.createElement('span');
		const stop = document.createElement('span');
		// const location = document.createElement('span');
		const progressBar = document.createElement('div');
		const progressBarFill = document.createElement('div');
		const time = document.createElement('span');
		const duration = document.createElement('span');

		playPause.textContent = playIcon;
		rewind.textContent = rewindIcon;
		back.textContent = backIcon;
		forward.textContent = forwardIcon;
		end.textContent = endIcon;
		stop.textContent = stopIcon;
		// location.textContent = locationIcon; 
		time.textContent = formatTime(0);
		duration.textContent = formatTime(0);

		/** Event Handling */
		playPause.addEventListener('click', () => {
			if (this.element.paused) {
				playPause.textContent = pauseIcon;
				this.element.play();
			}
			else {
				playPause.textContent = playIcon;
				this.element.pause();
			}
		});

		rewind.addEventListener('click', () => {
			this.element.currentTime = this.newCurrentTime(0);
		});

		back.addEventListener('click', () => {
			this.element.currentTime = this.newCurrentTime(this.skip);
		});

		forward.addEventListener('click', () => {
			this.element.currentTime = this.newCurrentTime(this.skip, false);
		});

		end.addEventListener('click', () => {
			this.element.currentTime = this.newCurrentTime(0, false);
		});

		stop.addEventListener('click', () => {
			if (!this.element.paused) this.element.pause();
			this.element.currentTime = 0;
			playPause.textContent = playIcon;
		});

		time.addEventListener('click', () => {
			navigator.clipboard.writeText(formatTime(this.element.currentTime));
			// const position = this.element.currentTime;
			// const positionText = (position != 0) ? formatTime(position) : '';
			// if (positionText) {
			// 	navigator.clipboard.writeText(positionText);
			// 	// window.alert(`Copied to Clipboard:\n${copyText}`);
			// }
		});

		this.element.addEventListener('timeupdate', () => {
			time.textContent = formatTime(this.element.currentTime);
			const barWidth = progressBar.offsetWidth;
			progressBarFill.style.width = `${this.element.currentTime / this.element.duration * barWidth}px`;
		});

		this.element.addEventListener('loadedmetadata', () => {
			duration.textContent = formatTime(this.element.duration);
		});

		this.element.addEventListener('ended', () => {
			this.element.currentTime = 0;
			playPause.textContent = playIcon;
		});

		/** Styling */
		this.panel.style.position = 'relative';
		this.panel.style.height = '38px';
		this.panel.style.width = '295px';
		this.panel.style.backgroundColor = 'rgb(210,227,247)';
		this.panel.style.border = '1px solid rgb(0,0,255)';
		this.panel.style.borderRadius = '10px';
		this.panel.style.padding = '10px';

		const absolute = 'absolute';
		const timeTop = '5px';
		const barTop = '8px';
		const barLeft = '57px';
		const barHeight = '8px';
		const barWidth = '200px';
		const fontFamily = 'Verdana, Geneva, Tahoma, sans-serif';
		const timesFontSize = '8pt';
		const timesColor = 'rgb(0,0,0)';
		const barBorderRadius = '20px';
		const pointer = 'pointer';
		const controlFontSize = '14pt';
		const controlBackground = 'none';
		const controlPaddingLeft = '16px'; // 1rem

		time.style.position = absolute;
		time.style.top = timeTop;
		time.style.left = '0px';
		time.style.width = '50px';
		time.style.fontFamily = fontFamily;
		time.style.fontSize = timesFontSize;
		time.style.textAlign = 'right';
		time.style.color = timesColor;
		time.style.cursor = pointer;

		duration.style.position = absolute;
		duration.style.top = timeTop;
		duration.style.left = '265px';
		duration.style.fontFamily = fontFamily;
		duration.style.fontSize = timesFontSize;
		duration.style.color = timesColor;

		for (const element of [progressBar, progressBarFill]) {
			element.style.position = absolute;
			element.style.top = barTop;
			element.style.left = barLeft;
			element.style.height = barHeight;
			element.style.borderRadius = barBorderRadius;
		}
		progressBar.style.width = barWidth;
		progressBar.style.backgroundColor = 'rgb(255,255,255)';

		progressBarFill.style.width = '0px';
		progressBarFill.style.backgroundColor = 'rgb(153,153,153)';

		// location.style.position = absolute;
		// location.style.top = '25px';
		// location.style.left = '10px';
		// location.style.fontSize = '16pt';
		// location.style.background = 'none';
		// location.style.padding = 'none';
		// location.style.cursor = pointer;

		/** Style controls and load them into the controlsSection */
		for (const element of [playPause, rewind, back, forward, end, stop]) {
			element.style.fontSize = controlFontSize;
			element.style.background = controlBackground;
			element.style.paddingLeft = controlPaddingLeft;
			element.style.cursor = pointer;
			controlsSection.append(element);
		}

		/** Load all elements into this.panel */
		// for (const element of [time, progressBar, progressBarFill, duration, location, controlsSection]) {
		for (const element of [time, progressBar, progressBarFill, duration, controlsSection]) {
			this.panel.append(element);
		}
	}

	private newCurrentTime(seconds: number, backwards = true) {
		let newCurrentTime = 0;
		if (!seconds && backwards) newCurrentTime = 0;
		else if (!seconds) newCurrentTime = this.element.duration - this.skip;
		else if (backwards) {
			const beforeStart = this.element.currentTime < seconds;
			newCurrentTime = (beforeStart) ? 0 : this.element.currentTime - seconds;
		}
		else {
			const afterEnd = this.element.currentTime + seconds > this.element.duration;
			newCurrentTime = (afterEnd) ? this.element.duration - this.skip : this.element.currentTime + seconds;
		}
		return newCurrentTime;
	}
}

/**
 * Given a number of seconds, return a formatted time string ('HH:MM:SS').
 * Return an empty string if seconds is a negative number, or if seconds is zero
 * and show0 is false.
 */
export function formatTime(seconds: number, show0 = true) {
	let formattedTime = '';
	seconds = Math.round(seconds);
	if (seconds > 0 || (show0 && seconds >= 0)) {
		const hours = Math.floor(seconds/3600)
		seconds -= (hours * 3600);
		const minutes = Math.floor(seconds/60);
		seconds -= (minutes * 60)
		formattedTime = (hours) ? `${hours}:` + `${minutes}`.padStart(2, '0') : `${minutes}`;
		formattedTime += ':' + `${seconds}`.padStart(2, '0');
	}
	return formattedTime;
}

function svgText(text: RichText) {
	// let svg = document.createElementNS(SVG, 'svg');
	// svg.setAttribute('x', coordinates.x.toString());
	// svg.setAttribute('y', coordinates.y.toString());
	// svg.setAttribute('width', coordinates.width.toString());
	// svg.setAttribute('height', coordinates.height.toString());

	let svgText = document.createElementNS(SVG, 'text');
	// svgText.setAttribute('x', Math.round(coordinates.width * .5).toString());
	// svgText.setAttribute('y', Math.round(coordinates.height * .7).toString());
	svgText.setAttribute('text-anchor', 'middle');
	svgText.setAttribute('font-family', text.fontFamily);
	svgText.setAttribute('font-size', text.fontSize.toString());
	// svgText.innerHTML = PrettyChord(text.value);
	// svg.appendChild(svgText);

	return svgText;
}

