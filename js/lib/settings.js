/**
 * Typically, this data is provided via the Page module, but there may be cases
 * where a module needs this data but does not want the overhead of Page.
 */
export const Session = {
    local: (window.location.hostname == 'localhost' || window.location.hostname.startsWith('192.168')),
    username: 'baitnickel',
    repository: 'bait-4',
    branch: 'main',
    built: Date.parse(document.lastModified), /** index.html modification date/time (milliseconds) */
};
/**
 * Fetching site files from the localhost is straightforward, but when
 * fetching from GitHub Pages we must use a special raw content URL.
 */
export function Site() {
    if (Session.local)
        return `${window.location.origin}/${Session.repository}`;
    const rawContent = 'https://raw.githubusercontent.com';
    return `${rawContent}/${Session.username}/${Session.repository}/${Session.branch}`;
}
