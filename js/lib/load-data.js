import { Page } from '../lib/page.js';
import * as Fetch from './fetch.js';
/**
 * Load data maps from the Indices folder into memory constants. Fetch.map
 * returns a Promise, and the `await` keyword ensures that the system waits for
 * each map to be fully loaded before proceeding.
 *
 * Modules that import this module can easily read map entries, e.g.:
 * - import * as Index from './lib/load-data.js';
 * - const properties = Index.Articles.get('README.md')!;
 *
 * Note that top level 'await' keywords (where explicit 'async' keywords are not
 * used) require minimal 'module' and 'target' settings in the project's
 * tsconfig.json file--see error message TS 1378.
 */
const PAGE = new Page();
const Site = PAGE.site;
export const Pages = await Fetch.map(`${Site}/Indices/pages.json`);
export const Articles = await Fetch.map(`${Site}/Indices/articles.json`);
