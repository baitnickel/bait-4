import * as T from './types.js';

/**
 * Utilities for handling audio and video media.
 */

/** define events */
export const PlaylistLoaded = 'bait:playlist-started';
export const TrackPlaying = 'bait:track-started';
export const PlaylistEnded = 'bait:playlist-ended';

/** define types for the JSON data */
export type Track = {
	file: string;
	title: string;
	performers: string[];
	composers: string[];
	date: string;
	notes: string;
};
export type Playlist = {
	folder: string,
	title: string,
	image: string,
	notes: string,
	sequence: string[],
	tracks: Track[],
};

/** a flattened object, merged Playlists */
export type PlaylistTrack = {
	folder: string,
	file: string, /** file names (URLs) cannot contain the hash (#) character! */
};

/**
 * Given an array of Playlist Objects (which may be an array with a single
 * Playlist object), return an array of PlaylistTracks, flattened Tracks that
 * can be combined and played in sequence.
 */
export function PlaylistTracks(playlists: Playlist[]) {
	const playlistTracks: PlaylistTrack[] = [];
	for (const playlist of playlists) {
		for (const sequencedTrack of playlist.sequence) {
			const playlistTrack = { folder: playlist.folder.toLowerCase(), file: sequencedTrack.toLowerCase() };
			playlistTracks.push(playlistTrack);
		}
	}
	return playlistTracks;
};

/**
 * Given a `folder` and a `file`, concatenate these two strings, separated by a
 * forward slash, to be used as a Map key in the TrackMap.
 */
export function TrackMapKey(folder: string, file: string) {
	/**
	 * Note: we initially tried to use a PlaylistTrack object as the TrackMap
	 * key, but found that it was error-prone when trying to do map.get(key).
	 */
	return `${folder.toLowerCase()}/${file.toLowerCase()}`;
}

/**
 * Playlist.sequence contains an array of audio file names to be played, whereas
 * Playlist.tracks contains an array of Track objects holding information about
 * the tracks. Not every sequenced file has a corresponding Track object. Here,
 * we will create a pseudo Track object for each file that is not included in
 * Playlist.tracks, to ensure that every sequenced track has at least a minimal
 * Track object.
 */
export function SequencedTracks(playlist: Playlist) {
	const sequencedTracks: Track[] = [];
	const tracksMap = new Map<string, Track>();
	for (const track of playlist.tracks) {
		const trackKey = track.file.toLowerCase();
		tracksMap.set(trackKey, track);
	}
	for (const sequencedTrack of playlist.sequence) {
		const file = sequencedTrack.toLowerCase();
		let track = tracksMap.get(file);
		if (!track) track = { file: file, title: '', performers: [], composers: [], date: '', notes: '' };
		if (!track.title) track.title = fileTitle(sequencedTrack);
		sequencedTracks.push(track);
	}
	return sequencedTracks;
}

/**
 * Given a `fileName`, derive and return a Track.title.
 */
function fileTitle(fileName: string) {
	let fileTitle = fileName;
	fileTitle = fileName.slice(0, fileName.lastIndexOf('.')); // remove file extension
	return fileTitle;
}

/**
 * Given an array of `playlists`, return a map of Playlist objects keyed by
 * lowercase folder.
 */
export function PlaylistMap(playlists: Playlist[]) {
	const map = new Map<string, Playlist>();
	for (const playlist of playlists) {
		const key = playlist.folder.toLowerCase();
		map.set(key, playlist);
	}
	return map;
}

/**
 * Given an array of `playlists`, return a map of sequenced Track objects keyed
 * by TrackMapKey.
 */
export function TrackMap(playlists: Playlist[]) {
	const map = new Map<string, Track>();
	for (const playlist of playlists) {
		const folder = playlist.folder.toLowerCase();
		const tracks = SequencedTracks(playlist);
		for (const track of tracks) {
			const key = TrackMapKey(folder, track.file);
			map.set(key, track);
		}
	}
	return map;
}

/**
 * Given an `audioElement`, a `path` under which Playlist folders can be found,
 * and an array of `playlistTracks` (one or more Playlist objects), load and
 * play each of the audio files in sequence.
 * 
 * By default, the playlist starts with track 0, but a different starting track
 * may be selected by setting the `start` parameter to a different valid number.
 * When the optional `loop` parameter is set to 'true', the entire playlist will
 * be repeated endlessly (or until the user refreshes their page).
 */
