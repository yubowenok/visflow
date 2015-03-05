

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

    // rendering properties
    this.propertyTypes = [];
    this.properties = [];

    // change status, if true, propagate to downflow nodes
    this.changed = true;
  }
};

var DataflowData = Base.extend(extObject);
