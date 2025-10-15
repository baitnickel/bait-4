export const Separator = '---';
const SEQUENCE_KEY = '-';
const SEQ = 'sequence';
const MAP = 'mapping';
const STR = 'string';
const ERRORS = {
    noKey: 'plain text without key',
    duplicateKey: 'duplicate key',
    wrongKeyType: 'key-type/block-type mismatch',
    invalidDepth: 'invalid indentation',
};
/**
 * Usage:
 * - const yaml = new YAML(text);
 * - const data = yaml.parse();
 * - if (yaml.errors) yaml.reportExceptions();
 *
 * The source `text` may be either a string or an array of strings. `data` is a
 * type "any" object which may be examined or written to a file by converting it
 * to JSON, e.g.:
 * - const jsonText = JSON.stringify(data, null, '  ');
 *
 * By default, data values are all strings or nulls. Passing a boolean `true`
 * argument to the `parse` method will cause the parser to convert strings into
 * numbers or booleans, as appropriate.
 *
 * Syntax Rules:
 * - Valid lines start with 'keyName:' or '-', followed by the Map value or Sequence value (respectively)
 * - Plain text lines are not allowed (use Sequences instead)
 * - Invalid lines are ignored (reported in the exceptions log, if requested)
 * - Values may be listed on separate lines indented below their key line, or as flow expressions on the same line as the key
 * - Map (object) flow expressions are enclosed in braces
 * - Sequence (array) flow expressions are enclosed in brackets
 */
