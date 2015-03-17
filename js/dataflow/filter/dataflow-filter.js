
/*
 * dataflow-filter base class
 */

"use strict";

var extObject = {

  nullValueString: "-",
  nodeShapeName: "longflat",

  initialize: function(para) {
    DataflowFilter.base.initialize.call(this, para);

    this.viewHeight = 90; // height + padding
    this.dimension = null;

    this.lastDataId = 0;  // default empty data
  },

  serialize: function() {
    var result = DataflowFilter.base.serialize.call(this);
    result.dimension = this.dimension;
    result.lastDataId = this.lastDataId;
    return result;
  },

  deserialize: function(save) {
    DataflowFilter.base.deserialize.call(this, save);
    this.dimension = save.dimension;
    this.lastDataId = save.lastDataId;
  },

  prepareContextMenu: function() {
    DataflowFilter.base.prepareContextMenu.call(this);
    this.jqview.contextmenu("showEntry", "details", false);
  },

  show: function() {
    DataflowFilter.base.show.call(this);

    var node = this;
    this.selectDimension = $("<select><option/></select>")
      .addClass("dataflow-node-select")
      .appendTo(this.jqview)
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

  prepareDimensionList: function() {
    var dims = this.ports["in"].pack.data.dimensions;
    for (var i in dims) {
      $("<option value='" + i + "'>" + dims[i] + "</option>")
        .appendTo(this.selectDimension);
    }
  },

  filter: function() {
    // filter the data by constraints
  }
};

var DataflowFilter = DataflowNode.extend(extObject);


