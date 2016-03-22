/**
 * @fileoverview Common externs for web environment.
 */

/**
 * @return {{
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number
 * }}
 */
Element.prototype.getBBox = function() {};

/**
 * @param {string} key
 * @return {*}
 */
FormData.prototype.get = function(key) {};

/**
 * @param {string} key
 * @param {*} val
 */
FormData.prototype.set = function(key, val) {};