export class YAML {
    lines;
    nodes;
    exceptions;
    get errors() { return (this.exceptions.length) ? true : false; }
    ;
    constructor(text) {
        this.exceptions = [];
        if (typeof text == 'string')
            this.lines = text.trimEnd().split('\n');
        else
            this.lines = text;
        this.nodes = this.yamlNodes();
    }
    /**
     * Parse YAML text and return a data object of type "any". When
     * `convertStrings` is true, the strings "true" and "false" are converted to
     * booleans, and valid numbers are converted from strings to numbers. When
     * `convertStrings` is false (the default), all values will be strings or
     * null.
     */
    parse(convertStrings = false) {
        const blocks = [];
        let i = 0;
        let parentNode = null;
        for (const node of this.nodes) {
            /** If there are no blocks yet or a parentNode is pending, add a new block. */
            if (blocks.length == 0 || parentNode !== null) {
                this.addBlock(node, blocks, parentNode);
                i = blocks.length - 1; /* index of current block */
                parentNode = null; /* always clear parentNode after adding a block */
            }
            /** reject node if it breaks YAML depth rules */
            if (this.invalidDepth(node, blocks))
                continue;
            /** roll up the data and remove the deeper block(s) */
            this.rollUpBlocks(blocks, node.depth);
            i = blocks.length - 1;
            /** reject node whose type differs from the block type */
            if (this.typeMismatch(node, blocks))
                continue;
            /** process current block node */
            if (node.depth == blocks[i].depth) {
                /** a node without a value may be the parent of the next node(s) */
                if (!node.value)
                    parentNode = node;
                else {
                    const nodeData = this.interpretValue(node.value, convertStrings);
                    if (blocks[i].type == SEQ)
                        blocks[i].data.push(nodeData);
                    else
                        blocks[i].data[node.key] = nodeData;
                }
            }
        }
        /** process dangling parentNode, if any (last node is parent without children) */
        if (parentNode) {
            if (blocks.length) {
                if (blocks[i].type == SEQ)
                    blocks[i].data.push(null);
                else
                    blocks[i].data[parentNode.key] = null;
            }
        }
        /** roll up the blocks data into the top-level block and return it to the calling program */
        return this.rollUpBlocks(blocks);
    }
    /**
     * Given a YAML `node`, an array of `blocks`, and an optional `parent` node
     * (which defaults to null), add a new Block to the blocks array.
     *
     * A Block represents either a sequence (array) or a map--both types may
     * contain zero or more values. On instantiation, Block.data is an empty
     * sequence or map, but this is usually filled with a complex data object as
     * nodes are parsed and leaf nodes roll up toward the root "node" (the root
     * node exists in the calling program, the final result of the `parse`
     * method).
     */
    addBlock(node, blocks, parent = null) {
        const block = {
            type: (node.key == SEQUENCE_KEY) ? SEQ : MAP,
            data: (node.key == SEQUENCE_KEY) ? [] : {},
            depth: node.depth,
            parent: parent,
        };
        if (parent !== null && parent.depth >= node.depth)
            block.data = null;
        blocks.push(block);
    }
    /**
     * A block may contain a single scalar value, or it may represent a sequence
     * (array) or map of multiple values. The `blocks` array represents a FILO
     * stack, where a new block is pushed onto the end of the blocks stack
     * whenever we encounter a node that has a deeper indentation level than the
     * previous one.
     *
     * Roll up the data in the current block into the data of its prior (parent)
     * block and pop the current block off the top of the stack. Continue
     * rolling up the data to each prior block until the specified `depth` is
     * reached, ultimately returning the accumulated data from all nodes as a
     * single (possibly complex) data object.
     */
    rollUpBlocks(blocks, depth = 0) {
        let data = null;
        let i = blocks.length - 1; /* index of current block */
        if (blocks.length) {
            while (blocks.length > 1 && blocks[i].parent && depth <= blocks[i].parent.depth) {
                if (blocks[i].parent.type == SEQ)
                    blocks[i - 1].data.push(blocks[i].data);
                else
                    blocks[i - 1].data[blocks[i].parent.key] = blocks[i].data;
                blocks.pop();
                i = blocks.length - 1;
            }
            data = blocks[i].data;
        }
        return data;
    }
    /**
     * Read an array of raw YAML text lines and return a corresponding array of
     * YAMLNodes.
     */
    yamlNodes() {
        const nodes = [];
        const indentedText = /(\S+)/; /* solely for determining indentation level */
        /**
         * @variation
         * was: `/^\s*(\S+):\s+(.*)/`, but we are now supporting keys that
         * contain embedded whitespace--essential when, for example, dealing
         * with file pathnames. Keys will still be trimmed (essentially), all
         * white space between the last non-whitespace character and the colon
         * ignored.
         */
        const keyValue = /^\s*(\S+):\s+(.*)/; // attempt to allow keys with embedded whitespace: /^\s*(\S.*\S)\s*:\s+(.*)/;
        const sequenceValue = /^\s*(-)\s+(.*)/;
        let line = 0;
        for (let textLine of this.lines) {
            line += 1;
            let key = '';
            let value = '';
            let depth = 0;
            textLine = this.removeComments(textLine);
            /** skip empty lines and YAML Separator lines */
            if (!textLine.trim() || textLine.trimEnd() == Separator)
                continue;
            /** appending a space to textLine ensures regex will work for key-only lines */
            let nodeMatch = `${textLine} `.match(keyValue);
            if (!nodeMatch)
                nodeMatch = `${textLine} `.match(sequenceValue);
            if (nodeMatch) {
                key = nodeMatch[1];
                value = (!nodeMatch[2]) ? '' : nodeMatch[2].trim();
            }
            else
                value = textLine.trim();
            const nodeText = textLine.match(indentedText);
            depth = (nodeText) ? nodeText.index : 0;
            const node = {
                key: key, // 'key' (map), '-' (seq), or '' (str)
                type: (key == SEQUENCE_KEY) ? SEQ : MAP,
                value: value,
                depth: depth,
                line: line,
            };
            /** reject node if it is missing a key or if the key is a duplicate */
            if (this.missingKey(node))
                continue;
            if (this.duplicateKey(node, nodes))
                continue;
            nodes.push(node);
        }
        return nodes;
    }
    /**
     * Given a string `value` that represents a boolean or number, return a
     * boolean or number, otherwise return the string unchanged.
     */
    convertStringValue(value) {
        let convertedValue = value;
        if (value == 'true' || value == 'false') {
            convertedValue = (value == 'true') ? true : false;
        }
        else if (!isNaN(Number(value)))
            convertedValue = Number(value);
        return convertedValue;
    }
    /**
     * Interpret the given `value`, which may be a scalar value or a "flow"
     * value (a list of Map values in braces or a list of Sequence values in
     * brackets). When `convertStrings` is true, strings representing numbers
     * and booleans are converted to the appropriate data types. Return the data
     * object representing the value.
     */
    interpretValue(value, convertStrings) {
        let data = null;
        if (value) {
            const matchMap = value.match(/^[\s]*{(.*)}[\s]*$/);
            const matchSequence = value.match(/^[\s]*\[(.*)\][\s]*$/);
            if (matchMap)
                data = this.flowMap(matchMap[1], convertStrings);
            else if (matchSequence)
                data = this.flowSequence(matchSequence[1], convertStrings);
            else
                data = (convertStrings) ? this.convertStringValue(value) : value;
        }
        return data;
    }
    /**
     * Given a Map `expression`, convert the values into a data Map. When
     * `convertStrings` is true, strings representing numbers and booleans are
     * converted to the appropriate data types. Return the Map.
     */
    flowMap(expression, convertStrings) {
        const data = {};
        const keyValues = this.commaSeparatedValues(expression);
        for (const keyValue of keyValues) {
            const substrings = keyValue.split(':');
            const key = substrings[0].trim();
            let value = null;
            if (substrings.length == 2)
                value = substrings[1].trim();
            if (substrings.length > 2)
                value = substrings.slice(1).join(' ').trim();
            if (value === null)
                data[key] = value;
            else {
                if (convertStrings)
                    data[key] = this.convertStringValue(value);
                else
                    data[key] = value;
            }
        }
        return data;
    }
    /**
     * Given a Sequence expression, convert the values into an array. When
     * `convertStrings` is true, strings representing numbers and booleans are
     * converted to the appropriate data types. Return the array.
     */
    flowSequence(expression, convertStrings) {
        const data = [];
        const values = this.commaSeparatedValues(expression);
        for (const value of values) {
            if (convertStrings)
                data.push(this.convertStringValue(value.trim()));
            else
                data.push(value.trim());
        }
        return data;
    }
    /**
     * Given a raw YAML text line, return a "clean" line, with comments removed.
     * Comments are preceded by a hash (#) character. If the line contains only
     * a comment, without data, an empty line is returned.
     */
    removeComments(line) {
        let cleanLine = line;
        /** pattern is hash preceded by whitespace and not quoted */
        const pattern = /[\s]+#(?=([^"]*"[^"]*")*[^"]*$)/;
        if (line.trim()[0] == '#')
            cleanLine = ''; /** comment-only line */
        else {
            const matches = pattern.exec(cleanLine);
            if (matches !== null) {
                cleanLine = cleanLine.slice(0, matches.index).trimEnd();
            }
        }
        return cleanLine;
    }
    /**
     * Given a text string containing comma-separated values, return an array of
     * values.
     */
    commaSeparatedValues(text) {
        const values = [];
        const pattern = /("[^"]+"|[^,]+)/g;
        const matches = text.match(pattern);
        if (matches !== null) {
            for (let match of matches) {
                match = match.trim();
                match = match.replace(/[\s]+/g, ' '); /** condense spaces */
                if (match.startsWith('"') && match.endsWith('"')) {
                    match = match.slice(1, -1);
                }
                values.push(match);
            }
        }
        return values;
    }
    /**
     * Given a `node`, return true if the node has a value but no key, otherwise
     * return false.
     */
    missingKey(node) {
        let result = false;
        if (!node.key && node.value) {
            this.recordException(node.line, ERRORS['noKey']);
            result = true;
        }
        return result;
    }
    /**
     * Given a `node` and an array of `currentNodes`, return true if the node's
     * key is equal to a previous node's key, otherwise return false.
     */
    duplicateKey(node, currentNodes) {
        let result = false;
        if (currentNodes.length && node.key != SEQUENCE_KEY) {
            /**
             * Loop over the current nodes from bottom to top. As soon as we
             * encounter a current node that has a lower depth than the new
             * node, we don't need to look further--the new node is not a
             * duplicate. When we encounter a current node with the same depth
             * and the same key, the new node is a duplicate.
             */
            for (let i = currentNodes.length - 1; i >= 0; i -= 1) {
                if (currentNodes[i].depth < node.depth)
                    break;
                if (currentNodes[i].depth == node.depth && currentNodes[i].key == node.key) {
                    this.recordException(node.line, ERRORS['duplicateKey']);
                    result = true;
                    break;
                }
            }
        }
        return result;
    }
    /**
     * Given a `node` and the array of current `blocks`, return true if the
     * node's depth is invalid, otherwise return false.
     */
    invalidDepth(node, blocks) {
        let invalid = true;
        const depth = node.depth;
        for (const block of blocks) {
            if (block.depth == depth) {
                invalid = false;
                break;
            }
        }
        if (invalid)
            this.recordException(node.line, ERRORS['invalidDepth']);
        return invalid;
    }
    /**
     * Given a `node` and the array of current `blocks`, return true if the
     * node's type does not match its block's type, otherwise return false.
     */
    typeMismatch(node, blocks) {
        let result = false;
        let i = blocks.length - 1; /* index of current block */
        if (blocks.length && node.type != blocks[i].type) {
            this.recordException(node.line, ERRORS['wrongKeyType']);
            result = true;
        }
        return result;
    }
    /**
     * Given a file `line` number and an `errorMessage`, compose an entry in
     * `YAML.exceptions` indicating the line number in the file where the error
     * occurred, the error message, and the line's text.
     */
    recordException(line, errorMessage) {
        const lineText = (line > 0 && line <= this.lines.length) ? `: ${this.lines[line - 1].trim()}` : '';
        this.exceptions.push(`[${line}] ${errorMessage}${lineText}`);
    }
    /**
     * Write exception messages, if any, to the console.
     */
    reportExceptions() {
        if (this.exceptions.length) {
            console.error('Exceptions:');
            for (const exception of this.exceptions) {
                console.error(`  ${exception}`);
            }
        }
    }
}
/*
 * Having parsed lines to create a YAML data object, we should be able to
 * call a method which will take a revised data object (with node changes,
 * additions, deletions) and "reverse-engineer" it, creating metadata lines.
 * But! ... I think this method really belongs in the `document` module.
 */
