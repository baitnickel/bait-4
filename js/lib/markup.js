import { Resource } from './resource.js';
/*###
 * Recognize embedded tags (#todo, #todo2, #todo-3, &c.). Does not apply to tags
 * listed in Front Matter--these are treated separately. Replace tag with space,
 * and condense space around it, trim start and/or end if tag appears at start
 * or end? Does not apply within Code and Code Blocks.
 *
 * Support custom markdown enclosed in braces. Mostly this will be resource
 * references such as {photo: foo}, {photo/category: bar}, where the Front
 * Matter of the document resolves the reference. The current
 * [content][reference] and ![content][reference] URL and Image syntaxes are
 * standard markdown and probably can coexist with new brace syntax. Braces may
 * also be used as a replacement for the current Span syntax: {{.foo #bar
 * content text}}.
 */
/*
 * Code Blocks - delimited by '~~~' or '```', lines from delimiter thru delimiter
 * Quote Blocks - consecutive lines beginning with '> '
 * Quotation - a line consisting of a quoted string followed by a tilde and an attribution
 * List Blocks - consecutive lines beginning with '- ' or '\d+\. '
 * Headings - line beginning with 1-6 hashes (#) followed by whitespace
 * Horizontal Rules - line consisting of '---' or '***' or '___'{3,}
 * Details Block - block following line starting with '#$ ', terminated by another Details line or EOF
 * Paragraphs - lines not matching any of above patterns until empty line
 *
 * Code - `content`
 * Bold - **content**
 * Italics - *content*
 * URL - [content](url) or [content][reference]
 * Image - ![content](url) or ![content][reference]
 * Span - {{content}}
 */
