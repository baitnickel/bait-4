/**
 * Utilities for handling audio and video media.
 */
/** define events */
export const PlaylistLoaded = 'bait:playlist-started';
export const TrackPlaying = 'bait:track-started';
// export const TrackEnded = 'bait:track-ended';
export const PlaylistEnded = 'bait:playlist-ended';
/**
 * Given a Playlist object or an array of Playlist Objects, return an array of
 * PlaylistTracks, flattened Tracks that can be combined and played in sequence.
 */
export function PlaylistTracks(playlists) {
    const playlistTracks = [];
    for (const playlist of playlists) {
        for (const sequencedTrack of playlist.sequence) {
            const track = playlist.tracks.find((element) => element.file == sequencedTrack);
            // if (track) {
            const playlistTrack = {
                folder: playlist.folder,
                file: sequencedTrack, // track.file,
                playlistTitle: playlist.title,
                trackTitle: (track) ? track.title : sequencedTrack,
            };
            playlistTracks.push(playlistTrack);
            // }
        }
    }
    return playlistTracks;
}
;
/**
 * Given a `path` under which Playlist folders can be found, an array of
 * `playlistTracks` (one or more Playlist objects), and an `audioElement`, load
 * and play each of the audio files in sequence. When the optional `loop`
 * parameter is set to 'true', the entire playlist will be repeated endlessly
 * (or until the user refreshes their page).
 */
export function RunPlaylists(path, playlistTracks, audioElement, loop = false) {
    const playlistLoaded = new Event(PlaylistLoaded);
    const trackPlaying = new Event(TrackPlaying);
    const playlistEnded = new Event(PlaylistEnded);
    let tracks = {
        index: 0,
        next: function () { this.index = (this.index + 1) % playlistTracks.length; },
        select: function () {
            const folder = playlistTracks[this.index].folder;
            const file = playlistTracks[this.index].file;
            return `${path}/${folder}/${file}`;
        }
    };
    audioElement.src = tracks.select();
    document.dispatchEvent(playlistLoaded);
    audioElement.addEventListener('playing', () => {
        document.dispatchEvent(trackPlaying);
    });
    audioElement.addEventListener('ended', (e) => {
        tracks.next();
        audioElement.src = tracks.select();
        if (tracks.index != 0 || loop) {
            audioElement.load();
            audioElement.play();
        }
        else
            document.dispatchEvent(playlistEnded);
    });
}
/**
 * Given a `playlist` containing a sequenced list of audio files and an
 * HTMLAudioElement, load and play each of the audio files in succession. When
 * the optional "loop" parameter is set to 'true', the entire playlist will be
 * repeated continuously.
 */
export function RunPlaylist(path, playlist, audioElement, loop = false) {
    const playlistLoaded = new Event(PlaylistLoaded);
    const trackPlaying = new Event(TrackPlaying);
    const playlistEnded = new Event(PlaylistEnded);
    let tracks = {
        uris: playlist.sequence,
        index: 0,
        next: function () { this.index = (this.index + 1) % this.uris.length; },
        select: function () { return `${path}/${playlist.folder}/${this.uris[this.index]}`; }
    };
    audioElement.src = tracks.select();
    // audioElement.load();
    document.dispatchEvent(playlistLoaded);
    audioElement.addEventListener('playing', () => {
        document.dispatchEvent(trackPlaying);
    });
    audioElement.addEventListener('ended', (e) => {
        tracks.next();
        audioElement.src = tracks.select();
        if (tracks.index != 0 || loop) {
            audioElement.load();
            audioElement.play();
        }
        else
            document.dispatchEvent(playlistEnded);
    });
}
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
export function PlayAudio(audioElement, uris, callback, loop = false) {
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
export function PlayAudio1(audioElement, uris, callback, loop = false) {
    if (typeof uris == 'string')
        uris = [uris];
    let tracks = {
        uris: uris,
        loop: loop,
        index: 0,
        next: function () { this.index = (this.index + 1) % this.uris.length; },
        select: function () { return this.uris[this.index]; }
    };
    audioElement.src = tracks.select();
    audioElement.play();
    callback(uris[tracks.index]);
    audioElement.addEventListener('ended', (e) => {
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
export function PlayAudioTracks(audioElement, uris, loop = false) {
    let tracks = {
        uris: uris,
        index: 0,
        next: function () { this.index = (this.index + 1) % this.uris.length; },
        select: function () { return this.uris[this.index]; }
    };
    audioElement.src = tracks.select();
    audioElement.addEventListener('ended', (e) => {
        tracks.next();
        audioElement.src = tracks.select();
        if (tracks.index != 0 || loop) {
            audioElement.load();
            audioElement.play();
        }
    });
}
