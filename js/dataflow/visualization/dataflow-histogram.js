
"use strict";

var extObject = {

  initialize: function(para) {
    this.base.initialize.call(this, para);
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
  },

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-histogram-icon")
      .appendTo(this.jqview);
  }

};

var DataflowHistogram = DataflowNode.extend(extObject);
