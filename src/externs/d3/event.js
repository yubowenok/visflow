/**
 * @constructor
 * @return {!d3.event}
 */
d3.event = function() {};

/** @type {number} */
d3.event.scale;

/** @type {!Array<number>} */
d3.event.translate;

/** @type {Element} */
d3.event.target;

/** @type {{x: number, y: number, k: number}} */
d3.event.transform;

/**
 * @param {Element} arg
 * @return {!Array<number>}
 */
d3.mouse = function(arg) {};
