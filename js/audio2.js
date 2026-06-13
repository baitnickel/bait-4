import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { Markup } from './lib/markup.js';
import * as Media from './lib/media.js';
import * as W from './lib/widgets.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const MediaFolders = '../media/audio';
let Selection = { playlists: [], start: 0, log: false };
let Playlists;
let PlaylistTracks;
let PlaylistMap; // = Media.PlaylistMap(Playlists);
let TrackMap; // = Media.TrackMap(Playlists);
// const Selection = getQuerySelection();
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
// const PlaylistFolders = ['test-piano', 'test-strings', 'test-harp'];
// THIS DOESN"T WORK ... async await continues to mystify me
// async function getPlaylists() {
// 	const playlists: Media.Playlist[] = [];
// 	for (const playlistFolder of Selection.playlists) {
// 		const indexFile = `${MediaFolders}/${playlistFolder}/_index.json`;
// 		const playlist = await Fetch.json<Media.Playlist>(indexFile);
// 		playlists.push(playlist);
// 	}
// 	return playlists;
// }
async function getPlaylist(indexFile) {
    const playlist = await Fetch.json(indexFile);
    return playlist;
}
async function getPlaylists(selection) {
    const playlists = [];
    for (const playlistFolder of selection.playlists) {
        const indexFile = `${MediaFolders}/${playlistFolder}/_index.json`;
        const playlist = await getPlaylist(indexFile);
        playlists.push(playlist);
    }
    return playlists;
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
const MainAudioElement = document.createElement('audio');
MainAudioElement.controls = true;
ControlsBlock.append(MainAudioElement);
let CurrentFolder = '';
let CurrentPlaylistTrack = 0; // Selection.start;
let PlaylistOffset = 0;
let SequencedTracks = [];
export function render() {
    PAGE.setTitle('Playlist Console');
    setQuerySelection();
    const dialog = createModalDialog();
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
    if (!playlist)
        log(`unresolved folder: ${folderKey}`, true);
    if (!track)
        log(`unresolved file: ${trackKey}`, true);
    if (playlist && track) {
        const newPlaylist = playlist.folder != CurrentFolder;
        if (newPlaylist) {
            PlaylistOffset = CurrentPlaylistTrack;
            SequencedTracks = Media.SequencedTracks(playlist);
        }
        refreshInfo(playlist, SequencedTracks, newPlaylist, CurrentPlaylistTrack, PlaylistOffset);
        // log(`track: [${CurrentPlaylistTrack + Start}] ${playlist.folder}/${track.file}`)
        log(`track: [${CurrentPlaylistTrack}] ${playlist.folder}/${track.file}`);
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
function refreshInfo(playlist, tracks, newPlaylist, currentTrack, offset) {
    /** set PlaylistInfo */
    if (newPlaylist) {
        const noteLines = [];
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
            const noteLines = [];
            noteLines.push(`### ${tracks[i].title}`);
            const composers = PAGE.oxfordJoin(tracks[i].composers);
            if (composers)
                noteLines.push(`Written by: ${composers}`);
            if (tracks[i].date)
                noteLines.push(`Recorded: ${tracks[i].date}`);
            noteLines.push('\n'); /** blank line between title/composers and 'track.notes' */
            noteLines.push(tracks[i].notes);
            TrackInfo.innerHTML = Markup(noteLines.join('\n'));
        }
        list.append(item);
    }
    TrackList.append(list);
}
function setQuerySelection() {
    const testPlaylists = ['test-piano', 'test-strings', 'test-harp'];
    // const selection: Options = { playlists: testPlaylists, start: 0, log: false };
    Selection.playlists = testPlaylists;
    Selection.log = PAGE.parameters.has('log');
    Selection.start = Number(PAGE.parameters.get('start'));
    if (isNaN(Selection.start) || Selection.start < 0)
        Selection.start = 0;
    const folders = PAGE.parameters.get('folders');
    if (folders) {
        Selection.playlists = [];
        for (let folder of folders.split(',')) {
            folder = folder.trim();
            Selection.playlists.push(folder);
        }
    }
}
function createModalDialog() {
    const dialog = new W.Dialog('Playlist Options');
    const folders = dialog.addText('Folders:', Selection.playlists.join(','));
    const start = dialog.addText('Offset:', '0');
    const log = dialog.addCheckbox('Update Log:', false);
    dialog.cancelButton.addEventListener('click', () => {
        window.history.back();
    });
    dialog.confirmButton.addEventListener('click', async () => {
        if (folders) {
            Selection.playlists = [];
            for (let folder of folders.value.split(',')) {
                folder = folder.trim();
                Selection.playlists.push(folder);
            }
        }
        Selection.start = Number(start.value);
        if (isNaN(Selection.start) || Selection.start < 0)
            Selection.start = 0;
        Selection.log = log.checked;
        Playlists = await getPlaylists(Selection);
        PlaylistTracks = Media.PlaylistTracks(Playlists);
        PlaylistMap = Media.PlaylistMap(Playlists);
        TrackMap = Media.TrackMap(Playlists);
        Media.RunPlaylists(MediaFolders, PlaylistTracks, MainAudioElement, Selection.start);
    });
    return dialog;
}
function log(message, error = false) {
    if (error)
        console.error(message);
    else
        console.log(message);
    if (Selection.log) {
        const logEntry = { text: message };
        Fetch.api(`${PAGE.backend}/log/`, logEntry)
            .then((response) => { if (response && response.text)
            console.log(response); });
    }
}
