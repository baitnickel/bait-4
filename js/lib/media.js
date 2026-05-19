/**
 * Utilities for handling audio and video media.
 */
export function PlayAudioTracks(audioElement, audioFiles, loop = false) {
    /**
     * Given an HTMLAudioElement and a list of audio file path names, load and
     * play each of the audio files in succession. When the optional "loop"
     * parameter is set to 'true', all tracks will be repeated continuously.
     */
    let tracks = {
        list: audioFiles,
        loop: loop,
        index: 0,
        next: function () {
            if (this.index == this.list.length - 1)
                this.index = 0;
            else
                this.index += 1;
        },
        select: function () {
            return this.list[this.index];
        }
    };
    audioElement.src = tracks.select();
    audioElement.addEventListener('ended', (e) => {
        tracks.next();
        audioElement.src = tracks.select();
        if (tracks.index != 0 || tracks.loop) {
            audioElement.load();
            audioElement.play();
        }
    });
}
