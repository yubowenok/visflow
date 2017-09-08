/**
 * @fileoverview A (potentially filtered) copy of the original data.
 * The subset maintains a list of references to the data table rows.
 * It allows rendering properties to be added.
 */

/**
 * A collection of item ids to boolean values, indicating whether each element
 * is present in the collection.
 * @typedef {!Object<number, boolean>}
 */
visflow.ItemSet;

/**
 * @param {visflow.Dataset=} data
 * @constructor
 */
visflow.Subset = function(data) {
  visflow.Subset.base.constructor.call(this, data);

  if (data == null) {
    data = new visflow.Dataset();
  }

  /**
   * A reference to the original data object.
   * @type {!visflow.Dataset}
   */
  this.data = data;

  /**
   * Item Ids.
   * @type {visflow.ItemSet}
   */
  this.items = {};

  for (var index = 0; index < data.values.length; index++) {
    // Create a rendering property object.
    this.items[index] = {
      properties: {}
    };
  }

};

_.inherit(visflow.Subset, visflow.Package);

/**
 * Makes full references to another package.
 * @param {!visflow.Subset} pack
 * @param {boolean=} opt_shallow
 * @return {!visflow.Subset}
 */
visflow.Subset.prototype.copy = function(pack, opt_shallow) {
  this.data = pack.data;
  if (!opt_shallow) {   // default deep copy
    this.items = {};
    for (var itemIndex in pack.items) {
      var index = +itemIndex;
      this.items[index] = {
        properties: _.extend({}, pack.items[index].properties)
      };
    }
  } else {
    this.items = pack.items;  // shallow copy only makes reference to items
  }
  return this;
};

/**
 * Accepts a list of indexes to be the new items, and update items and hasItem.
 * @param {!Array<number>} indices
 * @return {!visflow.Subset}
 */
visflow.Subset.prototype.filter = function(indices) {
  var newItems = {};
  indices.forEach(function(index) {
    var e = this.items[index];
    if (this.items[index] == null) {
      visflow.error('selected element not exists');
    }
    newItems[index] = e;
  }, this);
  this.items = newItems;
  return this;
};

/**
 * Retrieves the value for an item with given index, on dimension dim.
 * @param {number} index
 * @param {number} dim
 * @return {string|number}
 */
visflow.Subset.prototype.getValue = function(index, dim) {
  visflow.assert(index in this.items, 'item not found');
  if (dim == visflow.data.INDEX_DIM) {
    return index;
  }
  var numDims = this.data.dimensions.length;
  visflow.assert(0 <= dim && dim < numDims, 'dimension out of range');
  return this.data.values[index][dim];
};

/**
 * Counts the number of items in the subset.
 * @return {number}
 */
visflow.Subset.prototype.count = function() {
  return Object.keys(this.items).length;
};

/**
 * Checks if the subset has no items.
 * @return {boolean}
 */
visflow.Subset.prototype.isEmpty = function() {
  return $.isEmptyObject(this.items);
};

/**
 * Checks if the subset has empty data.
 * @return {boolean}
 */
visflow.Subset.prototype.isEmptyData = function() {
  return this.data.type === '';
};


/**
 * Groups items based on a given 'groupBy' attribute.
 * @param {string|number|null} groupBy If empty string, return a single group.
 * @return {!Array<!Array<string>>}
 */
visflow.Subset.prototype.groupItems = function(groupBy) {
  var groups = [];
  if (groupBy === '' || groupBy == null) {
    groups.push(_.allKeys(this.items));
  } else {
    var valueSet = {};
    var valueCounter = 0;
    for (var itemIndex in this.items) {
      var index = +itemIndex;
      var val = groupBy == visflow.data.INDEX_DIM ?
        index : this.data.values[index][+groupBy];
      var group = valueSet[val];
      if (group != null) {
        groups[group].push(index);
      } else {
        valueSet[val] = valueCounter;
        groups[valueCounter++] = [index];
      }
    }
  }
  return groups;
};