const MARKUP = {
    version: '2023.09.07',
};
console.log(`markup: ${MARKUP.version}`);
/* block patterns */
const CODE_BLOCK_PATTERN = /^(~~~|```)$/;
const QUOTE_BLOCK_PATTERN = /^>\s*/; // note: does not enforce space between '>' and text
const QUOTATION_PATTERN = /^"(.+)"\s*~\s*(.+)$/; // e.g., "I think therefore I am" ~ Descartes
const LIST_BLOCK_PATTERN = /^([-+*]|\d{1,}\.)\s+\S+/;
const LIST_BLOCK_LEAD_PATTERN = /^([-+*]|\d{1,}\.)\s+/;
const HEADING_PATTERN = /^#{1,6}\s+\S+/;
const HORIZONTAL_RULE_PATTERN = /^[-_*]{3,}\s*$/;
const DETAILS_PATTERN = /^#\$\s*/;
/* HTML tags */
const CODE_TAG = 'code';
const BOLD_TAG = 'strong';
const ITALIC_TAG = 'em';
const IMAGE_TAG = 'img';
const LINK_TAG = 'a';
const SPAN_TAG = 'span';
const UNORDERED_ITEM_TYPE = 'ul';
const ORDERED_ITEM_TYPE = 'ol';
/* non-global patterns--text will be split on this pattern (there will only be 1 per segment) */
const CODE_PATTERN = /(`.+?`)/;
const CODE_SEGMENT_PATTERN = /^`.+`$/;
/* global patterns--replacements are simple segment.replace operations */
const BOLD_PATTERN = /\*{2}(.+?)\*{2}/g;
const ITALIC_PATTERN = /\*(.+?)\*/g;
const IMAGE_PATTERN = /!\[(.*?)\]\((.*?)\)/g; /** ###  was: /!\[(.*)]\((.*?)\)/ */
const LINK_PATTERN = /\[(.*?)]\((.*?)\)/g;
/* non-global patterns--replacements are complex and will be performed in a while loop */
const IMAGE_REFERENCE_PATTERN = /!\[(.*?)\]\[(\S*?)\]/;
const LINK_REFERENCE_PATTERN = /\[(.*?)\]\[(\S*?)\]/;
const SPAN_PATTERN = /\{\{(.*?)\}\}/;
let IN_DETAILS_BLOCK = false; /* for now, this must be global */
/**
 * This function is typically the starting point. Given a string containing
 * multiple lines of markdown text, or an array of lines of markdown text, it
 * returns an array of HTML lines. It does this by generating an array of
 * `MarkdownElement` objects; each with a `render` method that generates HTML.
 * The `baseUrl` parameter is only required if markdown contains resource
 * objects with relative (query) definitions.
 *
 * The first pass at the beginning of this function collects all references and
 * stores them in a Map, where they can be looked up during the second pass to
 * resolve absolute URLs. References are referred to in hyperlink, image,
 * footnote, &c. markdown.
 */
export function Markup(markdown, baseUrl = '') {
    /* First Pass: Create a list of Resource objects from markdown references */
    let resources = new Map(); /* see: https://www.carlrippon.com/typescript-dictionary/ */
    let htmlLines = [];
    let markdownLines = (typeof markdown == 'string') ? markdown.split('\n') : markdown;
    let referencePattern = /^\[(\S+)\]:\s+(.*)/;
    /* step through the array in reverse order, as we will remove items along the way */
    for (let i = markdownLines.length - 1; i >= 0; i -= 1) {
        let referenceMatch = markdownLines[i].trim().match(referencePattern);
        if (referenceMatch !== null) {
            let name = referenceMatch[1].toLowerCase();
            let parameters = referenceMatch[2];
            let resource = new Resource(parameters);
            resources.set(name, resource); /** add resource to map */
            markdownLines.splice(i, 1); /** remove the markdown line so it won't be processed in pass two */
        }
    }
    /*
     * Second Pass: Create an array of MarkdownElement objects and render their
     * HTML, returning a single HTML string representing the entire document.
     * Each MarkdownElement object will contain one or more lines of markdown
     * text "content".
     */
    let elements = [];
    let index = 0;
    IN_DETAILS_BLOCK = false;
    while (true) {
        let element = MarkdownElement.getMarkdownElement(markdownLines, index, resources);
        if (element === null)
            break;
        elements.push(element);
        index += element.length;
    }
    for (let element of elements) {
        htmlLines = htmlLines.concat(element.render());
    }
    if (IN_DETAILS_BLOCK)
        htmlLines.push('</details>');
    return htmlLines.join('\n');
}
/**
 * Mark up a single line of text. We call the internal `markup` function, the
 * same function that is called by MarkdownElement.render().
 *
 * Options: `M`: markup - convert Markdown text to HTML; `E`: escape special
 * characters using HTML Entities; `T`: typeset characters using proper quotes,
 * dashes, ellipses, etc.; `F`: like `T` for Fixed-width fonts (no dash or
 * ellipsis conversion);
 *
 * (### Can this function be integrated into the `Markup` function? Why can't a
 * single line be treated as a single-element array in `Markup`?)
 */
export function MarkupLine(line, options) {
    options = options.toUpperCase();
    if (options.includes('E'))
        line = encodeEntities(line);
    if (options.includes('T') || options.includes('F')) {
        if (options.includes('F'))
            line = typeset(line, true);
        else
            line = typeset(line, false);
    }
    if (options.includes('M'))
        line = markup(line);
    return line;
}
/**
 * Typically called by the factory method, `getMarkdownElement`.
 *
 * `content`: always initialized to an empty array of strings?
 * `tags`: one or more HTML tags to be opened at the beginning and closed at the end
 * `typesetting`: should content lines be typeset?
 * `markingUp`: might content lines contain inline markdown?
 */
class MarkdownElement {
    constructor(content, tags, typesetting, markingUp) {
        this.prefix = '';
        this.suffix = '';
        this.endOfLine = '';
        this.typesetting = typesetting;
        this.markingUp = markingUp;
        this.resources = null;
        this.content = content;
        this.length = content.length; /* content length on instantiation */
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
     * A Factory method. Parse through lines of markdown text, beginning at
     * the line indicated by index (starting at line 0), and ending when the
     * first element encountered is complete. Instantiate and return a
     * MarkdownElement object. The index may be reset for a subsequent call
     * by adding MarkdownElement.length to the previous index (which is what
     * the calling function, `Markup`, does).
     *
     * Returns the MarkdownElement object, or null.
     */
    static getMarkdownElement(lines, index, resources) {
        let element = null;
        let content = [];
        let contentTerminated = false;
        let seekingFirstLine = true;
        for (let i = index; i < lines.length; i += 1) {
            let line = lines[i];
            if (seekingFirstLine) {
                if (line.trim() == '') {
                    /*
                     * Write leading empty lines to content. This is done so
                     * that the caller can properly advance the lines index
                     * based on the length of (number of markdown lines
                     * comprising) the element's content.
                     */
                    content.push(line.trim());
                }
                else {
                    seekingFirstLine = false;
                    /*
                     * The first non-empty line identifies the element type.
                     * These are all block elements as opposed to inline
                     * elements. Heading and Horizontal Rule elements are
                     * somewhat special cases, in this respect, as they are
                     * blocks that always begin and end on the same line, ending
                     * implicitly.
                     */
                    let trimmedLine = line.trim();
                    if (CODE_BLOCK_PATTERN.test(trimmedLine))
                        element = new CodeBlock();
                    else if (QUOTE_BLOCK_PATTERN.test(trimmedLine))
                        element = new QuoteBlock();
                    else if (QUOTATION_PATTERN.test(trimmedLine))
                        element = new Quotation();
                    else if (LIST_BLOCK_PATTERN.test(trimmedLine))
                        element = new ListBlock();
                    else if (HEADING_PATTERN.test(trimmedLine))
                        element = new Heading();
                    else if (HORIZONTAL_RULE_PATTERN.test(trimmedLine))
                        element = new HorizontalRule();
                    else if (DETAILS_PATTERN.test(trimmedLine))
                        element = new Details();
                    else
                        element = new Paragraph();
                    content.push(line);
                }
            }
            else {
                /*
                 * This is a line following the element's first non-empty line.
                 * If we have reached a line which represents the end of the
                 * element's content, break out of the loop. Otherwise, add this
                 * line to the content and continue.
                 */
                if (element !== null && element.terminalLine(line.trim())) {
                    if (element.addTerminalLine)
                        content.push(line);
                    contentTerminated = true;
                    break;
                }
                else
                    content.push(line);
            }
        }
        if (element !== null) {
            if (!contentTerminated && element.addTerminalLine)
                content.push('');
            element.addContent(content);
            element.resources = resources;
        }
        return element;
    }
    /**
     * 'addContent' is called after the object is instantiated to set its
     * 'content' and 'length' properties (subclasses may set additional
     * properties). Leading empty lines are removed. This is the first step in
     * converting the raw markdown text to HTML.
     */
    addContent(content) {
        this.content = content;
        this.length = content.length; /** length includes leading empty lines */
        while (this.content[0].trim() == '')
            this.content.shift(); /* remove leading empty lines */
    }
    /**
     * Called by the factory method `getMarkdownElement` during the creation of
     * a `MarkdownElement` object to determine when a multi-line element is
     * complete. 'terminalLine' returns true if the given line of markdown text
     * represents the end of the current block element, else false. Subclasses
     * for single-line elements do not need to override this method, as the
     * first (and only) line is always the terminal line.
     */
    terminalLine(line) {
        return true;
    }
    /**
     * Read the object's content lines and return HTML lines. HTML entity
     * encoding is done here, as well as typesetting and inline markup, as
     * appropriate. The HTML start and end tags (prefix and suffix) are added to
     * the first and last lines, respectively.
     */
    render() {
        let htmlLines = [];
        for (let i in this.content) {
            let line = this.content[i];
            line = encodeEntities(line);
            if (this.typesetting)
                line = typeset(line);
            if (this.markingUp)
                line = markup(line, this.resources);
            if (+i == 0)
                line = this.prefix + line;
            if (+i < this.content.length - 1)
                line += this.endOfLine;
            else
                line += this.suffix;
            htmlLines.push(line);
        }
        return htmlLines;
    }
}
//### need to test un-delimited code block at end of source file
//### need to ensure that starting pattern matches ending pattern
class CodeBlock extends MarkdownElement {
    constructor() {
        super([], ['pre', 'code'], false, false);
        this.addTerminalLine = true;
    }
    addContent(content) {
        super.addContent(content);
        /** Remove the first and last lines (the delimiters--'```' or '~~~') */
        this.content.shift();
        this.content.pop();
    }
    terminalLine(line) {
        return CODE_BLOCK_PATTERN.test(line);
        // return (line.trim() == this.content[0].trim());
    }
}
class QuoteBlock extends MarkdownElement {
    constructor() {
        super([], ['blockquote'], true, true);
        this.endOfLine = '<br>';
    }
    addContent(content) {
        super.addContent(content);
        /* Remove the indentation indicator ('>') and add line breaks. */
        let newContent = [];
        for (let line of content) {
            line = line.trim().replace(/^>\s*/, '');
            newContent.push(line);
        }
        this.content = newContent;
    }
    terminalLine(line) {
        return !(QUOTE_BLOCK_PATTERN.test(line));
    }
}
/**
 * Custom markup, source example: "I think therefore I am" ~ Descartes
 */
