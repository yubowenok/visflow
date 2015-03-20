
/*
 * a filtered copy of the original data
 * maintains a list of references to the data table rows
 * allow rendering properties to be added
 */
"use strict";

var extObject = {
  initialize: function(data) {

    if (data == null) {
      data = DataflowData.new();
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
  },

  // make full references to another package
  copy: function(pack, shallow) {
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
  },

  // accept a list of indexes to be the new items, and update items and hasItem
  filter: function(indexes) {
    var newItems = {};
    for (var i in indexes) {
      var index = indexes[i];
      var e = this.items[index];
      if(this.items[index] == null)
        console.error("selected element not exists");
      newItems[index] = e;
    }
    this.items = newItems;
  },

  isEmpty: function() {
    return $.isEmptyObject(this.items);
  },

  isEmptyData: function() {
    return this.data.type == "empty";
  }
};

var DataflowPackage = Base.extend(extObject);
