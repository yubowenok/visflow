
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowSet.initialize.call(this, para);

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

    DataflowSet.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-intersect-icon")
      .appendTo(this.jqview);
  },

  process: function() {
    var packa = this.ports["ina"].pack,
        packb = this.ports["inb"].pack;

    if (!packa.data.matchDataFormat(packb.data))
      return console.error("cannot make intersection of two different types of datasets");


  }

};

var DataflowIntersect = DataflowSet.extend(extObject);
