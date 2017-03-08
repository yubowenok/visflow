/**
 * @fileoverview Externs for annyang.
 */

/** @const */
var annyang = {};

/**
 * @param {!Object} commands
 * @param {boolean} overwrite
 */
annyang.init = function(commands, overwrite) {};

/**
 * @param {string} type
 * @param {Function} callback
 * @param {*=} opt_context
 */
annyang.addCallback = function(type, callback, opt_context) {};

/**
 * @param {!Object=} args
 */
annyang.start = function(args) {};

annyang.abort = function() {};

annyang.pause = function() {};

annyang.resume = function() {};
