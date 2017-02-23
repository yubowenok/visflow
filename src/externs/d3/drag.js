/** @typedef {Function} */
d3.Drag;

/** @return {d3.Drag} */
d3.drag = function() {};

/**
 * @param {string} event
 * @param {Function} handler
 */
d3.Drag.prototype.on = function(event, handler) {};

/**
 * @param {Function} arg
 */
d3.Drag.prototype.subject = function(arg) {};

/**
 * @param {!d3} arg
 */
d3.Drag.prototype.container = function(arg) {};
