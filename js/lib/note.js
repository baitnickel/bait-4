import * as YAML from './yaml.js';
/**
 * A Note object represents a markdown document which may contain YAML
 * Front Matter (metadata).
 */
export class Note {
    constructor(note, yamlOnly = false) {
        this.metadata = null;
        this.markdown = '';
        this.options = {
            convertNulls: true,
            convertNumbers: true,
            convertBooleans: true,
        };
        this.errors = false;
        this.metadataErrors = [];
        const metadataLines = [];
        const markdownLines = [];
        const lines = note.trim().split('\n');
        let inMetadata = (yamlOnly) ? true : false;
        let firstLine = true;
        for (let line of lines) {
            if (firstLine && line.trimEnd() == YAML.Separator) {
                inMetadata = true;
                metadataLines.push(line);
            }
            else if (!yamlOnly && inMetadata && line.trimEnd() == YAML.Separator) {
                metadataLines.push(line);
                inMetadata = false;
            }
            else if (inMetadata)
                metadataLines.push(line);
            else
                markdownLines.push(line);
            firstLine = false;
        }
        if (metadataLines.length) {
            const yaml = new YAML.YAML(metadataLines);
            yaml.options.convertNumbers = this.options.convertNumbers;
            yaml.options.convertNulls = this.options.convertNulls;
            yaml.options.convertBooleans = this.options.convertBooleans;
            this.metadata = yaml.parse();
            if (yaml.exceptions.length) {
                this.errors = true;
                this.metadataErrors = yaml.exceptions;
            }
        }
        if (markdownLines.length)
            this.markdown = markdownLines.join('\n').trim();
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
