import { Resource } from './resource.js';

/*### to do:
 *
 * Recognize embedded tags (#todo, #todo2, #todo-3, &c.). Does not apply to tags
 * listed in Front Matter--these are treated separately. Replace tag with space,
 * and condense space around it, trim start and/or end if tag appears at start
 * or end? Does not apply within Code and Code Blocks.
 *
 * Support custom markdown enclosed in braces. Mostly this will be resource
 * references such as {photo: foo}, {photo/category: bar}, where the Front
 * Matter of the document resolves the reference. But braces may also be used as
 * a replacement for the current Span syntax: {{.foo #bar content text}}.
 */

/*
 * Code Blocks - delimited by '~~~' or '```', lines from delimiter thru delimiter
 * Quote Blocks - consecutive lines beginning with '>'
 * Quotation - a line consisting of a quoted string followed by a tilde and an attribution
 * Table Blocks - consecutive lines beginning with '|' and ending with '|'
 *   | Item | Description |            (column headings)
 *   | --- |                           (headings/items separator)
 *   | item 1 | item 1 description |
 *   | item 2 | item 2 description |
 * List Blocks - consecutive lines beginning with '- ' or '\d+\. '
 * Headings - line beginning with 1-6 hashes (#) followed by whitespace
 * Horizontal Rules - line of three or more hyphens, asterisks, or underscores, intervening whitespace allowed
 * Details Block - block following line starting with '#$ ', terminated by another Details line or EOF
 * Paragraphs - lines not matching a blank line or any of above block patterns
 *
 * Code - `content`
 * Italics - *content*
 * Bold - **content**
 * Superscript - in "E=mc2^" superscript the digit
 * Highlight - ==content==
 * Strikethrough - ~~content~~
 * URL - [content](url) or [[url|content]]
 * Image - ![content](url) or ![[url|content]]
 * Span - {{.class content}}
 */

console.log(`markup: 2025.03.03`); /* report version */

/* HTML tags */
const PARAGRAPH_TAG = 'p';
const LINE_BREAK_TAG = 'br';
const HEADING_TAG = 'h'; /* converted to 'h1'...'h6' in Heading class */
const CODE_TAG = 'code';
const ITALIC_TAG = 'em';
const BOLD_TAG = 'strong';
const SUPERSCRIPT_TAG = 'sup';
const HIGHLIGHT_TAG = 'mark';
const STRIKETHROUGH_TAG = 's';
const PREFORMATTED_TAG = 'pre';
const BLOCKQUOTE_TAG = 'blockquote';
const HORIZONTAL_RULE_TAG = 'hr';
const IMAGE_TAG = 'img';
const LINK_TAG = 'a';
const SPAN_TAG = 'span';
const LIST_ITEM_TAG = 'li';
const UNORDERED_ITEM_TYPE = 'ul';
const ORDERED_ITEM_TYPE = 'ol';
const TABLE_TAG = 'table';
const TABLE_ROW_TAG = 'tr';
const TABLE_HEADING_TAG = 'th';
const TABLE_ITEM_TAG = 'td';
const DETAILS_TAG = 'details';
const SUMMARY_TAG = 'summary';

