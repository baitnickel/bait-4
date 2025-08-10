import * as T from './types.js';
import * as MD from './md.js';

export type Passage = {
	file: T.File|null;
	section: number;
	tag: string;
	text: string;
}

/**
 * Thread options (for API POST).
 */
export type QueryOptions = {
	root: string;
	tags: string[];
}

/**
 * Given an array of `MarkdownFile` objects, an array of `queryTags` (tags
 * supplied in the search query), and a `wildcard` character (or character
 * string), return an array of Passage objects. Passages may be global or
 * restricted to a section--global passages are comprised of the entire text of
 * a file when the queryTag appears in the file's metadata, whereas section
 * passages are comprised of only those text lines that follow a line in the
 * file text that contains only tags (including the queryTag), or a line in
 * which the queryTag is embedded. When a `wildcard` is supplied, tags are
 * selected if they start with the queryTag.
 */
export function getPassages(markdownFiles: MD.MarkdownFile[], queryTags: string[], wildcard: string) {
	const passages: Passage[] = [];
	for (const markdownFile of markdownFiles) {
		const globalTagsMatched = globalPassages(markdownFile.file, markdownFile.markdown, queryTags, passages, wildcard);
		if (!globalTagsMatched) sectionPassages(markdownFile.file, markdownFile.markdown, queryTags, passages, wildcard);
	}
	return passages;
}

/**
 * Given a `file`, a `markdown` object, an array of `queryTags`, and an array of
 * `passages`, add the entire text of the markdown file to the passages array if
 * the file's metadata includes one or more of the queryTag search strings. One
 * passage will be created for every search string match. Global passages are
 * always assigned section number 0.
 */
export function globalPassages(file: T.File|null, markdown: MD.Markdown, queryTags: string[], passages: Passage[], wildcard: string) {
	let globalTagsMatched = false;
	const globalTags = markdown.tags();
	for (const tag of matchingTags(queryTags, globalTags, wildcard)) {
		passages.push({file: file, section: 0, tag: tag, text: markdown.text});
		globalTagsMatched = true;
	}
	return globalTagsMatched;
}

/**
 * Given a `file`, a `markdown` object, an array of `queryTags`, and an array of
 * `passages`, add the section or line of text of the markdown file to the
 * passages array if the section or line includes one or more of the tag search
 * strings. One passage will be created for every search string match. Sections
 * are separated by "horizontal rule" lines (e.g., "___") in the markdown text,
 * and are numbered sequentially from 1 to N, where N is the number of sections
 * in the file).
 */
export function sectionPassages(file: T.File|null, markdown: MD.Markdown, queryTags: string[], passages: Passage[], wildcard: string) {
	let textLines: string[] = [];
	let headerTags: string[] = [];
	const hashTagPattern = /#[a-z_]\w*/ig;
	let sectionNumber = 0;
	for (const section of markdown.sections()) {
		sectionNumber += 1;
		const lines = section.split('\n');
		for (const line of lines) {
			const words = line.trim().split(/\s+/);
			const hashTags = line.match(hashTagPattern);

			if (hashTags === null) {
				/** plain text line */
				if (headerTags.length) textLines.push(line);
			}
			else if (hashTags.length == words.length) {
				/** header tags (no plain text) */
				/** first, output any pending passages */
				for (const tag of headerTags) {
					passages.push({file: file, section: sectionNumber, tag: tag, text: textLines.join('\n')});
				}
				/** then, initialize new header */
				headerTags = matchingTags(queryTags, hashTags, wildcard);
				textLines.splice(0); /** initialize (clear) the accumulated text lines */
			}
			else {
				/** embedded tags with plain text */
				for (const tag of matchingTags(queryTags, hashTags, wildcard)) {
					passages.push({file: file, section: sectionNumber, tag: tag, text: line.trim()});
				}
			}
		}
	}
	/** output any pending passages */
	for (const tag of headerTags) {
		passages.push({file: file, section: sectionNumber, tag: tag, text: textLines.join('\n')});
	}
}


/**
 * Given an array of `queryTags`, an array of `hashTags`, and a `wildcard`,
 * return an array of unique hashTags (without the hash) that satisfy the
 * queryTags criteria. When a wildcard is supplied, any tag that begins with a
 * queryTag is selected as a match. 
 */
export function matchingTags(queryTags: string[], hashTags: string[], wildcard: string) {
	const matchingTags = new Set<string>();
	for (const queryTag of queryTags) {
		for (const hashTag of hashTags) {
			const tag = (hashTag.startsWith('#')) ? hashTag.slice(1) : hashTag; /** remove hash, if any*/
			if (queryTag.endsWith(wildcard)) {
				if (tag.startsWith(queryTag.slice(0, -1))) matchingTags.add(tag);
			}
			else if (tag == queryTag) matchingTags.add(tag);
		}
	}
	return Array.from(matchingTags);
}

/**
 * Given an array of `queryArguments` (hashtag names), return an array of unique
 * query tags (i.e., remove duplicate query tags). 
 */
export function getQueryTags(queryArguments: string[], tagPrefix = '') {
	let tags = new Set<string>();
	for (const queryArgument of queryArguments) {
		tags.add(tagPrefix + queryArgument);
	}
	return Array.from(tags);
}

/**
 * Sort Passage objects by tag, file modification (if known), and section
 * number.
 */
export function sortPassages(passages: Passage[]) {
	if (passages.length > 1) {
		passages.sort((a: Passage, b: Passage) => {
			let result = 0;
			result = a.tag.localeCompare(b.tag);
			if (!result && a.file && b.file) {
				const aTime = a.file.modified.getTime();
				const bTime = b.file.modified.getTime();
				result = aTime - bTime;
			}
			if (!result) result = a.section - b.section;
			return result;
		});
	}
}
