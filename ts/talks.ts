import { Page } from './lib/page.js';
import * as T from './lib/types.js';
import * as Fetch from './lib/fetch.js';

const PAGE = new Page();
if (!PAGE.backendAvailable) {
	window.alert(`Cannot connect to: ${PAGE.backend}`);
	window.history.back();
}
console.log('v26.08.19.11.19');
const AudioDataset = await Fetch.api<T.AudioDataset>(`${PAGE.backend}/media/talks`);

export function render() {
	PAGE.setTitle('Talks List');
	const message = (AudioDataset === null) ? 'Nothing Loaded' : `Loaded ${AudioDataset.data.length} Records`;
	PAGE.appendParagraph(PAGE.content, message);
	// Dialog = createModalDialog();
	// document.body.append(Dialog.element);
	// Dialog.element.showModal();
}