/* block patterns */
const CODE_BLOCK_PATTERN = /^(~~~|```)$/; /* starting and ending delimiters must match */
const QUOTE_BLOCK_PATTERN = /^>\s*/; /* does not enforce space between '>' and text */
const QUOTATION_PATTERN = /^"(.+)"\s*~\s*(.+)$/; /* e.g., "I think therefore I am" ~ Descartes */
const TABLE_BLOCK_PATTERN = /^\|.*\|$/;
const LIST_BLOCK_PATTERN = /^([-+*]|\d{1,}\.)\s+\S+/;
const LIST_BLOCK_LEAD_PATTERN = /^([-+*]|\d{1,}\.)\s+/;
const HEADING_PATTERN = /^#{1,6}\s+\S+/;
const DETAILS_PATTERN = /^#\$\s*/; /* "#$ summary" begins Detail Block, "#$" alone terminates Block */
const HORIZONTAL_RULE_PATTERN = /^((-+[ \t]{0,}){3,}|(_+[ \t]{0,}){3,}|(\*+[ \t]{0,}){3,})$/;

/* simple inline patterns--replacements are straightforward "replace" operations */
const CODE_PATTERN = /(`.+?`)/;
const CODE_SEGMENT_PATTERN = /^`.+`$/;
const ITALIC_PATTERN = /\*(.+?)\*/g;
const BOLD_PATTERN = /\*{2}(.+?)\*{2}/g;
const SUPERSCRIPT_PATTERN = /([\S])(\d+)\^/g;
const HIGHLIGHT_PATTERN = /={2}(.+?)={2}/g;
const STRIKETHROUGH_PATTERN = /~{2}(.+?)~{2}/g;
const IMAGE_PATTERN = /!\[(.*?)\]\((.*?)\)/g; 
/* complex inline patterns--replacements will be performed in a while loop */
const LINK_PATTERN = /(?<!!)\[(.*?)]\((.*?)\)/; /* lookbehind assertion prevents image pattern match */
const WIKILINK_PATTERN = /\[\[(.*?)\|(.*?)\]\]/; /* [[path|label]] */
const EXTERNAL_LINK = /^(https?:\/\/|localhost\/)/; /* non-external links require special handling */
const IMAGE_REFERENCE_PATTERN = /!\[(.*?)\]\[(\S*?)\]/;
const LINK_REFERENCE_PATTERN = /\[(.*?)\]\[(\S*?)\]/;
const SPAN_PATTERN = /\{\{(.*?)\}\}/;

/**
 * This function is typically the starting point. Given markdown text (in either
 * a single string which may or may not contain newline characters, or an array
 * of strings), it returns a single string of HTML text. It does this by
 * generating an array of `MarkdownElement` objects; each with a `render` method
 * that generates HTML. A `baseUrl` parameter may be required if markdown
 * contains `Resource` objects with relative (query) definitions.
 */
export function Markup(markdown: string|string[], origin = '') {
	MARKDOWN = new MarkdownText();
	MARKDOWN.loadLines(markdown);
	return MARKDOWN.html();
}

/**
 * Mark up a single line of plain text, handling inline elements only. We call the
 * internal `markupText` function, the same function that is called by
 * MarkdownElement.render(). We are assuming that there are no block
 * elements--they won't be interpreted.
 *
 * Options: 
 * - `M`: markup - convert Markdown text to HTML
 * - `E`: escape special characters using HTML Entities
 * - `T`: typeset characters using proper quotes, dashes, ellipses, etc.
 * - `F`: like `T` for Fixed-width fonts (no dash or ellipsis conversion)
 */
export function MarkupLine(line: string, options: string) {
	options = options.toUpperCase();
	if (options.includes('E')) line = encodeEntities(line);
	if (options.includes('T') || options.includes('F')) {
		if (options.includes('F')) line = typeset(line, true);
		else line = typeset(line, false);
	}
	if (options.includes('M')) line = markupText(line);
	return line;
}

/**
 * A `MarkdownText` object represents lines of markdown text. This object will
 * maintain an index used to step through the text lines, and a Map of any
 * `Resources` referenced in the text.
 */
class MarkdownText {
	lines: string[];
	index: number;
	resources: Map<string, Resource>|null;
	detailsObject: MarkdownElement|null; /* Details object pending closure (if any) */

	constructor() {
		this.lines = [];
		this.index = 0;
		this.resources = null;
		this.detailsObject = null;
		/* extract Resource references from the markdown text and update the `resources` property */
		this.getResources();
	}

	loadLines(lines: string|string[]) {
		let line = ''
		if (Array.isArray(lines)) {
			line = lines.join('\n').trim();
		}
		else line = lines.trim();
		this.lines = line.split('\n');
		// we now trim the lines before processing them
		// this.lines = (typeof lines == 'string') ? lines.split('\n') : lines;
	}

	/**
	 * Called as the first pass over the `MarkdownText` lines to extract any
	 * `Resource` references from the text.
	 */
	getResources() {
		this.resources = new Map<string, Resource>();
		const referencePattern = /^\[(\S+)\]:\s+(.*)/;
		/* step through the array in reverse order, as we will remove items along the way */
		for (let i = this.lines.length - 1; i >= 0; i -= 1) {
			const referenceMatch = this.lines[i].trim().match(referencePattern);
			if (referenceMatch !== null) {
				const name = referenceMatch[1].toLowerCase();
				const parameters = referenceMatch[2];
				const resource = new Resource(parameters);
				this.resources.set(name, resource); /* add resource to map */
				this.lines.splice(i, 1); /* remove the markdown line so it won't be processed in subsequent passes */
			}
		}
	}

	/**
	 * Process the `MarkdownText` lines, returning a string of HTML text
	 * representing the elements.
	 */
	html() {
		const htmlLines: string[] = [];
		while (true) {
			const element = this.getNextElement();
			if (element === null) break;
			for (const htmlLine of element.render()) {
				htmlLines.push(htmlLine);
			}
		}
		if (this.detailsObject) htmlLines.push(this.detailsObject.suffix);
		// for (const htmlLine of htmlLines) console.log(htmlLine); /*### diagnostic */
		return htmlLines.join('\n');
	}

	/**
	 * Using the `index` property to manage a pointer to the "next" element in
	 * the `lines` of markdown text, create and return a single element object,
	 * being a subclass of `MarkdownElement`. Only block elements are processed
	 * here; inline elements are handled in the `MarkdownElement.render`
	 * methods.
	 */
	getNextElement() {
		let element: MarkdownElement|null = null;
		let contentIsComplete = false;
		let seekingFirstLine = true;
		while (this.index < this.lines.length) {
			const line = this.lines[this.index];
			if (seekingFirstLine) {
				const trimmedLine = line.trim();
				if (!trimmedLine) this.index += 1; /* ignore leading blank lines */
				else {
					/* The first line identifies the block element type. */
					if (CODE_BLOCK_PATTERN.test(trimmedLine)) element = new CodeBlock(trimmedLine);
					else if (QUOTE_BLOCK_PATTERN.test(trimmedLine)) element = new QuoteBlock();
					else if (QUOTATION_PATTERN.test(trimmedLine)) element = new Quotation();
					else if (TABLE_BLOCK_PATTERN.test(trimmedLine)) element = new TableBlock();
					/* A Horizontal Rule entry such as "- - -" can be misinterpreted as a List Block entry.
					   Test for the prior before testing for the latter to avoid this. */
					else if (HORIZONTAL_RULE_PATTERN.test(trimmedLine)) element = new HorizontalRule();
					else if (LIST_BLOCK_PATTERN.test(trimmedLine)) element = new ListBlock();
					else if (HEADING_PATTERN.test(trimmedLine)) element = new Heading();
					else if (DETAILS_PATTERN.test(trimmedLine)) element = new Details();
					else element = new Paragraph();

					element.content.push(line);
					this.index += 1;
					seekingFirstLine = false;
				}
			}
			else {
				if (!(element!.isTerminalLine(line))) {
					/* content is incomplete; add line to the content and loop for more */
					element!.content.push(line);
					this.index += 1;
				}
				else {
					/* the element's content is complete; finish up and break out of the loop */
					contentIsComplete = true;
					if (element!.addTerminalLine) {
						element!.content.push(line);
						this.index += 1;
					}
					break;
				}
			}
		}

		if (element) {
			/* Ensure that the element is terminated, even in cases where we've
			 * reached the end of the MarkdownText lines without an explicit
			 * terminal line.
			 */
			if (!contentIsComplete && element.addTerminalLine) element.content.push(element.terminal);
			/* Adjust the content and pass resources to the element object. */
			element.adjustContent(); 
			element.resources = this.resources;
		}
		return element; /* will be null when all lines have been processed */
	}
}

/**
 * This global object represents the source markdown text and all its
 * properties.
 */
// const MARKDOWN = new MarkdownText; // Yikes! Constant is loaded on import, shared between looping calls
let MARKDOWN: MarkdownText;

/**
 * `MarkdownElement` is a superclass; all element objects will be instantiated
 * as subclass extensions of this superclass. Parameters: `tags`: one or more
 * HTML tags to be opened at the beginning and closed at the end; `typesetting`:
 * should certain special characters (quotes, dashes, ellipses) in the content
 * lines be typeset? `markingUp`: should inline elements in the content lines be
 * marked up?
 */
class MarkdownElement {
	prefix: string;
	suffix: string;
	endOfLine: string;
	typesetting: boolean;
	markingUp: boolean;
	content: string[];
	addTerminalLine: boolean;
	terminal: string; /* for multi-line block elements, the terminal string (e.g., '~~~') */
	resources: Map<string, Resource>|null;

	constructor(tags: string[], typesetting: boolean, markingUp: boolean) {
		this.prefix = '';
		this.suffix = '';
		this.endOfLine = '';

		this.typesetting = typesetting;
		this.markingUp = markingUp;
		this.resources = null;
		this.content = [];
		this.addTerminalLine = false;
		this.terminal = '';
		for (let tag of tags) {
			let openTag = `<${tag}>`;
			let closeTag = `</${tag}>`;
			this.prefix = this.prefix + openTag;
			this.suffix = closeTag + this.suffix;
		}
	}

	/**
	 * This method is called in `MarkdownText.getNextElement` during the
	 * creation of a block element object to determine when all the markdown
	 * lines of the element have been captured. This method returns true if the
	 * given line of markdown text represents the last line of the element, else
	 * false. Subclasses for single-line elements do not need to override this
	 * method, as the first (and only) line is always the terminal line.
	 */
	isTerminalLine(line: string) {
		return true;
	}

	/**
	 * This method is called in `MarkdownText.getNextElement` after the element
	 * object is instantiated and all of its lines captured. Here, we adjust the
	 * `content` lines--subclasses may set additional properties and may alter
	 * the raw content. Leading empty lines (if any) are always removed. This is
	 * the first step in converting the raw markdown text to HTML.
	 */
	adjustContent() {
		while (this.content[0].trim() == '') this.content.shift(); /* remove leading empty lines */
	}

	/**
	 * This method is called in the main processing loop of `MarkdownText.html`.
	 * Read the element's content lines, converting them to HTML lines, and
	 * return the result. HTML entity encoding is done here, as well as
	 * typesetting and inline markup, based on the `typesetting` and `markingUp`
	 * boolean properties. The HTML start and end tags (prefix and suffix) are
	 * added to the first and last HTML lines, respectively.
	 */
	render() {
		let htmlLines: string[] = [];
		for (let i in this.content) {
			let line = this.content[i];
			line = encodeEntities(line);
			if (this.typesetting) line = typeset(line);
			if (this.markingUp) line = markupText(line, this.resources);
			if (+i == 0) line = this.prefix + line;
			if (+i < this.content.length - 1) line += this.endOfLine;
			else line += this.suffix;
			htmlLines.push(line);
		}
		return htmlLines;
	}
}

class CodeBlock extends MarkdownElement {
	constructor(line: string) {
		super([PREFORMATTED_TAG, CODE_TAG], false, false);
		this.addTerminalLine = true;
		let matchResults = CODE_BLOCK_PATTERN.exec(line);
		if (matchResults !== null) this.terminal = matchResults[1];
	}
	isTerminalLine(line: string) {
		return line.trim() == this.terminal.trim();
	}
	adjustContent() {
		super.adjustContent();
		/** Remove the first and last lines (the delimiters--'```' or '~~~') */
		this.content.shift();
		this.content.pop();
	}
}

