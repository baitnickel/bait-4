/**
 * Utilities for handling audio and video media.
 */

// function testAudio(testOutput: HTMLDivElement) {
// 	let audioElement = new Audio();
// 	const folder = '../media/audio/test';
// 	const urls = [`${folder}/F.m4a`, `${folder}/Bb.m4a`, `${folder}/C.m4a`, `${folder}/F.m4a`];
// 	PlayAudio(audioElement, urls);
// }
/**
 * Given an HTMLAudioElement and an audio file URI or an array of URIs (path
 * names), load and play each of the audio files in succession. When the
 * optional "loop" parameter is set to 'true', the complete array of audio files
 * will be repeated continuously.
 */
export function PlayAudio(
	audioElement: HTMLAudioElement,
	uris: string|string[],
	callback: (uri: string) => string,
	loop = false) {

	if (typeof uris == 'string') uris = [uris];
	const tracks = {
		uris: uris,
		index: 0,
		next: function() { this.index = (this.index + 1) % this.uris.length },
		select: function() { return this.uris[this.index] },
		play: function() {
			audioElement.src = tracks.select();
			audioElement.load();
			audioElement.play();
			callback(uris[tracks.index]);
		}
	}
	tracks.play();
	audioElement.addEventListener('ended', () => {
		tracks.next();
		if (tracks.index != 0 || loop) tracks.play();
	});
}

export function PlayAudio1(
	audioElement: HTMLAudioElement,
	uris: string|string[],
	callback: (uri: string) => string,
	loop = false) {

	if (typeof uris == 'string') uris = [uris];
	let tracks = {
		uris: uris,
		loop: loop,
		index: 0,
		next: function() { this.index = (this.index + 1) % this.uris.length },
		select: function() { return this.uris[this.index] }
	}
	audioElement.src = tracks.select();
	audioElement.play();
	callback(uris[tracks.index]);
	audioElement.addEventListener('ended', (e: Event) => {
		tracks.next();
		audioElement.src = tracks.select();
		if (tracks.index != 0 || tracks.loop) {
			audioElement.load();
			audioElement.play();
			callback(uris[tracks.index]);
		}
	});
}

// export async function AudioDuration(uri: string) {
// 	let duration = 0;
// 	const audioElement = new Audio(uri); // need to decode? decodeURI(uri)
// 	audioElement.addEventListener('loadedmetadata', () => {

// 	});
// 	audioElement.load();
	
// 	duration = audioElement.duration;
// 	return duration;
// }

/**
 * Given an HTMLAudioElement and a list of audio file path names, load and
 * play each of the audio files in succession. When the optional "loop"
 * parameter is set to 'true', all tracks will be repeated continuously.
 */
export function PlayAudioTracks(audioElement: HTMLAudioElement, uris: string[], loop: boolean = false) {
	let tracks = {
		uris: uris,
		index: 0,
		next: function() { this.index = (this.index + 1) % this.uris.length },
		select: function() { return this.uris[this.index] }
	}
	audioElement.src = tracks.select();
	audioElement.addEventListener('ended', (e: Event) => {
		tracks.next();
		audioElement.src = tracks.select();
		if (tracks.index != 0 || loop) {
			audioElement.load();
			audioElement.play();
		}
	});
}
