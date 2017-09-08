/**
 * @fileoverview Dataset definition. A dataset is immutable within the system.
 */


/**
 * @param {visflow.TabularData=} data
 * @constructor
 * @extends {visflow.TabularData}
 */
visflow.Dataset = function(data) {
  if (data == null) {
    _.extend(this, {  // empty data object
      dimensions: [],
      dimensionTypes: [],
      dimensionDuplicate: [],
      values: [],
      dataId: visflow.data.EMPTY_DATA_ID,
      type: ''
    });
    return;
  }

  if (data.type === 'constants') {
    visflow.error('reserved type "constants" used for data');
    return;
  }

  /** @const {!Array<string>} */
  var DATA_ATTRS = [
    'type',
    'dimensions',
    'dimensionTypes',
    'dimensionDuplicate',
    'hash'
  ];

  DATA_ATTRS.forEach(function(key) {
    if (data[key] == null) {
      visflow.error(key, 'not found in data');
    }
  });

  /**
   * Data id assigned by the running system instance.
   * Use hash value as data id to identify data changes.
   * @type {string}
   */
  this.dataId = data.hash;

  /**
   * Type of data. It will be a hash value of the data's dimensions and
   * dimension types.
   * @type {string}
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
   * @type {!Array<visflow.ValueType>}
   */
  this.dimensionTypes = data.dimensionTypes;

  /**
   * Whether the dimension contains duplicate values.
   * @type {!Array<boolean>}
   */
  this.dimensionDuplicate = data.dimensionDuplicate;

  /**
   * Hash id of the data, computed from all values inside the data.
   * @type {string}
   */
  this.hash = data.hash;

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
visflow.Dataset.prototype.isEmpty = function() {
  return this.type === '';
};

/**
 * Checks if the given data matches itself.
 * @param {!visflow.Dataset} data
 * @return {boolean}
 */
visflow.Dataset.prototype.matchDataFormat = function(data) {
  if (this.type === '' || data.type === '') {
    // Empty data is compatible with anything.
    return true;
  }
  return this.type == data.type;
};
