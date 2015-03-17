
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowPropertyEditor.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();

    this.properties = {
      fill: "red"
    };
  },

  show: function() {

    DataflowPropertyEditor.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-property-editor-icon")
      .appendTo(this.jqview);
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;
    outpack.copy(inpack);
    for (var index in inpack.items) {
      outpack.items[index] = {
        properties: _.extend({}, inpack.items[index], this.properties)
      };
    }
  }

};

var DataflowPropertyEditor = DataflowNode.extend(extObject);
