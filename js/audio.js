import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import { Markup, MarkupLine } from './lib/markup.js';
import { PlayAudioTracks } from './lib/media.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const AudioDataDirectory = 'data/audio';
const AlbumData = await Fetch.json(`${AudioDataDirectory}/albums.json`);
const TracksData = await Fetch.json(`${AudioDataDirectory}/tracks.json`);
const MediaFiles = '../media/audio';
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
    const albumQuery = PAGE.parameters.get('album');
    const tracksQuery = PAGE.parameters.get('tracks');
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
    if (!albumQuery) {
        /** No album ID has been supplied; display summaries for all albums that have tracks. */
        displayAlbumSummaries(AlbumData);
        // fetchData('@db/albums.json').then((albums: Album[]) => {
        // 	displayAlbumSummaries(albums);
        // });
    }
    else {
        /** Display the summary of the selected album (or an error message
         * if the selected album is invalid). Then display the audio element
         * (with controls) and the track listing (or an error message if no
         * tracks are defined for the album).
         */
        // fetchData('@db/albums.json').then((albums: Album[]) => {
        let requestedTrackIds = loadAlbum(AlbumData, albumQuery, tracksQuery);
        if (requestedTrackIds.length) {
            // fetchData('@db/tracks.json').then((tracks: Track[]) => {
            let selectedTracks = loadTrackList(TracksData, requestedTrackIds);
            playTracks(selectedTracks);
            // });
        }
        // });
    }
}
function displayAlbumSummaries(albums) {
    PAGE.setTitle('Audio Recordings');
    PAGE.addHeading('Audio Recordings', 2);
    /**
     * By convention, album IDs reflect the chronology of the
     * recordings (the oldest album has ID 1, and the newest album
     * has, e.g., ID 9999). Sorting albums by ID descending displays
     * the summaries in reverse-chronological order.
     */
    albums.sort((a, b) => b.id - a.id);
    for (let album of albums) {
        if (album.tracks.length) {
            let albumTitle = document.createElement('h3');
            let url = PAGE.url + '?page=audio&album=' + album.id;
            let albumAnchor = document.createElement('a');
            albumAnchor.setAttribute('href', url);
            albumAnchor.innerText = MarkupLine(album.title, 'et');
            albumTitle.append(albumAnchor);
            SummaryBlock.append(albumTitle);
            let element = document.createElement('div');
            element.innerHTML = Markup(album.notes);
            SummaryBlock.append(element);
        }
    }
}
function getTrackSummary(track, includeTitle = false) {
    /**
     * Return the track summary Markup text.
     */
    let noteLines = [];
    /** '\u200B' (zero-width character) prevents Markup from treating '1.' as a list item */
    // noteLines.push(`${index + 1}\u200B. **${track.title}** (${track.date})`);
    if (includeTitle)
        noteLines.push(`**${track.title}**`);
    // let time = this.trackTime(this.actualPath(`@db/audio/${track.audio}`));
    // noteLines.push(`(${time})`);
    let composers = PAGE.oxfordJoin(track.composers);
    if (composers)
        noteLines.push(`Written by: ${composers}`);
    if (track.date)
        noteLines.push(`Recorded: ${track.date}`);
    noteLines.push('\n'); /** blank line between title/composers and 'track.notes' */
    noteLines.push(track.notes);
    // noteLines.push('---'); /** horizontal rule */
    return Markup(noteLines.join('\n'));
}
function loadAlbum(albums, albumQuery, tracksQuery) {
    let requestedTrackIds = [];
    let albumFound = false;
    for (let album of albums) {
        if (album.id.toString() == albumQuery) {
            /** convert album's numeric track list to a list of track strings */
            album.tracks.forEach(trackId => { requestedTrackIds.push(trackId.toString()); });
            let albumTitle = MarkupLine(album.title, 'et');
            PAGE.setTitle(albumTitle);
            PAGE.addHeading(albumTitle, 3);
            SummaryBlock.innerHTML = Markup(album.notes);
            albumFound = true;
            break;
        }
    }
    let errorMessage = '';
    if (!albumFound)
        errorMessage = `Invalid Album ID: ${albumQuery}.`;
    else if (!requestedTrackIds.length)
        errorMessage = `Album ${albumQuery} has no tracks.`;
    else if (tracksQuery) {
        /** replace the default album tracks with parameter tracks */
        let queryTrackIds = tracksQuery.split(',');
        let invalidIds = [];
        for (let queryTrackId of queryTrackIds) {
            if (!requestedTrackIds.includes(queryTrackId))
                invalidIds.push(queryTrackId);
        }
        if (invalidIds.length == 1)
            errorMessage = `Invalid Track ID: ${invalidIds[0]}`;
        else if (invalidIds.length > 1)
            errorMessage = `Invalid Track IDs: ${invalidIds.join()}`;
        else
            requestedTrackIds = queryTrackIds;
    }
    if (errorMessage) {
        TrackListBlock.innerHTML = `<i>${errorMessage}</i>`;
        requestedTrackIds.length = 0;
    }
    return requestedTrackIds;
}
function loadTrackList(tracks, requestedTrackIds) {
    let selectedTracks = [];
    if (requestedTrackIds.length) {
        for (let requestedTrackId of requestedTrackIds) {
            /** get Track objects corresponding to the requested track IDs */
            let requestedTrack = tracks.find((track => track.id.toString() == requestedTrackId));
            if (requestedTrack)
                selectedTracks.push(requestedTrack);
        }
        let trackList = document.createDocumentFragment();
        let i = 0;
        for (let selectedTrack of selectedTracks) {
            i += 1;
            let trackTitle = MarkupLine(selectedTrack.title, 'et');
            trackTitle = `${i}. ${trackTitle}`;
            let trackElement = document.createElement('p');
            trackElement.id = `audio-track-${selectedTrack.id}`;
            if (i == 1)
                trackElement.classList.add('pad-top');
            trackElement.classList.add('track-list-item');
            trackElement.innerText = trackTitle;
            trackElement.addEventListener('click', () => {
                MainAudioElement.pause();
                singleTrack(selectedTrack);
            });
            trackList.append(trackElement);
        }
        TrackListBlock.classList.add('track-list');
        TrackListBlock.append(trackList);
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
function singleTrack(track) {
    Modal.classList.add('active');
    ModalOverlay.classList.add('active');
    let title = MarkupLine(track.title, 'et');
    ModalHeaderTitle.innerText = title;
    ModalBody.innerHTML = getTrackSummary(track);
    ModalAudioElement = document.createElement('audio'); /** recreate audio element */
    ModalAudioElement.controls = true;
    ModalAudioElement.src = `${MediaFiles}/test/F.m4a`; //actualPath(`@db/audio/${track.audio}`);
    ModalBody.append(ModalAudioElement);
}
function playTracks(selectedTracks) {
    let audioFiles = [];
    for (let selectedTrack of selectedTracks) {
        audioFiles.push('media resource URL'); // actualPath(`@db/audio/${selectedTrack.audio}`));
    }
    MainAudioElement = document.createElement('audio');
    MainAudioElement.controls = true;
    ControlsBlock.append(MainAudioElement);
    /** Display the track summary (if any) */
    MainAudioElement.addEventListener('play', (e) => {
        let element = e.target;
        let audioURI = decodeURI(element.src);
        let trackIndex = findAudioTrack(audioURI, selectedTracks);
        if (trackIndex !== null && trackIndex >= 0 && trackIndex < selectedTracks.length) {
            let trackSummary = getTrackSummary(selectedTracks[trackIndex], true);
            if (trackSummary)
                TrackBlock.innerHTML = trackSummary;
        }
    });
    /** Remove the track summary */
    MainAudioElement.addEventListener('ended', (e) => {
        TrackBlock.innerHTML = '';
    });
    /** Initialize audio player */
    PlayAudioTracks(MainAudioElement, audioFiles);
}
function findAudioTrack(uri, tracks) {
    /**
     * Given an audio URI and a list of track records, find and return the
     * index of the track record which corresponds to the audio URI, or null
     * if not found.
     */
    let trackIndex = null;
    for (let i in tracks) {
        if (uri.includes(tracks[i].audio)) {
            trackIndex = Number(i);
            break;
        }
    }
    return trackIndex;
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
/*

An audio file may or may not have information associated with it.

The bait-3 information is stored in two JSON files: db.2210/albums.json and
db.2210/tracks.json. We should continue to support this when a preferred method
is not present.

The bait-4 information is stored in each media/audio folder (formats TBD).

*/ 
