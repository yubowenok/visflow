
/*
 * the original data in table format
 * is immutable within the system
 */

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
  }
};

var DataflowData = Base.extend(extObject);
