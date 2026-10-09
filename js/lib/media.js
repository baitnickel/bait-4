/**
 * The Media superclass is similar to the Widget superclass. Obvious extensions
 * are Video and Audio. My immediate goal is to get an Audio Panel that can
 * replace the lame Audio "controls", as well as robust Play methods that can be
 * fed one or more audio files and play them in a sequence (sorted,
 * shuffled...).
 */
export class Media {
    static odometer = 0;
    static idBase = 'Media';
    constructor(element, id = '') {
        element.id = (id) ? id : Media.nextID();
    }
    static nextID() {
        Media.odometer += 1;
        const base = Media.idBase;
        const suffix = Media.odometer.toString();
        return `${base}-${suffix}`;
    }
}
export class Audio extends Media {
    element;
    playIcon;
    pauseIcon;
    playPauseIcon;
    startIcon;
    backIcon;
    forwardIcon;
    endIcon;
    stopIcon;
    constructor(id = '') {
        const element = document.createElement('audio');
        super(element, id);
        this.element = element;
        this.playIcon = '▶️';
        this.pauseIcon = '⏸';
        this.playPauseIcon = '⏯';
        this.startIcon = '⏮';
        this.backIcon = '⏪';
        this.forwardIcon = '⏩';
        this.endIcon = '⏭';
        this.stopIcon = '⏹';
        element.addEventListener('ended', () => {
            element.currentTime = 0;
        });
    }
    playPauseButton() {
        const button = document.createElement('button');
        button.innerText = this.playPauseIcon; // not toggling
        button.addEventListener('click', () => {
            if (this.element.paused) {
                // button.innerText = this.pauseIcon;
                this.element.play();
            }
            else {
                // button.innerText = this.playIcon;
                this.element.pause();
            }
            console.log('playPause currentTime:', this.element.currentTime);
        });
        return button;
    }
    skipBackButton(seconds = 0) {
        const button = document.createElement('button');
        button.innerText = (!seconds) ? this.startIcon : this.backIcon;
        button.addEventListener('click', () => {
            this.element.currentTime = this.newCurrentTime(seconds);
        });
        return button;
    }
    skipForwardButton(seconds = 0) {
        const button = document.createElement('button');
        button.innerText = (!seconds) ? this.endIcon : this.forwardIcon;
        button.addEventListener('click', () => {
            this.element.currentTime = this.newCurrentTime(seconds, false);
        });
        return button;
    }
    newCurrentTime(seconds, backwards = true) {
        let newCurrentTime = 0;
        if (!seconds && backwards)
            newCurrentTime = 0;
        else if (!seconds)
            newCurrentTime = this.element.duration - 10; // go to 10 seconds before the end
        else if (backwards) {
            const beforeStart = this.element.currentTime < seconds;
            newCurrentTime = (beforeStart) ? 0 : this.element.currentTime - seconds;
        }
        else {
            const afterEnd = this.element.currentTime + seconds > this.element.duration;
            newCurrentTime = (afterEnd) ? this.element.duration - 10 : this.element.currentTime + seconds;
        }
        if (backwards)
            console.log('Back currentTime:', newCurrentTime);
        else
            console.log('Forward currentTime:', newCurrentTime);
        return newCurrentTime;
    }
    stopButton(playPauseButton) {
        const button = document.createElement('button');
        button.innerText = this.stopIcon;
        button.addEventListener('click', () => {
            if (!this.element.paused)
                this.element.pause();
            this.element.currentTime = 0;
            playPauseButton.innerText = this.playPauseIcon; // redundant ... should be playIcon if we're toggling
        });
        return button;
    }
}
