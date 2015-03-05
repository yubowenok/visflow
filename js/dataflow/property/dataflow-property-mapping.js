
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowNode.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();
  },

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-property-mapping-icon")
      .appendTo(this.jqview);
  }

};

var DataflowPropertyMapping = DataflowNode.extend(extObject);
