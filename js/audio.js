import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { Markup, MarkupLine } from './lib/markup.js';
import { PlayAudioTracks } from './lib/media.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const MediaFolders = '../media/audio';
// these folders will be set from an API,
// all the folders in MediaFolders
// (or just those that contain "_index.json")
const PlaylistFolders = ['wake', 'test'];
const Playlists = [];
for (const playlistFolder of PlaylistFolders) {
    const playlist = await Fetch.json(`${MediaFolders}/${playlistFolder}/_index.json`);
    Playlists.push(playlist);
}
Playlists.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
const HeadingBlock = document.createElement('div');
const SummaryBlock = document.createElement('div');
const ControlsBlock = document.createElement('div');
const TrackBlock = document.createElement('div');
const TrackListBlock = document.createElement('div');
const Modal = document.createElement('div');
const ModalOverlay = document.createElement('div');
const ModalHeader = document.createElement('div');
const ModalHeaderTitle = document.createElement('div');
const ModalHeaderClose = document.createElement('button');
const ModalBody = document.createElement('div');
ControlsBlock.id = 'controls-block';
Modal.id = 'modal';
Modal.classList.add('modal');
ModalOverlay.id = 'modal-overlay';
ModalHeader.classList.add('modal-header');
ModalHeaderTitle.classList.add('title');
ModalHeaderClose.innerHTML = '&times;';
ModalHeaderClose.classList.add('close-button');
ModalBody.classList.add('modal-body');
let MainAudioElement = document.createElement('audio');
let ModalAudioElement = document.createElement('audio');
export function render() {
    const playlistQuery = PAGE.parameters.get('playlist');
    PAGE.content.append(HeadingBlock);
    PAGE.content.append(SummaryBlock);
    PAGE.content.append(ControlsBlock);
    PAGE.content.append(TrackBlock);
    PAGE.content.append(TrackListBlock);
    PAGE.content.append(ModalOverlay);
    PAGE.content.append(Modal);
    Modal.append(ModalHeader);
    Modal.append(ModalBody);
    ModalHeader.append(ModalHeaderTitle);
    ModalHeader.append(ModalHeaderClose);
    /**
     * We will display the specified playlist and a list of its tracks when the
     * URL contains "&playlist=folder", otherwise we will display a summary page
     * showing all playlists with hyperlinks to specify a "playlist" URL.
     */
    if (playlistQuery) { /** The URL contains "&playlist=folder" */
        const playlist = loadPlaylist(Playlists, playlistQuery);
        if (playlist !== null) {
            const tracks = loadTrackList(playlist);
            playTracks(playlist, tracks);
            // PlayAudio(MainAudioElement, tracks, trackPlaying);
        }
    }
    else { /** The URL does *not* contain "&playlist=folder" */
        displayPlaylistSummaries(Playlists);
    }
}
/** callback from PlayAudio */
const trackPlaying = (audioFile) => {
    console.log(audioFile);
    return audioFile;
};
/**
 * Called by `render` when a "playlist" URL query parameter has *not* been
 * supplied. Given an array of Playlist objects, display a list of playlist
 * titles, sorted by title, and including the notes for each playlist. The
 * titles are displayed as hyperlinks here, pointing to the same URL but with
 * the "&playlist=<playlist.folder>" query parameter added.
 */
function displayPlaylistSummaries(playlists) {
    PAGE.setTitle('Audio Recordings');
    setHeading(HeadingBlock, 'Audio Recordings', 2);
    playlists.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    for (const playlist of playlists) {
        if (playlist.sequence.length) {
            let playlistTitle = document.createElement('h3');
            let url = PAGE.url + '?page=audio&playlist=' + playlist.folder;
            let playlistAnchor = document.createElement('a');
            playlistAnchor.setAttribute('href', url);
            playlistAnchor.innerText = MarkupLine(playlist.title, 'et');
            playlistTitle.append(playlistAnchor);
            SummaryBlock.append(playlistTitle);
            let element = document.createElement('div');
            element.innerHTML = Markup(playlist.notes);
            SummaryBlock.append(element);
        }
    }
}
/**
 * Return the track summary Markup text.
 */
function getTrackSummary(track, includeTitle = false) {
    let noteLines = [];
    if (includeTitle)
        noteLines.push(`**${track.title}**`);
    let composers = PAGE.oxfordJoin(track.composers);
    if (composers)
        noteLines.push(`Written by: ${composers}`);
    if (track.date)
        noteLines.push(`Recorded: ${track.date}`);
    noteLines.push('\n'); /** blank line between title/composers and 'track.notes' */
    noteLines.push(track.notes);
    return Markup(noteLines.join('\n'));
}
/**
 * Given an array of Playlist objects and the playlist folder named in the
 * "playlist" URL query parameter, return an array of tracks from
 * playlist.sequence. Assuming the playlist is valid, we set the page title and
 * heading, and display the playlist notes. If errors are encountered (invalid
 * playlist or playlist without tracks) we display error messages in the page
 * and return an empty array.
 */
