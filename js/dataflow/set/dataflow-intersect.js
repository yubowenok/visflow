
"use strict";

var extObject = {

  iconName: "intersect",

  initialize: function(para) {
    DataflowIntersect.base.initialize.call(this, para);

    this.prepare();
  },

  show: function() {
    DataflowIntersect.base.show.call(this); // call parent settings
    this.showIcon();
  },

  process: function() {
    var packa = this.ports["ina"].pack,
        packb = this.ports["inb"].pack;

    if (!packa.data.matchDataFormat(packb.data))
      return console.error("cannot make intersection of two different types of datasets");

    // for every item in A, check if it is in B
    var result = {};
    for (var index in packa.items) {
      var itema = packa.items[index];
      var itemb = packb.items[index];
      if (itemb != null) {
        // merge rendering property in to a new one
        result[index] =  {
          properties: _.extend({}, itema.properties, itemb.properties)
        };
      }
    }
    var outpack = this.ports["out"].pack;
    outpack.copy(packa);  // either A or B will work
    // not using filter because the properties are new
    outpack.items = result;
  }

};

var DataflowIntersect = DataflowSet.extend(extObject);
