import * as YAML from './yaml.js';
/**
 * A MarkdownDocument object represents a document which may contain YAML
 * metadata as well as text.
 */
export class MarkdownDocument {
    constructor(markdownDocument, yamlOnly = false) {
        this.metadata = null;
        this.text = '';
        this.firstTextLine = 0;
        this.options = {
            convertNulls: true,
            convertNumbers: true,
            convertBooleans: true,
        };
        this.errors = false;
        this.metadataErrors = [];
        const metadataLines = [];
        const textLines = [];
        const lines = markdownDocument.trimEnd().split('\n');
        let inMetadata = (yamlOnly) ? true : false;
        let firstLine = true;
        let lineNumber = 0;
        for (let line of lines) {
            lineNumber += 1;
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
                if (this.firstTextLine == 0)
                    this.firstTextLine = lineNumber;
                textLines.push(line);
            }
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
        if (textLines.length)
            this.text = textLines.join('\n');
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