export function RunPlaylists(
	audioElement: HTMLAudioElement,
	path: string,
	playlistTracks: PlaylistTrack[],
	start = 0,
	loop = false
) {
	const playlistLoaded = new Event(PlaylistLoaded);
	const trackPlaying = new Event(TrackPlaying);
	const playlistEnded = new Event(PlaylistEnded);

	let tracks = {
		index: (start >= 0 && start < playlistTracks.length) ? start : 0,
		next: function() { this.index = (this.index + 1) % playlistTracks.length },
		select: function() {
			const folder = playlistTracks[this.index].folder;
			const file = playlistTracks[this.index].file;
			return `${path}/${folder}/${file}`;
		}
	}
	audioElement.src = tracks.select();
	document.dispatchEvent(playlistLoaded);
	document.dispatchEvent(trackPlaying);

	audioElement.addEventListener('ended', (e: Event) => {
		tracks.next();
		audioElement.src = tracks.select();
		if (tracks.index != 0 || loop) {
			audioElement.load();
			audioElement.play();
			document.dispatchEvent(trackPlaying);
		}
		else document.dispatchEvent(playlistEnded);
	});
}


/**********************************************************************************************
 * The code below is deprecated--the `RunPlaylists` function above should be used instead.
***********************************************************************************************/

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

/**
 * Given a `playlist` containing a sequenced list of audio files and an
 * HTMLAudioElement, load and play each of the audio files in succession. When
 * the optional "loop" parameter is set to 'true', the entire playlist will be
 * repeated continuously.
 */
// export function RunPlaylist(path: string, playlist: Playlist, audioElement: HTMLAudioElement, loop = false) {
// 	const playlistLoaded = new Event(PlaylistLoaded);
// 	const trackPlaying = new Event(TrackPlaying);
// 	const playlistEnded = new Event(PlaylistEnded);

// 	let tracks = {
// 		uris: playlist.sequence,
// 		index: 0,
// 		next: function() { this.index = (this.index + 1) % this.uris.length },
// 		select: function() { return `${path}/${playlist.folder}/${this.uris[this.index]}` }
// 	}
// 	audioElement.src = tracks.select();
// 	// audioElement.load();
// 	document.dispatchEvent(playlistLoaded);

// 	audioElement.addEventListener('playing', () => {
// 		document.dispatchEvent(trackPlaying);
// 	})

// 	audioElement.addEventListener('ended', (e: Event) => {
// 		tracks.next();
// 		audioElement.src = tracks.select();
// 		if (tracks.index != 0 || loop) {
// 			audioElement.load();
// 			audioElement.play();
// 		}
// 		else document.dispatchEvent(playlistEnded);
// 	});
// }


// function testAudio(testOutput: HTMLDivElement) {
// 	let audioElement = new Audio();
// 	const folder = '../media/audio/test';
// 	const urls = [`${folder}/F.m4a`, `${folder}/Bb.m4a`, `${folder}/C.m4a`, `${folder}/F.m4a`];
// 	PlayAudio(audioElement, urls);
// }
// export function PlayAudio1(
// 	audioElement: HTMLAudioElement,
// 	uris: string|string[],
// 	callback: (uri: string) => string,
// 	loop = false) {

// 	if (typeof uris == 'string') uris = [uris];
// 	let tracks = {
// 		uris: uris,
// 		loop: loop,
// 		index: 0,
// 		next: function() { this.index = (this.index + 1) % this.uris.length },
// 		select: function() { return this.uris[this.index] }
// 	}
// 	audioElement.src = tracks.select();
// 	audioElement.play();
// 	callback(uris[tracks.index]);
// 	audioElement.addEventListener('ended', (e: Event) => {
// 		tracks.next();
// 		audioElement.src = tracks.select();
// 		if (tracks.index != 0 || tracks.loop) {
// 			audioElement.load();
// 			audioElement.play();
// 			callback(uris[tracks.index]);
// 		}
// 	});
// }

// export async function AudioDuration(uri: string) {
// 	let duration = 0;
// 	const audioElement = new Audio(uri); // need to decode? decodeURI(uri)
// 	audioElement.addEventListener('loadedmetadata', () => {

// 	});
// 	audioElement.load();
	
// 	duration = audioElement.duration;
// 	return duration;
// }

