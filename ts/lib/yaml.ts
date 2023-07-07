/**
 * Usage:
 *   const yaml = new YAML(text);
 *   // override default options before parsing (see below)
 *   const data = yaml.parse();
 *   yaml.reportExceptions();
 * Options:
 *   enable/disable individual exceptions
 *   enable/disable individual data type conversions, e.g.:
 *     yaml.options.convertNumbers = false;
 *     yaml.options.convertNulls = false;
 *     yaml.options.convertBooleans = false;

 * Syntax Rules:
 *   valid lines start with 'key:' or '-' (no plain text)
 *   invalid lines are ignored (reported in an error log if requested)
 *   values are resolved from zero or more expressions (in flow or block)
 *   a flow expression always follows a node's key on the same line
 *   a set of block expressions may only be introduced by a node without a value
 *   expressions may be object literals, array literals, or string literals
 */

type YAMLNode = {
	key: string;
	type: string;
	value: string;
	depth: number;
};

type Block = {
	parent: YAMLNode|null;
	type: string;
	depth: number;
	data: any;
};

export type Options = {
	convertNulls: boolean,
	convertNumbers: boolean,
	convertBooleans: boolean,
};

/* ### must also catch duplicate mapping keys */
const ERRORS = {
	noKey: 'plain text without key',
	wrongKeyType: 'key-type/block-type mismatch',
	invalidDepth: 'invalid indentation',
};

export const Separator = '---';
const SEQUENCE_KEY = '-';
const SEQ = 'sequence';
const MAP = 'mapping';
const STR = 'string';

export class YAML {
	lines: string[];
	nodes: YAMLNode[];
	exceptions: string[];
	options: Options;

	constructor(text: string|string[]) {
		if (typeof text == 'string') this.lines = text.trimEnd().split('\n');
		else this.lines = text;
		this.nodes = this.yamlNodes();
		this.exceptions = [];
		this.options = {
			convertNulls: true,
			convertNumbers: true,
			convertBooleans: true,
		};
	}

	/**
	 * A Block is a set of nodes having the same indentation depth. Every Block
	 * has one ParentNode, the node under which they are indented (the highest
	 * level Block is an exception--its parent is the variable in the calling
	 * program that receives the data returned by this method). YAML data
	 * typically consists of Blocks within Blocks.
	 *
	 * All nodes in a Block must have the same key type and same indentation
	 * depth. The end of a block is reached when a node is encountered which has
	 * a depth equal to or less than its parent node's depth.
	 *
	 * We are not supporting plain text YAML lines; every line must begin with
	 * '<key>:' or '-'. Long text may be entered as a sequence of lines
	 * (including empty lines).
	 */