function loadPlaylist(playlists, playlistQuery) {
    let foundPlaylist = null;
    for (let playlist of playlists) {
        if (playlist.folder.toLowerCase() == playlistQuery.toLowerCase()) {
            const playlistTitle = MarkupLine(playlist.title, 'et');
            PAGE.setTitle(playlistTitle);
            setHeading(HeadingBlock, playlistTitle, 3);
            SummaryBlock.innerHTML = Markup(playlist.notes);
            foundPlaylist = playlist;
            break;
        }
    }
    let errorMessage = '';
    if (foundPlaylist === null)
        errorMessage = `Invalid Playlist ID: ${playlistQuery}.`;
    else if (!foundPlaylist.sequence.length)
        errorMessage = `Playlist ${foundPlaylist.folder} has no tracks.`;
    if (errorMessage) {
        TrackListBlock.innerHTML = `<i>${errorMessage}</i>`;
    }
    return foundPlaylist;
}
// function loadTrackList(tracks: Track[], playlistTracks: string[]) {
function loadTrackList(playlist) {
    const selectedTracks = [];
    let documentFragment = document.createDocumentFragment();
    if (playlist.sequence.length) {
        for (let i = 0; i < playlist.sequence.length; i += 1) {
            const audioFile = playlist.sequence[i];
            const track = getTrack(playlist, audioFile);
            selectedTracks.push(track);
            let trackTitle = MarkupLine(track.title, 'et');
            trackTitle = `${i + 1}. ${trackTitle}`;
            let trackElement = document.createElement('p');
            trackElement.id = `audio-track-${track.file}`;
            if (i == 0)
                trackElement.classList.add('pad-top');
            trackElement.classList.add('track-list-item');
            trackElement.innerText = trackTitle;
            trackElement.addEventListener('click', () => {
                MainAudioElement.pause();
                playTracks(playlist, track);
                // singleTrack(playlist, track);
                // PlayAudio(MainAudioElement, `${MediaFolders}/${playlist.folder}/${audioFile}`, trackPlaying);
            });
            documentFragment.append(trackElement);
        }
        TrackListBlock.classList.add('track-list');
        TrackListBlock.append(documentFragment);
        let infoText = 'Click the Play button above to play all tracks, ';
        infoText += 'or click on a track title to display and play only that track.';
        let infoParagraph = document.createElement('p');
        infoParagraph.classList.add('small', 'italic');
        infoParagraph.innerText = MarkupLine(infoText, 'et');
        PAGE.content.append(infoParagraph);
    }
    ModalHeaderClose.addEventListener('click', () => {
        ModalAudioElement.pause();
        Modal.classList.remove('active');
        ModalOverlay.classList.remove('active');
    });
    return selectedTracks;
}
function getTrack(playlist, audioFile) {
    const defaultTrack = {
        file: audioFile,
        title: audioFile.slice(0, audioFile.lastIndexOf('.')),
        performers: [],
        composers: [],
        date: '',
        notes: '',
    };
    let track = playlist.tracks.find((track => track.file == audioFile));
    if (track === undefined)
        track = defaultTrack;
    return track;
}
function singleTrack(playlist, track) {
    Modal.classList.add('active');
    ModalOverlay.classList.add('active');
    const title = MarkupLine(track.title, 'et');
    ModalHeaderTitle.innerText = title;
    ModalBody.innerHTML = getTrackSummary(track);
    ModalAudioElement = document.createElement('audio'); /** recreate audio element */
    ModalAudioElement.controls = true;
    const source = `${MediaFolders}/${playlist.folder}/${track.file}`;
    ModalAudioElement.src = source;
    ModalBody.append(ModalAudioElement);
}
function playTracks(playlist, tracks) {
    MainAudioElement = document.createElement('audio');
    MainAudioElement.controls = true;
    ControlsBlock.append(MainAudioElement);
    /**
     * Convert track entries to `audioFiles` (adding their full paths).
     */
    if (!Array.isArray(tracks))
        tracks = [tracks];
    let audioFiles = [];
    for (let track of tracks) {
        const source = `${MediaFolders}/${playlist.folder}/${track.file}`;
        audioFiles.push(source);
    }
    /**
     * Listen for the "play" event (user clicks the "play" button). Find the
     * Track record in the array of tracks and display the track record
     * information (if any) in the TrackBlock div.
     */
    MainAudioElement.addEventListener('play', (e) => {
        const element = e.target;
        const trackIndex = findAudioTrack(element.src, tracks);
        if (trackIndex !== null && trackIndex >= 0) {
            let trackSummary = getTrackSummary(tracks[trackIndex], true);
            if (trackSummary)
                TrackBlock.innerHTML = trackSummary;
        }
    });
    /**
     * Listen for the "ended" event; remove the track summary information when
     * the audio play ends.
     */
    MainAudioElement.addEventListener('ended', (e) => {
        TrackBlock.innerHTML = '';
    });
    /** Initialize audio player */
    // PlayAudio(MainAudioElement, audioFiles, trackPlaying); // new function - having issues
    PlayAudioTracks(MainAudioElement, audioFiles); // old function - works
}
/**
 * Given an audio URI and a list of track records, find and return the
 * index of the track record which corresponds to the audio URI, or null
 * if not found.
 */
function findAudioTrack(uri, tracks) {
    let trackIndex = null;
    for (let i in tracks) {
        if (uri.includes(tracks[i].file)) {
            trackIndex = Number(i);
            break;
        }
    }
    return trackIndex;
}
function setHeading(element, text, level = 2) {
    element.innerHTML = Markup('#'.repeat(level) + ` ${text}`);
}
// See: https://stackoverflow.com/questions/34647536/how-to-get-audio-duration-value-by-a-function
// getDuration(src: string, destination: ) {
// 	var audio = new Audio();
// 	$(audio).on("loadedmetadata", function(){
// 		destination.textContent = audio.duration;
// 	});
// 	audio.src = src;
// }
// var span = createOrGetSomeSpanElement();
// getDuration("./audio/2.mp3", span);