class QuoteBlock extends MarkdownElement {
	constructor() {
		super([BLOCKQUOTE_TAG], true, true);
		this.endOfLine = `<${LINE_BREAK_TAG}>`;
	}
	isTerminalLine(line: string) {
		return !(QUOTE_BLOCK_PATTERN.test(line.trim()));
	}
	adjustContent() {
		super.adjustContent();
		/* Remove the indentation indicator ('>') and add line breaks. */
		let newContent: string[] = [];
		for (let line of this.content) {
			line = line.trim().replace(/^>\s*/, '');
			newContent.push(line);
		}
		this.content = newContent;
	}
}

/**
 * Custom markdown, source example: "I think therefore I am" ~ Descartes
 */
class Quotation extends MarkdownElement {
	constructor() {
		super([PARAGRAPH_TAG, BLOCKQUOTE_TAG], true, true); /*### every quotation is its own paragraph; handle in CSS instead? */
	}
	/* 
	 * When rendering a `Quotation` line, we will use only the RegExp captured
	 * results, creating one line for the quotation and one line for the
	 * attribution.
	 */
	render() {
		let htmlLines: string[] = [];
		const matchResults = QUOTATION_PATTERN.exec(this.content[0]);
		let lines: string[] = [];
		let properQuotation = false;
		if (matchResults === null || matchResults.length < 3) lines = this.content;
		else {
			properQuotation = true;
			lines = matchResults.slice(1,3);
		}
		for (let i in lines) {
			lines[i] = encodeEntities(lines[i]);
			if (this.typesetting) lines[i] = typeset(lines[i]);
			if (this.markingUp) lines[i] = markupText(lines[i]);
		}
		if (properQuotation) {
			const quote = '\u201c';
			const endQuote = '\u201d';
			const indentation = '&numsp;&numsp;';
			const quotation = `${this.prefix}${quote}${lines[0]}${endQuote}<br>`;
			const attribution = `<small>${indentation}~ ${lines[1]}</small>${this.suffix}`;
			htmlLines.push(`${quotation}${attribution}`);
		}
		else htmlLines = lines;
		return htmlLines;
	}
}

