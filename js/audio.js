import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
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
const PlaylistFolders = ['test-piano', 'test-strings', 'test-harp', 'wake'];
const Playlists = [];
for (const playlistFolder of PlaylistFolders) {
    const indexFile = `${MediaFolders}/${playlistFolder}/_index.json`;
    const playlist = await Fetch.json(indexFile);
    Playlists.push(playlist);
}
const PlaylistTracks = Media.PlaylistTracks(Playlists);
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
    console.log(`playlist loaded (${PlaylistTracks.length} tracks)`);
});
// The TrackPlaying event is dispatched when a track begins playing, but also
// when a track is paused and restarted, or when its progress bar is moved. This
// is a problem. Maybe TrackEnded is a better indication (but we'd have to treat
// the first track in the playlist as an exception).
document.addEventListener(Media.TrackPlaying, () => {
    const folder = PlaylistTracks[CurrentPlaylistTrack].folder;
    const file = PlaylistTracks[CurrentPlaylistTrack].file;
    const playlistTitle = PlaylistTracks[CurrentPlaylistTrack].playlistTitle;
    const trackTitle = PlaylistTracks[CurrentPlaylistTrack].trackTitle;
    NowPlaying.innerHTML = `<h3>${playlistTitle}: ${trackTitle}</h3>`;
    console.log(`track playing: [${CurrentPlaylistTrack}] ${folder}/${file}`);
    CurrentPlaylistTrack += 1;
});
document.addEventListener(Media.PlaylistEnded, () => {
    NowPlaying.innerHTML = '';
    console.log(`playlist ended`);
});
// document.addEventListener(Media.TrackEnded, () => {
// 	// console.log(`track ended: ${Playlists[CurrentPlaylist].sequence[CurrentTrack]}`);
// 	CurrentTrack += 1;
// });
