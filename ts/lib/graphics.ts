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
	static odometer = 0;
	width: number;
	height: number;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
	}

	/**
	 * Given a `point` (a string containing two positive integers separated by a
	 * comma or whitespace) return a two-element array of integers x and y. If
	 * `point` is improperly formed, return [0,0].
	 */
	xy(point: string) {
		let xy = [0,0];
		let match = /^(\d+)\s*,\s*(\d+)$/.exec(point.trim());
		if (match === null) match = /^(\d+)\s+(\d+)$/.exec(point.trim());
		if (match !== null) xy = [Number(match[1]), Number(match[2])];
		return xy;
	}

	/**
	 * Given two positive integers `x` and `y`, return a string representing the
	 * x,y point (e.g., "1,2"). If either `x` or `y` is not a positive integer,
	 * return the string "0,0".
	 */
	point(x: number, y: number) {
		let point = '0,0';
		if (Number.isInteger(x) && x >= 0 && Number.isInteger(y) && y >= 0) point = `${x},${y}`;
		return point;
	}

	static nextID(group: string) {
		Graphic.odometer += 1;
		return `${group}-${Graphic.odometer}`;
	}
}

export class SVG extends Graphic {
	static strokeColor = 'black';
	static strokeWidth = 1;
	static group = '';
	element: SVGSVGElement;
	
	constructor(width: number, height: number) {
		super(width, height);
		this.element = document.createElementNS(SVGNameSpace, 'svg');
		this.element.setAttribute('width', `${width}`);
		this.element.setAttribute('height', `${height}`);
		this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);

		const border = document.createElementNS(SVGNameSpace, 'rect');
		border.setAttribute('x', '0');
		border.setAttribute('y', '0');
		border.setAttribute('width', `${width}`);
		border.setAttribute('height', `${height}`);
		border.setAttribute('stroke', 'red');
		border.setAttribute('fill', 'transparent');
		border.setAttribute('stroke-width', '1');
		this.element.appendChild(border);
	}

	addGrid(point: string, columns: number, rows: number, columnWidth: number, rowHeight: number) {
		const lineElements: SVGLineElement[] = [];
		if (rows > 0 && columns > 0) {
			const [x, y] = this.xy(point)
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
				svgLine.setAttribute('stroke', SVG.strokeColor);
				svgLine.setAttribute('stroke-width', `${SVG.strokeWidth}`);
				this.element.appendChild(svgLine);
				lineElements.push(svgLine);
			}
			/** draw vertical lines */
			for (let column = 0; column <= columns; column += 1) {
				const xOffset = column * columnWidth;
				const svgLine = document.createElementNS(SVGNameSpace, 'line');
				svgLine.setAttribute('x1', `${x + xOffset}`);
				svgLine.setAttribute('x2', `${x + xOffset}`);
				svgLine.setAttribute('y1', `${y}`);
				svgLine.setAttribute('y2', `${y + gridHeight}`);
				svgLine.setAttribute('stroke', SVG.strokeColor);
				svgLine.setAttribute('stroke-width', SVG.strokeWidth.toString());
				this.element.appendChild(svgLine);
				lineElements.push(svgLine);
			}
		}
		return lineElements; /** the caller may want to do something with these */
	}

	addText(point: string, anchor: string, text: RichText) {
		const [x, y] = this.xy(point);

		// let svg = document.createElementNS(SVGNameSpace, 'svg');
		// svg.setAttribute('x', `${x}`);
		// svg.setAttribute('y', `${y}`);
		// svg.setAttribute('width', `${width}`);
		// svg.setAttribute('height', `${height}`);

		let svgText = document.createElementNS(SVGNameSpace, 'text');
		svgText.setAttribute('x', `${x}`);
		svgText.setAttribute('y', `${y}`);
		svgText.setAttribute('text-anchor', anchor);
		svgText.setAttribute('font-family', text.fontFamily);
		svgText.setAttribute('font-size', `${text.fontSize}`);
		svgText.innerHTML = text.value;

		// svg.appendChild(svgText);
		// this.element.appendChild(svg);
		this.element.appendChild(svgText);

		return svgText; /** the caller may want to do something with this */
	}

	/**
	 * circle characters: 2299, 229A, (25CB), 25CC, 25CF, 25EF, 26AA, 26AB, (26AC), 2B55, (2B58)
	 * cross ('x') characters: 00D7, 2297, 2715, 292B, 292C, 2A09, 2A2F, 2B59, 2BBE, 2BBF
	 * number characters: 2460...2473
	 * dot (guitar neck) characters: 2802, 2805
	 */
}
