/**
 * @fileoverview VisFlow data object, and data definitions.
 * The original data in table format is immutable within the system.
 */

'use strict';

/**
 * @typedef {{
 *   type: string
 *   dimensions: !Array<string>,
 *   dimensionTypes: !Array<string>,
 *   values: !Array<!Array<string|number>>
 * }}
 */
visflow.TabularData;

/**
 * @param {visflow.TabularData} data
 * @constructor
 */
visflow.Data = function(data) {
  if (data == null) {
    _(this).extend({  // empty data object
      dimensions: [],
      dimensionTypes: [],
      values: [],
      dataId: 0,
      type: 'empty',
      numItems: 0
    });
    return;
  }

  if (data.type === 'constants') {
    visflow.error('reserved type "constants" used for data');
    return;
  }

  /**
   * Type of data. It will be a hash value of the data's dimensions and
   * dimension types.
   */
  this.type = data.type;

  /**
   * Name of the data.
   * @type {string}
   */
  this.name = data.name;

  /**
   * File information, usually the file name.
   * If the data is from online sources, then the value is 'online'.
   * @type {string}
   */
  this.file = data.file;

  /**
   * List of dimensions.
   * @type {!Array<string>}
   */
  this.dimensions = data.dimensions;

  /**
   * Dimension types: int, float, string.
   * @type {!Array<string>}
   */
  this.dimensionTypes = data.dimensionTypes;

  /**
   * Data attribute values.
   * @type {!Array<!Array<number|string>>}
   */
  this.values = data.values;
};

/**
 * Checks if the data is empty data.
 * @return {boolean}
 */
visflow.Data.prototype.isEmpty = function() {
  return this.type == 'empty';
};

/**
 * Gets the number of data items.
 * @return {number}
 */
visflow.Data.prototype.numItems = function() {
  return this.values.length;
};

/**
 * Checks if the given data matches itself.
 * @param {!visflow.Data} data
 * @return {boolean}
 */
visflow.Data.prototype.matchDataFormat = function(data) {
  if (this.type == 'empty' || data.type == 'empty') {
    // Empty data is compatible with anything.
    return true;
  }
  return this.type == data.type;
};
