/**
 * @fileoverview A (potentially filtered) copy of the original data.
 * The package maintains a list of references to the data table rows.
 * It allows rendering properties to be added.
 */

'use strict';

/**
 * @param {!Object} data
 * @constructor
 */
visflow.Package = function(data) {
  if (data == null) {
    data = new visflow.Data();
  }

  // maintain a reference to the original data object
  this.data = data;

  // list of references
  this.items = {};
  for (var i in data.values) {
    var e = {
      properties: {}  // create a rendering property object
    };
    this.items[i] = e;
  }

  // change status
  this.changed = true;
};

/**
 * Makes full references to another package.
 */
visflow.Package.prototype.copy = function(pack, shallow) {
  this.data = pack.data;
  if (!shallow) {   // default deep copy
    this.items = {};
    for (var index in pack.items) {
      this.items[index] = {
        properties: _.extend({}, pack.items[index].properties)
      };
    }
  } else {
    this.items = pack.items;  // shallow copy only makes reference to items
  }
  this.changed = true;
};

/**
 * Accepts a list of indexes to be the new items, and update items and hasItem.
 * @param indexes
 */
visflow.Package.prototype.filter = function(indexes) {
  var newItems = {};
  for (var i in indexes) {
    var index = indexes[i];
    var e = this.items[index];
    if(this.items[index] == null)
      visflow.error('selected element not exists');
    newItems[index] = e;
  }
  this.items = newItems;
};

/**
 * Counts the number of items in the package.
 * @return {number}
 */
visflow.Package.prototype.count = function() {
  return Object.keys(this.items).length;
};

/**
 * Checks if the package has no items.
 * @return {boolean}
 */
visflow.Package.prototype.isEmpty = function() {
  return $.isEmptyObject(this.items);
};

/**
 * Checks if the package has empty data.
 * @return {boolean}
 */
visflow.Package.prototype.isEmptyData = function() {
  return this.data.type == 'empty';
};
