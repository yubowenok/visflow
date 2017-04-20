/** @typedef {Function} */
d3.Axis;

/** @return {d3.Axis} */
d3.axisTop = function() {};

/** @return {d3.Axis} */
d3.axisBottom = function() {};

/** @return {d3.Axis} */
d3.axisLeft = function() {};

/** @return {d3.Axis} */
d3.axisRight = function() {};

/**
 * @param {string} dir
 */
d3.Axis.prototype.orient = function(dir) {};

/**
 * @param {d3.Scale} scale
 */
d3.Axis.prototype.scale = function(scale) {};

/**
 * @param {!Array<number|string>} values
 */
d3.Axis.prototype.tickValues = function(values) {};

/**
 * @param {string|function(string): string} format
 */
d3.Axis.prototype.tickFormat = function(format) {};

/**
 * v3
 * @const
 */
//d3.svg = {};

/**
 * v3
 * @return {d3.Axis}
 */
//d3.svg.axis = function() {};
