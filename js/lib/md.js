import * as YAML from './yaml.js';
/**
 * Given a string containing the contents of a text file, presumed to be a
 * markdown file that may or may not contain a YAML metadata header (front
 * matter), create an object having the properties:
 *
 * - `metadata`: a data object of type "any", containing metadata key:value
 *   pairs, if any
 * - `text`: the markdown text
 * - `textOffset`: the zero-based line number of the first `text` line
 *
 * If the file contains only YAML metadata lines without markdown text, and the
 * YAML lines are not preceded by a "---" line and followed by a "---" line, set
 * the `yamlOnly` parameter to `true`. Otherwise the lines will be treated as
 * markdown text.
 *
 * If all metadata values are to be returned as strings, let the
 * `convertStrings` parameter default to false. Otherwise values which represent
 * booleans and numbers will be converted to Numbers and Booleans.
 *
 * If parsing errors occur during instantiation, the `errors` property will be
 * set to true, and a list of error messages will be found in `metadataErrors`.
 * The `errorMessages` and `reportErrors` methods can be used to display error
 * messages.
 */
export class MarkdownDocument {
    constructor(markdownDocument, yamlOnly = false, convertStrings = false) {
        this.metadata = null;
        this.text = '';
        this.textOffset = -1;
        this.errors = false;
        this.metadataErrors = [];
        const metadataLines = [];
        const textLines = [];
        const lines = markdownDocument.trimEnd().split('\n');
        let inMetadata = (yamlOnly) ? true : false;
        let firstLine = true;
        let textOffset = 0;
        for (let line of lines) {
            if (firstLine && !line.trim())
                continue; /* ignore empty lines at start of document */
            else if (firstLine && line.trimEnd() == YAML.Separator) {
                inMetadata = true;
                metadataLines.push(line);
            }
            else if (!yamlOnly && inMetadata && line.trimEnd() == YAML.Separator) {
                metadataLines.push(line);
                inMetadata = false;
            }
            else if (inMetadata)
                metadataLines.push(line);
            else {
                if (this.textOffset < 0)
                    this.textOffset = textOffset;
                textLines.push(line);
            }
            firstLine = false;
            textOffset += 1;
        }
        if (metadataLines.length) {
            const yaml = new YAML.YAML(metadataLines);
            this.metadata = yaml.parse(convertStrings);
            if (yaml.exceptions.length) {
                this.errors = true;
                this.metadataErrors = yaml.exceptions;
            }
        }
        if (textLines.length)
            this.text = textLines.join('\n');
    }
    /**
     * Return an array of `sections` from `this.text`. Each section consists of
     * a single string, typically with embedded linefeeds. Sections are
     * separated by lines that match the Horizontal Rule pattern. There will
     * always be at least one section, though it may consist of only an empty
     * string.
     */
    sections() {
        const sections = [];
        const HORIZONTAL_RULE_PATTERN = /^((-+[ \t]{0,}){3,}|(_+[ \t]{0,}){3,}|(\*+[ \t]{0,}){3,})$/;
        const lines = this.text.split('\n');
        const sectionLines = [];
        for (const line of lines) {
            if (HORIZONTAL_RULE_PATTERN.test(line)) {
                if (sectionLines.length) {
                    sections.push(sectionLines.join('\n'));
                    sectionLines.splice(0);
                }
                else
                    sections.push('');
            }
            else
                sectionLines.push(line);
        }
        if (sectionLines.length)
            sections.push(sectionLines.join('\n'));
        return sections;
    }
    /**
     * This is a convenience method which returns lines of error messages as
     * HTML (the default) or plain text.
     */
    errorMessages(html = true) {
        let messages = '';
        if (this.metadataErrors.length) {
            let heading = (html) ? '<h6>Metadata Errors:</h6>' : 'Metadata Errors:\n';
            let separator = (html) ? '<br>' : '\n';
            let errors = this.metadataErrors.join(separator);
            errors = heading + errors;
            for (let error of this.metadataErrors) {
                console.log(`  ${error}`);
            }
            messages = heading + errors;
        }
        return messages;
    }
    /**
     * This is a convenience method which writes error messages to the console.
     */
    reportErrors() {
        if (this.metadataErrors.length) {
            console.log('Metadata Errors:');
            for (let error of this.metadataErrors) {
                console.log(`  ${error}`);
            }
        }
    }
}
