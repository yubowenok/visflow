
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowVisualization.initialize.call(this, para);
    this.inPorts = [
      {
        id: "in",
        type: "in-single"
      }
    ];
    this.outPorts = [
      {
        id: "out",
        type: "out-multiple"
      }
    ];
    this.prepare();
  },

  showIcon: function() {
    this.jqicon = $("<div></div>")
      .addClass("dataflow-table-icon")
      .appendTo(this.jqview);
  },

  showVisualization: function() {
    console.log("show vis");
  }
};

var DataflowTable = DataflowVisualization.extend(extObject);
