
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowNode.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "inv1", "in-single"),
      DataflowPort.new(this, "inv2", "in-single"),
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();
  },


  show: function() {

    DataflowNode.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-range-icon")
      .appendTo(this.jqview);
  }

};

var DataflowRangeFilter = DataflowNode.extend(extObject);
