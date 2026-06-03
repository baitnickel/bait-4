import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { Markup, MarkupLine } from './lib/markup.js';
import * as Media from './lib/media.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}

// we need to write path/folder/track.file and index number into a log file
// and support restarting from that index

// if processing multiple playlists, we must merge them all into one
const MediaFolders = '../media/audio';
const PlaylistFolders = ['test'];
const Playlists: Media.Playlist[] = [];
for (const playlistFolder of PlaylistFolders) {
	const indexFile = `${MediaFolders}/${playlistFolder}/_index.json`;
	const playlist = await Fetch.json<Media.Playlist>(indexFile);
	Playlists.push(playlist);
}

const ControlsBlock = document.createElement('div');
ControlsBlock.id = 'controls-block';
let MainAudioElement = document.createElement('audio');
MainAudioElement.controls = true;
ControlsBlock.append(MainAudioElement);

let CurrentPlaylist = 0;
let CurrentTrack = 0;

export function render() {
	PAGE.addHeading('Audio Playlists', 2);
	PAGE.content.append(ControlsBlock);
	runPlaylist(CurrentPlaylist);
	// Media.RunPlaylist(MediaFolders, Playlists[0], MainAudioElement);
}

function runPlaylist(index: number) {
	Media.RunPlaylist(MediaFolders, Playlists[index], MainAudioElement);
}

document.addEventListener(Media.PlaylistLoaded, () => {
	console.log(`playlist loaded: ${Playlists[CurrentPlaylist].folder}`);
});

document.addEventListener(Media.TrackPlaying, () => {
	console.log(`track playing: ${Playlists[CurrentPlaylist].sequence[CurrentTrack]}`);
	CurrentTrack += 1;
});

// document.addEventListener(Media.TrackEnded, () => {
// 	// console.log(`track ended: ${Playlists[CurrentPlaylist].sequence[CurrentTrack]}`);
// 	CurrentTrack += 1;
// });

document.addEventListener(Media.PlaylistEnded, () => {
	console.log(`playlist ended: ${Playlists[CurrentPlaylist].folder}`);
	// won't work right - on each Playlist load, the user must click on the Play button
	// CurrentPlaylist += 1;
	CurrentTrack = 0;
	// if (CurrentPlaylist < Playlists.length) runPlaylist(CurrentPlaylist);
});
