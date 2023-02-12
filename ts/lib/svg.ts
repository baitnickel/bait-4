import * as Fetch from '../lib/fetch.js';

export const W3NameSpace = 'http://www.w3.org/2000/svg';

export function appendSVG(targetElement: HTMLElement, svgFile: string, reservedSites: string[] = []) {
	Fetch.fetchData(svgFile).then((svgText: string) => {
		/**
		 * As a test, replace blue site numbers ('#0000FF') with red ones ('red').
		 * A regex like /fill="(.+)">.*</ or /fill="(.+)">J105</ returns jmap7 site colors.
		 * Pseudo colors such as 'site', 'site-na', 'site-cabin' might serve as placeholders in the SVG file;
		 * then configuration could update the SVG text, assigning valid color names based on category.
		 */
		svgText = svgText.replace(/fill="#CBCBCB"/g, 'fill="silver"');
		svgText = svgText.replace(/fill="#CCCCCC"/g, 'fill="silver"');
		svgText = svgText.replace(/fill="#CBCCCC"/g, 'fill="silver"');
		for (let reservedSite of reservedSites) {
			reservedSite = reservedSite.toUpperCase();
			let regex = new RegExp(`fill="(.+)">${reservedSite}<`, 'gi');
			svgText = svgText.replace(regex, `fill="red">${reservedSite}<`);
		}
		const blob = new Blob([svgText], {type: 'image/svg+xml'});
		const url = URL.createObjectURL(blob);
		const imageElement = new Image();
		imageElement.src = url;
		imageElement.width = 500;
		targetElement.append(imageElement);
	});
}
