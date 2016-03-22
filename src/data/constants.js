/**
 * @fileoverview visflow Constants is essentially a single constant or a set of
 * constants used for filtering.
 */

/**
 * @param {string=} opt_text Input to be parsed as constants.
 * @constructor
 */
visflow.Constants = function(opt_text) {
  /**
   * Type of the constant.
   * Can be one of {empty, int, float, string}.
   * @type {visflow.ValueType}
   */
  this.constantType = visflow.ValueType.EMPTY;

  /**
   * List of elements.
   * @type {!Array<number|string>}
   */
  this.elements = [];

  /**
   * A collection of keys of the elements.
   * @type {!Object<boolean>}
   */
  this.hasElement = {};

  /**
   * Change status. If true then we need propagation.
   * @type {boolean}
   */
  this.changed = true;

  if (opt_text != null) {
    if (typeof opt_text !== 'string') {
      visflow.error('non-string input');
      return;
    }

    var elements = opt_text.split(/[,;]+/);
    elements.forEach(function(element) {
      element = element.replace(/\s+/g, '');
      this.add(element);
    }, this);
  }
};

/**
  * Flag used to make constants be differentiable from data.
  * @type {string}
  */
visflow.Constants.prototype.type = 'constants';

/**
 * Checks if another package is compatible with the constants.
 * @param {!visflow.Constants} pack
 * @return {boolean}
 */
visflow.Constants.prototype.compatible = function(pack) {
  if (this.constantType == visflow.ValueType.EMPTY ||
      pack.constantType == visflow.ValueType.EMPTY) {
    return true;
  }
  if (this.constantType == visflow.ValueType.STRING ^
      pack.constantType == visflow.ValueType.STRING) {
    return false;
  }
  return true;
};

/**
 * Stringifies the constants.
 * @return {string}
 */
visflow.Constants.prototype.stringify = function() {
  return this.elements.join(', ');
};

/**
 * Adds one element to the set.
 * @param {number|string} value
 */
visflow.Constants.prototype.add = function(value) {
  var parsed = visflow.parser.checkToken('' + value, [
    // Time is not handled by constants.
    visflow.ValueType.TIME
  ]);
  var valueType = parsed.type;
  value = parsed.value;

  if (valueType == visflow.ValueType.EMPTY) {
    return; //  ignore empty element
  }

  if (this.hasElement[value]) {
    return; // element already exists
  }

  this.hasElement[value] = true;
  this.elements.push(value);

  // Force conversion to higher types
  // i.e. int -> float -> string
  if (valueType > this.constantType) {
    this.constantType = valueType;
    this.elements.forEach(function(element, index, array) {
      array[index] = visflow.parser.tokenize('' + element, valueType);
    });
  }
};

/**
 * Removes all elements and returns to un-initialized state.
 */
visflow.Constants.prototype.clear = function() {
  this.elements = [];
  this.constantType = visflow.ValueType.EMPTY;
};

/**
 * Gets the first element in the set.
 * @return {number|string|null}
 */
visflow.Constants.prototype.getOne = function() {
  if (this.elements.length == 0) {
    return null;
  }
  return this.elements[0];
};

/**
 * Gets all elements of the set.
 * @return {!Array<number|string>}
 */
visflow.Constants.prototype.getAll = function() {
  if (this.elements.length == 0) {
    return [];
  }
  return this.elements;
};

/**
 * Counts the number of values in the constants set.
 * @return {number}
 */
visflow.Constants.prototype.count = function() {
  return this.elements.length;
};

