/**
 * A Graphic object is a generic graphic element. Objects such as SVG are
 * subclasses of Graphic, inheriting generic properites and methods.
 */
export const SVGNameSpace = 'http://www.w3.org/2000/svg';
// export type Margins = {
// 	top: number;
// 	right: number;
// 	bottom: number;
// 	left: number;
// }
class Graphic {
    static odometer = 0;
    width;
    height;
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    /**
     * Given a `point` (a string containing two positive integers separated by a
     * comma or whitespace) return a two-element array of integers x and y. If
     * `point` is improperly formed, return [0,0].
     */
    xy(point) {
        let xy = [0, 0];
        let match = /^(\d+)\s*,\s*(\d+)$/.exec(point.trim());
        if (match === null)
            match = /^(\d+)\s+(\d+)$/.exec(point.trim());
        if (match !== null)
            xy = [Number(match[1]), Number(match[2])];
        return xy;
    }
    /**
     * Given two positive integers `x` and `y`, return a string representing the
     * x,y point (e.g., "1,2"). `x` and `y` are rounded to the nearest integers.
     * If either `x` or `y` is not a positive number, return the string "0,0".
     */
    point(x, y) {
        let point = '0,0';
        x = Math.round(x);
        y = Math.round(y);
        if (x >= 0 && y >= 0)
            point = `${x},${y}`;
        return point;
    }
    static nextID(group) {
        Graphic.odometer += 1;
        return `${group}-${Graphic.odometer}`;
    }
}
export class Point {
    x;
    y;
    constructor(x, y) {
        this.x = Math.round(x);
        this.y = Math.round(y);
    }
    get position() { return `${this.x},${this.y}`; }
}
export class SVG extends Graphic {
    static strokeColor = 'black';
    static strokeWidth = 1;
    static group = '';
    element;
    constructor(width, height, borderColor = '') {
        super(width, height);
        this.element = document.createElementNS(SVGNameSpace, 'svg');
        this.element.setAttribute('width', `${width}`);
        this.element.setAttribute('height', `${height}`);
        this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
        if (borderColor)
            this.showBorder(borderColor);
    }
    addGrid(point, columns, rows, columnWidth, rowHeight) {
        const lineElements = [];
        if (rows > 0 && columns > 0) {
            const gridWidth = columns * columnWidth;
            const gridHeight = rows * rowHeight;
            /** draw horizontal lines */
            for (let row = 0; row <= rows; row += 1) {
                const yOffset = row * rowHeight;
                const svgLine = document.createElementNS(SVGNameSpace, 'line');
                svgLine.setAttribute('x1', `${point.x}`);
                svgLine.setAttribute('x2', `${point.x + gridWidth}`);
                svgLine.setAttribute('y1', `${point.y + yOffset}`);
                svgLine.setAttribute('y2', `${point.y + yOffset}`);
                svgLine.setAttribute('stroke', SVG.strokeColor);
                svgLine.setAttribute('stroke-width', `${SVG.strokeWidth}`);
                this.element.appendChild(svgLine);
                lineElements.push(svgLine);
            }
            /** draw vertical lines */
            for (let column = 0; column <= columns; column += 1) {
                const xOffset = column * columnWidth;
                const svgLine = document.createElementNS(SVGNameSpace, 'line');
                svgLine.setAttribute('x1', `${point.x + xOffset}`);
                svgLine.setAttribute('x2', `${point.x + xOffset}`);
                svgLine.setAttribute('y1', `${point.y}`);
                svgLine.setAttribute('y2', `${point.y + gridHeight}`);
                svgLine.setAttribute('stroke', SVG.strokeColor);
                svgLine.setAttribute('stroke-width', SVG.strokeWidth.toString());
                this.element.appendChild(svgLine);
                lineElements.push(svgLine);
            }
        }
        return lineElements; /** the caller may want to do something with these */
    }
    addText(point, anchor, text) {
        let svgText = document.createElementNS(SVGNameSpace, 'text');
        svgText.setAttribute('x', `${point.x}`);
        svgText.setAttribute('y', `${point.y}`);
        svgText.setAttribute('text-anchor', anchor);
        svgText.setAttribute('font-family', text.fontFamily);
        svgText.setAttribute('font-size', `${text.fontSize}`);
        svgText.innerHTML = text.value;
        this.element.appendChild(svgText);
        return svgText; /** the caller may want to do something with this */
    }
    showBorder(borderColor) {
        const border = document.createElementNS(SVGNameSpace, 'rect');
        border.setAttribute('x', '0');
        border.setAttribute('y', '0');
        border.setAttribute('width', `${this.width}`);
        border.setAttribute('height', `${this.height}`);
        border.setAttribute('stroke', borderColor);
        border.setAttribute('fill', 'transparent');
        border.setAttribute('stroke-width', '2');
        border.setAttribute('stroke-dasharray', '10,5'); // stroke-dasharray="10,5"
        this.element.appendChild(border);
    }
}
