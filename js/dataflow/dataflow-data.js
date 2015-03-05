

"use strict";

var extObject = {
  // data dimensions
  dimensions: [],
  dimensionTypes: [], // int, float, string
  values: [], // attribute values

  // rendering properties
  propertyTypes: [],
  properties: [],

  // cache status, empty data is considered cached
  cached: true
};

var DataflowData = Base.extend(extObject);
