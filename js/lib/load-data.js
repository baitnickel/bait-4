/**
 * Not currently in use. We might have a need at some point to load multiple
 * indices into memory.
 */
/** maps to be filled through async calls */
export const Pages = new Map();
export const Articles = new Map();
// // see: https://atomizedobjects.com/blog/typescript/promises-and-async-await-in-typescript/
// const promise = new Promise<number>((resolve, reject) => {
// 	/**
// 	 * Anonymous callback function (i.e., arrow function or lambda) with two
// 	 * parameters: `resolve` and `reject`. Both parameters are functions. The
// 	 * `resolve` function returns a value having the generic type named in the
// 	 * Promise constructor above. The `reject` function returns an Error object.
// 	 */
// 	const success = true; // Asynchronous operation
// 	if (success) {
// 		resolve(42); // Resolving with a value
// 	} else {
// 		reject(new Error("Operation failed")); // Rejecting with an error
// 	}
// });