/*
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
// /**
//  * Given a YAML `node` and an optional `parent` YAML node, create and return
//  * a Block object. A Block is either a sequence (array) or a map--both types
//  * may contain zero or more values. On instantiation, Block.data is an empty
//  * sequence or map, but this is usually filled with a complex data object as
//  * nodes are parsed and leaf nodes roll up toward the root "node" (the root
//  * node exists in the calling program).
//  */
// block(node: YAMLNode, parent: YAMLNode|null = null) {
// 	let block: Block = {
// 		type: (node.key == SEQUENCE_KEY) ? SEQ : MAP,
// 		data: (node.key == SEQUENCE_KEY) ? [] : {},
// 		depth: node.depth,
// 		parent: parent,
// 	};
// 	return block;
// }
// validDepth(blocks: Block[], depth: number) {
// 	let valid = false;
// 	for (let block of blocks) {
// 		if (block.depth == depth) {
// 			valid = true;
// 			break;
// 		}
// 	}
// 	return valid;
// }
// create the initial block:
// if (blocks.length == 0) {
// 	let block = this.block(null, node);
// 	blocks.unshift(block);
// }
// create a new block when node is indented below a node without a value (parentNode):
// else if (parentNode) {
// 	let block = this.block(parentNode, node);
// 	if (parentNode.depth >= node.depth) block.data = null;
// 	blocks.unshift(block);
// 	parentNode = null;
// }
// compactBlocks(blocks: Block[], depth: number = 0) {
// 	let data: any = null;
// 	if (blocks.length) {
// 		while (blocks.length > 1 && blocks[0].parent && depth <= blocks[0].parent.depth) {
// 			if (blocks[0].parent.type == SEQ) blocks[1].data.push(blocks[0].data)
// 			else blocks[1].data[blocks[0].parent.key] = blocks[0].data;
// 			blocks.shift();
// 		}
// 		data = blocks[0].data;
// 	}
// 	return data;
// }
