import * as YAML from './yaml.js';
/**
 * A Markdown object represents a markdown document, which may contain YAML
 * Front Matter (metadata).
 */
export class Markdown {
    constructor(document, yamlOnly = false) {
        this.text = '';
        this.metadata = null;
        this.options = {
            convertNulls: true,
            convertNumbers: true,
            convertBooleans: true,
        };
        this.errors = false;
        this.metadataErrors = [];
        const metadataLines = [];
        const textLines = [];
        const lines = document.trim().split('\n');
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
                textLines.push(line);
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
            this.text = textLines.join('\n').trim();
    }
    /**
     * This is a convenience method which writes to the console; web pages which
     * need to display these errors should loop over this.metadataErrors
     * themselves and display the errors on their page.
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
