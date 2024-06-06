/**
 * Each subclass should define the values of each of its elements, icons
 * (button/drop-down option images), and the method for deriving a result within
 * the defined limit (e.g., 64--0...63). On instantiation, the caller must
 * provide an HTML workspace (i.e., an HTMLDivElement). The subclasses may
 * create their own divs within this workspace, and must provide methods for
 * initialization, display, etc.
 */
class Divination {
    constructor(elements, facets, limit, workspace) {
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
