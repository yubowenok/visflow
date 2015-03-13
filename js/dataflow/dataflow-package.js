
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
    this.items = [];
    this.hasItem = {};
    for (var i in data.values) {
      var e = {
        index: i,
        properties: {}  // create a rendering property object
      };
      this.items.push(e);
      this.hasItem[i] = e;
    }

    // change status
    this.changed = true;
  },

  // make full references to another package
  copy: function(pack) {
    this.data = pack.data;
    this.items = pack.items;
    this.hasItem = pack.hasItem;
    this.changed = true;
  },

  // accept a list of indexes to be the new items, and update items and hasItem
  filter: function(indexes) {
    var newHasItem = {},
        newItems = [];
    for (var i in indexes) {
      var index = indexes[i];
      var e = this.hasItem[index];
      if (e == null) {
        console.log("?");
        continue;
      }
      newItems.push(e);
      newHasItem[index] = e;
    }
    this.hasItem = newHasItem;
    this.items = newItems;
  }
};

var DataflowPackage = Base.extend(extObject);
