import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
// import { Markup, MarkupLine } from './lib/markup.js';
import * as Media from './lib/media.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}

// we need to write path/folder/track.file and index number into a log file
// and support restarting from that index

const MediaFolders = '../media/audio';
const PlaylistFolders = ['test-piano', 'test-strings', 'test-harp'];
const Playlists: Media.Playlist[] = [];

for (const playlistFolder of PlaylistFolders) {
	const indexFile = `${MediaFolders}/${playlistFolder}/_index.json`;
	const playlist = await Fetch.json<Media.Playlist>(indexFile);
	Playlists.push(playlist);
}
const PlaylistTracks = Media.PlaylistTracks(Playlists);
const PlaylistMap = Media.PlaylistMap(Playlists);
const TrackMap = Media.TrackMap(Playlists);

const NowPlaying = document.createElement('div');
const ControlsBlock = document.createElement('div');
ControlsBlock.id = 'controls-block';
let MainAudioElement = document.createElement('audio');
MainAudioElement.controls = true;
ControlsBlock.append(MainAudioElement);

let CurrentPlaylistTrack = 0;

export function render() {
	PAGE.addHeading('Playlist Console', 2);
	PAGE.content.append(NowPlaying);
	PAGE.content.append(ControlsBlock);
	Media.RunPlaylists(MediaFolders, PlaylistTracks, MainAudioElement);
}

document.addEventListener(Media.PlaylistLoaded, () => {
	log(`playlist loaded (${PlaylistTracks.length} tracks)`);
});

document.addEventListener(Media.TrackPlaying, () => {
	const folderKey = PlaylistTracks[CurrentPlaylistTrack].folder.toLowerCase();
	const fileKey = PlaylistTracks[CurrentPlaylistTrack].file.toLowerCase();
	const trackKey = Media.TrackMapKey(folderKey, fileKey); // = { folder: folderKey, file: fileKey };
	const playlist = PlaylistMap.get(folderKey);
	const track = TrackMap.get(trackKey);
	if (!playlist) log(`unresolved folder: ${folderKey}`, true);
	if (!track) log(`unresolved file: ${trackKey}`, true);
	if (playlist && track) {
		const folder = playlist.folder;
		const file = track.file;
		const playlistTitle = playlist.title;
		const trackTitle = track.title;
		NowPlaying.innerHTML = `<h4>${playlistTitle}:<br>${trackTitle}</h4>`;
		log(`track: [${CurrentPlaylistTrack}] ${folder}/${file}`)
	}
	CurrentPlaylistTrack += 1;
});

document.addEventListener(Media.PlaylistEnded, () => {
	NowPlaying.innerHTML = '';
	CurrentPlaylistTrack = 1; // clicking the play button again will not report track 0 
	log(`playlist ended`);
});

function log(message: string, error = false) {
	if (error) console.error(message);
	else console.log(message);
	const logEntry: T.LogEntry = { text: message };
	Fetch.api<T.LogEntry>(`${PAGE.backend}/log/`, logEntry)
		.then((response) => {
			// if (error) console.error(message);
			// else console.log(message);
			// console.log(response)
		}
	);
}