class Quotation extends MarkdownElement {
    constructor() {
        super([], ['p', 'blockquote'], true, true); /* every quotation is its own paragraph */
    }
    /*
     * When rendering a `Quotation` line, we will use only the RegExp captured
     * results, creating one line for the quotation and one line for the
     * attribution.
     */
    render() {
        let htmlLines = [];
        const matchResults = QUOTATION_PATTERN.exec(this.content[0]);
        let lines = [];
        let properQuotation = false;
        if (matchResults === null || matchResults.length < 3)
            lines = this.content;
        else {
            properQuotation = true;
            lines = matchResults.slice(1, 3);
        }
        for (let i in lines) {
            lines[i] = encodeEntities(lines[i]);
            if (this.typesetting)
                lines[i] = typeset(lines[i]);
            if (this.markingUp)
                lines[i] = markup(lines[i]);
        }
        if (properQuotation) {
            const quote = '\u201c';
            const endQuote = '\u201d';
            const indentation = '&numsp;&numsp;';
            const quotation = `${this.prefix}${quote}${lines[0]}${endQuote}<br>`;
            const attribution = `<small>${indentation}~ ${lines[1]}</small>${this.suffix}`;
            htmlLines.push(`${quotation}${attribution}`);
        }
        else
            htmlLines = lines;
        return htmlLines;
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
        super([], ['li'], true, true);
    }
    render() {
        let items = [];
        let previousLevel = -1;
        for (let line of this.content) {
            let level = 0;
            let itemType = UNORDERED_ITEM_TYPE;
            let value = '';
            let tabs = line.match(/^\t*/);
            if (tabs)
                level = tabs[0].length;
            if (/^\d+\./.test(line.trim()))
                itemType = ORDERED_ITEM_TYPE;
            let lineContents = line.trim().split(LIST_BLOCK_LEAD_PATTERN);
            if (lineContents.length >= 3)
                value = lineContents[2];
            if (value) {
                if (level > previousLevel + 1)
                    level = previousLevel + 1; /* limit indentation */
                value = encodeEntities(value);
                if (this.markingUp)
                    value = markup(value, this.resources);
                if (this.typesetting)
                    value = typeset(value);
                let item = new ListItem(level, itemType, value);
                items.push(item);
                previousLevel = level;
            }
        }
        let blocks = [];
        let previousItem = null;
        for (let item of items) {
            if (previousItem === null)
                blocks.push(new ListSubBlock(item.itemType, this.prefix, this.suffix));
            else if (previousItem.level < item.level) {
                blocks.push(new ListSubBlock(item.itemType, this.prefix, this.suffix));
                previousItem.block = blocks[blocks.length - 1];
            }
            else if (previousItem.level > item.level) {
                for (let i = previousItem.level - item.level; i > 0; i -= 1)
                    blocks.pop();
            }
            blocks[blocks.length - 1].addItem(item);
            previousItem = item;
        }
        let htmlLines = [];
        if (blocks.length > 0) {
            htmlLines = blocks[0].render();
        }
        return htmlLines;
    }
    terminalLine(line) {
        return !(LIST_BLOCK_PATTERN.test(line));
    }
}
class ListItem {
    constructor(level, itemType, value) {
        this.level = level;
        this.itemType = itemType;
        this.value = value;
        this.block = null;
    }
}
class ListSubBlock {
    constructor(listType, prefix, suffix) {
        this.listType = listType;
        this.items = [];
        this.prefix = prefix;
        this.suffix = suffix;
    }
    addItem(item) {
        this.items.push(item);
    }
    render() {
        let htmlLines = [];
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
        super([], ['h#'], true, true);
    }
    addContent(content) {
        super.addContent(content);
        let line = content[0].trim(); /* heading elements can only have one line */
        let matches = line.match(/^#{1,6}/); /* subset of MarkdownElement.HEADING_PATTERN (just the hashes) */
        if (matches) { /* should always be true or we wouldn't be here */
            let hashes = matches[0];
            line = line.substring(hashes.length).trim();
            this.prefix = this.prefix.replace('#', `${hashes.length}`); /* '#' is our arbitrary char in tags */
            this.suffix = this.suffix.replace('#', `${hashes.length}`);
        }
        this.content = [line];
    }
}
class HorizontalRule extends MarkdownElement {
    constructor() {
        super([], ['hr'], false, false);
    }
    render() {
        return [this.prefix];
    }
}
class Details extends MarkdownElement {
    constructor() {
        super([], ['details'], true, true);
    }
    addContent(content) {
        super.addContent(content);
        let lines = [];
        let line = content[0].trim(); /* details elements can only have one line */
        line = line.replace('#$', '').trim();
        if (line)
            lines.push(line);
        this.content = lines; /** 0 or 1 line; 1 line contains summary */
    }
    render() {
        let htmlLines = [];
        if (IN_DETAILS_BLOCK)
            htmlLines.push(this.suffix); /** close previous Details section */
        if (this.content.length) {
            let summary = this.content[0];
            summary = encodeEntities(summary);
            if (this.typesetting)
                summary = typeset(summary);
            if (this.markingUp)
                summary = markup(summary);
            htmlLines.push(`${this.prefix}<summary>${summary}</summary>`);
            IN_DETAILS_BLOCK = true;
        }
        else
            IN_DETAILS_BLOCK = false;
        return htmlLines;
    }
}
class Paragraph extends MarkdownElement {
    constructor() {
        super([], ['p'], true, true);
        this.endOfLine = '<br>';
    }
    terminalLine(line) {
        /*
         * A paragraph is terminated by an empty line or any of the block elements
         */
        return (line == ''
            || CODE_BLOCK_PATTERN.test(line)
            || QUOTE_BLOCK_PATTERN.test(line)
            || QUOTATION_PATTERN.test(line)
            || LIST_BLOCK_PATTERN.test(line)
            || HEADING_PATTERN.test(line)
            || HORIZONTAL_RULE_PATTERN.test(line)
            || DETAILS_PATTERN.test(line));
    }
}
/**
 * Replace special characters `&`, `<`, and `>`, characters that may conflict
 * with HTML rendering, with corresponding `&xx;` HTML entities.
 */
function encodeEntities(text) {
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
function typeset(text, fixedWidth = false) {
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
 * prior inspection of the whole document), return HTML markup.
 */
function markup(text, resources = null) {
    /*
     * Split text into segments, made up of `code` segments and non-`code`
     * segments. Inline markup is applied to only non-`code` segments.
     */
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
            segment = segment.replace(LINK_PATTERN, `<${LINK_TAG} href="$2">$1</${LINK_TAG}>`);
            segment = segment.replace(BOLD_PATTERN, `<${BOLD_TAG}>$1</${BOLD_TAG}>`);
            segment = segment.replace(ITALIC_PATTERN, `<${ITALIC_TAG}>$1</${ITALIC_TAG}>`);
            /* complex replacements (cannot be done using a simple global replacement) */
            if (resources !== null) {
                segment = markupReference(segment, IMAGE_REFERENCE_PATTERN, IMAGE_TAG, resources);
                segment = markupReference(segment, LINK_REFERENCE_PATTERN, LINK_TAG, resources);
            }
            segment = markupSpan(segment, SPAN_PATTERN, SPAN_TAG);
        }
        markedUpText += segment;
    }
    return markedUpText;
}
/**
 * Image and Link markdown using references, resolved in Resource objects.
 */
