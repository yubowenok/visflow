
/*
 * a filtered copy of the original data
 * maintains a list of references to the data table rows
 * allow rendering properties to be added
 */
"use strict";

var extObject = {
  initialize: function(data) {

    if (data == null)
      return;

    // maintain a reference to the original data object
    this.data = data;

    // list of references
    this.items = [];
    for (var i in data.values) {
      this.items.push({
        values: data.values[i],
        properties: {}  // create a rendering property object
      });
    }

    // change status
    this.changed = true;
  }
};

var DataflowPackage = Base.extend(extObject);
