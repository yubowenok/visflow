
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowVisualization.initialize.call(this, para);
    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();
  },

  showIcon: function() {
    this.jqicon = $("<div></div>")
      .addClass("dataflow-parallelcoordinates-icon")
      .appendTo(this.jqview);
  },

  showVisualization: function() {
    console.log("show vis");
  }

};

var DataflowParallelCoordinates = DataflowVisualization.extend(extObject);