function markupReference(segment, pattern, tag, resources) {
    while (pattern.test(segment)) {
        let captureGroups = segment.match(pattern);
        let inlineText = captureGroups[1];
        let resourceKey = captureGroups[2].toLowerCase();
        let resource = resources.get(resourceKey);
        if (resource)
            segment = segment.replace(captureGroups[0], resource.render(tag, inlineText));
    }
    return segment;
}
/**
 * Span markdown supports the addition of `class` and `id` attributes. Classes
 * and IDs must be entered into the markdown as the first words, classes
 * prefixed with `.`, and ID prefixed with `#`. When multiple IDs are entered,
 * all but the first one is ignored.
 *
 * E.g.: `{{.my-class #my-id and my text}}`
 */
function markupSpan(segment, pattern, tag) {
    /**
     */
    while (pattern.test(segment)) {
        let captureGroups = segment.match(pattern);
        let contents = [];
        let attributes = '';
        let classes = [];
        let id = '';
        let spannedWords = captureGroups[1].split(' ');
        let plainTextFound = false;
        for (let word of spannedWords) {
            if (word) {
                if (plainTextFound)
                    contents.push(word);
                else if (word.startsWith('.')) {
                    if (word.length > 1)
                        classes.push(word.slice(1));
                }
                else if (word.startsWith('#')) {
                    if (!id && word.length > 1)
                        id = word.slice(1);
                }
                else {
                    plainTextFound = true;
                    contents.push(word);
                }
            }
        }
        if (classes.length)
            attributes += ` class="${classes.join(' ')}"`;
        if (id)
            attributes += ` id="${id}"`;
        segment = segment.replace(captureGroups[0], `<${tag}${attributes}>${contents.join(' ')}</${tag}>`);
    }
    return segment;
}
