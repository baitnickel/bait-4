import { MarkupLine } from './markup.js';
/**
 * Fakesheet files are markdown (.md) files, typically containing a YAML
 * metadata header to set properties:
 * - title
 * - artist
 * - composers
 * - key
 * - capo
 * - tuning
 * - tempo
 * - copyright
 * - placeholder
 * - chords
 *
 * FakeSheet.placeholder in normal (lyric) line is replaced by the next
 * chord in the section's chord sequence.
 *
 * Section names begin with FAKESHEET.tokenCharacter
 * Section names contain non-whitespace characters.
 * Section names are case-insensitive.
 * Section declarations define a chord sequence and/or make a chord sequence current:
 * - token chord chord chord (defines a sequence and makes it current)
 * - token (makes an already defined sequence current)
 * When a Section name begins with FAKESHEET.tokenCharacter + FAKESHEET.inlinePrefix,
 * it's an inline sequence (chords are placed on same line as text), e.g.,
 *   ..intro C F G
 *   | ^ | ^ | ^ |
 *
 * Fakesheet files may contain comments (inline or whole line);
 * they begin with FAKESHEET.commentPattern.
 *
 * @todo
 * - Fix line spacing
 * - Do not display Tuning if it is not in metadata (equals default)
 * - Not only capo, but tuning and chords declarations should vanish on newKey
 * - Support a library of chord diagrams, particularly for newKeys
 */
/**
 * The 'Notes' array contains 12 elements, representing the chromatic scale.
 * Each element is, itself, an array--most notes are entered in single-element
 * arrays, while enharmonic notes are entered in two-element arrays. Notes are
 * ordered from C to B, corresponding to Scientific Pitch Notation (aka "MIDI
 * Note") sequencing.
 *
 * The `ValidNote` regular expression contains a flattened copy of `Notes`, with
 * the 2-character notes (sharps and flats) sorted to the top. This sorting
 * supports the proper splitting of `Chord` strings into segments, while also
 * supporting the validation of note names.
 */
const Notes = [['C'], ['C#', 'Db'], ['D'], ['D#', 'Eb'], ['E'], ['F'], ['F#', 'Gb'], ['G'], ['G#', 'Ab'], ['A'], ['A#', 'Bb'], ['B']];
const ValidNote = new RegExp(`(${Notes.flat().sort((a, b) => b.length - a.length).join('|')})`);
/**
 * Given a note name, return its `Notes` index (0...11) or -1 if the note
 * name is invalid.
 */
function NoteIndex(noteName) {
    return Notes.findIndex((elements) => elements.includes(noteName));
}
/**
 * Given a `pitch` and an optional `key` name, return the pitch's note name.
 * Enharmonic note names are resolved by rule, according to key signatures. The
 * rule for C/Am is somewhat arbitrary, using sharps except for Bb and Eb. When
 * either the pitch or the key is invalid, return an empty string.
 */
function PitchName(pitch, key = 'C') {
    let noteName = '';
    const validationKey = (key.endsWith('m')) ? key.slice(0, -1) : key;
    if (ValidNote.test(validationKey) && pitch >= 0 && pitch < 128) {
        const flatKey = (key.includes('b') || ['F', 'Cm', 'Dm', 'Fm', 'Gm'].includes(key));
        const sharpKey = (key.includes('#') || ['A', 'B', 'D', 'E', 'G', 'Bm', 'Em'].includes(key));
        pitch = pitch % Notes.length;
        const notes = Notes[pitch];
        if (notes.length == 1)
            noteName = notes[0];
        else {
            const flatNote = (notes[0].endsWith('b')) ? notes[0] : notes[1];
            const sharpNote = (notes[0].endsWith('b')) ? notes[1] : notes[0];
            if (flatKey)
                noteName = flatNote;
            else if (sharpKey)
                noteName = sharpNote;
            else if (['Bb', 'Eb'].includes(flatNote))
                noteName = flatNote;
            else
                noteName = sharpNote;
        }
    }
    return noteName;
}
/**
 * Given a `pitch` number (0...127), return its Scientific Pitch Notation (SPN),
 * a note name, showing either the flat or sharp enharmonic note based on the
 * given `key`, and a number identifying the pitch's octave. Can be used in a
 * loop to produce a list of pitches and note names.
 */
