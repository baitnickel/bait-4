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
export class Markdown {
	metadata: any;
	text: string;
	textOffset: number;
	errors: boolean;
	metadataErrors: string[];

	constructor(markdown: string, yamlOnly = false, convertStrings = false) {
		this.metadata = null;
		this.text = '';
		this.textOffset = -1;
		this.errors = false;
		this.metadataErrors = [];
		const metadataLines: string[] = [];
		const textLines: string[] = [];

		const lines = markdown.trimEnd().split('\n');
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
			this.metadata = yaml.parse(convertStrings);
			if (yaml.exceptions.length) {
				this.errors = true;
				this.metadataErrors = yaml.exceptions;
			}
		}
		if (textLines.length) this.text = textLines.join('\n');
	}

	/**
	 * Return an array of metadata hashtags (without the hash). The array is
	 * empty when there are no hashtags in the metadata, or when there is no
	 * metadata.
	 * 
	 * Tags may be properly enclosed in brackets, or improperly a simple string
	 * of comma-separated tags.
	 */
	tags() {
		let tags: string[] = [];
		const keyword = 'tags';
		if (this.metadata !== null && this.metadata[keyword]) {
			if (Array.isArray(this.metadata[keyword])) tags = Array.from(this.metadata[keyword]);
			else tags = this.metadata[keyword].split(/\s*,\s*/);
		}
		return tags;
	}

	/**
	 * Divide the markdown text into sections and return an array of sections.
	 * Each section is a string, typically containing newline characters.
	 * Sections are separated by the Horizontal Rule pattern. Blank lines at the
	 * beginning and end of a section are removed. Sections containing only
	 * whitespace are ignored.
	 */
	sections() {
		const sections: string[] = [];
		const HORIZONTAL_RULE_PATTERN = /^_{3,}\s*$/gm;
		const sectionTexts = this.text.split(HORIZONTAL_RULE_PATTERN);
		for (let sectionText of sectionTexts) {
			if (sectionText.trim()) { /** ignore whitespace-only section */
				const sectionLines = sectionText.split('\n');
				/** set indices of start and end of non-blank lines */
				let start = -1;
				let end = -1;
				for (let i = 0; i < sectionLines.length; i += 1) {
					if (sectionLines[i].trim()) {
						if (start < 0) start = i;
						end = i;
					}
				}
				sections.push(sectionLines.slice(start, end + 1).join('\n'))
			}
		}
		return sections;
	}

	/**
	 * Divide the markdown text into paragraphs, each paragraph separated by a
	 * blank line, and return an array of paragraphs. First, we divide the text
	 * into sections, treating each section boundary as a paragraph boundary and
	 * removing the section Horizontal Rule markup.
	 */
	paragraphs() {
		const paragraphs: string[] = [];
		const PARAGRAPH_BOUNDARY_PATTERN = /\n\s*\n/gm;
		const sections = this.sections();
		for (const section of sections) {
			const sectionParagraphs = section.split(PARAGRAPH_BOUNDARY_PATTERN);
			for (const sectionParagraph of sectionParagraphs) {
				if (sectionParagraph.trim()) paragraphs.push(sectionParagraph);
			}
		}
		return paragraphs;
	}

	/**
	 * Divide the markdown text into lines, each line separated by a newline
	 * character, and return an array of lines. First, we divide the text into
	 * sections, removing the section Horizonal Rule markup.
	 */
	lines() {
		const lines: string[] = [];
		const sections = this.sections();
		for (const section of sections) {
			const rawLines = section.split('\n');
			for (const rawLine of rawLines) {
				if (rawLine.trim()) lines.push(rawLine.trimEnd()); // or trim() and lose indentation?
			}
		}
		return lines;
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
