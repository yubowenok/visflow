
"use strict";

var extObject = {

  nodeShapeName: "set",

  contextmenuDisabled: {
    "details": true,
    "options": true
  },

  initialize: function(para) {
    DataflowSet.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-multiple", "D"),
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];

    this.lastConnectionNumber = 0;
  },

  //  may change because of removed connections
  inPortsChanged: function() {
    if (this.lastConnectionNumber != this.ports["in"].connections.length) {
      this.lastConnectionNumber = this.ports["in"].connections.length;
      return true;
    }
    return DataflowSet.base.inPortsChanged.call(this);
  },

  showDetails: function() {
    DataflowSet.base.showDetails.call(this);
  },

  show: function() {
    DataflowSet.base.show.call(this);
  }

};

var DataflowSet = DataflowNode.extend(extObject);
