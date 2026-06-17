import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import { Markup, MarkupLine } from './lib/markup.js';
import * as Media from './lib/media.js';
import * as W from './lib/widgets.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}
console.log('v26.06.17.16.18');

// If a folder that does not contain an index file is selected, we
// might generate one with an empty Tracks array and a sequence array that
// simply lists the audio file names.

type Options = { playlist: string, start: number, log: boolean };
const AudioMediaRoot = '../media/audio';
const IndexFile = '_index.json';

let Selection: Options = { playlist: '', start: 0, log: false };
let Dialog: W.Dialog;
let Playlist: Media.Playlist;
let PlaylistTracks: Media.PlaylistTrack[];
let PlaylistMap: Map<string, Media.Playlist>;
let TrackMap: Map<string, Media.Track>;

/**
 * Call API to retrieve all the folders in AudioMediaRoot that contain an
 * "_index.json" file.
 */ 
const apiResult = await Fetch.api<string[]>(`${PAGE.backend}/media/audio/playlists`);
const EligiblePlaylists = (apiResult !== null) ? apiResult : [];
console.log(EligiblePlaylists);

/**
 * Given a playlist directory name (name only, not path) fetch its IndexFile and
 * create and return a Media.Playlist object.
 */
async function getPlaylist(folderName: string) {
	const indexFile = `${AudioMediaRoot}/${folderName}/${IndexFile}`;
	const playlist = await Fetch.json<Media.Playlist>(indexFile);
	return playlist;
}

/** define document containers */
const PlaylistInfo = document.createElement('div');
const ControlsBlock = document.createElement('div');
ControlsBlock.id = 'controls-block';
const GridContainer = document.createElement('div');
GridContainer.classList.add('grid-auto2');

const TrackList = document.createElement('div');
const TrackInfo = document.createElement('div');
TrackList.classList.add('framed');
TrackInfo.classList.add('framed');
const AudioElement = document.createElement('audio');
AudioElement.controls = true;
ControlsBlock.append(AudioElement);

/** global variables for controlling the process of playing the audio files */
let CurrentFolder = '';
let CurrentPlaylistTrack = 0;
let PlaylistOffset = 0;
let SequencedTracks: Media.Track[] = [];

export function render() {
	PAGE.setTitle('Audio Playlist Console');
	Dialog = createModalDialog();
	document.body.append(Dialog.element);
	Dialog.element.showModal();
}

document.addEventListener(Media.PlaylistLoaded, () => {
	console.log(`Event: PlaylistLoaded`);
	CurrentFolder = '';
	CurrentPlaylistTrack = 0;
	PlaylistOffset = 0;
	SequencedTracks = [];
	const startingAt = (Selection.start > 0) ? `, starting with track ${Selection.start}` : '';
	const plural = (PlaylistTracks.length != 1) ? 's' : '';
	log(`PlaylistLoaded (${PlaylistTracks.length} track${plural}${startingAt})`);
});

document.addEventListener(Media.TrackPlaying, () => {
	console.log(`Event: TrackPlaying`);
	const folderKey = PlaylistTracks[CurrentPlaylistTrack].folder.toLowerCase();
	const fileKey = PlaylistTracks[CurrentPlaylistTrack].file.toLowerCase();
	const trackKey = Media.TrackMapKey(folderKey, fileKey);
	const playlist = PlaylistMap.get(folderKey);
	const track = TrackMap.get(trackKey);
	if (!playlist) log(`unresolved folder: ${folderKey}`, true);
	if (!track) log(`unresolved file: ${trackKey}`, true);
	if (playlist && track) {
		const newPlaylist = playlist.folder != CurrentFolder;
		if (newPlaylist) {
			PlaylistOffset = CurrentPlaylistTrack;
			SequencedTracks = Media.SequencedTracks(playlist);
		}
		refreshInfo(playlist, SequencedTracks, newPlaylist, CurrentPlaylistTrack, PlaylistOffset);
		log(`TrackPlaying: [${CurrentPlaylistTrack}] ${playlist.folder}/${track.file}`)
		CurrentFolder = playlist.folder;
	}
	CurrentPlaylistTrack += 1;
});

