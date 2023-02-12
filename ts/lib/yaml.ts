/**
 * Obsidian Front Matter (YAML) processing
 *
 * Rules:
 *   scalar: one
 *   flow-list: [one, two, three]
 *   block-list:
 *     - one
 *     - two
 *     - three
 *   flow-object: {one: 1, two: 2, three: 3}
 *   block-object:
 *     one: 1
 *     two: 2
 *     three: 3
 *   block-text:
 *     I once had a girl--
 *     or should I say
 *     she once had me?
 */

export function processText(text: string) {
	text = removeComments(text);
	// text = removeComments(text);
	let textLines = text.split('\n');
	let inBlock = false;
	for (let textLine of textLines) {
		textLine = textLine.trimEnd();
		if (textLine) {
			/**
			 * for now, we're assuming single-level hierarchy (no leading
			 * whitespace) otherwise, we must take the indentation into account
			 */
			let matches = textLine.match(/([\S]*?)-[\s]+(.*)/);
			if (matches !== null) {
				console.log(`block Seq at ${matches.index}: ${matches[2]}`);
			}
			else {
				matches = textLine.match(/([\S]*?):[\s]+(.*)/);
				if (matches !== null) {
					let values = commaSeparatedValues(matches[2]);
					console.log(`at ${matches.index}: ${matches[1]}:`);
					for (let value of values) {
						console.log(`  ${value}`);
					}
				}
			}
		}
	}
}

function commaSeparatedValues(text: string) {
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

function removeComments(text: string) {
	/**
	 * YAML comments start with a hash (#) and extend to the end of the line
	 * (there are no multi-line comments in YAML). The hash is only considered
	 * the start of a comment if it is placed at the beginning of a line or
	 * following whitespace, excluding hashes that are part of a quoted string.
	 */
	let cleanText = '';
	let cleanTextLines: string[] = [];
	let textLines = text.split('\n');
	/** pattern is hash preceded by whitespace and not quoted */
	let pattern = /[\s]+#(?=([^"]*"[^"]*")*[^"]*$)/;
	for (let textLine of textLines) {
		if (!(textLine[0] == '#')) { /** skip lines where hash is first character */
			let matches = pattern.exec(textLine);
			if (matches !== null) {
				textLine = textLine.slice(0, matches.index).trimEnd();
			}
			if (textLine) cleanTextLines.push(textLine);
		}
	}
	cleanText = cleanTextLines.join('\n');
	return cleanText;
}
