/** @typedef {Function} */
d3.Zoom;

/**
 * @param {Array<number>=} opt_arg
 * @return {!Array<number>}
 */
d3.Zoom.prototype.scaleExtent = function(opt_arg) {};

/**
 * @param {Function} callback
 */
d3.Zoom.prototype.x = function(callback) {};

/**
 * @param {Function} callback
 */
d3.Zoom.prototype.y = function(callback) {};

/**
 * @param {string} event
 * @param {Function} handler
 */
d3.Zoom.prototype.on = function(event, handler) {};

/**
 * @param {Function} arg
 */
d3.Zoom.prototype.filter = function(arg) {};

/** @return {d3.Zoom} */
d3.zoom = function() {};
