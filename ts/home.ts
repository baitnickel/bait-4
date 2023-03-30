import { Page } from './lib/page.js';
import * as Embed from './lib/embed.js';

export function render() {
	const page = new Page();
	page.displayMenu();
	let lyrics: string[] = [
		'There’s nothing you can know that isn’t known',
		'Nothing you can see that isn’t shown',
		'Nowhere you can be that isn’t where you’re meant to be',
	];
	page.content.append(Embed.paragraph(lyrics));
	page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));
	// SVG.appendSVG(page.content, 'data/jmap7.svg', ['93', '95', '97', '99', '103', '104', 'J105']);
	// page.content.append(Embed.youTubeFrame('5FQpeqFmwVk', 560, 315));

}
