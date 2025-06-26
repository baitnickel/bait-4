import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
import * as Thread from './lib/thread.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}
const Passages = await Fetch.json<Thread.Passage[]>(`${PAGE.backend}/threads?tags=era+`);

export function render() {
	const lines: string[] = [];
	for (const passage of Passages) {
		const fileName = (passage.file === null) ? '(none)' : passage.file.name;
		lines.push(`File: ${fileName} Section: ${passage.section} Tag: ${passage.tag} Text: ${passage.text.slice(0, 10)}`);
	}
	if (!lines.length) lines.push('No threads found');
	PAGE.appendParagraph(PAGE.content, lines);
}