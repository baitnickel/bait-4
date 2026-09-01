import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';
import * as W from './lib/widgets.js';

const PAGE = new Page(false, false);

/** all of this stuff should be handled in the `page` module and/or CSS */
PAGE.header.remove();
PAGE.content.remove();
PAGE.footer.remove();

document.documentElement.style['backgroundColor'] = '#000';

document.body.style['backgroundColor'] = '#000';
document.body.style['width'] = '100vw';
document.body.style['maxWidth'] = '100vw';
document.body.style['height'] = '100vh';
document.body.style['maxHeight'] = '100vh';
document.body.style['margin'] = '0';
document.body.style['padding'] = '0';
document.body.style['border'] = '0';
document.body.style['gap'] = '0';

if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}
/***********************************************************************/

export function render() {
	const main = document.createElement('main');
	main.classList.add('canvas-main');
	const box1 = document.createElement('div');
	box1.classList.add('canvas-box1');
	const box2 = document.createElement('div');
	box2.classList.add('canvas-box2');
	const textElement = document.createElement('div');
	textElement.classList.add('canvas-text');
	main.append(box1);
	main.append(box2);
	main.append(textElement);
	document.body.append(main);
	const texts: string[] = [];
	texts.push('Nulla eiusmod cupidatat culpa exercitation Lorem et Lorem commodo deserunt cillum.');
	texts.push('Minim ea do ut duis aliquip labore ad.');
	texts.push('Elit enim tempor elit magna irure aute amet laborum id dolore.');
	texts.push('Nulla eiusmod cupidatat culpa exercitation Lorem et Lorem commodo deserunt cillum.');
	texts.push('Minim ea do ut duis aliquip labore ad.');
	texts.push('Elit enim tempor elit magna irure aute amet laborum id dolore.');
	texts.push('Nulla eiusmod cupidatat culpa exercitation Lorem et Lorem commodo deserunt cillum.');
	texts.push('Minim ea do ut duis aliquip labore ad.');
	texts.push('Elit enim tempor elit magna irure aute amet laborum id dolore.');
	texts.push('Nulla eiusmod cupidatat culpa exercitation Lorem et Lorem commodo deserunt cillum.');
	texts.push('Minim ea do ut duis aliquip labore ad.');
	texts.push('Elit enim tempor elit magna irure aute amet laborum id dolore.');
	let text = texts.join('\n\n');
	text += texts.join('\n\n');
	PAGE.appendParagraph(textElement, text);
}
