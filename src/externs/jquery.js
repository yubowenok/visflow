/**
 * @fileoverview Additional jQuery externs.
 */

/** @const */
jQuery.mousewheel = {};

/**
 * @constructor
 * @extends {jQuery.Event}
 */
jQuery.mousewheel.Event = function() {};

/** @type {number} */
jQuery.mousewheel.Event.prototype.deltaX;

/** @type {number} */
jQuery.mousewheel.Event.prototype.deltaY;

/** @type {number} */
jQuery.mousewheel.Event.prototype.deltaFactor;

/**
 * @param {function(jQuery.mousewheel.Event)} handler
 */
jQuery.prototype.mousewheel = function(handler) {};

/**
 * @param {string} str
 */
$.camelCase = function(str) {};
