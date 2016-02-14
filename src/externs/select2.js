/**
 * @fileoverview Select2 externs.
 */


/**
 * @constructor
 * @return {!select2}
 */
function select2() {}

/**
 * @constructor
 * @extends {jQuery.Event}
 * @param {string} eventType
 * @param {Object=} properties
 * @return {!select2.Event}
 */
select2.Event = function(eventType, properties) {};

/** @type {?} */
select2.Event.prototype.params;

/**
 * @param {Object=} opt_params
 * @return {!select2}
 */
jQuery.prototype.select2 = function(opt_params) {};

/**
 * @param {string} arg1
 * @param {*} arg2
 */
select2.prototype.select2 = function(arg1, arg2) {};

/**
 * @param {string} arg
 * @param {function(!select2.Event)} handler
 * @return {!select2}
 */
select2.prototype.on = function(arg, handler) {};

/**
 * @param {string} arg
 * @param {function(!select2.Event)} handler
 * @return {!select2}
 */
select2.prototype.off = function(arg, handler) {};

/**
 * @param {(string|number)=} val
 * @return {string|!select2}
 */
select2.prototype.val = function(val) {};

/**
 * @param {string} event
 * @param {*=} data
 */
select2.prototype.trigger = function(event, data) {};
