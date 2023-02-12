import * as Fetch from '../lib/fetch.js';
export function displayMoonData(element) {
    // const url = 'https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005048/mooninfo_2023.json';
    const url = 'data/moon.json'; /** relative to index.html directory */
    Fetch.fetchData(url).then((records) => {
        let lines = [];
        if (records === null) {
            lines.push('error fetching JSON data');
        }
        else {
            const limit = 30000;
            let i = 0;
            /**
             * new moon:  age < previous age
             * first qtr: phase is nearest to 50.0 && age < 15
             * full moon: phase is nearest to 100.0
             * last qtr:  phase is nearest to 50.0 && age >= 15
             */
            let foundNew = false;
            let foundFull = false;
            let previousQuarterDiff = 100;
            let previousFullDiff = 100;
            let previousPhase = 0;
            let previousAge = 0;
            for (let record of records) {
                let d = datetime(record.time);
                if (record.age < previousAge) {
                    lines.push('');
                    lines.push(`New Moon   ${d} `);
                    foundNew = true;
                    foundFull = false;
                }
                if (foundNew) {
                    // let quarterDiff = Math.abs(50 - record.phase);
                    // let fullDiff = Math.abs(100 - record.phase);
                    // if (quarterDiff < previousQuarterDiff && record.age < 15) {
                    if (record.phase >= 50 && previousPhase < 50) {
                        /**
                         * if the phase >= 50
                         * and the previous phase < 50
                         * display date
                         */
                        lines.push(` First Qtr ${d}`);
                    }
                    // else if (quarterDiff < previousQuarterDiff && record.age >= 15) {
                    else if (record.phase < 50 && previousPhase >= 50) {
                        /**
                         * if the phase < 50
                         * and the previous phase >= 50
                         * display date
                         */
                        lines.push(`  Last Qtr ${d}`);
                    }
                    // else if (fullDiff < previousFullDiff) {
                    else if (!foundFull && record.phase > 90 && record.phase < previousPhase) {
                        /**
                         * if the phase > 90
                         * and this phase < previous phase
                         * display previous date
                         */
                        lines.push(` Full Moon ${d}`);
                        foundFull = true;
                    }
                    // previousQuarterDiff = quarterDiff;
                    // previousFullDiff = fullDiff;
                }
                // lines.push(`${d} ${record.phase} ${record.age}`);
                previousPhase = record.phase;
                previousAge = record.age;
                i += 1;
                if (i >= limit)
                    break;
            }
        }
        let paragraph = document.createElement('p');
        paragraph.innerHTML = lines.join('<br>');
        element.append(paragraph);
    });
}
function datetime(dateTimeString) {
    /** YYYY-MM-DDTHH:mm:ss.sssZ */
    const year = dateTimeString.slice(7, 11);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNumber = Number(months.indexOf(dateTimeString.slice(3, 6))) + 1;
    let month = '01';
    if (!isNaN(monthNumber))
        month = monthNumber.toString().padStart(2, '0');
    const day = dateTimeString.slice(0, 2);
    const hourMinute = dateTimeString.slice(12, 17);
    return new Date(`${year}-${month}-${day}T${hourMinute}:00.000Z`);
}
// async function fetchData(path: string, type: string = 'text') {
// 	try {
// 		const uri = new Request(path);
// 		const response = await fetch(uri);
// 		var data: any;
// 		if (type == 'json' || path.endsWith('.json')) data = await response.json();
// 		else if (type == 'blob') data = await response.blob();
// 		else data = await response.text();
// 		return data;
// 	}
// 	catch(error) {
// 		console.error(error); 
// 		return null;
// 	}
// }
