import * as YAML from './yaml.js';

export class Document {
	metadata: any;
	markdown: string;
	options: YAML.Options;
	errors: boolean;
	metadataErrors: string[];

	constructor(resourceText: string, yamlOnly: boolean = false) {
		this.metadata = null;
		this.markdown = '';
		this.options = { // ### set using parameter(s)
			convertNulls: true,
			convertNumbers: true,
			convertBooleans: true,
		};
		this.errors = false;
		this.metadataErrors = [];
		const metadataLines: string[] = [];
		const markdownLines: string[] = [];

		const lines = resourceText.trim().split('\n');
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
			else if (inMetadata) metadataLines.push(line);
			else markdownLines.push(line);
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
		if (markdownLines.length) this.markdown = markdownLines.join('\n').trim();
	}

	reportErrors() {
		if (this.metadataErrors.length) {
			console.log('Metadata Errors:');
			for (let error of this.metadataErrors) {
				console.log(`  ${error}`);
			}
		}
	}
}
