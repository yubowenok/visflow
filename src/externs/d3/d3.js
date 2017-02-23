/**
 * @constructor
 * @return {!d3}
 */
function d3() {}

/**
 * @param {!d3|string|Element|undefined|null} arg
 * @return {!d3}
 */
d3.select = function(arg) {};

/**
 * @param {!d3|string|!Array<Element>|null} arg
 * @return {!d3}
 */
d3.selectAll = function(arg) {};

/**
 * @return {!d3}
 */
d3.none = function() {};

/**
 * @param {!Array<T>|T} arg
 * @param {...T} args
 * @return <T>
 * @template T
 */
d3.max = function(arg, args) {};

/**
 * @param {!Array<T>|T} arg
 * @param {...T} args
 * @return <T>
 * @template T
 */
d3.min = function(arg, args) {};

/**
 * @param {!d3|string|Element|null} arg
 * @return {!d3}
 */
d3.prototype.select = function(arg) {};

/**
 * @param {!d3|string|!Array<Element>|null} arg
 * @return {!d3}
 */
d3.prototype.selectAll = function(arg) {};

/** @return {!d3} */
d3.prototype.exit = function() {};

/** @return {!d3} */
d3.prototype.enter = function() {};

/** @return {!d3} */
d3.prototype.remove = function() {};

/** @return {!d3} */
d3.prototype.empty = function() {};

/**
 * @param {!d3} arg
 * @return {!d3}
 */
d3.prototype.merge = function(arg) {};

/**
 * @param {!d3|Function} selector
 */
d3.prototype.filter = function(selector) {};

/**
 * @return {!d3}
 */
d3.prototype.transition = function() {};

/**
 * @param {*} arg
 * @return {!d3}
 */
d3.prototype.datum = function(arg) {};

/**
 * @param {!Array<*>|Function} arg
 * @param {Function=} opt_mapping
 * @return {!d3}
 */
d3.prototype.data = function(arg, opt_mapping) {};

/**
 * @param {string} classes
 * @param {(Function|boolean)=} val
 * @return {boolean}
 */
d3.prototype.classed = function(classes, val) {};

/**
 * @param {string|!Object} prop
 * @param {(string|number|Function)=} opt_val
 * @return {!d3|string|number|null}
 */
d3.prototype.style = function(prop, opt_val) {};

/**
 * @param {string|!Object} prop
 * @param {(string|number|Function)=} opt_val
 * @return {!d3|string|number|null}
 */
d3.prototype.attr = function(prop, opt_val) {};

/**
 * @param {string} event
 * @param {Function} handler
 * @return {!d3}
 */
d3.prototype.on = function(event, handler) {};

/**
 * @param {string|function(*, number): string} text
 */
d3.prototype.text = function(text) {};

/**
 * @param {string} tag
 */
d3.prototype.append = function(tag) {};

/**
 * @param {d3.Zoom} arg
 */
d3.prototype.call = function(arg) {};

/**
 * @return {Element}
 */
d3.prototype.node = function() {};

/**
 * @param {string} event
 * @param {Function} handler
 */
d3.prototype.each = function(event, handler) {};
