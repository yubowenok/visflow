
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
        values: [],
        dataId: 0,
        type: "empty"
      };
    }

    if (data.type === "constants") {
      console.error("reserved type 'constants' used for data");
    }

    this.type = data.type;  // data types: empty, car, etc

    this.dimensions = data.dimensions;  // data dimensions
    this.dimensionTypes = data.dimensionTypes;  // int, float, string
    this.values = data.values;  // attribute values


    this.numItems = this.values.length;
  },

  matchDataFormat: function(data) {
    if (this.type === "empty" || data.type === "empty")
      return true;  // empty data is compatible with anything
    if (this.dimensions.length != data.dimensions.length)
      return false;
    for (var i in this.dimensions) {
      if (this.dimensions[i] !== data.dimensions[i] ||
          this.dimensionTypes[i] !== data.dimensionTypes[i])
        return false;
    }
    return true;
  }
};

var DataflowData = Base.extend(extObject);
