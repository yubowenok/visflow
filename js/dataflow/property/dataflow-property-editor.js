
"use strict";

var extObject = {

  iconName: "property-editor",
  nodeShapeName: "property-editor", // dedicate shape

  contextmenuDisabled: {
    "options": true
  },

  initialize: function(para) {
    DataflowPropertyEditor.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];
    this.prepare();

    // nothing is set by default
    this.properties = {};
  },

  serialize: function() {
    var result = DataflowPropertyEditor.base.serialize.call(this);
    result.properties = this.properties;
    return result;
  },

  deserialize: function(save) {
    DataflowPropertyEditor.base.deserialize.call(this, save);
    this.properties = save.properties;
    if (this.properties == null) {
      console.error("properties not saved in property editor");
      this.properties = {};
    }
  },

  show: function() {
    DataflowPropertyEditor.base.show.call(this); // call parent settings

    if (this.detailsOn) {
      var node = this;
      ["Color", "Border"].map(function(text) {
        var id = text.toLowerCase();
        var colorpicker = DataflowColorpicker.new(id, text);
        if (this.properties[id] != null) {
          colorpicker.setColor(this.properties[id]);
        }
        colorpicker.change(function(event){
          var unitChange = event.unitChange;
          node.properties[unitChange.id] = unitChange.value;
          node.process();

          // push property changes to downflow
          core.dataflowManager.propagate(node);
        });
        colorpicker.jqunit.appendTo(this.jqview);
      }, this);
    }
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;
    outpack.copy(inpack);
    var newitems = {};
    for (var index in inpack.items) {
      newitems[index] = {
        properties: _.extend({}, inpack.items[index].properties, this.properties)
      };
    }
    // cannot reuse old items
    outpack.items = newitems;
  }
};

var DataflowPropertyEditor = DataflowNode.extend(extObject);
