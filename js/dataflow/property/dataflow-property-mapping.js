
"use strict";

var extObject = {

  iconName: "property-mapping",
  nodeShapeName: "property-mapping", // dedicate shape

  contextmenuDisabled: {
    "options": true
  },

  initialize: function(para) {
    DataflowPropertyMapping.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];
    this.prepare();

    this.dimension = null;
    this.scale = null;
    this.properties = {};
  },

  serialize: function() {
    var result = DataflowPropertyMapping.base.serialize.call(this);
    result.scale = this.scale;
    result.dimension = this.dimension;
    return result;
  },

  deserialize: function(save) {
    DataflowPropertyMapping.base.deserialize.call(this, save);

    this.scale = save.scale;
    this.dimension = save.dimension;
    // check null? TODO
  },

  show: function() {
    DataflowPropertyMapping.base.show.call(this); // call parent settings

    if (this.detailsOn) {
      // select dimension
      this.selectDimension = DataflowSelect.new({
        id: "dimension",
        label: "Dimension",
        labelWidth: 75,
        containerWidth: this.jqview.width() - 75,
        change: function(event) {
          var unitChange = event.unitChange;
        }
      });
      this.selectDimension.jqunit.appendTo(this.jqview);
      this.prepareDimensionList();

      // select scale
      this.selectScale = DataflowSelect.new({
        id: "mapping",
        label: "Mapping",
        labelWidth: 75,
        containerWidth: this.jqview.width() - 75,
        change: function(event) {
          var unitChange = event.unitChange;
        }
      });
      this.selectScale.jqunit.appendTo(this.jqview);
      this.prepareScaleList();
    }
    this.viewWidth = this.jqview.width();
    this.viewHeight = this.jqview.height();
    this.updatePorts();
  },

  prepareDimensionList: function() {
    var dims = this.ports["in"].pack.data.dimensions;
    var list = [];
    for (var i in dims) {
      list.push({
        value: i,
        text: dims[i]
      });
    }
    this.selectDimension.setList(list);
  },

  prepareScaleList: function() {
    var x = d3.scale.linear().domain([-1,1]).range(["red", "blue"]);
    $.get("js/dataflow/property/mappings.json", function(data) {
      console.log(data);
    });
  }
};

var DataflowPropertyMapping = DataflowNode.extend(extObject);
