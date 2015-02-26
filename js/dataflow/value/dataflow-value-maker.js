
"use strict";

var extObject = {

  initialize: function(para) {
    this.base.initialize.call(this, para);

    this.viewHeight = 50;

    this.inPorts = [];
    this.outPorts = [
      {
        id: "out",
        type: "out-multiple"
      }
    ];
    this.prepare();
  },

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-set-shape");

    this.jqicon = $("<div></div>")
      .addClass("dataflow-value-maker-icon")
      .appendTo(this.jqview);
  }

};

var DataflowValueMaker = DataflowNode.extend(extObject);
