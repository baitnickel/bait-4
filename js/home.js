import { Page } from './lib/page.js';
import * as Embed from './lib/embed.js';
import * as YAML from './lib/yaml.js';
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
    const yamlText = `
foo: 44
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
    const yaml = new YAML.YAML(yamlText);
    yaml.options.convertNumbers = false;
    // yaml.options.convertNulls = false;
    // yaml.options.convertBooleans = false;
    const data = yaml.parse();
    yaml.reportExceptions();
    console.log(data);
    // console.log(Object.keys(data));
    // console.log(Object.values(data));
    // const dataEntries = Object.entries(data);
    // for (let dataEntry of dataEntries) {
    // 	console.log(dataEntry);
    // }
    if ('sites' in data) {
        // let siteData = transform<Campsite[]>(data.sites);
        let siteData = (data.sites);
        for (let siteDatum of siteData) {
            console.log(siteDatum.site, siteDatum.table, siteDatum.comment, siteDatum.whatever);
        }
    }
    if ('foo' in data) {
        // let fooData = transform<number>(data.foo);
        let fooData = (data.foo);
        console.log(fooData);
    }
    if ('publish' in data) {
        // let targets = Coerce<string[]>(data.publish);
        let targets = (data.publish);
        for (let target of targets)
            console.log(`publish to: ${target}`);
    }
}
