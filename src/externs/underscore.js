/**
 * @fileoverview Custom underscore externs.
 */

/**
 * @param {!Object<T, *>} obj
 * @return {!Array<T>}
 * @template T
 */
_.allKeys = function(obj) {};

/**
 * @param {!Array<T>|!Object<T>} array
 * @return {!Object<T, boolean>}
 * @template T
 */
_.keySet = function(array) {};


/**
 * @param {string} attr
 * @param {string=} opt_suffix
 * @return {function(!d3, *): *}
 */
_.getValue = function(attr, opt_suffix) {};


/**
 * @param {!d3} arg
 */
_.fadeOut = function(arg) {};

/**
 * @param {!Array} arr
 * @param {number=} opt_count
 */
_.popFront = function(arr, opt_count) {};

/**
 * @param {Function} arg1
 * @param {Function} arg2
 */
_.inherit = function(arg1, arg2) {};

/**
 * @return {!d3}
 */
_.d3 = function() {};
