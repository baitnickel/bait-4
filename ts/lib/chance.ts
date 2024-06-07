/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined limit (e.g., 64--0...63). On instantiation, the caller must
 * provide an HTML workspace (i.e., an HTMLDivElement). The subclasses may
 * create their own divs within this workspace, and must provide methods for
 * initialization, display, etc.
 * 
 * Creating a Chance object should be rarely done--this is why we have
 * subclasses. Constructors probably don't need arguments--use setters instead.
 * The superclass object is completely dumb, it won't do anything much for you,
 * unless you just want a random number >= 0 and < 1. Each subclass establishes
 * its default behavior, its icons, its input process. Every object must return
 * a result constrained by its unique parameters/properties.
 * 
 * Calling programs may influence any object by altering its properties to suit
 * their needs. The calling program may, for instance, create multiple objects
 * and blend their results. For example, you want a result 0...63 by rolling
 * three normal dice. The three dice can return such results as 6x6x6 and 3x6x6
 * and 2x6x6, none of which produce a usable result--but the calling program can
 * also "divine" additional results to refine the dice result, e.g., get a
 * "seasonal" result using the earth's orbit, moon phases, sun time, etc.
 */

class Chance {
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

export class Dice extends Chance {

}

export class Coins extends Chance {
	
}

export class Orbitals extends Chance {
	
}