	parse() {
		let blocks: Block[] = [];
		let parentNode: YAMLNode|null = null;
		let index = 0;
		for (let node of this.nodes) {
			
			/** a node with a value but no key is invalid */
			/**
			 * We may, at some point, want to allow these values if we are in a
			 * STR block, and the indentation is correct. STR blocks can be
			 * introduced by '<key>: <STR-type>' or '- <STR-type>', where
			 * 'STR-type' is an optional '>' or '|' (default is wordwrap). Block
			 * treats every node member/child as text until it reaches closure
			 * (higher depth), and all indentation until then is taken
			 * literally. The block's depth is the text's left margin. An empty
			 * line, usually ignored, must be treated as a properly indented
			 * newline. How do we handle lines starting with '#'? If we want to
			 * exclude these, we will need a way to identify them--maybe set
			 * their value to the single '#' character in this.yamlNodes(). We
			 * could also eliminate them in this.yamlNodes(), but then a
			 * YAMLNode object would need a line:number or index:number property
			 * to facilitate error messaging.
			 */
			if (!node.key && node.value && node.value.trimEnd() != Separator) {
				this.recordException(index, ERRORS['noKey']);
				continue;
			}
			else if (node.key) {

				/** create the initial block */
				if (blocks.length == 0) {
					let block = this.block(null, node);
					blocks.unshift(block);
				}
				/** create a new block when node is indented below a node without a value (parentNode) */
				else if (parentNode) {
					let block = this.block(parentNode, node);
					if (parentNode.depth >= node.depth) block.data = null;
					blocks.unshift(block);
					parentNode = null;
				}

				/** reject node if the its depth is invalid */
				if (!this.validDepth(blocks, node.depth)) {
					this.recordException(index, ERRORS['invalidDepth']);
				 	continue;
				}

				/** when node belongs to a previous block, roll up and remove the deeper block(s) */
				this.compactBlocks(blocks, node.depth);

				/** reject node having a type different than the block type */
				if (node.type != blocks[0].type) {
					this.recordException(index, ERRORS['wrongKeyType']);
					continue;
				}

				/** process current block node */
				if (node.depth == blocks[0].depth) {
					/** a node without a value is the parent of successive indented nodes (if any) */
					if (!node.value) parentNode = node;
					else {
						let nodeData = this.interpretValue(node.value);
						if (blocks[0].type == SEQ) blocks[0].data.push(nodeData);
						else blocks[0].data[node.key] = nodeData;
					}
				}
			}
			index += 1;
		}

		/** process dangling parentNode (last node is parent without children) */
		if (parentNode) {
			if (blocks[0].type == SEQ) blocks[0].data.push(null);
			else blocks[0].data[parentNode.key] = null;
		}

		/** compact the blocks data into the top-level block and return it */
		return this.compactBlocks(blocks);
	}

	block(parent: YAMLNode|null, child: YAMLNode) {
		let block: Block = {
			parent: parent,
			type: (child.key == SEQUENCE_KEY) ? SEQ : MAP,
			depth: child.depth,
			data: (child.key == SEQUENCE_KEY) ? [] : {},
		};
		return block;
	}

	compactBlocks(blocks: Block[], depth: number = 0) {
		/**
		 * The deepest Blocks (the leaves) are on the top of the (FILO) stack
		 * and the root Block is on the bottom of the stack (a bit
		 * counter-intuitive, perhaps). 'block[0]' is always the current Block,
		 * the Block where nodes are currently being processed. Here, we compact
		 * Blocks to the level specified in 'depth'.
		 *
		 * Return the data accumulated as we compact each block.
		 */
		let data: any = null;
		if (blocks.length) {
			while (blocks.length > 1 && blocks[0].parent && depth <= blocks[0].parent.depth) {
				if (blocks[0].parent.type == SEQ) blocks[1].data.push(blocks[0].data)
				else blocks[1].data[blocks[0].parent.key] = blocks[0].data;
				blocks.shift();
			}
			data = blocks[0].data;
		}
		return data;
	}

	validDepth(blocks: Block[], depth: number) {
		let valid = false;
		for (let block of blocks) {
			if (block.depth == depth) {
				valid = true;
				break;
			}
		}
		return valid;
	}

	yamlNodes() {
		/**
		 * Read an array of raw YAML text lines and return a corresponding array of
		 * YAMLNodes.
		 */
		let nodes: YAMLNode[] = [];
		const indentedText = /(\S+)/;
		const keyValue = /^\s*(\S+):\s+(.*)/;
		const sequenceValue = /^\s*(-)\s+(.*)/;
	
		for (let textLine of this.lines) {
			let key = '';
			let value = '';
			let depth = 0;
			textLine = this.removeComments(textLine);
			if (textLine.trim()) {
				/** appending a space to textLine ensures regex will work for key-only lines */
				let nodeMatch = `${textLine} `.match(keyValue);
				if (!nodeMatch) nodeMatch = `${textLine} `.match(sequenceValue);
				if (nodeMatch) {
					key = nodeMatch[1];
					value = (!nodeMatch[2]) ? '' : nodeMatch[2].trim();
				}
				else value = textLine.trim();
				let nodeText = textLine.match(indentedText);
				depth = (nodeText) ? nodeText.index! : 0;
			}
			let node: YAMLNode = {
				key: key, // 'key' (map), '-' (seq), or '' (str)
				type: (key == SEQUENCE_KEY) ? SEQ : MAP,
				value: value,
				depth: depth,
			};
			nodes.push(node);
		}
		return nodes;
	}