/**
 * A Table Block is represented as consecutive lines, each line beginning and
 * ending with a pipe (|) character. The pipe character is also used as a
 * field/column delimiter. A line having three or more hyphens in its first
 * field (e.g., "|---|") is treated as a separator between heading line(s) and
 * item line(s).
 */
class TableBlock extends MarkdownElement {
	columns: number;
	headingDivider: number;
	constructor() {
		super([TABLE_TAG], true, true);
		this.columns = 0;
		this.headingDivider = -1;
	}
	isTerminalLine(line: string) {
		return !(TABLE_BLOCK_PATTERN.test(line.trim()));
	}
	adjustContent() {
		super.adjustContent();
		/*
		 * We do not alter the content here, but simply determine how many
		 * columns (fields) there are, based on the first line, and at which row
		 * (if any) the table headings are divided from the table items.
		 */
		for (let i = 0; i < this.content.length; i += 1) {
			let fields = this.fields(this.content[i]);
			if (!this.columns) this.columns = fields.length; /* first line determines number of fields/columns */
			if (this.headingDivider < 0) {
				let firstField = fields[0];
				/* the heading divider is the first row where the first field contains only 3 or more hyphens */
				if (/^-{3,}$/.test(firstField)) this.headingDivider = i;
			}
			if (this.columns && this.headingDivider >= 0) break;
		}
	}
	render() {
		let htmlLines: string[] = [];
		htmlLines.push(this.prefix);
		let tag = (this.headingDivider > 0) ? TABLE_HEADING_TAG : TABLE_ITEM_TAG;
		for (let i = 0; i < this.content.length; i += 1) {
			if (i == this.headingDivider) tag = TABLE_ITEM_TAG;
			else {
				htmlLines.push(`<${TABLE_ROW_TAG}>`);
				let fields = this.fields(this.content[i]);
				/* loop over each field - ignore fields beyond column limit */
				for (let j = 0; j < this.columns; j += 1) {
					let field = (j >= fields.length) ? '' : fields[j];
					htmlLines.push(`<${tag}>${field}</${tag}>`);
				}
				htmlLines.push(`</${TABLE_ROW_TAG}>`);
			}
		}
		htmlLines.push(this.suffix);
		return htmlLines;
	}
	/**
	 * Given a markdown table line, return an array of pipe-separated fields
	 * with each field trimmed.
	 */
	fields(line: string) {
		let fields: string[] = [];
		line = line.trim();
		fields = line.split('|');
		fields.shift(); /* pattern always results in empty field 0 - discard it */
		fields.pop();   /* pattern always results in empty field N - discard it */
		for (let i = 0; i < fields.length; i += 1) {
			fields[i] = fields[i].trim();
		}
		return fields;
	}
}

