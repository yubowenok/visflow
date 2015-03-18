
"use strict";

var extObject = {

  iconName: "property-mapping",

  contextmenuDisabled: {
    "options": true
  },

  initialize: function(para) {
    DataflowPropertyMapping.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();
  },

  show: function() {

    DataflowPropertyMapping.base.show.call(this); // call parent settings
  }

};

var DataflowPropertyMapping = DataflowNode.extend(extObject);
