
"use strict";

var extObject = {

  iconName: "value-extractor",
  nodeShapeName: "value-extractor", // special shape for itself

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

  show: function() {

    DataflowValueExtractor.base.show.call(this); // call parent settings

    var node = this;
    var div = $("<div></div>")
        .addClass("dataflow-options-item")
        .appendTo(this.jqview);
      $("<label></label>")
        .addClass("dataflow-options-text")
        .text("Extract values from")
        .appendTo(div);
    this.selectDimension = $("<select><option/></select>")
      .addClass("dataflow-node-select")
      .appendTo(div)
      .select2({
        placeholder: "Select"
      })
      .change(function(event){
        node.dimension = event.target.value;
        node.process();

        // push dimension change to downflow
        core.dataflowManager.propagate(node);
      });
    this.prepareDimensionList();

    // show current selection, must call after prepareDimensionList
    this.selectDimension.select2("val", this.dimension);
  },

  process: function() {
    var inpack = this.ports["in"].pack;
    if (inpack.type === "constants")
      return console.error("constants in connected to value extractor");

    if (inpack.isEmpty())
      return;

    if (inpack.data.dataId != this.lastDataId) {
      this.lastDataId = inpack.data.dataId;
      this.dimension = 0;
    }

    // overwrite to maintain reference downflow
    $.extend(this.ports["out"].pack, DataflowConstants.new());
    var outpack = this.ports["out"].pack;

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
  },

  prepareDimensionList: function() {
    var dims = this.ports["in"].pack.data.dimensions;
    for (var i in dims) {
      $("<option value='" + i + "'>" + dims[i] + "</option>")
        .appendTo(this.selectDimension);
    }
  },

  prepareContextMenu: function() {
    DataflowValueExtractor.base.prepareContextMenu.call(this);
    this.jqview.contextmenu("showEntry", "details", false);
    this.jqview.contextmenu("showEntry", "options", false);
  }

};

var DataflowValueExtractor = DataflowNode.extend(extObject);
