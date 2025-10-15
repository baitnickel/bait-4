const DIRECTORY = new Map([
    ['db', 'db.2210'],
    ['icons', 'icons.2210'],
    ['images', 'images.2210'],
    ['modules', 'modules.2210']
]);
// import * as Site from './index.js'
const Site = {
    BASE_URL: '',
};
/**
Resource is the superclass, Note, Footnote, Audio, Video, &c are subclasses.

The Markup module will handle references to resources, e.g.:
    [photo1]: images/banners/DSC_0288.jpeg "alt info" width="200" height="50" #img44 .right-side .bold

A markdown reference contains the data required to instantiate a resource.
E.g., the example above would create an Image object using:
    url = `${DIRECTORY.images}/banners/DSC_0288.jpeg`      (external or relative links should always contain one or more slashes)
    id = 'img44'                              (word starting with a hash)
    classes = ['right-side', 'bold']          (word(s) starting with a dot)
    options = {'alt': 'alt info', 'width': '200', 'height': '50'}

The 'url' for hyperlinks may be explicit, as above, or may be interpreted, e.g.:
    url = '?page=history&doc=interview'       (query to be added to base URL, always starts with '?')

There may be many references in a markdown document, each corresponding to a
resource, some resources (e.g., an image with a caption) may need special
logic to render it in the HTML page. Resource objects (such as the subclass:
Image) can use the 'options' property to do the rendering.

A separate process should resolve the location of a resource, before the
Resource object is created (it's not part of a Resource object's job).

Articles should be full of links, so they become a big tangle of writing and
music and video and art work &c.

Link:Resource Footnotes: the content of a “footnote” may be a brief statement
   (this is the traditional meaning), or another note, another page (internal
   or external), an image, an audio recording...

We only need one form of Link markdown.

Expanding the notion of Resource objects beyond things that appear within markdown documents, we might have Resource objects such as:
    Session
    Page
    Panel
    Markdown Document (Note)
    CSV Document (Record?)
    Fakesheet

Image Resources might have properties such as 'caption' (string), 'frame' (boolean), 'width'/'height' (numbers), etc.

*/
export class Resource {
    url; /** location */
    id; /** corresponds to CSS/HTML ID */
    classes; /** corresponds to CSS/HTML class(es) */
    options; /** associative array of options */
    constructor(specifications) {
        this.url = '';
        this.id = '';
        this.classes = [];
        this.options = new Map();
        /**
         * Begin by finding the attribute="value" specifications (e.g.,
         * width="200"). Parse them to set this.options, and then remove them
         * from the specifications string.
         */
        let attributeValueMatches = specifications.match(/(\S+?)="(.*?)"/g);
        if (attributeValueMatches !== null) {
            for (let attributeValueMatch of attributeValueMatches) {
                let captureGroups = attributeValueMatch.match(/(\S+?)="(.*?)"/);
                if (captureGroups !== null) {
                    let attribute = captureGroups[1].toLowerCase();
                    let value = captureGroups[2];
                    this.options.set(attribute, value);
                    specifications = specifications.replace(attributeValueMatch, '');
                }
            }
        }
        /**
         * Now, specifications contains only simple words. Parse them.
         */
        if (specifications.trim()) { /** proceed only if specifications is not empty */
            let words = specifications.split(' ');
            for (let word of words) {
                if (word) { /** ignore empty words (products of uncompressed spaces) */
                    if (!this.url) {
                        this.url = word; /** the first word is the URL (we're assuming it contains no spaces) */
                        if (this.url.startsWith('?')) {
                            /** URL is a query string to be added to the base URL
                             * e.g., '?page=history&doc=interview'
                             */
                            this.url = Site.BASE_URL + this.url;
                        }
                        else if (this.url.indexOf('/') > 0) { /** URL begins with text followed by slash, e.g. "images/..." */
                            let urlComponents = this.url.split('/');
                            /**
                             * if the first component of the URL is a key in the
                             * DIRECTORY map, substitute the DIRECTORY map
                             * value - e.g., "images" might become
                             * "images.2206". This allows references to use
                             * generic local directory names such as "images",
                             * which are automatically redirected here.
                             */
                            if (DIRECTORY.has(urlComponents[0])) {
                                urlComponents[0] = DIRECTORY.get(urlComponents[0]);
                                this.url = urlComponents.join('/');
                            }
                        }
                    }
                    else if (word.startsWith('#')) {
                        if (!this.id)
                            this.id = word.slice(1);
                    }
                    else if (word.startsWith('.'))
                        this.classes.push(word.slice(1));
                    else
                        this.options.set(word, ''); /** attribute without value (boolean) */
                }
            }
        }
    }
    render(type, inlineText) {
        let html;
        let closure;
        if (type == 'img') { /** ### IMAGE_TAG and other constants (in markup.ts) should be in a shared module */
            html = `<img src="${this.url}"`;
            if (inlineText)
                html += ` alt="${inlineText}"`;
            closure = '>';
        }
        else { /** type == 'a' */
            html = `<a href="${this.url}"`;
            closure = `>${inlineText}</a>`;
        }
        if (this.id)
            html += ` id="${this.id}"`;
        if (this.classes.length) {
            let classes = this.classes.join(' ');
            html += ` class="${classes}"`;
        }
        this.options.forEach((value, key) => {
            html += ` ${key}="${value}"`;
        });
        html += closure;
        return html;
    }
}
// export class Image extends Resource {
// }
