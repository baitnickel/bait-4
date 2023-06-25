import { Page } from './lib/page.js';
import * as Embed from './lib/embed.js';
import { YAML } from './lib/yaml.js';
export function render() {
    const page = new Page();
    page.displayMenu();
    page.displayFooter();
    let lyrics = [
        'There’s nothing you can know that isn’t known',
        'Nothing you can see that isn’t shown',
        'Nowhere you can be that isn’t where you’re meant to be',
    ];
    page.content.append(Embed.paragraph(lyrics));
    page.content.append(Embed.smugImage('i-SDpf2qV', 'S'));
    // SVG.appendSVG(page.content, 'data/jmap7.svg', ['93', '95', '97', '99', '103', '104', 'J105']);
    // page.content.append(Embed.youTubeFrame('5FQpeqFmwVk', 560, 315));
    /** test File API (local file access) */
    // https://stackoverflow.com/questions/13975031/reading-multiple-files-with-javascript-filereader-api-one-at-a-time
    // https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
    let newParagraph = document.createElement('p');
    let inputElement = document.createElement('input');
    inputElement.id = 'ie';
    inputElement.type = 'file';
    inputElement.multiple = true;
    let outputDivElement = document.createElement('div');
    outputDivElement.id = 'output';
    outputDivElement.classList.add('scroll-text');
    inputElement.addEventListener("change", () => {
        if (inputElement.files) {
            for (const file of inputElement.files) {
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    outputDivElement.innerText += reader.result;
                });
                reader.readAsText(file);
            }
        }
        // const [file] = inputElement.files as FileList;
        // if (file) {
        // 	const reader = new FileReader();
        // 	reader.addEventListener("load", () => {
        // 		outputDivElement.innerText = reader.result as string;
        // 	});
        // 	reader.readAsText(file);
        // }
    });
    newParagraph.append(inputElement);
    newParagraph.append(outputDivElement);
    page.content.append(newParagraph);
    const yamlText = `
foo: 44A
bar: true
baz: enough
publish: [family, friends]
sites:
  -
    site: 1
    table: 
    comment: open, on corner, exposed and near entrance & highway
  -
    site: 2
    table: true
    comment: lots of tent space, could be OK in combination with 4, but near entrance & highway
	`;
    const yaml = new YAML(yamlText);
    yaml.options.convertNumbers = false;
    // yaml.options.convertNulls = false;
    // yaml.options.convertBooleans = false;
    const data = yaml.parse();
    yaml.reportExceptions();
    console.log('data:', data);
    // console.log(Object.keys(data));
    // console.log(Object.values(data));
    // const dataEntries = Object.entries(data);
    // for (let dataEntry of dataEntries) {
    // 	console.log(dataEntry);
    // }
    // if ('sites' in data) {
    // 	// let siteData = transform<Campsite[]>(data.sites);
    // 	let siteData = <Campsite[]>(data.sites);
    // 	for (let siteDatum of siteData) {
    // 		console.log(siteDatum.site, siteDatum.category, siteDatum.table, siteDatum.comment)
    // 	}
    // }
    if ('sites' in data) {
        let siteData = (data.sites);
        for (let siteDatum of siteData) {
            console.log('siteDatum .site and .category', siteDatum.site, siteDatum.category);
        }
    }
    if ('foo' in data) {
        // let fooData = transform<number>(data.foo);
        let fooData = (data.foo);
        console.log('data.foo coerced to number?', fooData);
    }
    if ('publish' in data) {
        // let targets = Coerce<string[]>(data.publish);
        let targets = (data.publish);
        for (let target of targets)
            console.log(`publish to string array: ${target}`);
    }
}
