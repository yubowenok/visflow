

"use strict";

var extObject = {

  initialize: function(data) {

    if (data == null) {
      data = {
        dimensions: [],
        dimensionTypes: [],
        values: []
      };
    }

    this.dimensions = data.dimensions;  // data dimensions
    this.dimensionTypes = data.dimensionTypes;  // int, float, string
    this.values = data.values;  // attribute values
    this.numItems = this.values.length;

    // rendering properties
    this.propertyTypes = [];
    this.properties = [];
    for (var i = 0; i < this.numItems; i++)
      this.properties.push([]); // create emtpy 2D array

    // change status, if true, propagate to downflow nodes
    this.changed = true;
  }
};

var DataflowData = Base.extend(extObject);
