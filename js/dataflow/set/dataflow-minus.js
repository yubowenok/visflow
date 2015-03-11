
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowMinus.base.initialize.call(this, para);

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

    DataflowMinus.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-minus-icon")
      .appendTo(this.jqview);
  },

  process: function() {
    var packa = this.ports["ina"].pack,
        packb = this.ports["inb"].pack;

    if (!packa.data.matchDataFormat(packb.data))
      return console.error("cannot make intersection of two different types of datasets");

    // for every item in A, check if it is in B
    // first make a dict for B
    var hasb = {};
    for (var i in packb.items) {
      var item = packb.items[i];
      hasb[item.index] = item;
    }
    var result = [];
    for (var i in packa.items) {
      var item = packa.items[i];
      var itemb = hasb[item.index];
      if (itemb == null) {
        result.push(item);
      }
    }
    var outpack = this.ports["out"].pack;
    outpack.copy(packa);  // either A or B works
    outpack.items = result;
  }


};

var DataflowMinus = DataflowSet.extend(extObject);
