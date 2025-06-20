export function getPassages(markdownFiles, queryTags, wildcard) {
    const passages = [];
    if (markdownFiles !== null) {
        for (const markdownFile of markdownFiles) {
            const globalTagsMatched = globalPassages(markdownFile.file, markdownFile.markdown, queryTags, passages, wildcard);
            if (!globalTagsMatched)
                sectionPassages(markdownFile.file, markdownFile.markdown, queryTags, passages, wildcard);
        }
    }
    return passages;
}
export function globalPassages(file, markdown, queryTags, passages, wildcard) {
    let globalTagsMatched = false;
    const globalTags = markdown.tags();
    for (const tag of matchingTags(queryTags, globalTags, wildcard)) {
        passages.push({ file: file, section: 0, tag: tag, text: markdown.text });
        globalTagsMatched = true;
    }
    return globalTagsMatched;
}
/**
 * Given a `file`, a `markdown` object, an array of `queryTags`, and an array
 * of `passages`, add the relevant text of the markdown file to the passages
 * array if the text includes one or more of the tag search strings. One passage
 * will be created for every search string match.
 */
export function sectionPassages(file, markdown, queryTags, passages, wildcard) {
    let textLines = [];
    let headerTags = [];
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
                if (headerTags.length)
                    textLines.push(line);
            }
            else if (hashTags.length == words.length) {
                /** header tags (no plain text) */
                /** first, output any pending passages */
                for (const tag of headerTags) {
                    passages.push({ file: file, section: sectionNumber, tag: tag, text: textLines.join('\n') });
                }
                /** then, initialize new header */
                headerTags = matchingTags(queryTags, hashTags, wildcard);
                textLines.splice(0); /** initialize (clear) the accumulated text lines */
            }
            else {
                /** embedded tags with plain text */
                for (const tag of matchingTags(queryTags, hashTags, wildcard)) {
                    passages.push({ file: file, section: sectionNumber, tag: tag, text: line.trim() });
                }
            }
        }
    }
    /** output any pending passages */
    for (const tag of headerTags) {
        passages.push({ file: file, section: sectionNumber, tag: tag, text: textLines.join('\n') });
    }
}
/**
 * Given an array of `queryTags` and an array of `hashTags`, return an array of
 * unique hashTags (without the hash) that satisfy the queryTags criteria.
 */
export function matchingTags(queryTags, hashTags, wildcard) {
    const matchingTags = new Set();
    for (const queryTag of queryTags) {
        for (const hashTag of hashTags) {
            const tag = (hashTag.startsWith('#')) ? hashTag.slice(1) : hashTag; /** remove hash, if any*/
            if (queryTag.endsWith(wildcard)) {
                if (tag.startsWith(queryTag.slice(0, -1)))
                    matchingTags.add(tag);
            }
            else if (tag == queryTag)
                matchingTags.add(tag);
        }
    }
    return Array.from(matchingTags);
}
/**
 * Given an array of `queryArguments` and a `tagPrefix` (which may be ''), return
 * an array of unique query tags.
 */
export function getQueryTags(queryArguments, tagPrefix) {
    let tags = new Set();
    for (const queryArgument of queryArguments) {
        tags.add(tagPrefix + queryArgument);
    }
    return Array.from(tags);
}
/**
 * Sort Passage objects by tag, file modification (if known), and section
 * number.
 */
export function sortPassages(passages) {
    passages.sort((a, b) => {
        let result = 0;
        result = a.tag.localeCompare(b.tag);
        if (!result && a.file && b.file) {
            const aTime = a.file.modified.getTime();
            const bTime = b.file.modified.getTime();
            result = aTime - bTime;
        }
        if (!result)
            result = a.section - b.section;
        return result;
    });
}