document.addEventListener(Media.PlaylistEnded, () => {
	console.log(`Event: PlaylistEnded`);
	console.log('--------------------');
	CurrentFolder = '';
	CurrentPlaylistTrack = 0;
	PlaylistOffset = 0;
	SequencedTracks = [];
	PAGE.content.innerHTML = '<h2>Refresh Page (⌘R) to select another playlist</h2>';
	// Dialog.element.showModal();
});

function createModalDialog() {
	const dialog = new W.Dialog('Options');
	const playlist = dialog.addSelect('Playlist:', EligiblePlaylists);
	const start = dialog.addText('Offset:', '0');
	const log = dialog.addCheckbox('Update Log:', false);

	dialog.cancelButton.addEventListener('click', () => {
		window.history.back();
	});
	dialog.confirmButton.addEventListener('click', async () => {
		console.log(`Event: ConfirmButton`);
		Selection.playlist = playlist.value;
		Selection.start = Number(start.value);
		if (isNaN(Selection.start) || Selection.start < 0) Selection.start = 0;
		Selection.log = log.checked;
		Playlist = await getPlaylist(Selection.playlist);
		PlaylistTracks = Media.PlaylistTracks([Playlist]);
		PlaylistMap = Media.PlaylistMap([Playlist]);
		TrackMap = Media.TrackMap([Playlist]);

		PAGE.content.append(PlaylistInfo);
		PAGE.content.append(ControlsBlock);
		PAGE.content.append(GridContainer);
		GridContainer.append(TrackList);
		GridContainer.append(TrackInfo);

		console.log(CurrentPlaylistTrack);
		Media.RunPlaylists(AudioElement, AudioMediaRoot, PlaylistTracks, Selection.start);
	});
	return dialog;
}

/**
 * Refresh the playlist information, track listing, and track information
 * panels.
 */
function refreshInfo(
	playlist: Media.Playlist,
	tracks: Media.Track[],
	newPlaylist: boolean,
	currentTrack: number,
	offset: number
) {
	/** set PlaylistInfo */
	if (newPlaylist) {
		const noteLines: string[] = [];
		noteLines.push(`## ${playlist.title}`);
		noteLines.push(`${playlist.notes}`);
		PlaylistInfo.innerHTML = Markup(noteLines.join('\n'));
	}
	/** set TrackList and TrackInfo */
	TrackList.innerHTML = '';
	TrackInfo.innerHTML = '';
	const list = document.createElement('ol');
	for (let i = 0; i < tracks.length; i += 1) {
		const item = document.createElement('li');
		item.innerText = tracks[i].title;
		if (currentTrack - offset - i == 0) {
			item.classList.add('blue');
			const noteLines: string [] = [];
			noteLines.push(`### ${tracks[i].title}`);
			const composers = PAGE.oxfordJoin(tracks[i].composers);
			if (composers) noteLines.push(`Written by: ${composers}`);
			if (tracks[i].date) noteLines.push(`Recorded: ${tracks[i].date}`);
			noteLines.push('\n'); /** blank line between title/composers and 'track.notes' */
			noteLines.push(tracks[i].notes);
			TrackInfo.innerHTML = Markup(noteLines.join('\n'));
		}
		list.append(item);
	}
	TrackList.append(list);
}

/**
 * Given a text `message`, write it to the console, treating it as an error if
 * `error` is true. When `Selection.log` is true (checked in the options
 * Dialog), copy the message to the server log file via an API call.
 */
function log(message: string, error = false) {
	if (error) console.error(message);
	else console.log(message);
	/** when requested via "Update Log" checkbox, write message to server log */
	if (Selection.log) {
		const logEntry: T.LogEntry = { text: message };
		Fetch.api<T.LogEntry>(`${PAGE.backend}/log/`, logEntry)
			.then((response) => { if (response && response.text) console.log(response) }
		);
	}
}
