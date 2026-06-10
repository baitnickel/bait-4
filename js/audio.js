import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { Markup } from './lib/markup.js';
import * as Media from './lib/media.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const WriteServerLog = PAGE.parameters.has('log');
let Start = Number(PAGE.parameters.get('start'));
if (isNaN(Start) || Start < 0)
    Start = 0;
// we need to write path/folder/track.file and index number into a log file
// and support restarting from that index
const MediaFolders = '../media/audio';
const PlaylistFolders = ['test-piano', 'test-strings', 'test-harp', 'wake'];
const Playlists = [];
for (const playlistFolder of PlaylistFolders) {
    const indexFile = `${MediaFolders}/${playlistFolder}/_index.json`;
    const playlist = await Fetch.json(indexFile);
    Playlists.push(playlist);
}
let PlaylistTracks = Media.PlaylistTracks(Playlists);
const TotalTracks = PlaylistTracks.length;
PlaylistTracks = PlaylistTracks.slice(Start);
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
const MainAudioElement = document.createElement('audio');
MainAudioElement.controls = true;
ControlsBlock.append(MainAudioElement);
let CurrentFolder = '';
let CurrentPlaylistTrack = 0;
let PlaylistOffset = 0;
let SequencedTracks = [];
export function render() {
    PAGE.setTitle('Playlist Console');
    PAGE.content.append(PlaylistInfo);
    PAGE.content.append(ControlsBlock);
    PAGE.content.append(GridContainer);
    GridContainer.append(TrackList);
    GridContainer.append(TrackInfo);
    if (Start >= TotalTracks)
        log(`"start=${Start}" exceeds highest track number (${TotalTracks - 1})`, true);
    else
        Media.RunPlaylists(MediaFolders, PlaylistTracks, MainAudioElement);
}
document.addEventListener(Media.PlaylistLoaded, () => {
    const skipping = (Start > 0) ? ` (starting with track ${Start})` : '';
    log(`playlist loaded ${PlaylistTracks.length} tracks${skipping}`);
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
        log(`track: [${CurrentPlaylistTrack + Start}] ${playlist.folder}/${track.file}`);
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
        PlaylistInfo.innerHTML = `<h2>${playlist.title}</h2>`;
        PlaylistInfo.innerHTML += `<p>${playlist.notes}</p>`;
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
            let noteLines = [];
            noteLines.push(`### ${tracks[i].title}`);
            let composers = PAGE.oxfordJoin(tracks[i].composers);
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
function log(message, error = false) {
    if (error)
        console.error(message);
    else
        console.log(message);
    if (WriteServerLog) {
        const logEntry = { text: message };
        Fetch.api(`${PAGE.backend}/log/`, logEntry)
            .then((response) => { if (response && response.text)
            console.log(response); });
    }
}
