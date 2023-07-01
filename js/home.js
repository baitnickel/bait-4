import { Page } from './lib/page.js';
import * as Embed from './lib/embed.js';
export function render() {
    const page = new Page();
    const lyrics = [
        'There’s nothing you can know that isn’t known',
        'Nothing you can see that isn’t shown',
        'Nowhere you can be that isn’t where you’re meant to be',
    ];
    page.content.append(Embed.paragraph(lyrics));
    page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));
}