	convertValue(value: string) {
		let convertedValue: any = value;
		if (this.options.convertNumbers && !isNaN(Number(value))) {
			convertedValue = Number(value);
		}
		if (this.options.convertBooleans && ['true', 'false'].includes(value)) {
			convertedValue = (value == 'true') ? true : false;
		}
		if (this.options.convertNulls && value == 'null') {
			convertedValue = null;
		}
		return convertedValue;
	}

	interpretValue(value: string) {
		let data: any = null;
		if (value) {
			let matchMap = value.match(/^[\s]*{(.*)}[\s]*$/);
			let matchSequence = value.match(/^[\s]*\[(.*)\][\s]*$/);
			if (matchMap) data = this.flowMap(matchMap[1]);
			else if (matchSequence) data = this.flowSequence(matchSequence[1]);
			else data = this.convertValue(value);
		}
		return data;
	}
	
	flowMap(expression: string) {
		let data: any = {};
		const keyValues = this.commaSeparatedValues(expression);
		for (let keyValue of keyValues) {
			let substrings = keyValue.split(':');
			let key = substrings[0].trim();
			let value = null;
			if (substrings.length == 2) value = substrings[1].trim();
			if (substrings.length > 2) value = substrings.slice(1).join(' ').trim();
			if (value === null) data[key] = value;
			else data[key] = this.convertValue(value);
		}
		return data;
	}
	
	flowSequence(expression: string) {
		let data: any = [];
		const values = this.commaSeparatedValues(expression);
		for (let value of values) {
			data.push(this.convertValue(value.trim()));
		}
		return data;
	}
	
	removeComments(line: string) {
		let cleanLine = line;
		/** pattern is hash preceded by whitespace and not quoted */
		let pattern = /[\s]+#(?=([^"]*"[^"]*")*[^"]*$)/;
		if (line.trim()[0] == '#') cleanLine = ''; /** comment-only line */
		else {
			let matches = pattern.exec(cleanLine);
			if (matches !== null) {
				cleanLine = cleanLine.slice(0, matches.index).trimEnd();
			}
		}
		return cleanLine;
	}
	
	commaSeparatedValues(text: string) {
		let values: string[] = [];
		let pattern = /("[^"]+"|[^,]+)/g;
		let matches = text.match(pattern);
		if (matches !== null) {
			for (let match of matches) {
				match = match.trim();
				match = match.replace(/[\s]+/g, ' '); /** condense spaces */
				if (match.startsWith('"') && match.endsWith('"')) {
					match = match.slice(1,-1);
				}
				values.push(match);
			}
		}
		return values;
	}

	recordException(index: number, errorMessage: string) {
		let lineNumber = index + 1;
		this.exceptions.push(`[${lineNumber}] ${errorMessage}: ${this.lines[index].trim()}`);
	}
	
	reportExceptions() {
		let successfulResult = this.success();
		if (!successfulResult)
		{
			console.log('Exceptions:');
			for (let exception of this.exceptions) {
				console.log(`  ${exception}`);
			}
		}
		return successfulResult;
	}
	
	success() {
		return (this.exceptions.length) ? false : true;
	}
}

// /** test run */
// import * as FileSystem from './file-system.js';
// let vault = '/Users/dan/Library/Mobile Documents/iCloud~md~obsidian/Documents/main';
// let text = FileSystem.ReadText(`${vault}/content/as-far-as-i-know/Soldier Boy.md`);
// if (!text) console.log('cannot read file');
// let sections = splitDocument(text);
// const yaml = new YAML(sections[0]);
// // yaml.options.convertNumbers = false;
// // yaml.options.convertNulls = false;
// // yaml.options.convertBooleans = false;
// const data = yaml.parse();
// console.log(data);
// yaml.reportExceptions()
// for (let line of sections[1]) {
// 	console.log(line);
// }
