export const Session = {
	local: (window.location.hostname == 'localhost'),
	username: 'baitnickel',
	repository: 'bait-4',
	branch: 'main',
	built: (new Date('2023-09-21T19:05:15')).valueOf(),
	encryption: 26,
	encryptPrefix: 999,
}

/**
 * Fetching content files from the localhost is straightforward, but from GitHub
 * Pages we must use a special raw content URL. 
*/
export function ContentOrigin() {
	if (Session.local) return `${window.location.origin}/${Session.repository}`;
	const rawContent = 'https://raw.githubusercontent.com';
	return `${rawContent}/${Session.username}/${Session.repository}/${Session.branch}`;
}
