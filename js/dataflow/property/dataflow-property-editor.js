
"use strict";

var extObject = {

  iconName: "property-editor",
  nodeShapeName: "property",

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
      // color and border
      [
        ["Color", DataflowColorpicker],
        ["Border", DataflowColorpicker],
        ["BorderWidth", DataflowInput, "float", [0, 1E9], 0.1],
        ["Size", DataflowInput, "float", [0, 1E9], 0.5],
        ["Opacity", DataflowInput, "float", [0, 1], 0.05]
      ].map(function(unit) {
        var id = unit[0].toLowerCase();
        var input = unit[1].new({
          id: id,
          label: unit[0],
          accept: unit[2],
          range: unit[3],
          scrollDelta: unit[4]
        });
        if (this.properties[id] != null) {
          input.setValue(this.properties[id]);
        }
        input.change(function(event){
          var unitChange = event.unitChange;
          node.properties[unitChange.id] = unitChange.value;
          node.pushflow();
        });
        input.jqunit.appendTo(this.jqview);
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
