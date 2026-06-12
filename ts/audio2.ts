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

type Options = { playlists: string[], start: number, log: boolean };

const Selection = getQuerySelection();
// const dialog = createModalDialog(selection);
// dialog.element.showModal();

// const WriteServerLog = PAGE.parameters.has('log');
// let Start = Number(PAGE.parameters.get('start'));
// if (isNaN(Start) || Start < 0) Start = 0;
// let PlaylistFolders = ['test-piano', 'test-strings', 'test-harp'];
// const Folders = PAGE.parameters.get('folders');
// if (Folders) {
// 	PlaylistFolders = [];
// 	for (let folder of Folders.split(',')) {
// 		folder = folder.trim();
// 		PlaylistFolders.push(folder);
// 	}
// }

// we need to write path/folder/track.file and index number into a log file
// and support restarting from that index

const MediaFolders = '../media/audio';
// const PlaylistFolders = ['test-piano', 'test-strings', 'test-harp'];
const Playlists: Media.Playlist[] = [];

for (const playlistFolder of Selection.playlists) {
	const indexFile = `${MediaFolders}/${playlistFolder}/_index.json`;
	const playlist = await Fetch.json<Media.Playlist>(indexFile);
	Playlists.push(playlist);
}
const PlaylistTracks = Media.PlaylistTracks(Playlists);
// let PlaylistTracks = Media.PlaylistTracks(Playlists);
// const TotalTracks = PlaylistTracks.length;
// PlaylistTracks = PlaylistTracks.slice(Start);
const PlaylistMap = Media.PlaylistMap(Playlists);
const TrackMap = Media.TrackMap(Playlists);

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
const MainAudioElement = document.createElement('audio');
MainAudioElement.controls = true;
ControlsBlock.append(MainAudioElement);

let CurrentFolder = '';
let CurrentPlaylistTrack = Selection.start;
let PlaylistOffset = 0;
let SequencedTracks: Media.Track[] = [];

export function render() {
	PAGE.setTitle('Playlist Console');
	const Selection = getQuerySelection();
	const dialog = createModalDialog(Selection);
	document.body.append(dialog.element);
	dialog.element.showModal();

	PAGE.content.append(PlaylistInfo);
	PAGE.content.append(ControlsBlock);
	PAGE.content.append(GridContainer);
	GridContainer.append(TrackList);
	GridContainer.append(TrackInfo);

	// if (selection.start >= PlaylistTracks.length) log(`"start=${selection.start}" exceeds highest track number (${PlaylistTracks.length - 1})`, true);
	// else Media.RunPlaylists(MediaFolders, PlaylistTracks, MainAudioElement, selection.start);
}

document.addEventListener(Media.PlaylistLoaded, () => {
	const startingAt = (Selection.start > 0) ? ` (starting with track ${Selection.start})` : '';
	log(`playlist loaded ${PlaylistTracks.length} tracks${startingAt}`);
});

document.addEventListener(Media.TrackPlaying, () => {
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
		// log(`track: [${CurrentPlaylistTrack + Start}] ${playlist.folder}/${track.file}`)
		log(`track: [${CurrentPlaylistTrack}] ${playlist.folder}/${track.file}`)
		CurrentFolder = playlist.folder;
	}
	CurrentPlaylistTrack += 1;
});

document.addEventListener(Media.PlaylistEnded, () => {
	PlaylistInfo.innerHTML = '';
	TrackList.innerHTML = '';
	TrackInfo.innerHTML = '';
	CurrentPlaylistTrack = 1; // clicking the play button again will not report track 0 
	log(`playlist ended`);
});

function refreshInfo(playlist: Media.Playlist, tracks: Media.Track[], newPlaylist: boolean, currentTrack: number, offset: number) {
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

function getQuerySelection() {
	const testPlaylists = ['test-piano', 'test-strings', 'test-harp'];
	const selection: Options = { playlists: testPlaylists, start: 0, log: false };
	selection.log = PAGE.parameters.has('log');
	selection.start = Number(PAGE.parameters.get('start'));
	if (isNaN(selection.start) || selection.start < 0) selection.start = 0;
	const folders = PAGE.parameters.get('folders');
	if (folders) {
		selection.playlists = [];
		for (let folder of folders.split(',')) {
			folder = folder.trim();
			selection.playlists.push(folder);
		}
	}
	return selection;
}

function createModalDialog(selection: Options) {
	const dialog = new W.Dialog('Playlist Options');
	const folders = dialog.addText('Folders:', selection.playlists.join(','));
	const start = dialog.addText('Offset:', '0');
	const log = dialog.addCheckbox('Update Log:', false);

	dialog.cancelButton.addEventListener('click', () => {
		window.history.back();
	});
	dialog.confirmButton.addEventListener('click', () => {
		if (folders) {
			selection.playlists = [];
			for (let folder of folders.value.split(',')) {
				folder = folder.trim();
				selection.playlists.push(folder);
			}
		}
		selection.start = Number(start.value);
		if (isNaN(selection.start) || selection.start < 0) selection.start = 0;
		selection.log = log.checked;
		// runCarousel(selection, dialog);
	});
	return dialog;
}

function log(message: string, error = false) {
	if (error) console.error(message);
	else console.log(message);

	if (Selection.log) {
		const logEntry: T.LogEntry = { text: message };
		Fetch.api<T.LogEntry>(`${PAGE.backend}/log/`, logEntry)
			.then((response) => { if (response && response.text) console.log(response) }
		);
	}
}
