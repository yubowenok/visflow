
"use strict";

var extObject = {

  initialize: function(para) {
    this.base.initialize.call(this, para);

    this.viewHeight = 40; // height + padding

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];

    // overwrite with constants
    this.outPorts[0].pack = DataflowConstants.new();

    this.prepare();
  },

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-superflat");


    /*
    this.jqicon = $("<div></div>")
      .addClass("dataflow-value-extractor-icon")
      .appendTo(this.jqview);
      */
  }

};

var DataflowValueExtractor = DataflowNode.extend(extObject);
