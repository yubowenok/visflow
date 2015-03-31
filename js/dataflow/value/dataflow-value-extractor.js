
"use strict";

var extObject = {

  iconClass: "dataflow-value-extractor-icon dataflow-flat-icon",
  nodeShapeName: "value-extractor", // dedicate shape

  contextmenuDisabled: {
    "details": true,
    "options": true
  },

  initialize: function(para) {
    DataflowValueExtractor.base.initialize.call(this, para);

    this.viewHeight = 40; // height + padding

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single", "V")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "V", true)
    ];

    // overwrite with constants
    this.outPorts[0].pack = DataflowConstants.new();

    this.dimension = null;

    this.lastDataId = 0;  // default empty data

    this.prepare();
  },

  serialize: function() {
    var result = DataflowValueExtractor.base.serialize.call(this);
    result.dimension = this.dimension;
    result.lastDataId = this.lastDataId;
    return result;
  },

  deserialize: function(save) {
    DataflowValueExtractor.base.deserialize.call(this, save);
    this.dimension = save.dimension;
    this.lastDataId = save.lastDataId;
  },

  showDetails: function() {

    DataflowValueExtractor.base.showDetails.call(this); // call parent settings

    var node = this;
    this.selectDimension = DataflowSelect.new({
      id: "dimension",
      label: "Extract values from",
      target: this.jqview,
      relative: true,
      placeholder: "Select",
      value: this.dimension,
      list: this.prepareDimensionList(),
      change: function(event) {
        var unitChange = event.unitChange;
        node.dimension = unitChange.value;
        node.pushflow();
      }
    });
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;
    if (inpack.type === "constants")
      return console.error("constants in connected to value extractor");

    // overwrite to maintain reference downflow
    $.extend(outpack, DataflowConstants.new());

    if (inpack.isEmpty()) {
      return;
    }

    if (inpack.data.dataId != this.lastDataId) {
      this.lastDataId = inpack.data.dataId;
      this.dimension = 0;
    }

    var items = inpack.items,
        values = inpack.data.values;
    var allValues = {};
    for (var index in items) {
      var value = values[index][this.dimension];
      allValues[value] = true;
    }

    _(allValues).allKeys().map(function(val) {
      // insert each value into constants
      outpack.add(val);
    }, this);
  }

};

var DataflowValueExtractor = DataflowNode.extend(extObject);
