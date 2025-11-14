/**
 * A Graphic object is a generic graphic element. Objects such as SVG are
 * subclasses of Graphic, inheriting generic properites and methods.
 */
export const SVGNameSpace = 'http://www.w3.org/2000/svg';
class Graphic {
    constructor() {
    }
}
export class SVG extends Graphic {
    element;
    strokeColor;
    strokeWidth;
    constructor(width, height, strokeColor = 'black', strokeWidth = 1) {
        super();
        this.element = document.createElementNS(SVGNameSpace, 'svg');
        this.element.setAttribute('width', width.toString());
        this.element.setAttribute('height', height.toString());
        this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
    }
    addGrid(x, y, columns, rows, columnWidth, rowHeight) {
        if (rows > 0 && columns > 0) {
            const gridWidth = columns * columnWidth;
            const gridHeight = rows * rowHeight;
            /** draw horizontal lines */
            for (let row = 0; row <= rows; row += 1) {
                const yOffset = row * rowHeight;
                const svgLine = document.createElementNS(SVGNameSpace, 'line');
                svgLine.setAttribute('x1', `${x}`);
                svgLine.setAttribute('x2', `${x + gridWidth}`);
                svgLine.setAttribute('y1', `${y + yOffset}`);
                svgLine.setAttribute('y2', `${y + yOffset}`);
                svgLine.setAttribute('stroke', this.strokeColor);
                svgLine.setAttribute('stroke-width', this.strokeWidth.toString());
                this.element.appendChild(svgLine);
            }
            /** draw vertical lines */
            for (let column = 0; column <= columns; column += 1) {
                const xOffset = column * columnWidth;
                const svgLine = document.createElementNS(SVGNameSpace, 'line');
                svgLine.setAttribute('x1', `${x + xOffset}`);
                svgLine.setAttribute('x2', `${x + xOffset}`);
                svgLine.setAttribute('y1', `${y}`);
                svgLine.setAttribute('y2', `${y + gridHeight}`);
                svgLine.setAttribute('stroke', this.strokeColor);
                svgLine.setAttribute('stroke-width', this.strokeWidth.toString());
                this.element.appendChild(svgLine);
            }
        }
    }
    addText(coordinates, text) {
        let svg = document.createElementNS(SVGNameSpace, 'svg');
        svg.setAttribute('x', coordinates.x.toString());
        svg.setAttribute('y', coordinates.y.toString());
        svg.setAttribute('width', coordinates.width.toString());
        svg.setAttribute('height', coordinates.height.toString());
        let svgText = document.createElementNS(SVGNameSpace, 'text');
        svgText.setAttribute('x', Math.round(coordinates.width * .5).toString());
        svgText.setAttribute('y', Math.round(coordinates.height * .7).toString());
        svgText.setAttribute('text-anchor', 'middle');
        svgText.setAttribute('font-family', text.fontFamily);
        svgText.setAttribute('font-size', text.fontSize.toString());
        svgText.innerHTML = text.value;
        svg.appendChild(svgText);
        return svg;
    }
}
