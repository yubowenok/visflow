
"use strict";

var extObject = {

  initialize: function(para) {
    this.base.initialize.call(this, para);

    this.viewHeight = 50;

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

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-set-shape");

    this.jqicon = $("<div></div>")
      .addClass("dataflow-value-extractor-icon")
      .appendTo(this.jqview);
  }

};

var DataflowValueExtractor = DataflowNode.extend(extObject);