export function SPN(pitch, key = 'C') {
    const note = PitchName(pitch, key);
    const octave = Math.floor(pitch / Notes.length) - 1;
    return `${note}${octave}`;
}
function PrettyChord(chordName) {
    chordName = chordName.replace(/b/g, '♭');
    chordName = chordName.replace(/#/g, '♯');
    return chordName;
}
export const FAKESHEET = {
    version: '2025.10.16',
    commentPattern: /(^\/{2}|\s\/{2}).*/, /* comments follow double-slash at line start or after whitespace */
    tokenCharacter: '.',
    inlinePrefix: '.',
    /**
     * The first placeholder is the default; avoid characters that can be part
     * of a chord name or the comment pattern or inline markdown.
     */
    chordPlaceholders: ['^', '%', '@', '$'],
    /**
     * The whitespace chord-notation separator allows the chord list to be
     * prettified with multiple spaces. For example:
     *
     * chords:
     *   - C        x32010
     *   - C7       x32310
     *   - C(sus4)  x3(2,3)010
     */
    chordNotationSeparator: /\s+/, /* separates chord name from chord notation */
    chordSpacing: 2, /* minimum number of spaces between chords on chord line */
    space: '\u{00a0}', /* unicode no-break space */
    tabSize: 4, /* tabs in source documents are replaced with this many spaces */
    chordLine: 'C',
    lyricLine: 'L',
    removeLeadingBlanks: true,
    removeTrailingBlanks: true,
};
const Instruments = new Map();
/** the first instrument here will be used as the default instrument */
Instruments.set('guitar', { frets: 22, tunings: [40, 45, 50, 55, 59, 64] });
Instruments.set('mandolin', { frets: 20, tunings: [55, 62, 69, 76] });
Instruments.set('ukulele-baritone', { frets: 20, tunings: [50, 55, 59, 64] });
Instruments.set('ukulele-soprano', { frets: 20, tunings: [67, 60, 64, 69] });
export class Instrument {
    name; /* instrument name */
    strings; /* guitar 6, ukulele 4, piano 88 */
    frets; /* guitar 22, piano 0 */
    pitches; /* pitch numbers of the instrument's open strings (0...127) */
    constructor(name, alternateTunings = []) {
        const defaultInstrument = Instruments.keys().next().value;
        this.name = name.toLowerCase();
        const instrument = (Instruments.has(this.name)) ? Instruments.get(this.name) : Instruments.get(defaultInstrument);
        this.strings = instrument.tunings.length;
        this.frets = instrument.frets;
        this.pitches = instrument.tunings.slice();
        if (alternateTunings.length)
            this.updatePitches(alternateTunings);
    }
    /**
     * Given an array of note names (e.g., from `alternateTuning` or
     * `Fakesheet.tuning`), update each pitch in `this.pitches` by determining
     * the offset between the original pitch and the new pitch.
     */
    updatePitches(notes) {
        for (let i = 0; i < this.pitches.length && i < notes.length; i += 1) {
            let offset = 0;
            let pitchIndex = this.pitches[i] % Notes.length; /** get 0 ... 11 for pitch */
            const newIndex = NoteIndex(notes[i]);
            if (newIndex >= 0) {
                const half = Notes.length / 2;
                offset = newIndex - pitchIndex;
                if (offset >= half)
                    offset -= Notes.length;
                else if (offset < -half)
                    offset += Notes.length;
            }
            this.pitches[i] += offset;
        }
    }
}
export class FakeSheet {
    title; /* song title */
    artist; /* performing/composing artist name(s) */
    composers; /* list of song composers */
    key; /* song's (initial) key (e.g., FAKESHEET.chordLine, 'Bb', 'Am') */
    newKey; /* new key for transposition */
    capo; /* capo position (or 0 for none) */
    instrument; /* musical instrument */
    tuning; /* open string notes (e.g., ['E','A','D','G','B','E']) */
    tempo; /* beats per minute */
    copyright; /* copyright info, to be displayed following copyright symbol */
    chords; /* Chord objects, used to display chord diagrams */
    placeholder; /* chord placeholder */
    metadata; /* metadata from source text */
    lines; /* source text of fakesheet */
    sections; /* Section objects */
    chordsUsed; /* unique list of chord names used, ordered by appearance */
    errors; /* error messages written into the fakesheet */
    /**
     * 'chords' is set of Chord objects defined in the 'chords' metadata in the
     * fakesheet source text. These are optional, required only if chord
     * diagrams are desired. We might someday have a "library" of standard
     * chords, read from a configuration file. The locally defined chords should
     * always take precedence, though.

     * In 'chordsUsed', we maintain a unique list of chord names appearing in
     * the fakesheet source text, ordered by occurrence. This list might also be
     * sorted alphabetically, via configuration options. It will be used to
     * select which chord diagrams from the list of 'chords' will be rendered.
     * Currently, diagrams are rendered only when the original musical key is
     * selected.

     * Chord names are modified to use unicode: '♭' and '♯' as a final rendering
     * step . See 'function PrettyChord'.
     */
    /**###
     * all optional parameters might be passed in an Options object (even key
     * change?), declared and exported here. Should be able to specify
     * Instrument, placeholder, key, maybe even source text? What would it mean
     * to instantiate a FakeSheet object without any parameters? Maybe it
     * triggers an "open local file" dialog? Running the parsing methods should
     * be optional, either one or both or neither should produce expected
     * results.
     */
    constructor(fakeSheet) {
        this.title = '(untitled)';
        this.artist = '';
        this.composers = '';
        this.key = null;
        this.newKey = null;
        this.capo = 0;
        this.instrument = new Instrument('Guitar');
        this.tuning = []; /** when not set, defaults to the Instrument's standard tuning */
        this.tempo = 0;
        this.copyright = '';
        this.placeholder = FAKESHEET.chordPlaceholders[0];
        this.chords = [];
        this.metadata = fakeSheet.metadata;
        this.lines = fakeSheet.text.split('\n');
        this.sections = [];
        this.chordsUsed = [];
        this.errors = [];
        this.parseMetadata();
        this.parseSourceText(fakeSheet.textOffset);
    }
    parseSourceText(textOffset) {
        let currentSection = null;
        let lineNo = textOffset;
        for (let line of this.lines) {
            lineNo += 1;
            const comment = FAKESHEET.commentPattern.test(line);
            line = line.replace(FAKESHEET.commentPattern, '');
            const trimmedLine = line.trim();
            const commentOnly = comment && !trimmedLine;
            const firstChar = (trimmedLine) ? trimmedLine[0] : '';
            if (firstChar == FAKESHEET.tokenCharacter) {
                /** Section token line */
                let parameters = trimmedLine.split(/\s+/);
                const token = parameters.shift().toLowerCase().slice(1);
                if (token)
                    currentSection = this.newSection(currentSection, token, parameters, lineNo);
                else
                    this.addError('Ignoring null token name', lineNo);
            }
            else if (!commentOnly) {
                /** Lyric line */
                if (currentSection)
                    currentSection.addLine(line);
                else if (trimmedLine)
                    this.addError('Ignoring line before first section', lineNo);
            }
        }
    }
    parseMetadata() {
        if (this.metadata === null)
            return;
        const metaMap = new Map();
        metaMap.set('title', this.setTitle);
        metaMap.set('artist', this.setArtist);
        metaMap.set('composers', this.setComposers);
        metaMap.set('key', this.setKey);
        metaMap.set('capo', this.setCapo);
        metaMap.set('tuning', this.setTuning);
        metaMap.set('tempo', this.setTempo);
        metaMap.set('copyright', this.setCopyright);
        metaMap.set('placeholder', this.setPlaceholder);
        metaMap.set('chords', this.setChords);
        /**
         * YAML parsing does not allow duplicate keywords, so the last entry is
         * the only one recorded. Keywords with a null or whitespace value will
         * be ignored.
         */
        metaMap.forEach((method, propertyName) => {
            let rawValues = this.metadata[propertyName];
            if (propertyName in this.metadata && rawValues) {
                /** values is always an array; scalar values are treated as single-element arrays */
                let values = [];
                if (Array.isArray(rawValues)) {
                    for (let value of rawValues)
                        values.push(`${value}`);
                }
                else
                    values.push(`${rawValues}`);
                /**
                 * Passing 'this' below gives the called method the FakeSheet object context
                 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
                 */
                method.call(this, propertyName, values);
            }
        });
    }
    setTitle(propertyName, values) {
        this.title = values.join(' ');
    }
    setArtist(propertyName, values) {
        this.artist = values.join(' ');
    }
    setComposers(propertyName, values) {
        const conjunction = 'and';
        let joinedList = '';
        if (values.length) {
            let separator = (values.length == 2) ? ` ${conjunction} ` : ', ';
            joinedList = values.join(separator);
            if (values.length > 2) {
                let lastComma = joinedList.lastIndexOf(', ');
                joinedList = `${joinedList.slice(0, lastComma + 1)} ${conjunction} ${joinedList.slice(lastComma + 2)}`;
            }
        }
        this.composers = joinedList;
    }
    setKey(propertyName, values) {
        let lookupKey = values[0];
        if (lookupKey.length > 1 && lookupKey.endsWith('m')) {
            lookupKey = lookupKey.slice(0, -1);
        }
        if (!ValidNote.test(lookupKey)) {
            this.addError(`Ignoring invalid ${propertyName} value: ${values[0]}`);
        }
        else {
            this.key = new Chord(values[0]);
            /* ignore new key if it is the same as the propertyName key */
            if (this.newKey && this.newKey.root == this.key.root)
                this.newKey = null;
        }
    }
    /**
     * Best practice is to explicitly name the song's key using the "key"
     * metadata propertyName, but if this isn't done this method will be called to
     * derive the key from the first chord encountered (e.g., in a "chord"
     * declaration or section declaration).
    */
    deriveKey(chordName) {
        let chord = new Chord(chordName);
        if (chord.base)
            this.key = new Chord(chord.base);
    }
    setCapo(propertyName, values) {
        let capo = Number(values[0]);
        if (isNaN(capo) || capo < 0 || capo > this.instrument.frets) {
            this.addError(`Ignoring invalid ${this.instrument.name} ${propertyName} position: ${values[0]}`);
        }
        else
            this.capo = capo;
    }
    setTuning(propertyName, values) {
        /**
         * Tuning must be defined before chords. We enforce this through the
         * order of the default instrument and tuning assignments in the
         * constructor, and through the parseMetadata map insertion order.
         */
        if (this.chords.length) {
            this.addError(`${propertyName} must be defined before chords`);
        }
        else {
            let compressedNotes = '';
            let invalidNotes = [];
            for (let value of values)
                compressedNotes += value.trim();
            /** Remove punctuation characters that may be used as note separators (,:;_-/.)
             * This allows the user to enter tunings like: E-A-D-G-B-E.
             */
            compressedNotes = compressedNotes.replace(/[,:;_\-\/\.]/g, '');
            let notes = [];
            for (let compressedNote of compressedNotes) {
                if (notes.length == 0 || 'ABCDEFG'.includes(compressedNote)) {
                    notes.push(compressedNote);
                }
                else {
                    notes[notes.length - 1] = notes[notes.length - 1] + compressedNote;
                }
            }
            for (let note of notes) {
                if (!ValidNote.test(note))
                    invalidNotes.push(note);
            }
            if (invalidNotes.length) {
                this.addError(`${propertyName} contains invalid values: ${invalidNotes.join(' ')}`);
            }
            else if (notes.length != this.instrument.strings) {
                let errorMessage = `${this.instrument.name} ${propertyName} requires exactly `;
                errorMessage += `${this.instrument.strings} notes, but ${notes.length} `;
                errorMessage += `are provided: ${notes.join(' ')}`;
                this.addError(errorMessage);
            }
            else {
                this.tuning = notes;
                this.instrument.updatePitches(notes);
            }
        }
    }
    setTempo(propertyName, values) {
        let tempo = Number(values[0]);
        if (isNaN(tempo) || tempo < 20 || tempo > 400) {
            this.addError(`Ignoring invalid tempo: ${values[0]}`);
        }
        else
            this.tempo = tempo;
    }
    setCopyright(propertyName, values) {
        this.copyright = values.join(' ');
    }
    setPlaceholder(propertyName, values) {
        let placeholder = values.join(' ');
        if (!FAKESHEET.chordPlaceholders.includes(placeholder)) {
            this.addError(`Ignoring invalid placeholder: ${placeholder}`);
            this.addError(`...valid placeholders are: ${FAKESHEET.chordPlaceholders.join(' ')}`);
            this.placeholder = FAKESHEET.chordPlaceholders[0];
        }
        else
            this.placeholder = placeholder;
    }
    /**
     * Here we encounter values indicating chord name and notation,
     * separated by FAKESHEET.chordNotationSeparator (e.g. "C x32010").
     * For every valid value, create or update an entry in 'this.chords'.
     * Entries may already exist if a chord was previously referenced in a
     * lyric-chord line or if referenced more than once in this propertyName.
    */
    setChords(propertyName, values) {
        for (let value of values) {
            let words = value.split(FAKESHEET.chordNotationSeparator);
            if (words.length != 2)
                this.addError(`Ignoring invalid ${propertyName}: ${value}`);
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
                    this.addError(`Ignoring attempt to redefine ${propertyName}: ${value}`);
                else {
                    let chord = new Chord(chordName, this.instrument, chordNotation);
                    if (chordNotation && chord.notation !== null && chord.notation.valid) {
                        this.chords.push(chord);
                        /** If the key hasn't already been established, set it from this chord */
                        if (!this.key)
                            this.deriveKey(chordName);
                    }
                    else
                        this.addError(`Ignoring ${propertyName} with invalid notation: ${value}`);
                }
            }
        }
    }
    newSection(currentSection, sectionName, chordNames, lineNo) {
        let existingSection = null;
        let chords = [];
        for (let section of this.sections) {
            if (section.name == sectionName) {
                existingSection = section;
                break;
            }
        }
        if (existingSection && chordNames.length) {
            this.addError(`Cannot redefine section: ${sectionName}`, lineNo);
        }
        else if (!existingSection && !chordNames.length) {
            this.addError(`Section definition requires chords: ${sectionName}`, lineNo);
        }
        else {
            if (existingSection)
                chords = existingSection.chords;
            else {
                for (let chordName of chordNames) {
                    chords.push(new Chord(chordName)); //### validate each chord, raise errors?
                }
            }
            currentSection = new Section(sectionName, chords, this.placeholder);
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
        let fakeLines = [];
        for (let section of this.sections) {
            for (let fakeLine of section.fakeLines(this.key, this.newKey)) {
                fakeLines.push(fakeLine);
            }
        }
        return fakeLines;
    }
    lyrics(indent = true) {
        /** Return lyrics as lines of text */
        const lines = [];
        const fakeLines = this.fakeSheetLines();
        for (let fakeLine of fakeLines) {
            if (fakeLine.type == FAKESHEET.lyricLine) {
                fakeLine.text = fakeLine.text.trim();
                fakeLine.text = fakeLine.text.replace(/\s{2,}/g, ' '); /* condense spaces */
                if (indent) {
                    fakeLine.text = FAKESHEET.space.repeat(fakeLine.indentation) + fakeLine.text;
                }
                lines.push(fakeLine.text);
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
    /**
     * When a new song key has been selected (via the drop-down selection
     * element generated by the 'html' method), an event is raised and
     * handled by the calling program, which calls this method to regenerate
     * the HTML.
    */
    changeKey(newKey) {
        this.newKey = new Chord(newKey);
        if (!this.newKey.base || this.newKey.base == this.key.base)
            this.newKey = null;
    }
    /**
     * Return an array of all valid tonic notes in pitch order, including both
     * enharmonic sharps and flats. When the `unicode` flag is set to true, the
     * "b" and "#" characters are replaced with the unicode "♭" and "♯"
     * characters, respectively.
     */
    tonics(unicode = false) {
        let adjustedTonics = [];
        for (let tonic of Notes.flat()) {
            if (unicode)
                tonic = PrettyChord(tonic);
            adjustedTonics.push(tonic);
        }
        return adjustedTonics;
    }
    addError(text, lineNo = 0) {
        if (lineNo)
            this.errors.push(`Line ${lineNo}: ${text}`);
        else
            this.errors.push(`metadata: ${text}`);
    }
}
class Section {
    name; /* section name as provided in fakesheet source text (token) */
    chords; /* a list of Chord objects */
    lines; /* lyric/chord lines from fakesheet source text for this section */
    inline; /* true if inline section (text and chords merged into single lines) */
    placeholder; /* chord placeholder */
    constructor(name, chords, placeholder) {
        this.name = name;
        this.chords = chords;
        this.lines = [];
        this.inline = name.startsWith(FAKESHEET.inlinePrefix);
        this.placeholder = placeholder;
    }
    addLine(line) {
        if (line) {
            /**
             * Separate consecutive chord placeholders and ensure that line does
             * not end with a chord placeholder character.
             */
            const joinedPlaceholders = this.placeholder.repeat(2);
            const separatedPlaceholders = this.placeholder + ' ' + this.placeholder;
            while (true) {
                let alteredLine = line.replace(joinedPlaceholders, separatedPlaceholders);
                if (line == alteredLine)
                    break;
                line = alteredLine;
            }
            line = line.trimEnd();
            if (line.endsWith(this.placeholder))
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
                /** determine how many spaces of indentation are in the line */
                let indentation = 0;
                const indented = line.match(/^(\s*)/);
                if (indented)
                    indentation = indented[1].length;
                if (this.inline) {
                    /* chords and text go on one line */
                    while (true) {
                        let pos = line.indexOf(this.placeholder);
                        if (pos < 0)
                            break;
                        let chord = this.chords[currentChord];
                        let chordName = chord.name;
                        if (newKey) {
                            chord = chord.transpose(key, newKey);
                            chordName = chord.name;
                        }
                        chordName = PrettyChord(chordName);
                        line = line.replace(this.placeholder, chordName);
                        currentChord = (currentChord + 1) % this.chords.length;
                    }
                    let fakeLine = { type: FAKESHEET.chordLine, indentation: indentation, text: line };
                    fakeLines.push(fakeLine);
                }
                else if (line.trim() == '') {
                    /* treat a blank line as an empty lyrics line */
                    let fakeLine = { type: FAKESHEET.lyricLine, indentation: indentation, text: line };
                    fakeLines.push(fakeLine);
                }
                else {
                    /* produce two lines, one for chords and one for lyrics */
                    let addChord = false;
                    for (let character of line) {
                        if (character == this.placeholder)
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
                                chordName = PrettyChord(chordName);
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
                    if (chordsLine) {
                        let fakeLine = { type: FAKESHEET.chordLine, indentation: indentation, text: chordsLine };
                        fakeLines.push(fakeLine);
                    }
                    if (lyricsLine) {
                        let fakeLine = { type: FAKESHEET.lyricLine, indentation: indentation, text: lyricsLine };
                        fakeLines.push(fakeLine);
                    }
                }
            }
        }
        return fakeLines;
    }
}
const W3NameSpace = 'http://www.w3.org/2000/svg';
export class Chord {
    name; /** chord name (in original key, e.g., 'Dbm7/Ab') */
    instrument; /** Instrument object */
    stringCount; /** number of strings (derived from 'instrument') */
    notation; /** Notation object */
    root; /** root note (e.g., 'Db') */
    base; /** base of chord (or key) (e.g., 'Dbm') */
    minor; /** true if this.base ends with 'm' */
    noteIndices; /** sequential list of Note indices (e.g., 'Dbm7/Ab' contains 2 indices: [1, 8] (for 'Db' and 'Ab') */
    modifiers; /** sequential list of modifiers (e.g., 'Dbm7/Ab' contains three modifiers: ['', 'm7/', and ''] */
    static Intervals = [
        ['1'],
        ['b2'], /*'b9'*/
        ['2', '9'],
        ['b3'], /*'#9'*/
        ['3'],
        ['4', '11'],
        ['b5'], /*'#11'*/
        ['5'],
        ['#5'], /*'b13'*/
        ['6', '13'],
        ['b7'],
        ['7']
    ];
    constructor(name, instrument = null, notation = '') {
        this.name = name;
        this.instrument = instrument;
        this.stringCount = (instrument) ? instrument.strings : 0;
        this.notation = (notation) ? new Notation(notation, this.stringCount) : null; /* consumers must check Notation.valid */
        this.root = '';
        this.base = '';
        this.minor = false;
        this.noteIndices = [];
        this.modifiers = [];
        this.parseChordName();
    }
    /**
     * A chord name is split into a list of segments, where segments are
     * alternating modifiers and notes, e.g.: 'Dbm7/Ab' has segments '', 'Db',
     * 'm7/', 'Ab', ''. The first and last segments are always modifiers (often
     * ''). The modifiers will always be even-numbered segments (0, 2, ...),
     * while the notes will always be odd-numbered segments (1, 3, ...). We
     * store these segments in two separate lists: a list of modifiers and a
     * list of note numbers, where note numbers are indexes of the note name in
     * the Notes constant. So, the example above would become: modifiers:
     * ['','m7/',''] and note numbers: [1,8]. Transposition is done by
     * offsetting the note numbers.
     */
    parseChordName() {
        const segments = this.name.split(ValidNote);
        this.modifiers = segments.filter((segment, i) => i % 2 == 0);
        const notes = segments.filter((segment, i) => i % 2 != 0);
        for (const note of notes)
            this.noteIndices.push(NoteIndex(note));
        this.root = this.base = notes[0];
        if (this.modifiers[1].startsWith('m') && !this.modifiers[1].startsWith('maj')) {
            this.base += 'm';
            this.minor = true;
        }
    }
    /**
     * Return the twelve note names representing the 12-tone scale of this Chord
     * (typically based on the song's key). Resolve enharmonic notes by rule,
     * according to key signatures. The rule for C/Am is somewhat arbitrary,
     * based on my personal preferences: using sharps except for Bb and Eb).
    */
    scale() {
        const notes = [];
        for (let i = 0; i < Notes.length; i += 1) {
            notes.push(PitchName(i, this.base));
        }
        return notes;
    }
    /**
     * Given "from key" and "to key" Chord objects, transpose this Chord to
     * the new key.
    */
    transpose(fromKey, toKey) {
        let scale = toKey.scale();
        let interval = toKey.noteIndices[0] - fromKey.noteIndices[0];
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
            else if (i % 2 != 0 && nextNumber < this.noteIndices.length) {
                noteNumber = this.noteIndices[nextNumber] + interval;
                if (noteNumber < 0)
                    noteNumber += scale.length;
                else if (noteNumber >= scale.length)
                    noteNumber -= scale.length;
                newChordName += scale[noteNumber];
                nextNumber += 1;
            }
            if (nextModifier >= this.modifiers.length && nextNumber >= this.noteIndices.length) {
                break;
            }
            i += 1;
        }
        return new Chord(newChordName);
    }
    /**
     * Given a capo position, return a new Chord object representing the
     * effective key. E.g., if this.base is 'Am' and the capo is 2, we would
     * return a 'Bm' Chord.
    */
    effectiveKey(capo) {
        let noteNumber = this.noteIndices[0] + capo;
        if (noteNumber >= Notes.length)
            noteNumber -= Notes.length;
        let scale = this.scale();
        let key = scale[noteNumber];
        if (this.minor)
            key += 'm';
        return new Chord(key);
    }
    /**
     * Given a key and capo as selected in the fakesheet, return the capo
     * position required to play the song in the original effective key,
     * using the key represented by this Chord.
    */
    suggestedCapo(key, capo) {
        let suggestedCapo = 0;
        let effectiveKey = key.effectiveKey(capo);
        suggestedCapo = effectiveKey.noteIndices[0] - this.noteIndices[0];
        if (suggestedCapo < 0)
            suggestedCapo += Notes.length;
        return suggestedCapo;
    }
    /**
     * Return an array of interval numbers (or note names, when the `noteNames`
     * option is true) corresponding to the notes of the Chord. Where there are
     * multiple notes on a string, we will consider only the primary (first)
     * one. The Chord.root note is assigned interval 1 and the other notes are
     * offsets from the root.
     *
     * intervals: 1, b2, 2/9, b3, 3, 4/11, b5, 5, #5, 6/13, b7, 7
     *
     * Secondary interval values are used once the notes have entered the second
     * (or later) octave of the chord's notes.
     */
    intervals(noteNames = false) {
        const intervals = [];
        const intervalPairs = [];
        const names = [];
        const rootIndex = NoteIndex(this.root);
        let seventh = false; /** does chord contain 'b7' or '7'? */
        if (this.instrument !== null && this.notation !== null && rootIndex >= 0) {
            let firstRoot = 0;
            const notes = this.notation.notes;
            const primaryPitch = 0;
            for (let instrumentString = 0; instrumentString < this.instrument.strings; instrumentString += 1) {
                if (isNaN(notes[instrumentString][0]))
                    continue; /** ignore "x" (unplayed) strings */
                /** determine the pitch of the fretted string, the SPN note name, and the octave */
                const openStringPitch = this.instrument.pitches[instrumentString];
                const frettedPitch = openStringPitch + notes[instrumentString][primaryPitch];
                const octave = (!firstRoot) ? 0 : Math.floor((frettedPitch - firstRoot) / Notes.length);
                /** determine the interval pair (e.g., ['1'], ['2','9'] ...) */
                const notesIndex = frettedPitch % Notes.length;
                const intervalsIndex = (rootIndex <= notesIndex) ? notesIndex - rootIndex : notesIndex + Notes.length - rootIndex;
                let intervalPair = Chord.Intervals[intervalsIndex].slice(); /** create shallow copy */
                if (intervalsIndex >= 10)
                    seventh = true;
                if (intervalsIndex == 0) {
                    if (!firstRoot)
                        firstRoot = frettedPitch;
                    if (octave > 0)
                        intervalPair[0] += `'`.repeat(octave); /** number of ticks is distance between octaves */
                }
                names.push(SPN(frettedPitch, this.base));
                intervalPairs.push(intervalPair);
            }
            /** when the chord contains a seventh interval, use the secondary value (i.e., '9', '11', '13') */
            for (const intervalPair of intervalPairs) {
                if (!seventh || intervalPair.length == 1)
                    intervals.push(intervalPair[0]);
                else
                    intervals.push(intervalPair[1]);
            }
        }
        return (noteNames) ? names : intervals;
    }
    /**
     * Given the `intervals` in a chord, return a string of unique intervals
     * sorted by position relative to the root note (1), separated by
     * hyphens--e.g., '1-3-5', '1-b3-5-b7'. This return value can be used as the
     * key to a map created from a YAML file such as:
     *
     * -  1-3-5-b7: 7
     * -  1-3-5:
     * -  1-b3-5-b7: m7
     */
    intervalPattern(intervals, addRoot = false) {
        const intervalSet = new Set();
        const rankedIntervals = [];
        for (let i = 0; i < 2; i += 1) {
            for (const intervals of Chord.Intervals) {
                if (i == 0 || intervals.length > 1)
                    rankedIntervals.push(intervals[i]);
            }
        }
        /** ignore interval 1 w/ ticks: 1', 1'', etc. by ensuring that interval is included in rankedIntervals */
        for (const interval of intervals)
            if (rankedIntervals.includes(interval))
                intervalSet.add(interval);
        const uniqueIntervals = Array.from(intervalSet.values());
        uniqueIntervals.sort((a, b) => rankedIntervals.indexOf(a) - rankedIntervals.indexOf(b));
        if (uniqueIntervals[0] != '1' && addRoot)
            uniqueIntervals.unshift('1'); /** the root is implied? */
        return uniqueIntervals.join('-');
    }
    /**
     * @todo support adding slash-bass note
     */
    modifier(intervals, addRoot = false) {
        const intervalPattern = this.intervalPattern(intervals, addRoot);
        const patternModifiers = [
            '1-3-5     major',
            '1-b3-5    m',
            '1-3-5-b7  7',
            '1-b3-5-b7 m7',
            '1-3-5-7   maj7',
            '1-3-(5-)?b7-9   9',
            '1-b3-(5-)?b7-9  m9',
            '1-b3-5-7        m-maj7',
            '1-3-(5-)?7-9    maj9',
            '1-(3-)?(5-)?b7-(9-)?11  11',
            '1-b3-5-b7-9-11          m11',
            '1-(3-)?(5-)?7-(9-)?11   maj11',
            '1-3-(5-)?b7-(9-)?(11-)?13   13',
            '1-b3-(5-)?b7-(9-)?(11-)?13  m13',
            '1-3-(5-)?7-(9-)?(11-)?13    maj13',
            '1-3-#5         +', // 'aug'
            '1-3-#5-b7      +7', // 'aug7'
            '1-b3-b5        °', // 'dim'
            '1-b3-b5-6      °7', // 6 is "double flat 7" (strange name)
            '1-b3-b5-b7     ø', // half diminished (m7b5)
            '1-b3-b5-b7-11  11b5', // half diminished w/ 11
            '1-b3-b7        m7(no5)',
            '1-2-5         sus2',
            '1-4-5         sus4',
            '1-4-5-6       6sus4',
            '1-4-5-6-9     6sus4-add9',
            '1-2-5-b7      7sus2',
            '1-4-5-b7      7sus4',
            '1-4-5-b7-9    9sus4',
            '1-4-5-b7-b9   sus4b9',
            '1-4-5-b7-13   13sus4',
            '1-4-5-9       sus4-add9',
            '1-2-3-4-5  add2/4', // e.g., D/G 554030
            '1-2-3-4    add4(no5)',
            '1-3-4-5    add4',
            '1-3-5-6    6',
            '1-b3-5-6   m6',
            '1-3-5-9    add9',
            '1-b3-5-9   m-add9',
            '1-3-5-13   add13',
        ];
        let chordModifier = '?';
        for (const patternModifier of patternModifiers) {
            const [pattern, modifier] = patternModifier.split(/\s+/);
            const regExp = new RegExp(`^${pattern}$`);
            if (regExp.test(intervalPattern)) {
                chordModifier = modifier;
                break;
            }
        }
        return chordModifier;
    }
    diagram(fontFamily = 'sans-serif', svgScaling = 0.85, stringSpacing = 16, diagramText = '') {
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
        /** Add chord name (or notation) to group container */
        coordinates = {
            x: fretPositionWidth,
            y: 0,
            width: nameWidth,
            height: nameHeight,
            radius: 0
        };
        text = {
            value: (diagramText) ? MarkupLine(diagramText, 'E') : MarkupLine(this.name, 'E'),
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
        svgText.innerHTML = PrettyChord(text.value);
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
    valid;
    notes; /** for each of the instrument's strings, a list of note(s) to be fretted */
    barres; /** a list of barred frets */
    stringCount; /** number of strings on the instrument */
    fretCount; /** misnamed? this is the default number of frets to be shown in the Chord diagram */
    firstFret; /** first fret displayed in Chord diagram */
    lowFret; /** lowest fret played */
    highFret; /** highest fret played */
    constructor(chordNotation, stringCount, fretCount = 5) {
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
