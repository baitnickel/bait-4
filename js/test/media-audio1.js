"use strict";
// export class Audio1 extends Media {
// 	element: HTMLAudioElement;
// 	offset: number;
// 	playIcon: string;
// 	pauseIcon: string;
// 	playPauseIcon: string;
// 	startIcon: string;
// 	backIcon: string;
// 	forwardIcon: string;
// 	endIcon: string;
// 	stopIcon: string;
// 	panel: HTMLDivElement;
// 	playPauseElement: HTMLSpanElement;
// 	skipToStartElement: HTMLSpanElement;
// 	skipBackElement: HTMLSpanElement;
// 	skipForwardElement: HTMLSpanElement;
// 	skipToEndElement: HTMLSpanElement;
// 	stopElement: HTMLSpanElement;
// 	locationElement: HTMLSpanElement;
// 	progressBar: HTMLDivElement;
// 	progressBarFill: HTMLDivElement;
// 	timeElement: HTMLSpanElement;
// 	durationElement: HTMLSpanElement;
// 	constructor(id = '') {
// 		const element = document.createElement('audio');
// 		super(element, id);
// 		this.element = element;
// 		this.offset = 10;
// 		this.playIcon = '▶️';
// 		this.pauseIcon = '⏸';
// 		this.playPauseIcon = '⏯';
// 		this.startIcon = '⏮';
// 		this.backIcon = '⏪';
// 		this.forwardIcon = '⏩';
// 		this.endIcon = '⏭';
// 		this.stopIcon = '⏹';
// 		this.panel = document.createElement('div');
// 		this.playPauseElement = document.createElement('span');
// 		this.playPauseElement.textContent = this.playIcon;
// 		this.skipToStartElement = document.createElement('span');
// 		this.skipToStartElement.textContent = this.startIcon;
// 		this.skipBackElement = document.createElement('span');
// 		this.skipBackElement.textContent = this.backIcon;
// 		this.skipForwardElement = document.createElement('span');
// 		this.skipForwardElement.textContent = this.forwardIcon;
// 		this.skipToEndElement = document.createElement('span');
// 		this.skipToEndElement.textContent = this.endIcon;
// 		this.stopElement = document.createElement('span');
// 		this.stopElement.textContent = this.stopIcon;
// 		this.locationElement = document.createElement('span');
// 		// this.locationElement.id = 'location';
// 		this.locationElement.textContent = '\u2316'; // 🔆 \u2316 📌 🔖
// 		this.progressBar = document.createElement('div');
// 		// this.progressBar.id = 'progress-bar';
// 		this.progressBarFill = document.createElement('div');
// 		// this.progressBarFill.id = 'progress-bar-fill';
// 		this.timeElement = document.createElement('span');
// 		// this.timeElement.id = 'current-time';
// 		this.timeElement.textContent = formatTime(0);
// 		this.durationElement = document.createElement('span');
// 		// this.durationElement.id = 'duration';
// 		this.durationElement.textContent = formatTime(0);
// 		/** Fill Container Elements */
// 		const controlsSection = document.createElement('div');
// 		controlsSection.append(this.playPauseElement);
// 		controlsSection.append(this.skipToStartElement);
// 		controlsSection.append(this.skipBackElement);
// 		controlsSection.append(this.skipForwardElement);
// 		controlsSection.append(this.skipToEndElement);
// 		controlsSection.append(this.stopElement);
// 		this.panel.append(this.timeElement);
// 		this.panel.append(this.progressBar);
// 		this.panel.append(this.progressBarFill);
// 		this.panel.append(this.durationElement);
// 		this.panel.append(this.locationElement);
// 		this.panel.append(controlsSection);
// 		/** Event Handling */
// 		this.playPauseElement.addEventListener('click', () => {
// 			if (this.element.paused) {
// 				this.playPauseElement.textContent = this.pauseIcon;
// 				this.element.play();
// 			}
// 			else {
// 				this.playPauseElement.textContent = this.playIcon;
// 				this.element.pause();
// 			}
// 		});
// 		this.skipToStartElement.addEventListener('click', () => {
// 			this.element.currentTime = this.newCurrentTime(0);
// 		});
// 		this.skipBackElement.addEventListener('click', () => {
// 			this.element.currentTime = this.newCurrentTime(this.offset);
// 		});
// 		this.skipForwardElement.addEventListener('click', () => {
// 			this.element.currentTime = this.newCurrentTime(this.offset, false);
// 		});
// 		this.skipToEndElement.addEventListener('click', () => {
// 			this.element.currentTime = this.newCurrentTime(0, false);
// 		});
// 		this.stopElement.addEventListener('click', () => {
// 			if (!this.element.paused) this.element.pause();
// 			this.element.currentTime = 0;
// 			this.playPauseElement.textContent = this.playIcon;
// 		});
// 		this.locationElement.addEventListener('click', () => {
// 			const position = this.element.currentTime;
// 			const copyText = (position != 0) ? formatTime(position) : '';
// 			if (copyText) {
// 				navigator.clipboard.writeText(copyText);
// 				window.alert(`Copied to Clipboard:\n${copyText}`);
// 			}
// 		});
// 		this.element.addEventListener('timeupdate', () => {
// 			this.timeElement.textContent = formatTime(this.element.currentTime);
// 			const barWidth = this.progressBar.offsetWidth;
// 			this.progressBarFill.style.width = `${this.element.currentTime / this.element.duration * barWidth}px`;
// 		});
// 		this.element.addEventListener('loadedmetadata', () => {
// 			this.durationElement.textContent = formatTime(this.element.duration);
// 		});
// 		this.element.addEventListener('ended', () => {
// 			this.element.currentTime = 0;
// 			this.playPauseElement.textContent = this.playIcon;
// 		});
// 		/** Styling */
// 		this.panel.style.position = 'relative';
// 		this.panel.style.height = '38px';
// 		this.panel.style.width = '295px';
// 		// this.panel.style.left = '5px'; // why?
// 		this.panel.style.backgroundColor = 'rgb(210,227,247)';
// 		this.panel.style.border = '1px solid rgb(0,0,255)';
// 		this.panel.style.borderRadius = '10px';
// 		this.panel.style.padding = '10px';
// 		const absolute = 'absolute';
// 		const timeTop = '5px';
// 		const barTop = '8px';
// 		const barLeft = '57px';
// 		const barHeight = '8px';
// 		const barWidth = '200px';
// 		const fontFamily = 'Verdana, Geneva, Tahoma, sans-serif';
// 		const timesFontSize = '8pt';
// 		const timesColor = 'rgb(0,0,0)';
// 		const barBorderRadius = '20px';
// 		const pointer = 'pointer';
// 		const controlFontSize = '14pt';
// 		const controlBackground = 'none';
// 		const controlPaddingLeft = '16px'; // 1rem
// 		this.timeElement.style.position = absolute;
// 		this.timeElement.style.top = timeTop;
// 		this.timeElement.style.left = '0px';
// 		this.timeElement.style.width = '50px';
// 		this.timeElement.style.fontFamily = fontFamily;
// 		this.timeElement.style.fontSize = timesFontSize;
// 		this.timeElement.style.textAlign = 'right';
// 		this.timeElement.style.color = timesColor;
// 		this.durationElement.style.position = absolute;
// 		this.durationElement.style.top = timeTop;
// 		this.durationElement.style.left = '265px';
// 		this.durationElement.style.fontFamily = fontFamily;
// 		this.durationElement.style.fontSize = timesFontSize;
// 		this.durationElement.style.color = timesColor;
// 		this.progressBar.style.position = absolute;
// 		this.progressBar.style.top = barTop;
// 		this.progressBar.style.left = barLeft;
// 		this.progressBar.style.height = barHeight;
// 		this.progressBar.style.width = barWidth;
// 		this.progressBar.style.borderRadius = barBorderRadius;
// 		this.progressBar.style.backgroundColor = 'rgb(255,255,255)';
// 		this.progressBarFill.style.position = absolute;
// 		this.progressBarFill.style.top = barTop;
// 		this.progressBarFill.style.left = barLeft;
// 		this.progressBarFill.style.height = barHeight;
// 		this.progressBarFill.style.width = '0px';
// 		this.progressBarFill.style.borderRadius = barBorderRadius;
// 		this.progressBarFill.style.backgroundColor = 'rgb(153,153,153)';
// 		this.locationElement.style.position = absolute;
// 		this.locationElement.style.top = '25px';
// 		this.locationElement.style.left = '10px';
// 		this.locationElement.style.fontSize = '16pt';
// 		this.locationElement.style.background = 'none';
// 		this.locationElement.style.padding = 'none';
// 		this.locationElement.style.cursor = pointer;
// 		controlsSection.style.position = absolute;
// 		controlsSection.style.top = '25px';
// 		controlsSection.style.left = '35px';
// 		this.playPauseElement.style.fontSize = controlFontSize;
// 		this.playPauseElement.style.background = controlBackground;
// 		this.playPauseElement.style.paddingLeft = controlPaddingLeft;
// 		this.playPauseElement.style.cursor = pointer;
// 		this.skipToStartElement.style.fontSize = controlFontSize;
// 		this.skipToStartElement.style.background = controlBackground;
// 		this.skipToStartElement.style.paddingLeft = controlPaddingLeft;
// 		this.skipToStartElement.style.cursor = pointer;
// 		this.skipBackElement.style.fontSize = controlFontSize;
// 		this.skipBackElement.style.background = controlBackground;
// 		this.skipBackElement.style.paddingLeft = controlPaddingLeft;
// 		this.skipBackElement.style.cursor = pointer;
// 		this.skipForwardElement.style.fontSize = controlFontSize;
// 		this.skipForwardElement.style.background = controlBackground;
// 		this.skipForwardElement.style.paddingLeft = controlPaddingLeft;
// 		this.skipForwardElement.style.cursor = pointer;
// 		this.skipToEndElement.style.fontSize = controlFontSize;
// 		this.skipToEndElement.style.background = controlBackground;
// 		this.skipToEndElement.style.paddingLeft = controlPaddingLeft;
// 		this.skipToEndElement.style.cursor = pointer;
// 		this.stopElement.style.fontSize = controlFontSize;
// 		this.stopElement.style.background = controlBackground;
// 		this.stopElement.style.paddingLeft = controlPaddingLeft;
// 		this.stopElement.style.cursor = pointer;
// 	}
// 	private newCurrentTime(seconds: number, backwards = true) { // needs: currentTime, duration, offset
// 		let newCurrentTime = 0;
// 		if (!seconds && backwards) newCurrentTime = 0;
// 		else if (!seconds) newCurrentTime = this.element.duration - this.offset;
// 		else if (backwards) {
// 			const beforeStart = this.element.currentTime < seconds;
// 			newCurrentTime = (beforeStart) ? 0 : this.element.currentTime - seconds;
// 		}
// 		else {
// 			const afterEnd = this.element.currentTime + seconds > this.element.duration;
// 			newCurrentTime = (afterEnd) ? this.element.duration - this.offset : this.element.currentTime + seconds;
// 		}
// 		return newCurrentTime;
// 	}
// }
