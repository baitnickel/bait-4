import { Page } from './lib/page.js';
import * as Embed from './lib/embed.js';
import { Markup, MarkupLine } from './lib/markup.js';

export function render() {
	const page = new Page();
	const lyrics: string[] = [
		'There’s nothing you can know that isn’t known',
		'Nothing you can see that isn’t shown',
		'Nowhere you can be that isn’t where you’re meant to be',
		`Session encryption value is ${page.encryption}`,
	];
	page.content.append(Embed.paragraph(lyrics));
	page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));
	const markdown: string[] = [
		'### Sample Markdown',
		'In the *very* beginning there was only the **void**. God took a look at the void and decided it was very good. "Very good!", God said to itself. And so the world began.',
		'>Void in every sense of the word',
		'>  (To the point of being senseless).',
		'After a while, there was `light` and the tree of knowledge.',
		'',
		'"There\'s nothing you can know that isn\'t known." ~ John Lennon, *All You Need Is Love*',
		'',
		'Getting a quote to be formatted correctly is important!',
		'~~~',
		'let i = 0;',
		'i += 1;',
		'console.log(i);',
		'~~~',
		'',
		'{{.blue Am I blue?}}',
	];
	const html = Markup(markdown.join('\n'));
	page.content.append(Embed.paragraph(html));
}
