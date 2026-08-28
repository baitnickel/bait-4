/**
 * Given an HTMLAudioElement and a single audio file URI (path name), load the
 * audio file. When the optional `play` argument is true, the audio file is
 * played immediately, otherwise the user must press the play button on the
 * audio control. When the optional `callback` function is provided (a function
 * taking a single (uri: string) argument), the function will be called when the
 * URI is played.
 */
export function Play(audioElement, uri, play = false, callback = null) {
    audioElement.src = uri;
    audioElement.load();
    if (play)
        audioElement.play();
    if (callback !== null)
        callback(uri);
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
export function PlayList(audioElement, uris, callback = null, // (uri: string) => string,
loop = false) {
    if (typeof uris == 'string')
        uris = [uris];
    const tracks = {
        uris: uris,
        index: 0,
        next: function () { this.index = (this.index + 1) % this.uris.length; },
        select: function () { return this.uris[this.index]; },
        play: function () {
            audioElement.src = tracks.select();
            audioElement.load();
            audioElement.play();
            if (callback !== null)
                callback(uris[tracks.index]);
        }
    };
    tracks.play();
    audioElement.addEventListener('ended', () => {
        tracks.next();
        if (tracks.index != 0 || loop)
            tracks.play();
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
