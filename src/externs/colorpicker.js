/**
 * @fileoverview Colorpicker externs.
 */

/**
 * @constructor
 */
jQuery.color = function() {};

/**
 * @return {string}
 */
jQuery.color.prototype.toHex = function() {};

/**
 * @constructor
 */
jQuery.colorpicker = function() {};

/**
 * @param {(!Object|string)=} arg1
 * @param {string=} arg2
 * @return {!jQuery.colorpicker}
 */
jQuery.prototype.colorpicker = function(arg1, arg2) {};

/**
 * @constructor
 * @extends {jQuery.Event}
 */
jQuery.colorpicker.Event = function() {};

/**
 * @type {!jQuery.color}
 */
jQuery.colorpicker.Event.prototype.color;


