/**
 * @fileoverview VisFlow data object.
 * The original data in table format is immutable within the system.
 */

'use strict';

/**
 * @param {Object} data
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

  this.type = data.type;  // data types: empty, car, etc

  this.dimensions = data.dimensions;  // data dimensions
  this.dimensionTypes = data.dimensionTypes;  // int, float, string
  this.values = data.values;  // attribute values


  this.numItems = this.values.length;
};

/**
 * Checks if the given data matches itself.
 * @param {!visflow.Data} data
 * @return {boolean}
 */
visflow.Data.prototype.matchDataFormat = function(data) {
  if (this.type === 'empty' || data.type === 'empty')
    return true;  // empty data is compatible with anything
  if (this.dimensions.length != data.dimensions.length)
    return false;
  for (var i in this.dimensions) {
    if (this.dimensions[i] !== data.dimensions[i] ||
        this.dimensionTypes[i] !== data.dimensionTypes[i])
      return false;
  }
  return true;
};
