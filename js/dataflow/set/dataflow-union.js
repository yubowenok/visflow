
"use strict";

var extObject = {

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

    this.jqicon = $("<div></div>")
      .addClass("dataflow-union-icon")
      .appendTo(this.jqview);
  },

  process: function() {
    var packa = this.ports["ina"].pack,
        packb = this.ports["inb"].pack;

    if (!packa.data.matchDataFormat(packb.data))
      return console.error("cannot make intersection of two different types of datasets");

    // for every item in A, check if it is in B
    // first make a dict for B
    var hasa= {},
        hasb = {};
    for (var i in packa.items) {
      var item = packa.items[i];
      hasa[item.index] = item;
    }
    for (var i in packb.items) {
      var item = packb.items[i];
      hasb[item.index] = item;
    }
    var result = [];
    // first get all items from A, if it exists in B as well, overwrite rendering properties
    for (var i in packa.items) {
      var item = packa.items[i];
      var itemb = hasb[item.index];
      if (itemb != null) {
        _(item.properties).extend(itemb.properties);
      }
      result.push(item);
    }
    // then for every element in B but not in A, add it to result
    for (var i in packb.items) {
      var item = packb.items[i];
      var itema = hasa[item.index];
      if (itema == null) {
        result.push(item);
      }
    }
    var outpack = this.ports["out"].pack;
    outpack.copy(packa);  // either A or B works
    outpack.items = result;
  }

};

var DataflowUnion = DataflowSet.extend(extObject);
