/**
 * A Graphic object is a generic graphic element. Objects such as SVG are
 * subclasses of Graphic, inheriting generic properites and methods.
 */

export const SVGNameSpace = 'http://www.w3.org/2000/svg';

export type Coordinates = {
	x: number;
	y: number;
	width: number;
	height: number;
	radius: number;
}
export type RichText = {
	value: string;
	fontSize: number;
	fontFamily: string;
}
export type Margins = {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

class Graphic {

	constructor() {
	}
}

export class SVG extends Graphic {
	element: SVGSVGElement;
	strokeColor: string;
	strokeWidth: number;
	
	constructor(width: number, height: number, strokeColor = 'black', strokeWidth = 1) {
		super();
		this.element = document.createElementNS(SVGNameSpace, 'svg');
		this.element.setAttribute('width', width.toString());
		this.element.setAttribute('height', height.toString());
		this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
		this.strokeColor = strokeColor;
		this.strokeWidth = strokeWidth;
	}

	addGrid(x: number, y: number, columns: number, rows: number, columnWidth: number, rowHeight: number) {
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

	addText(coordinates: Coordinates, text: RichText) {
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

	/**
	 * circle characters: 2299, 229A, 25CB, 25CC, 25CF, 25EF, 26AA, 26AB, 26AC, 2B55, 2B58
	 * cross ('x') characters: 00D7, 2297, 2715, 292B, 292C, 2A09, 2A2F, 2B59, 2BBE, 2BBF
	 * number characters: 2460...2473
	 * dot (guitar neck) characters: 2802, 2805
	 */
}
