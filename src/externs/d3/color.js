/**
 * @typedef {
 *   {r: number, g: number, b: number, a: (number|undefined)}|
 *   {h: number, s: number, l: number, a: (number|undefined)}
 * }
 */
d3.Color;

/**
 * @param {(d3.Color|string)=} arg
 * @return {d3.Color}
 */
d3.rgb = function(arg) {};

/**
 * @param {(d3.Color|string)=} arg
 * @return {d3.Color}
 */
d3.hsl = function(arg) {};


/** @typedef {!Array<string>} */
d3.SchemeCategory;

/** @type {!d3.SchemeCategory} */
d3.schemeCategory10;

/** @type {!d3.SchemeCategory} */
d3.schemeCategory20;
