import { MarkupLine } from './markup.js';
export const FAKESHEET = {
    version: '2022.01.19',
    notes: /(Ab|A#|Bb|C#|Db|D#|Eb|F#|Gb|G#|A|B|C|D|E|F|G)/,
    tonics: ['A', 'A#|Bb', 'B', 'C', 'C#|Db', 'D', 'D#|Eb', 'E', 'F', 'F#|Gb', 'G', 'G#|Ab'],
    tonicSeparator: '|',
    commentPattern: /\/\/.*/,
    tokenCharacter: '.',
    inlinePrefix: '_',
    chordPlaceholder: '^',
    chordNotationSeparator: ':',
    chordSpacing: 2,
    space: '\u{00a0}',
    tabSize: 4,
    keyTag: 'key-select',
    chordLine: 'C',
    lyricLine: 'L',
    removeLeadingBlanks: true,
    removeTrailingBlanks: true,
};
export class FakeSheet {
    /**
     * 'chords' is set from the name:notation string(s) supplied in the .chords declaration
     * of the fakesheet source text. Additional standard name:notation strings may optionally
     * be added from one or more files, though the fakesheet .chords always take precendence.
     * These chord names are never transposed or made unicode-pretty.

     * We also need a unique list of chord names used ('chordsUsed') in the fakesheet source text,
     * ordered by occurrence. This list may optionally be sorted alphabetically. It will be
     * used to select chords to be diagrammed from the list of 'chords'.

     * Chord names will always be the original chord names until final presentation.
     * Only just before (or during) final presentation will we do transposition, lookup
     * of chords for diagrams, and finally made pretty (substituting unicode characters for
     * 'b' and '#' and such).
     */
    constructor(fakeSheetText, key = '') {
        this.title = '';
        this.artist = '';
        this.key = null;
        this.newKey = (key) ? new Chord(key) : null;
        this.capo = 0;
        this.tuning = [];
        this.tempo = 0;
        this.copyright = '';
        this.chords = [];
        this.lines = fakeSheetText.split('\n');
        this.sections = [];
        this.chordsUsed = [];
        this.instrument = new Instrument('guitar', 6, 22, ['E', 'A', 'D', 'G', 'B', 'E']);
        this.errors = [];
    }
    parseSourceText() {
        let currentSection = null;
        let lineNo = 0;
        let textLinesFound = false; /** lines containing non-space characters */
        let consecutiveBlankLines = 0;
        for (let line of this.lines) {
            lineNo += 1;
            let commentLine = FAKESHEET.commentPattern.test(line);
            line = line.replace(FAKESHEET.commentPattern, '');
            let trimmedLine = line.trim();
            let firstChar = (trimmedLine) ? trimmedLine[0] : '';
            if (firstChar == FAKESHEET.tokenCharacter) {
                /* token line */
                let parameters = trimmedLine.split(/\s+/);
                let token = parameters.shift().toLowerCase().slice(1);
                if (token == 'title')
                    this.setTitle(token, parameters, lineNo);
                else if (token == 'artist')
                    this.setArtist(token, parameters, lineNo);
                else if (token == 'key')
                    this.setKey(token, parameters, lineNo);
                else if (token == 'capo')
                    this.setCapo(token, parameters, lineNo);
                else if (token == 'tuning')
                    this.setTuning(token, parameters, lineNo);
                else if (token == 'tempo')
                    this.setTempo(token, parameters, lineNo);
                else if (token == 'copyright')
                    this.setCopyright(token, parameters, lineNo);
                else if (token == 'chords')
                    this.setChords(token, parameters, lineNo);
                else if (token)
                    currentSection = this.newSection(currentSection, token, parameters, lineNo);
                else
                    this.addError(lineNo, 'Ignoring null token name');
            }
            else {
                /* lyric, chord, or blank line */
                if (!currentSection) {
                    if (trimmedLine)
                        this.addError(lineNo, 'Ignoring orphan line (not in a section)');
                    /** blank lines not in a section will be ignored */
                }
                else if (trimmedLine) {
                    /** non-blank line in a section */
                    while (consecutiveBlankLines > 0) {
                        currentSection.addLine('');
                        consecutiveBlankLines -= 1;
                    }
                    currentSection.addLine(line);
                    textLinesFound = true;
                }
                else {
                    /** blank line in a section */
                    if (!commentLine) { /** lines that contain only comments are always ignored */
                        if (FAKESHEET.removeTrailingBlanks)
                            consecutiveBlankLines += 1;
                        if (textLinesFound || !FAKESHEET.removeLeadingBlanks)
                            currentSection.addLine(line);
                    }
                }
            }
        }
    }
    validTokenLine(property, name, parameters, lineNo) {
        let valid = false;
        let errorMessage = '';
        if (property) {
            errorMessage = `Ignoring attempt to redefine ${name}`;
            if (parameters.length)
                errorMessage += `: ${parameters.join(' ')}`;
        }
        else if (!parameters.length) {
            errorMessage = `Ignoring ${name} with blank or invalid value`;
        }
        else
            valid = true;
        if (errorMessage)
            this.addError(lineNo, errorMessage);
        return valid;
    }
    setTitle(token, parameters, lineNo) {
        if (this.validTokenLine(this.title, token, parameters, lineNo)) {
            this.title = parameters.join(' ');
        }
    }
    setArtist(token, parameters, lineNo) {
        if (this.validTokenLine(this.artist, token, parameters, lineNo)) {
            this.artist = parameters.join(' ');
        }
    }
    setKey(token, parameters, lineNo) {
        if (this.validTokenLine(this.key, token, parameters, lineNo)) {
            let lookupKey = parameters[0];
            if (lookupKey.length > 1 && lookupKey.endsWith('m')) {
                lookupKey = lookupKey.slice(0, -1);
            }
            if (!FAKESHEET.notes.test(lookupKey)) {
                this.addError(lineNo, `Ignoring invalid key value: ${parameters[0]}`);
            }
            else {
                this.key = new Chord(parameters[0]);
                /* ignore new key if it is the same as the token key */
                if (this.newKey && this.newKey.root == this.key.root)
                    this.newKey = null;
            }
        }
    }
    deriveKey(chordName) {
        /**
         * Best practice is to explicitly name the song's key using the .key
         * token at the top of the fakesheet, but if this isn't done, this
         * method may be called to derive the key from the first chord
         * encountered (e.g., in a .chord declaration or section declaration).
         */
        let chord = new Chord(chordName);
        if (chord.base)
            this.key = new Chord(chord.base);
    }
    setCapo(token, parameters, lineNo) {
        if (this.validTokenLine(this.capo, token, parameters, lineNo)) {
            let capo = Number(parameters[0]);
            if (isNaN(capo) || capo < 0 || capo > 24) {
                this.addError(lineNo, `Ignoring invalid capo position: ${parameters[0]}`);
            }
            else
                this.capo = capo;
        }
    }
    setTuning(token, parameters, lineNo) {
        if (this.validTokenLine(this.tuning.length, token, parameters, lineNo)) {
            /* tuning must be defined before chords */
            if (this.chords.length) {
                this.addError(lineNo, `${token} must be defined before chords`);
            }
            else {
                let compressedNotes = '';
                let invalidNotes = [];
                for (let parameter of parameters)
                    compressedNotes += parameter.trim();
                /** Remove punctuation characters that may be used as note separators (,:;_-/.)
                 * This allows the user to enter tunings like: E-A-D-G-B-E.
                 */
                compressedNotes = compressedNotes.replace(/[,:;_\-\/\.]/g, '');
                let notes = [];
                // for (let i = 0; i < compressedNotes.length; i += 1) {
                // 	if (notes.length == 0 || 'ABCDEFG'.includes(compressedNotes[i])) {
                // 		notes.push(compressedNotes[i]);
                // 	} else {
                // 		notes[notes.length-1] = notes[notes.length-1] + compressedNotes[i];
                // 	}
                // }
                for (let compressedNote of compressedNotes) {
                    if (notes.length == 0 || 'ABCDEFG'.includes(compressedNote)) {
                        notes.push(compressedNote);
                    }
                    else {
                        notes[notes.length - 1] = notes[notes.length - 1] + compressedNote;
                    }
                }
                for (let note of notes) {
                    if (!FAKESHEET.notes.test(note))
                        invalidNotes.push(note);
                }
                if (invalidNotes.length) {
                    this.addError(lineNo, `${token} contains invalid values: ${invalidNotes.join(' ')}`);
                }
                else if (notes.length != this.instrument.strings) {
                    let errorMessage = `${this.instrument.name} ${token} requires exactly `;
                    errorMessage += `${this.instrument.strings} notes, but ${notes.length} `;
                    errorMessage += `are provided: ${notes.join(' ')}`;
                    this.addError(lineNo, errorMessage);
                }
                else
                    this.tuning = notes;
            }
        }
    }
    setTempo(token, parameters, lineNo) {
        if (this.validTokenLine(this.tempo, token, parameters, lineNo)) {
            let tempo = Number(parameters[0]);
            if (isNaN(tempo) || tempo < 20 || tempo > 400) {
                this.addError(lineNo, `Ignoring invalid tempo: ${parameters[0]}`);
            }
            else
                this.tempo = tempo;
        }
    }
    setCopyright(token, parameters, lineNo) {
        if (this.validTokenLine(this.copyright, token, parameters, lineNo))
            this.copyright = parameters.join(' ');
    }
    setChords(token, parameters, lineNo) {
        /**
         * Here we encounter parameters indicating chord name and notation,
         * separated by FAKESHEET.chordNotationSeparator (e.g. "C:x32010").
         * For every valid parameter, create or update an entry in 'this.chords'.
         * Entries may already exist if a chord was previously referenced in a
         * lyric-chord line or if referenced more than once in this token.
         */
        for (let parameter of parameters) {
            let words = parameter.split(FAKESHEET.chordNotationSeparator);
            if (words.length != 2)
                this.addError(lineNo, `Ignoring invalid ${token}: ${parameter}`);
            else {
                /* split out into a separate method if needed elsewhere */
                let chordName = words[0];
                let chordNotation = words[1];
                let found = false;
                for (let chord of this.chords) {
                    if (chord.name == chordName) {
                        found = true;
                        break;
                    }
                }
                if (found)
                    this.addError(lineNo, `Ignoring attempt to redefine ${token}: ${parameter}`);
                else {
                    let chord = new Chord(chordName, this.instrument, chordNotation);
                    if (chordNotation && chord.notation !== null && chord.notation.valid) {
                        this.chords.push(chord);
                        /* If the key hasn't already been established, set it from this chord */
                        if (!this.key)
                            this.deriveKey(chordName);
                    }
                    else
                        this.addError(lineNo, `Ignoring ${token} with invalid notation: ${parameter}`);
                }
            }
        }
    }
    newSection(currentSection, token, parameters, lineNo) {
        let sectionName = token;
        let existingSection = null;
        let chords = [];
        for (let section of this.sections) {
            if (section.name == sectionName) {
                existingSection = section;
                break;
            }
        }
        if (existingSection && parameters.length) {
            this.addError(lineNo, `Cannot redefine section: ${sectionName}`);
        }
        else if (!existingSection && !parameters.length) {
            this.addError(lineNo, `Section definition requires chords: ${sectionName}`);
        }
        else {
            if (existingSection)
                chords = existingSection.chords;
            else {
                for (let chordName of parameters) {
                    chords.push(new Chord(chordName)); //### validate each chord, raise errors?
                }
            }
            currentSection = new Section(sectionName, chords);
            this.sections.push(currentSection);
            /* If the key hasn't already been established, set it from this chord */
            if (!this.key)
                this.deriveKey(currentSection.chords[0].name);
            /* Update unique list of chord names used (for Chord diagrams) */
            for (let chord of chords) {
                if (!this.chordsUsed.includes(chord.name))
                    this.chordsUsed.push(chord.name);
            }
        }
        return currentSection;
    }
    capoMessage() {
        let message = '';
        if (this.key) {
            let effectiveKey = this.key.effectiveKey(this.capo);
            if (this.capo && !this.newKey) {
                message = `${this.capo} (effective key: ${effectiveKey.base})`;
            }
            if (this.newKey) {
                let capo = this.newKey.suggestedCapo(this.key, this.capo);
                if (capo)
                    message = `${capo} (to play in original key: ${effectiveKey.base})`;
            }
        }
        return message;
    }
    fakeSheetLines() {
        let lines = [];
        for (let section of this.sections) {
            for (let fakeLine of section.fakeLines(this.key, this.newKey)) {
                lines.push(fakeLine);
            }
        }
        return lines;
    }
    chordDiagrams() {
        let diagrams = [];
        if (!this.newKey) {
            for (let chord of this.chords) {
                if (this.chordsUsed.includes(chord.name)
                    && chord.notation !== null
                    && chord.notation.valid) {
                    diagrams.push(chord.diagram());
                }
            }
        }
        return diagrams;
    }
    changeKey(newKey) {
        /**
         * When a new song key has been selected (via the drop-down selection
         * element generated by the 'html' method), an event is raised and
         * handled by the calling program, which calls this method to regenerate
         * the HTML.
         */
        this.newKey = new Chord(newKey);
        if (!this.newKey.base || this.newKey.base == this.key.base)
            this.newKey = null;
    }
    addError(lineNo, text) {
        this.errors.push(`Line ${lineNo}: ${text}`);
    }
}
class Section {
    constructor(name, chords) {
        this.name = name;
        this.chords = chords;
        this.lines = [];
        this.inline = (name.charAt(0) === FAKESHEET.inlinePrefix) ? true : false;
    }
    addLine(line) {
        if (line) {
            /**
             * Separate consecutive chord placeholders and ensure that line does
             * not end with a chord placeholder character.
             */
            line = line.trimEnd();
            line = line.replace(/\^\^/g, '^ ^');
            if (line.endsWith(FAKESHEET.chordPlaceholder))
                line += FAKESHEET.space;
        }
        this.lines.push(line);
    }
    fakeLines(key, newKey) {
        let fakeLines = [];
        let currentChord = 0;
        for (let line of this.lines) {
            if (fakeLines.length || line.trim() || !FAKESHEET.removeLeadingBlanks) {
                /* normally, we skip over leading blank lines (per conditions above) */
                let previousChordName = ''; /* will prevent repeating same chord */
                let chordsLine = '';
                let lyricsLine = '';
                /* replace ordinary spaces with non-breaking spaces */
                line = line.replace(/ /g, FAKESHEET.space);
                /* replace tabs with non-breaking spaces */
                line = line.replace(/\t/g, FAKESHEET.space.repeat(FAKESHEET.tabSize));
                if (this.inline) {
                    /* chords and text go on one line */
                    while (true) {
                        let pos = line.indexOf(FAKESHEET.chordPlaceholder);
                        if (pos < 0)
                            break;
                        let chord = this.chords[currentChord];
                        let chordName = chord.name;
                        if (newKey) {
                            chord = chord.transpose(key, newKey);
                            chordName = chord.name;
                        }
                        line = line.replace(FAKESHEET.chordPlaceholder, chordName);
                        currentChord = (currentChord + 1) % this.chords.length;
                    }
                    fakeLines.push(FAKESHEET.chordLine + line);
                }
                else if (line.trim() == '') {
                    /* treat a blank line as an empty lyrics line */
                    // fakeLines.push(line);
                    fakeLines.push(FAKESHEET.lyricLine + line);
                }
                else {
                    /* produce two lines, one for chords and one for lyrics */
                    let addChord = false;
                    for (let character of line) {
                        if (character == FAKESHEET.chordPlaceholder)
                            addChord = true;
                        else {
                            if (addChord) {
                                addChord = false;
                                let chordName = '';
                                if (this.chords.length) {
                                    /* get the next chord in the sequence */
                                    let chord = this.chords[currentChord];
                                    chordName = chord.name;
                                    if (newKey) {
                                        chord = chord.transpose(key, newKey);
                                        chordName = chord.name;
                                    }
                                    currentChord = (currentChord + 1) % this.chords.length;
                                    if (chordName == previousChordName)
                                        chordName = '';
                                    else
                                        previousChordName = chordName;
                                }
                                /* add spaces to the lyric line to catch up to the position of the new chord */
                                while (chordsLine.length > lyricsLine.length)
                                    lyricsLine += FAKESHEET.space;
                                /* update chord and lyric lines */
                                if (chordName)
                                    chordName += FAKESHEET.space.repeat(FAKESHEET.chordSpacing);
                                chordsLine += chordName;
                                lyricsLine += character;
                            }
                            else {
                                if (chordsLine.length == lyricsLine.length)
                                    chordsLine += FAKESHEET.space;
                                lyricsLine += character;
                            }
                        }
                    }
                    if (chordsLine) { /* ### if (chordsLine && !lyricsOnly) */
                        fakeLines.push(FAKESHEET.chordLine + chordsLine);
                    }
                    if (lyricsLine)
                        fakeLines.push(FAKESHEET.lyricLine + lyricsLine);
                }
            }
        }
        return fakeLines;
    }
}
/**
 * 'chordNotation' is a character string, consisting of fret directives and
 * optional barre directives. The fret directives consist of a series of fret
 * numbers, generally one fret number per instrument string, but multiple fret
 * numbers can be entered for a single string (as a comma-separated list
 * surrounded by parentheses) to indicate a primary note and one or more
 * secondary notes. Barre directives (one or more) must follow the fret
 * directives; each barre directive consists of a single fret number preceded
 * by a pipe (|) character.
 *
 * Fret numbers are integers between 0 and the largest allowed fret on the
 * instrument. Multi-digit fret numbers (numbers greater than 9) must be
 * enclosed in parentheses (unless they are part of a comma-separated list).
 * There are, however, two special fret numbers: 'x' and 'o' (and their
 * uppercase equivalents). 'x' indicates no fret (string is not to be played),
 * and 'o' indicates that the string is to be played open. 'o' and 0 are
 * synonyms.
 *
 * Examples:
 * x32010                 C
 * x32(0,3)10             C(7)
 * 355433|3               G, barre at 3 from 6th to 1st string
 * xx(4,2)232|2           Bm7, barre at 2 from 4th to 1st string
 * 88(10)(10)(10)8|8|(10) F/C, barre at 8 (6th-1st) and 10 (4th-2nd)
 *
 * Parsing 'chordNotation' begins with a split on the pipe character. If the
 * split produces a single-element array, there are no barre directives,
 * otherwise the barre directives are in elements 1 thru the last element.
 *
 * Then the note directives are parsed, one directive per instrument string,
 * each directive consisting of one or more fret numbers. Likewise, the barre
 * directives, if any, are parsed to produce a list of one or more barred
 * frets.
 */
class Notation {
    constructor(chordNotation, fretCount = 4, stringCount) {
        this.valid = true;
        this.notes = []; /* typescript multi-dimensional array initialization uses single [] */
        this.barres = [];
        this.stringCount = stringCount;
        this.fretCount = fretCount; /* determines grid size; instrument.frets is maxFret, if we choose to use it for validation */
        this.firstFret = 1;
        this.lowFret = 0;
        this.highFret = 0;
        const invalidNotationCharacters = /[^0-9xo,|\()]/gi;
        var directives = [];
        var noteDirectives = '';
        var barreDirectives = [];
        /* normalize chordNotation and ensure it contains only valid characters */
        chordNotation = chordNotation.toLowerCase();
        if (!chordNotation || chordNotation.match(invalidNotationCharacters) !== null)
            this.valid = false;
        if (this.valid) {
            /* divide chordNotation into note directives and an optional list of barre directives */
            directives = chordNotation.split('|');
            noteDirectives = directives.shift(); /* ! asserts that shift value is not undefined */
            if (!noteDirectives)
                this.valid = false;
            else
                barreDirectives = directives;
        }
        if (this.valid) {
            /** parse the note directives and assign note numbers
             (an array of 1 or more frets per instrument string)
             */
            this.notes = this.noteFrets(noteDirectives);
            if (this.notes.length != this.stringCount)
                this.valid = false;
        }
        if (this.valid) {
            /* parse the barre directives and assign barre numbers (a list of frets barred) */
            this.barres = this.barreFrets(barreDirectives);
        }
        if (this.valid) {
            /* calculate fret properties */
            for (let string of this.notes) {
                for (let fret of string) {
                    if (fret > 0) {
                        if (!this.lowFret || fret < this.lowFret)
                            this.lowFret = fret;
                        if (!this.highFret || fret > this.highFret)
                            this.highFret = fret;
                    }
                }
            }
            if (this.lowFret || this.highFret) {
                let fretCount = this.highFret - this.lowFret + 1;
                if (this.fretCount < fretCount)
                    this.fretCount = fretCount;
                if (this.highFret > this.fretCount)
                    this.firstFret = this.lowFret;
            }
        }
    }
    noteFrets(noteDirectives) {
        /**
         * 'noteDirectives' is a character string representing the frets to be played
         * across each of an instrument's strings (for guitar, 6 strings), e.g.:
         * 'x8(10)(10,8)(10)8'
         * Return a list of fret numbers for each of the instrument's strings, e.g.:
         * [ [ NaN ], [ 8 ], [ 10 ], [ 10, 8 ], [ 10 ], [ 8 ] ]
         */
        var frets = [];
        const separateDirectives = /(\(.*?\)|[xo0-9])/;
        const parentheticDirective = /\((.*)\)/;
        let noteDirectivesList = noteDirectives.split(separateDirectives);
        for (let noteDirective of noteDirectivesList) {
            let fretStrs;
            let fretNumbers = [];
            if (noteDirective) {
                fretStrs = [];
                let matches = noteDirective.match(parentheticDirective);
                if (matches === null)
                    fretStrs.push(noteDirective); /* only one fret */
                else
                    fretStrs = matches[1].split(','); /* may be multiple frets, separated by commas */
                for (let fretStr of fretStrs) {
                    if (fretStr == 'o')
                        fretStr = '0';
                    let fret = Number(fretStr);
                    if (fretStr != 'x' && isNaN(fret))
                        this.valid = false;
                    else
                        fretNumbers.push(fret);
                }
                frets.push(fretNumbers);
            }
        }
        return frets;
    }
    barreFrets(barreDirectives) {
        /**
         * 'barreDirectives' is a list of fret numbers as character strings,
         * any of which may be enclosed in parentheses, e.g.:
         * ['8', '(10)']
         * Return a list of fret numbers, e.g.:
         * [8, 10]
         */
        var frets = [];
        const parentheticDirective = /\((.*)\)/;
        for (let barreDirective of barreDirectives) {
            let fret = NaN;
            let matches = barreDirective.match(parentheticDirective);
            if (matches === null)
                fret = Number(barreDirective); /* directive without parentheses */
            else
                fret = Number(matches[1]);
            if (!isNaN(fret))
                frets.push(fret);
            else
                this.valid = false;
        }
        return frets;
    }
}
const W3NameSpace = 'http://www.w3.org/2000/svg';
/**
 * MIDI note numbers:
 *   C4:60 (middle C)
 * A0:21 ... C8:108 (88 piano keys)
 *   E3:52, A3:57, D4:62, G4:67, B4:71, E5:76 (normal guitar tuning)
 *   E3:52 ... D7:98 (typical guitar range)
 */
class Chord {
    // midiNotes: number[];    /* ### MIDI note numbers representing chord */
    constructor(name, instrument = null, notation = '') {
        this.name = name;
        this.stringCount = (instrument) ? instrument.strings : 0;
        this.notation = (notation) ? new Notation(notation, 5, this.stringCount) : null; /* consumers must check Notation.valid */
        /**
         * A chord name is split into a list of elements,
         * where elements are alternating modifiers and notes, e.g.:
         * 'Dbm7/Ab' has elements '', 'Db', 'm7/', 'Ab', ''.
         * The first and last elements are always modifiers (often '').
         * The modifiers will always be even-numbered elements (0, 2, ...),
         * while the notes will always be odd-numbered elements (1, 3, ...).
         * We store these elements in two separate lists:
         * a list of modifiers and a list of note numbers,
         * where note numbers are indexes of the note name in
         * the FAKESHEET.tonics constant.
         * So, the example above would become:
         * modifiers: ['','m7/',''] and note numbers: [4,11].
         * Transposition is done by offsetting the note numbers.
         */
        this.root = '';
        this.base = '';
        this.minor = false;
        this.noteNumbers = [];
        this.modifiers = [];
        let elements = this.name.split(FAKESHEET.notes);
        if (elements.length >= 3) { /* valid chord names always have at least three elements */
            let expectingModifier = true;
            for (let element of elements) {
                if (expectingModifier)
                    this.modifiers.push(element);
                else { /* expecting note */
                    let noteNumber = 0;
                    for (let tonicSet of FAKESHEET.tonics) {
                        let tonics = tonicSet.split(FAKESHEET.tonicSeparator);
                        if (tonics.includes(element)) {
                            this.noteNumbers.push(noteNumber);
                            break;
                        }
                        noteNumber += 1;
                    }
                }
                expectingModifier = !expectingModifier;
            }
            this.root = this.base = elements[1];
            if (elements[2].startsWith('m') && !elements[2].startsWith('maj')) {
                this.base += 'm';
                this.minor = true;
            }
        }
    }
    scale() {
        let notes = [];
        /**
         * Return the twelve notes representing the scale of this Chord
         * (typically, the song's key). Resolve enharmonic notes by rule,
         * according to key signatures. The rule for C/Am is somewhat arbitrary,
         * based on my personal preferences: using sharps except for Bb and Eb).
         */
        for (let tonicSet of FAKESHEET.tonics) {
            let tonics = tonicSet.split(FAKESHEET.tonicSeparator);
            if (tonics.length < 2)
                notes.push(tonics[0]); /* no enharmonic equivalent note */
            else {
                let sharpNote = (tonics[0].endsWith('#')) ? tonics[0] : tonics[1];
                let flatNote = (tonics[0].endsWith('#')) ? tonics[1] : tonics[0];
                if (/b/.test(this.base) || ['F', 'Cm', 'Dm', 'Fm', 'Gm'].includes(this.base))
                    notes.push(flatNote);
                else {
                    if (['C', 'Am'].includes(this.base) && ['Bb', 'Eb'].includes(flatNote))
                        notes.push(flatNote);
                    else
                        notes.push(sharpNote);
                }
            }
        }
        return notes;
    }
    transpose(fromKey, toKey) {
        /**
         * Given "from key" and "to key" Chord objects, transpose this Chord to
         * the new key.
         */
        let scale = toKey.scale();
        let interval = toKey.noteNumbers[0] - fromKey.noteNumbers[0];
        let noteNumber;
        let newChordName = '';
        let nextModifier = 0;
        let nextNumber = 0;
        let i = 0;
        while (true) {
            if (i % 2 == 0 && nextModifier < this.modifiers.length) {
                newChordName += this.modifiers[nextModifier];
                nextModifier += 1;
            }
            else if (i % 2 != 0 && nextNumber < this.noteNumbers.length) {
                noteNumber = this.noteNumbers[nextNumber] + interval;
                if (noteNumber < 0)
                    noteNumber += scale.length;
                else if (noteNumber >= scale.length)
                    noteNumber -= scale.length;
                newChordName += scale[noteNumber];
                nextNumber += 1;
            }
            if (nextModifier >= this.modifiers.length && nextNumber >= this.noteNumbers.length) {
                break;
            }
            i += 1;
        }
        return new Chord(newChordName);
    }
    effectiveKey(capo) {
        /**
         * Given a capo position, return a new Chord object representing the
         * effective key. E.g., if this.base is 'Am' and the capo is 2, we would
         * return a 'Bm' Chord.
         */
        let noteNumber = this.noteNumbers[0] + capo;
        if (noteNumber >= FAKESHEET.tonics.length)
            noteNumber -= FAKESHEET.tonics.length;
        let scale = this.scale();
        let key = scale[noteNumber];
        if (this.minor)
            key += 'm';
        return new Chord(key);
    }
    suggestedCapo(key, capo) {
        /**
         * Given a key and capo as selected in the fakesheet, return the capo
         * position required to play the song in the original effective key,
         * using the key represented by this Chord.
         */
        let suggestedCapo = 0;
        let effectiveKey = key.effectiveKey(capo);
        suggestedCapo = effectiveKey.noteNumbers[0] - this.noteNumbers[0];
        if (suggestedCapo < 0)
            suggestedCapo += FAKESHEET.tonics.length;
        return suggestedCapo;
    }
    diagram(fontFamily = 'sans-serif', svgScaling = 0.85, stringSpacing = 16) {
        /**
         * Return an SVG element representing the chord diagram. 'stringSpacing'
         * is the horizontal distance between adjacent strings; this value
         * determines the size of all objects in the chord diagram. 'svgScaling'
         * determines the scale of the diagram, where 0.85 is 85% of normal.
         * 'fontFamily' is the default font used in the SVG-drawn text.
         */
        let coordinates;
        let text;
        let rightPadding = Math.round(stringSpacing * 1.25); /** horizontal diagram spacing */
        let bottomPadding = Math.round(stringSpacing * 1.25); /** vertical diagram spacing */
        let fretSpacing = Math.round(stringSpacing * 1.30);
        let fingerRadius = Math.round(stringSpacing * 0.25);
        let neckMargin = Math.round(fingerRadius * 1.30);
        let nameWidth = ((this.notation.stringCount - 1) * stringSpacing) + (neckMargin * 2);
        let nameHeight = Math.round(fretSpacing * 0.80);
        let nameFontSize = Math.round(nameHeight * 0.80);
        let nutHeight = Math.round(fretSpacing * 0.50);
        let nutMarkRadius = Math.round(nutHeight * 0.30);
        let fretPositionWidth = (this.notation.firstFret == 1) ? 0 : stringSpacing;
        let fretPositionHeight = fretSpacing;
        let fretPositionFontSize = Math.round(fretPositionHeight * 0.50);
        let neckWidth = nameWidth;
        let neckHeight = this.notation.fretCount * fretSpacing;
        let fullWidth = fretPositionWidth + nameWidth + rightPadding; /* ### will change when we add this.firstFret */
        let fullHeight = nameHeight + nutHeight + neckHeight + bottomPadding;
        /** Create the main SVG element */
        let svg = document.createElementNS(W3NameSpace, 'svg');
        svg.setAttribute('width', fullWidth.toString());
        svg.setAttribute('height', fullHeight.toString());
        svg.setAttribute('viewBox', `0 0 ${fullWidth} ${fullHeight}`);
        /** Create an SVG group element--a container for all the sub-elements */
        let svgGroup = document.createElementNS(W3NameSpace, 'g');
        svgGroup.setAttribute('transform', `scale(${svgScaling})`);
        /** Add chord name to group container */
        coordinates = {
            x: fretPositionWidth,
            y: 0,
            width: nameWidth,
            height: nameHeight,
            radius: 0
        };
        text = {
            value: MarkupLine(this.name, 'E'),
            fontSize: nameFontSize,
            fontFamily: fontFamily
        };
        svgGroup.appendChild(this.diagramName(coordinates, text));
        /* Draw 'x' and 'o' marks above the nut */
        coordinates = {
            x: fretPositionWidth,
            y: nameHeight,
            width: nameWidth,
            height: nutHeight,
            radius: nutMarkRadius
        };
        svgGroup.appendChild(this.diagramNutMarks(coordinates, stringSpacing, neckMargin));
        /* Draw the first fret number when it isn't the default '1' */
        if (fretPositionWidth) {
            coordinates = {
                x: 0,
                y: nameHeight + nutHeight,
                width: fretPositionWidth,
                height: fretPositionHeight,
                radius: 0
            };
            text = {
                value: this.notation.firstFret.toString(),
                fontSize: fretPositionFontSize,
                fontFamily: fontFamily
            };
            svgGroup.appendChild(this.diagramFretPosition(coordinates, text));
        }
        /* Draw neck with fingerings--primary and secondary notes and barres */
        coordinates = {
            x: fretPositionWidth,
            y: nameHeight + nutHeight,
            width: neckWidth,
            height: neckHeight,
            radius: fingerRadius
        };
        svgGroup.appendChild(this.diagramNeck(coordinates, stringSpacing, fretSpacing, neckMargin));
        svg.appendChild(svgGroup);
        return svg;
    }
    diagramName(coordinates, text) {
        let svg = document.createElementNS(W3NameSpace, 'svg');
        svg.setAttribute('x', coordinates.x.toString());
        svg.setAttribute('y', coordinates.y.toString());
        svg.setAttribute('width', coordinates.width.toString());
        svg.setAttribute('height', coordinates.height.toString());
        let svgText = document.createElementNS(W3NameSpace, 'text');
        svgText.setAttribute('x', Math.round(coordinates.width * .5).toString());
        svgText.setAttribute('y', Math.round(coordinates.height * .7).toString());
        svgText.setAttribute('text-anchor', 'middle');
        svgText.setAttribute('font-family', text.fontFamily);
        svgText.setAttribute('font-size', text.fontSize.toString());
        svgText.innerHTML = text.value;
        svg.appendChild(svgText);
        return svg;
    }
    diagramNutMarks(coordinates, spacing, margin) {
        /* get 'x' or 'o', if any, for each string; if both are present, the first one wins */
        let notes = [];
        let i = 0;
        for (let noteOptions of this.notation.notes) {
            notes.push('');
            for (let noteOption of noteOptions) {
                if (isNaN(noteOption) || noteOption == 0) {
                    notes[i] = (isNaN(noteOption)) ? 'x' : 'o';
                    break;
                }
            }
            i += 1;
        }
        let svg = document.createElementNS(W3NameSpace, 'svg');
        svg.setAttribute('x', coordinates.x.toString());
        svg.setAttribute('y', coordinates.y.toString());
        svg.setAttribute('width', coordinates.width.toString());
        svg.setAttribute('height', coordinates.height.toString());
        let stroke = 'black'; //### should be calling program option??
        i = 0;
        for (let note of notes) {
            let nutCenter = Math.floor(coordinates.height * 0.50);
            let stringCenter = Math.floor(i * spacing) + margin;
            if (note == 'x') {
                /* first line of the 'x' shape, above nut at stringCenter */
                let svgX1 = document.createElementNS(W3NameSpace, 'line');
                svgX1.setAttribute('x1', (stringCenter - coordinates.radius).toString());
                svgX1.setAttribute('y1', (nutCenter - coordinates.radius).toString());
                svgX1.setAttribute('x2', (stringCenter + coordinates.radius).toString());
                svgX1.setAttribute('y2', (nutCenter + coordinates.radius).toString());
                svgX1.setAttribute('stroke', stroke);
                svgX1.setAttribute('stroke-width', '1');
                svg.appendChild(svgX1);
                /* second line of the 'x' shape */
                let svgX2 = document.createElementNS(W3NameSpace, 'line');
                svgX2.setAttribute('x1', (stringCenter + coordinates.radius).toString());
                svgX2.setAttribute('y1', (nutCenter - coordinates.radius).toString());
                svgX2.setAttribute('x2', (stringCenter - coordinates.radius).toString());
                svgX2.setAttribute('y2', (nutCenter + coordinates.radius).toString());
                svgX2.setAttribute('stroke', stroke);
                svgX2.setAttribute('stroke-width', '1');
                svg.appendChild(svgX2);
            }
            else if (note == "o") {
                /* 'o' above nut at stringCenter */
                let svgO = document.createElementNS(W3NameSpace, 'circle');
                svgO.setAttribute('cx', stringCenter.toString());
                svgO.setAttribute('cy', nutCenter.toString());
                svgO.setAttribute('r', coordinates.radius.toString());
                svgO.setAttribute('stroke', stroke);
                svgO.setAttribute('stroke-width', '1');
                svgO.setAttribute('fill-opacity', '0'); /** 0 opacity == fully transparent */
                svg.appendChild(svgO);
            }
            i += 1;
        }
        return svg;
    }
    diagramFretPosition(coordinates, text) {
        let svg = document.createElementNS(W3NameSpace, 'svg');
        svg.setAttribute('x', coordinates.x.toString());
        svg.setAttribute('y', coordinates.y.toString());
        svg.setAttribute('width', coordinates.width.toString());
        svg.setAttribute('height', coordinates.height.toString());
        let svgText = document.createElementNS(W3NameSpace, 'text');
        svgText.setAttribute('x', Math.round(coordinates.width * 0.75).toString());
        svgText.setAttribute('y', Math.round(coordinates.height * .7).toString());
        svgText.setAttribute('text-anchor', 'end');
        svgText.setAttribute('font-family', text.fontFamily);
        svgText.setAttribute('font-size', text.fontSize.toString());
        svgText.innerHTML = text.value;
        svg.appendChild(svgText);
        return svg;
    }
    diagramNeck(coordinates, stringSpacing, fretSpacing, margin) {
        let svg = document.createElementNS(W3NameSpace, 'svg');
        svg.setAttribute('x', coordinates.x.toString());
        svg.setAttribute('y', coordinates.y.toString());
        svg.setAttribute('width', coordinates.width.toString());
        svg.setAttribute('height', coordinates.height.toString());
        let i = 0;
        while (i < this.stringCount) {
            let xx = Math.floor(i * stringSpacing) + margin;
            let svgLine = document.createElementNS(W3NameSpace, 'line');
            svgLine.setAttribute('x1', xx.toString());
            svgLine.setAttribute('y1', '0');
            svgLine.setAttribute('x2', xx.toString());
            svgLine.setAttribute('y2', coordinates.height.toString());
            svgLine.setAttribute('stroke', 'black');
            svgLine.setAttribute('stroke-width', '1');
            svg.appendChild(svgLine);
            i += 1;
        }
        /* draw the horizontal frets - width of stroke is 2 instead of 1 for first and last fret */
        i = 0;
        while (i <= this.notation.fretCount) {
            let yy = Math.floor(i * fretSpacing);
            let x2 = coordinates.width - margin;
            let strokeWidth = (i == 0 || i == this.notation.fretCount) ? 2 : 1;
            let svgLine = document.createElementNS(W3NameSpace, 'line');
            svgLine.setAttribute('x1', margin.toString());
            svgLine.setAttribute('y1', yy.toString());
            svgLine.setAttribute('x2', x2.toString());
            svgLine.setAttribute('y2', yy.toString());
            svgLine.setAttribute('stroke', 'black');
            svgLine.setAttribute('stroke-width', strokeWidth.toString());
            svg.appendChild(svgLine);
            i += 1;
        }
        /* draw the barres (if any) */
        for (let barre of this.notation.barres) {
            /* offset fret (when diagram's first fret is not 1) */
            let relativeFret = barre;
            if (this.notation.firstFret > 1) {
                relativeFret -= this.notation.firstFret - 1;
            }
            let stringBounds = [NaN, NaN];
            i = 0;
            for (let strings of this.notation.notes) {
                for (let string of strings) {
                    if (string == barre) {
                        if (isNaN(stringBounds[0]))
                            stringBounds[0] = i;
                        stringBounds[1] = i;
                    }
                }
                i += 1;
            }
            if (!isNaN(stringBounds[0])) { /* fingerings found for barre fret */
                for (let stringBound of stringBounds) { /* draw the starting and ending dots */
                    let stringCenter = Math.floor(stringBound * stringSpacing) + margin;
                    let fingerCenter = Math.floor(fretSpacing * relativeFret) - Math.floor(fretSpacing * 0.5);
                    let svgCircle = document.createElementNS(W3NameSpace, 'circle');
                    svgCircle.setAttribute('cx', stringCenter.toString());
                    svgCircle.setAttribute('cy', fingerCenter.toString());
                    svgCircle.setAttribute('r', coordinates.radius.toString());
                    svgCircle.setAttribute('stroke', 'black');
                    svgCircle.setAttribute('stroke-width', '1');
                    svgCircle.setAttribute('fill', 'black');
                    svg.appendChild(svgCircle);
                }
            }
            if (stringBounds[0] < stringBounds[1]) {
                /* draw and fill a rectangle to connect the barre dots */
                let rectx = Math.floor(stringBounds[0] * stringSpacing) + margin;
                let fingerCenter = Math.floor(fretSpacing * relativeFret) - Math.floor(fretSpacing * 0.5);
                let recty = fingerCenter - Math.floor(coordinates.radius);
                let rectw = Math.floor(stringSpacing) * (stringBounds[1] - stringBounds[0]);
                let recth = Math.floor(coordinates.radius) * 2;
                let svgRectangle = document.createElementNS(W3NameSpace, 'rect');
                svgRectangle.setAttribute('x', rectx.toString());
                svgRectangle.setAttribute('y', recty.toString());
                svgRectangle.setAttribute('width', rectw.toString());
                svgRectangle.setAttribute('height', recth.toString());
                svgRectangle.setAttribute('stroke', 'black');
                svgRectangle.setAttribute('stroke-width', '1');
                svgRectangle.setAttribute('fill', 'black');
                svg.appendChild(svgRectangle);
            }
        }
        /* draw the finger dots */
        i = 0;
        for (let strings of this.notation.notes) {
            let primary = true; /* the first fret for this string is the primary fret */
            for (let string of strings) {
                let stringCenter = Math.floor(i * stringSpacing) + margin;
                if (string && string > 0 && (this.notation.barres.indexOf(string) < 0)) {
                    /* set the relative fret when the diagram's first fret is not 1 */
                    let relativeFret = string;
                    if (this.notation.firstFret > 1) {
                        relativeFret -= this.notation.firstFret - 1;
                    }
                    let fingerCenter = Math.floor(fretSpacing * relativeFret) - Math.floor(fretSpacing * 0.5);
                    let svgCircle = document.createElementNS(W3NameSpace, 'circle');
                    svgCircle.setAttribute('cx', stringCenter.toString());
                    svgCircle.setAttribute('cy', fingerCenter.toString());
                    svgCircle.setAttribute('r', coordinates.radius.toString());
                    svgCircle.setAttribute('stroke', 'black');
                    svgCircle.setAttribute('stroke-width', '1');
                    svgCircle.setAttribute('fill', 'black');
                    if (!primary)
                        svgCircle.setAttribute('fill-opacity', '0'); /** transparent */
                    svg.appendChild(svgCircle);
                }
                primary = false; /* subsequent frets, if any, are secondary frets */
            }
            i += 1;
        }
        return svg;
    }
}
class Instrument {
    constructor(name, strings, frets, standardTuning) {
        this.name = name;
        this.strings = strings;
        this.frets = frets;
        this.standardTuning = standardTuning;
    }
}