/**
 * A `ListBlock` is composed of `ListItems` (such as a bullet), and any `ListItem`
 * may contain a `ListSubBlock` (a `ListBlock` nested inside the `ListItem`). The
 * recursive property of `ListBlocks` is handled in the `ListSubBlock.render()`
 * method.
 */
class ListBlock extends MarkdownElement {
	constructor() {
		super([LIST_ITEM_TAG], true, true);
	}
	isTerminalLine(line: string) {
		return !(LIST_BLOCK_PATTERN.test(line.trim()));
	}
	render() {
		let items: ListItem[] = [];
		let previousLevel = -1;
		for (let line of this.content) {
			let level = 0;
			let itemType = (/^\d+\./.test(line.trim())) ? ORDERED_ITEM_TYPE : UNORDERED_ITEM_TYPE;
			let value = '';
			let tabs = line.match(/^\t*/);
			if (tabs) level = tabs[0].length;
			let lineContents = line.trim().split(LIST_BLOCK_LEAD_PATTERN);
			if (lineContents.length >= 3) value = lineContents[2];
			if (value) {
				if (level > previousLevel + 1) level = previousLevel + 1; /* limit indentation */
				value = encodeEntities(value);
				if (this.markingUp) value = markupText(value, this.resources);
				if (this.typesetting) value = typeset(value);
				let item = new ListItem(level, itemType, value);
				items.push(item);
				previousLevel = level;
			}
		}

		let blocks: ListSubBlock[] = [];
		let previousItem: ListItem|null = null;
		for (let item of items) {
			if (previousItem === null) blocks.push(new ListSubBlock(item.itemType, this.prefix, this.suffix));
			else if (previousItem.level < item.level) {
				blocks.push(new ListSubBlock(item.itemType, this.prefix, this.suffix));
				previousItem.block = blocks[blocks.length-1];
			} else if (previousItem.level > item.level) {
				for (let i = previousItem.level - item.level; i > 0; i -= 1) blocks.pop();
			}
			blocks[blocks.length-1].addItem(item);
			previousItem = item;
		}

		let htmlLines: string[] = [];
		if (blocks.length > 0) {
			htmlLines = blocks[0].render();
		}
		return htmlLines;
	}
}

