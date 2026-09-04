/**
 * Given an HTMLAudioElement and a single audio file URI (path name), load the
 * audio file. When the optional `play` argument is true, the audio file is
 * played immediately, otherwise the user must press the play button on the
 * audio control. When the optional `callback` function is provided (a function
 * taking a single (uri: string) argument), the function will be called when the
 * URI is played.
 */
export function Play(audio, uri, play = false, callback = null) {
    audio.src = uri;
    audio.load();
    if (play)
        audio.play();
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
export function PlayList(audio, uris, callback = null, // (uri: string) => string,
loop = false) {
    if (typeof uris == 'string')
        uris = [uris];
    const tracks = {
        uris: uris,
        index: 0,
        next: function () { this.index = (this.index + 1) % this.uris.length; },
        select: function () { return this.uris[this.index]; },
        play: function () {
            audio.src = tracks.select();
            audio.load();
            audio.play();
            if (callback !== null)
                callback(uris[tracks.index]);
        }
    };
    tracks.play();
    audio.addEventListener('ended', () => {
        tracks.next();
        if (tracks.index != 0 || loop)
            tracks.play();
    });
}
/**
 * Given the `uri` of an audio file, return a Promise to be resolved as a fully
 * loaded Audio element. Waiting for the full load ensures that the file's
 * metadata is available.
 */
export function LoadAudioData(uri) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = uri;
        audio.onloadeddata = () => resolve(audio);
        // audio.onerror = () => reject(new Error(`Error loading audio: ${uri}`));
        audio.onerror = () => reject(`Error loading audio: ${uri}`);
    });
}
// export async function MetaData(media: HTMLMediaElement) {
// 	// initialize Promise
// 	// const promise = new Promise<void>(resolve)
// 	// media.addEventListener('loadedmetadata', () => {
// 	// });
// 	// audio.load();
// 	// let duration = 0;
// 	// const audio = new Audio(uri); // need to decode? decodeURI(uri)
// 	// return audio.duration;
// 	// duration = audio.duration;
// 	// return duration;
// }
/**
 * Given a number of seconds, return a formatted time string ('HH:MM:SS').
 * Return an empty string if seconds is a negative number.
 */
export function FormatTime(seconds) {
    let formattedTime = '';
    seconds = Math.round(seconds);
    if (seconds > 0) {
        const hours = Math.floor(seconds / 3600);
        seconds -= (hours * 3600);
        const minutes = Math.floor(seconds / 60);
        seconds -= (minutes * 60);
        formattedTime = (hours) ? `${hours}:` + `${minutes}`.padStart(2, '0') : `${minutes}`;
        formattedTime += ':' + `${seconds}`.padStart(2, '0');
    }
    return formattedTime;
}
/*

https://stackoverflow.com/questions/46399223/async-await-in-image-loading

// Source - https://stackoverflow.com/a/46399452
// Posted by Phil, modified by community. See post 'Timeline' for change history
// Retrieved 2026-09-02, License - CC BY-SA 4.0

addImageProcess(src){
    return new Promise((resolve, reject) => {
    let img = new Image()
    img.onload = () => resolve(img.height)
    img.onerror = reject
    img.src = src
})
}

// Source - https://stackoverflow.com/a/52851789
// Posted by Pinna_be, modified by community. See post 'Timeline' for change history
// Retrieved 2026-09-02, License - CC BY-SA 4.0

interface OnLoadAble {
    onload: any;
}
function onload2promise<T extends OnLoadAble>(obj: T): Promise<T> {
    return new Promise((resolve, reject) => {
        obj.onload = () => resolve(obj);
        obj.onerror = reject;
    });
}

async function addImageProcess(src){
    let img = new Image();
    let imgpromise = onload2promise(img); // see comment of T S why you should do it this way.
    img.src = src;
    await imgpromise;
    return this.height;
}
*/ 
