
"use strict";

var extObject = {

  iconName: "union",

  initialize: function(para) {
    DataflowUnion.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "ina", "in-single"),
      DataflowPort.new(this, "inb", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();
  },

  show: function() {
    DataflowUnion.base.show.call(this); // call parent settings
    this.showIcon();
  },

  process: function() {
    var packa = this.ports["ina"].pack,
        packb = this.ports["inb"].pack;

    if (!packa.data.matchDataFormat(packb.data))
      return console.error("cannot make intersection of two different types of datasets");

    var result = {};
    // first get all items from A, if it exists in B as well, overwrite rendering properties
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
    // then for every element in B but not in A, add it to result
    for (var index in packb.items) {
      var itemb = packb.items[index];
      var itema = packa.items[index];
      if (itema == null) {
        result[index] = itemb;
      }
    }
    var outpack = this.ports["out"].pack;
    outpack.copy(packa.isEmpty() ? packb : packa);  // pack a non-empty pack
    // not using filter because the properties are new
    outpack.items = result;
  }

};

var DataflowUnion = DataflowSet.extend(extObject);