class ListItem {
	level: number; /* number of indentation tabs */
	itemType: string; /* Ordered or Unordered */
	value: string;
	block: ListSubBlock|null;
	constructor(level: number, itemType: string, value: string) {
		this.level = level;
		this.itemType = itemType;
		this.value = value;
		this.block = null;
	}
}

class ListSubBlock {
	listType: string; /* Ordered or Unordered */
	items: ListItem[];
	prefix: string;
	suffix: string;
	constructor(listType: string, prefix: string, suffix: string) {
		this.listType = listType;
		this.items = [];
		this.prefix = prefix;
		this.suffix = suffix;
	}
	addItem(item: ListItem) {
		this.items.push(item);
	}
	render() {
		let htmlLines: string[] = [];
		htmlLines.push(`<${this.listType}>`);
		for (let item of this.items) {
			htmlLines.push(`${this.prefix}${item.value}`);
			if (item.block !== null) {
				let subBlockLines = item.block.render();
				htmlLines = htmlLines.concat(subBlockLines);
			}
			htmlLines.push(this.suffix);
		}
		htmlLines.push(`</${this.listType}>`);
		return htmlLines;
	}
}

class Heading extends MarkdownElement {
	constructor() {
		super([HEADING_TAG], true, true);
	}
	adjustContent() {
		super.adjustContent();
		let line = this.content[0].trim(); /* heading elements can only have one line */
		let matches = line.match(/^#{1,6}/); /* subset of MarkdownElement.HEADING_PATTERN (just the hashes) */
		if (matches) { /* should always be true or we wouldn't be here */
			let hashes = matches[0];
			line = line.substring(hashes.length).trim();
			this.prefix = this.prefix.replace(HEADING_TAG, `${HEADING_TAG}${hashes.length}`);
			this.suffix = this.suffix.replace(HEADING_TAG, `${HEADING_TAG}${hashes.length}`);
		}
		this.content = [line];
	}
}

class HorizontalRule extends MarkdownElement {
	constructor() {
		super([HORIZONTAL_RULE_TAG], false, false);
	}
	render() {
		return [this.prefix];
	}
}

/**
 * Much like the `Heading` element, the `Details` element consists of a single
 * line--in this case, "#$", followed by whitespace and a text `Summary`, e.g.:
 * "#$ Sample Details". When rendered, it first checks to see if a previous
 * `Details` block was encountered (i.e., if MARKDOWN.detailsObject is set) and,
 * if so, we add the `</details>` HTML line to close it. Then we add the new
 * `<details>` HTML line, and `<summary>`...`</summary>` HTML line.
 *
 * "#$" without summary text will close a prior Details block (or will be
 * ignored if there is no prior Details block.)
 *
 * `MarkdownText.html()` will check to see if MARKDOWN.detailsObject is set
 * after processing the final markdown line, and if so, it will add the closing
 * `</details>` tag.
 */
class Details extends MarkdownElement {
	constructor() {
		super([DETAILS_TAG], true, true);
		this.terminal = this.suffix;
	}
	adjustContent() {
		super.adjustContent();
		let lines: string[] = [];
		let line = this.content[0].trim(); /* details elements can only have one line */
		line = line.replace('#$', '').trim();
		if (line) lines.push(line);
		this.content = lines; /** 0 or 1 line; 1 line contains summary */
	}
	render() {
		let htmlLines: string[] = [];
		if (MARKDOWN.detailsObject) htmlLines.push(this.suffix); /** close previous Details section */
		if (this.content.length) {
			let summary = this.content[0];
			summary = encodeEntities(summary);
			if (this.typesetting) summary = typeset(summary);
			if (this.markingUp) summary = markupText(summary);
			htmlLines.push(`${this.prefix}<${SUMMARY_TAG}>${summary}</${SUMMARY_TAG}>`);
			MARKDOWN.detailsObject = this;
		}
		else MARKDOWN.detailsObject = null;
		return htmlLines;
	}
}

class Paragraph extends MarkdownElement {
	constructor() {
		super([PARAGRAPH_TAG], true, true);
		this.endOfLine = `<${LINE_BREAK_TAG}>`;
	}
	isTerminalLine(line: string) {
		/* A paragraph is terminated by an empty line or any of the block elements */
		line = line.trim();
		return (
			line == ''
			|| CODE_BLOCK_PATTERN.test(line)
			|| QUOTE_BLOCK_PATTERN.test(line)
			|| QUOTATION_PATTERN.test(line)
			|| TABLE_BLOCK_PATTERN.test(line)
			|| LIST_BLOCK_PATTERN.test(line)
			|| HEADING_PATTERN.test(line)
			|| HORIZONTAL_RULE_PATTERN.test(line)
			|| DETAILS_PATTERN.test(line)
		);
	}
}

/**
 * Replace special characters `&`, `<`, and `>`, characters that may conflict
 * with HTML rendering, with corresponding HTML entities.
 */
function encodeEntities(text: string) {
	let encodedText = text;
	encodedText = encodedText.replace(/&/g, '&amp;');
	encodedText = encodedText.replace(/</g, '&lt;');
	encodedText = encodedText.replace(/>/g, '&gt;');
	return encodedText;
}

/**
 * Replace typewriter characters with unicode typographic characters.
 * Oddities like `’twas` will get the wrong single quote (fix these
 * manually in the source text--on the Mac: `Shift-Option-]`).
 */
function typeset(text: string, fixedWidth = false) {
	let typesetText = text;
	typesetText = typesetText.replace(/(^|[-\u2014\s(\["])'/g, "$1\u2018"); // opening singles
	typesetText = typesetText.replace(/'/g, "\u2019"); // closing singles & apostrophes
	typesetText = typesetText.replace(/(^|[-\u2014/\[(\u2018\s])"/g, "$1\u201c"); // opening doubles
	typesetText = typesetText.replace(/"/g, "\u201d"); // closing doubles
	/**
	 * Dash and ellipsis substitutions don't look very good in fixed-width
	 * fonts, and present problems in calculating Fakesheet chord and lyric line spacing.
	 */
	if (!fixedWidth) {
		typesetText = typesetText.replace(/(\d)-(\d)/g, '$1\u2013$2'); // en-dashes in numerals
		typesetText = typesetText.replace(/\s?(-{2,3}|\u2014)\s?/g, "\u2014"); // em-dashes
		typesetText = typesetText.replace(/\.{3}/g, '\u2026'); // ellipses
	}
	return typesetText;
}

/**
 * Given a markdown text string and an optional Map of Resources (resolved in a
 * prior inspection of the whole document), return HTML markup. Text is split
 * into "segments", made up of `code` segments and non-`code` segments. Inline
 * markup is applied to only non-`code` segments.
 */
function markupText(text: string, resources: Map<string, Resource>|null = null) {
	let markedUpText = '';
	let segments = text.split(CODE_PATTERN);
	for (let segment of segments) {
		if (CODE_SEGMENT_PATTERN.test(segment)) {
			segment = segment.replace('`', `<${CODE_TAG}>`);
			segment = segment.replace('`', `</${CODE_TAG}>`);
		}
		else {
			/* simple global replacements */
			segment = segment.replace(IMAGE_PATTERN, `<${IMAGE_TAG} src="$2" alt="$1">`);
			segment = segment.replace(SUPERSCRIPT_PATTERN, `$1<${SUPERSCRIPT_TAG}>$2</${SUPERSCRIPT_TAG}>`);
			segment = segment.replace(BOLD_PATTERN, `<${BOLD_TAG}>$1</${BOLD_TAG}>`);
			segment = segment.replace(ITALIC_PATTERN, `<${ITALIC_TAG}>$1</${ITALIC_TAG}>`);
			segment = segment.replace(HIGHLIGHT_PATTERN, `<${HIGHLIGHT_TAG}>$1</${HIGHLIGHT_TAG}>`);
			segment = segment.replace(STRIKETHROUGH_PATTERN, `<${STRIKETHROUGH_TAG}>$1</${STRIKETHROUGH_TAG}>`);
			/* complex replacements (cannot be done using a simple global replacement) */
			if (resources !== null) {
				segment = markupReference(segment, IMAGE_REFERENCE_PATTERN, IMAGE_TAG, resources);
				segment = markupReference(segment, LINK_REFERENCE_PATTERN, LINK_TAG, resources);
			}
			segment = markupLinks(segment);
			segment = markupSpan(segment, SPAN_PATTERN, SPAN_TAG);
		}
		markedUpText += segment;
	}
	return markedUpText;
}

/**
 * Markup Hyperlinks, doing special handling of local relative URLs (both
 * standard markdown links and Wikilinks).
 */
function markupLinks(segment: string) {
	const patterns = [LINK_PATTERN, WIKILINK_PATTERN]; /* support both standard markdown links and wikilinks */
	for (const pattern of patterns) {
		const globalPattern = new RegExp(pattern, 'g');
		const links = segment.match(globalPattern); /* get all links in the segment */
		if (links) {
			for (const link of links){
				const components = link.match(pattern); /* get this link's components (label and uri) */
				if (components) {
					let label = components[1];
					let uri = components[2];
					if (pattern.toString() === WIKILINK_PATTERN.toString()) {
						label = components[2];
						uri = components[1];
					}
					if (!EXTERNAL_LINK.test(uri)) {
						const originPathname = `${window.location.origin}${window.location.pathname}`; /** URL preceding query */
						const page = 'articles'; //### hardcoding - should be a function of the Article type
						const query = `page=${page}&path=${uri}`;
						uri = `${originPathname}?${query}`;
						uri = encodeURI(uri);
					}
					segment = segment.replace(link, `<${LINK_TAG} href="${uri}">${label}</${LINK_TAG}>`);
				}
			}
		}
	}
	return segment;
}

/**
 * Image and Link markdown using references, resolved in Resource objects.
 */
function markupReference(segment: string, pattern: RegExp, tag: string, resources: Map<string, Resource>) {
	while (pattern.test(segment)) {
		let captureGroups = segment.match(pattern)!;
		let inlineText = captureGroups[1];
		let resourceKey = captureGroups[2].toLowerCase();
		let resource = resources.get(resourceKey);
		if (resource) segment = segment.replace(captureGroups[0], resource.render(tag, inlineText));
	}
	return segment;
}

/**
 * Span markdown supports the addition of `class` and `id` attributes. Classes
 * and IDs must be entered into the markdown as the first words, classes
 * prefixed with `.`, and ID prefixed with `#`. When multiple IDs are entered,
 * all but the first one are ignored.
 *
 * E.g.: `{{.my-class #my-id and my text}}`
 */
function markupSpan(segment: string, pattern: RegExp, tag: string) {
	while (pattern.test(segment)) {
		let captureGroups = segment.match(pattern)!;
		let contents: string[] = [];
		let attributes = '';
		let classes: string[] = [];
		let id = '';
		let spannedWords = captureGroups[1].split(' ');
		let plainTextFound = false;
		for (let word of spannedWords) {
			if (word) {
				if (plainTextFound) contents.push(word);
				else if (word.startsWith('.')) {
					if (word.length > 1) classes.push(word.slice(1));
				}
				else if (word.startsWith('#')) {
					if (!id && word.length > 1) id = word.slice(1);
				}
				else {
					plainTextFound = true;
					contents.push(word);
				}
			}
		}
		if (classes.length) attributes += ` class="${classes.join(' ')}"`;
		if (id) attributes += ` id="${id}"`;
		segment = segment.replace(captureGroups[0], `<${tag}${attributes}>${contents.join(' ')}</${tag}>`);
	}
	return segment;
}

/**
 * Maintenance Notes
 * 
 * Adding a new Block element:
 * - add top comments
 * - add top constants:
 *   - HTML tag(s)
 *   - RegExp pattern(s)
 * - define new class extending `MarkdownElement`:
 *   - `isTerminalLine` (not needed for single-line blocks)
 *   - `adjustContent`
 *   - `render`
 * - in `MarkdownText.getNextElement`, add RegExp test and create new object instance
 * - in `Paragraph.isTerminalLine`, add RegExp test
 * 
 * Adding a new Inline element:
 * - add top comments
 * - add top constants:
 *   - HTML tag(s)
 *   - RegExp pattern(s)
 * - in function `markupText`, add RegExp replacement
 */