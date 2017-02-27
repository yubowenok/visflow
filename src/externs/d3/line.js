/** @typedef {Function} */
d3.Line;

/**
 * v3.
 * @return {!d3.Line}
 */
//d3.svg.line = function() {};

/** @return {!d3.Line} */
d3.line = function() {};

/**
 * v3
 * @param {string} arg
 */
//d3.Line.prototype.interpolate = function(arg) {};

/** @typedef {Function} */
d3.Curve;

/**
 * @param {d3.Curve} curve
 */
d3.Line.prototype.curve = function(curve) {};

/** @type {d3.Curve} */
d3.curveLinear;

/** @type {d3.Curve} */
d3.curveLinearClosed;

/** @type {d3.Curve} */
d3.curveBasis;

/** @type {d3.Curve} */
d3.curveBundle;

/**
 * @param {number} val
 * @return {d3.Curve}
 */
d3.curveBundle.beta = function(val) {};

/** @type {d3.Curve} */
d3.curveCatmullRom;

/**
 * @param {number} val
 * @return {d3.Curve}
 */
d3.curveCatmullRom.alpha = function(val) {};

/**
 * @param {Function|number} arg
 */
d3.Line.prototype.x = function(arg) {};

/**
 * @param {Function|number} arg
 */
d3.Line.prototype.y = function(arg) {};
