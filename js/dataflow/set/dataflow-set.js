
"use strict";

var extObject = {

  nodeShapeName: "flat",

  contextmenuDisabled: {
    "details": true,
    "options": true
  },

  initialize: function(para) {
    DataflowSet.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "ina", "in-single", "D"),
      DataflowPort.new(this, "inb", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];

    this.viewHeight = 50;
  },

  show: function() {
    DataflowSet.base.show.call(this);
  },

};

var DataflowSet = DataflowNode.extend(extObject);
