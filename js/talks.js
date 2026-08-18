import { Page } from './lib/page.js';
import * as Fetch from './lib/fetch.js';
const PAGE = new Page(false, false);
if (!PAGE.backendAvailable) {
    window.alert(`Cannot connect to: ${PAGE.backend}`);
    window.history.back();
}
const AudioDataset = await Fetch.api(`${PAGE.backend}/media/talks`);
export function render() {
    PAGE.setTitle('Talks List');
    // Dialog = createModalDialog();
    // document.body.append(Dialog.element);
    // Dialog.element.showModal();
}
