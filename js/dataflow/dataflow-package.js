
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
    for (var i in data.values) {
      this.items.push({
        index: i,
        properties: {}  // create a rendering property object
      });
    }

    // change status
    this.changed = true;
  },

  // make full references to another package
  copy: function(pack) {
    this.data = pack.data;
    this.items = pack.items;
    this.changed = true;
  }
};

var DataflowPackage = Base.extend(extObject);
