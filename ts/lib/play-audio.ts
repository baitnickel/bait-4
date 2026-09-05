type Callback = (uri: string) => string;

/**
 * Given an HTMLAudioElement and a single audio file URI (path name), load the
 * audio file. When the optional `play` argument is true, the audio file is
 * played immediately, otherwise the user must press the play button on the
 * audio control. When the optional `callback` function is provided (a function
 * taking a single (uri: string) argument), the function will be called when the
 * URI is played.
 */
export function Play(
	audio: HTMLAudioElement,
	uri: string,
	play = false,
	callback: Callback|null = null)
{
	audio.src = uri;
	audio.load();
	if (play) audio.play();
	if (callback !== null) callback(uri);
}

/**
 * Given an HTMLAudioElement and an audio file URI or an array of URIs (path
 * names), load and play each of the audio files in succession. When the
 * optional "loop" parameter is set to 'true', the complete array of audio files
 * will be repeated continuously.
 * 
 * When the optional `callback` function is provided (a function taking a single
 * (uri: string) argument), the function will be called as each URI is played.
 */
export function PlayList(
	audio: HTMLAudioElement,
	uris: string|string[],
	callback: Callback|null = null, // (uri: string) => string,
	loop = false) {

	if (typeof uris == 'string') uris = [uris];
	const tracks = {
		uris: uris,
		index: 0,
		next: function() { this.index = (this.index + 1) % this.uris.length },
		select: function() { return this.uris[this.index] },
		play: function() {
			audio.src = tracks.select();
			audio.load();
			audio.play();
			if (callback !== null) callback(uris[tracks.index]);
		}
	}
	tracks.play();
	audio.addEventListener('ended', () => {
		tracks.next();
		if (tracks.index != 0 || loop) tracks.play();
	});
}

/**
 * Given the `uri` of an audio file, return a Promise to be resolved as a fully
 * loaded Audio element. Waiting for the full load ensures that the file's
 * metadata is available.
 */
export function LoadAudioData(uri: string) {
	return new Promise<HTMLAudioElement>((resolve, reject) => {
		const audio = new Audio();
		audio.src = uri;
		audio.onloadeddata = () => resolve(audio);
		audio.onerror = () => reject(`Error loading audio: ${uri}`); // caller handles implicit string
		// audio.onerror = () => reject(new Error(`Error loading audio: ${uri}`)); // not well-handled by caller
	});
}

/**
 * Given a number of seconds, return a formatted time string ('HH:MM:SS').
 * Return an empty string if seconds is a negative number.
 */
export function FormatTime(seconds: number) {
	let formattedTime = '';
	seconds = Math.round(seconds);
	if (seconds > 0) {
		const hours = Math.floor(seconds/3600)
		seconds -= (hours * 3600);
		const minutes = Math.floor(seconds/60);
		seconds -= (minutes * 60)
		formattedTime = (hours) ? `${hours}:` + `${minutes}`.padStart(2, '0') : `${minutes}`;
		formattedTime += ':' + `${seconds}`.padStart(2, '0');
	}
	return formattedTime;
}
