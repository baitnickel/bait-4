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
 * If all metadata values are to be returned as strings (or string arrays), set
 * the `stringMetadata` parameter to `true`. Otherwise non-string values will be
 * converted to Numbers, Booleans, and Nulls.
 * 
 * If parsing errors occur during instantiation, the `errors` property will be
 * set to true, and a list of error messages will be found in `metadataErrors`.
 * The `errorMessages` and `reportErrors` methods can be used to display error
 * messages.
 */
export class MarkdownDocument {
	metadata: any;
	text: string;
	textOffset: number;
	options: YAML.Options;
	errors: boolean;
	metadataErrors: string[];

	constructor( markdownDocument: string, yamlOnly = false, stringMetadata = false) {
		this.metadata = null;
		this.text = '';
		this.textOffset = -1;
		if (stringMetadata) this.options = {convertNulls: false, convertNumbers: false, convertBooleans: false};
		else this.options = {convertNulls: true, convertNumbers: true, convertBooleans: true};
		this.errors = false;
		this.metadataErrors = [];
		const metadataLines: string[] = [];
		const textLines: string[] = [];

		const lines = markdownDocument.trimEnd().split('\n');
		let inMetadata = (yamlOnly) ? true : false;
		let firstLine = true;
		let textOffset = 0;
		for (let line of lines) {
			if (firstLine && !line.trim()) continue; /* ignore empty lines at start of document */
			else if (firstLine && line.trimEnd() == YAML.Separator) {
				inMetadata = true;
				metadataLines.push(line);
			}
			else if (!yamlOnly && inMetadata && line.trimEnd() == YAML.Separator) {
				metadataLines.push(line);
				inMetadata = false;
			}
			else if (inMetadata) metadataLines.push(line);
			else {
				if (this.textOffset < 0) this.textOffset = textOffset;
				textLines.push(line);
			}
			firstLine = false;
			textOffset += 1;
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
		if (textLines.length) this.text = textLines.join('\n');
	}

	/**
	 * This is a convenience method which returns lines of error messages as
	 * HTML (the default) or plain text.
	 */
	errorMessages(html: boolean = true) {
		let messages = '';
		if (this.metadataErrors.length) {
			let heading = (html) ? '<h6>Metadata Errors:</h6>' : 'Metadata Errors:\n';
			let separator = (html) ? '<br>' : '\n';
			let errors = this.metadataErrors.join(separator)
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

