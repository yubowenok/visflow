/** @typedef {Function} */
d3.Scale;

/**
 * @param {d3.SchemeCategory=} opt_scheme
 * @return {d3.Scale}
 */
d3.scaleOrdinal = function(opt_scheme) {};

/**
 * @return {d3.Scale}
 */
d3.scaleLinear = function() {};

/**
 * @return {d3.Scale}
 */
d3.scalePoint = function() {};

/**
 * @return {d3.Scale}
 */
d3.scaleBand = function() {};

/**
 * @return {d3.Scale}
 */
d3.scaleTime = function() {};

/**
 * @param {Array<number|string>=} opt_range
 * @return {!Array<number|string>}
 */
d3.Scale.prototype.range = function(opt_range) {};

/**
 * @param {Array<number|string>=} opt_range
 * @return {!Array<number|string>}
 */
d3.Scale.prototype.domain = function(opt_range) {};

/**
 * @param {number=} padding
 */
d3.Scale.prototype.padding = function(padding) {};

/**
 * @param {boolean} round
 */
d3.Scale.prototype.round = function(round) {};

/** @return {number} */
d3.Scale.prototype.bandwidth = function() {};

/**
 * @param {number=} padding
 */
d3.Scale.prototype.paddingInner = function(padding) {};

/**
 * @param {number=} padding
 */
d3.Scale.prototype.paddingOuter = function(padding) {};

/**
 * @return {d3.Scale}
 */
d3.Scale.prototype.copy = function() {};
