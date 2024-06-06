/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined limit (e.g., 64--0...63). On instantiation, the caller must
 * provide an HTML workspace (i.e., an HTMLDivElement). The subclasses may
 * create their own divs within this workspace, and must provide methods for
 * initialization, display, etc.
 */

class Divination {
	elements: number; /** number of elements, e.g., 3 dice*/
	facets: number[]; /** number of facets/faces of each element, e.g., 6 die faces (facets.length is 1 if all alike) */
	limit: number; /** divination should result in an integer >= 0 and < limit, e.g., 64 */
	workspace: HTMLElement; /** HTML element where drop-down selection, selected values, etc. may be displayed */

	constructor(elements: number, facets: number[], limit: number, workspace: HTMLElement) {
		this.elements = elements;
		this.facets = facets;
		this.limit = limit;
		this.workspace = workspace;
	}
}

export class Dice extends Divination {

}

export class Coins extends Divination {
	
}

export class Random extends Divination {

}
