import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';
const PAGE = new Page();
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const MediaAudio = await Fetch.api(`${PAGE.backend}/media/audio`);
const Playlists = mediaAudioMap(MediaAudio);
export function render() {
    const selection = getQuerySelection();
    const dialog = createModalDialog(selection);
    if (selection.playlist)
        playAudio(selection, dialog);
    else
        dialog.element.showModal();
}
function playAudio(selection, dialog) {
    console.log(`playing audio selection: ${selection.playlist}`);
    const audioFiles = playlistFiles(selection.playlist);
    if (!audioFiles.length) {
        alert('No audio files have been selected!');
        dialog.element.showModal();
    }
    else {
        /** display the playlist files, support reordering, playing singles, playing all, etc. */
        const audioConsole = document.createElement('div');
        PAGE.content.append(audioConsole);
        PAGE.appendParagraph(audioConsole, audioFiles);
        // for (const audioFile of audioFiles) {
        // 	audioConsole.append(`${audioFile}<br>`);
        // }
    }
}
function playlistFiles(playlistName) {
    let audioFiles = [];
    if (Playlists.has(playlistName)) {
        audioFiles = Playlists.get(playlistName);
    }
    return audioFiles;
}
/**
 * Get selection criteria from URL query, if any.
 */
function getQuerySelection() {
    const selection = { playlist: '', shuffle: false }; //, interval: 0 };
    if (PAGE.parameters.has('playlist'))
        selection.playlist = PAGE.parameters.get('playlist');
    // if (PAGE.parameters.has('interval')) selection.interval = Number(PAGE.parameters.get('interval'));
    // if (isNaN(selection.interval) || selection.interval < 0) selection.interval = 0;
    if (PAGE.parameters.has('shuffle'))
        selection.shuffle = true;
    return selection;
}
function createModalDialog(selection) {
    const dialog = new W.Dialog('Audio Options');
    const playlistDropDown = dialog.addSelect('Playlist:', Array.from(Playlists.keys()));
    const shuffleCheckbox = dialog.addCheckbox('Shuffle List:', selection.shuffle);
    // const outputTexts = ['Manually', 'Every Second', 'Every %% Seconds'];
    // const intervalRange = dialog.addRange('Change Slides:', selection.interval, 0,60,1, outputTexts);
    dialog.cancelButton.addEventListener('click', () => {
        window.history.back();
    });
    dialog.confirmButton.addEventListener('click', () => {
        selection.playlist = playlistDropDown.value;
        selection.shuffle = shuffleCheckbox.checked;
        // selection.interval = Number(intervalRange.value);
        playAudio(selection, dialog);
    });
    return dialog;
}
function mediaAudioMap(audioData) {
    const audioMap = new Map();
    if (audioData !== null) {
        for (const audioDatum of audioData) {
            audioMap.set(audioDatum.playlist, audioDatum.filePaths);
        }
    }
    return audioMap;
}
