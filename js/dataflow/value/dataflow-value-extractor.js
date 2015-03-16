
"use strict";

var extObject = {

  iconName: "value-extractor",

  initialize: function(para) {
    DataflowValueExtractor.base.initialize.call(this, para);

    this.viewHeight = 40; // height + padding

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", true)
    ];

    // overwrite with constants
    this.outPorts[0].pack = DataflowConstants.new();

    this.prepare();
  },

  show: function() {

    DataflowValueExtractor.base.show.call(this); // call parent settings

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-superflat");
  },

  prepareContextMenu: function() {
    DataflowValueExtractor.base.prepareContextMenu.call(this);
    this.jqview.contextmenu("showEntry", "details", false);
  }

};

var DataflowValueExtractor = DataflowNode.extend(extObject);
