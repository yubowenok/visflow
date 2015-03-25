
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

  showDetails: function() {
    DataflowFilter.base.showDetails.call(this);

    this.jqview
      .css("text-align", "center");

    var node = this;
    this.selectDimension = DataflowSelect.new({
      id: "dimension",
      list: this.prepareDimensionList(),
      value: this.dimension,
      relative: true,
      placeholder: "Select",
      change: function(event){
        node.dimension = event.target.value;
        if (node.dimension == "")
          node.dimension = null;
        node.pushflow();
      }
    });
    this.selectDimension.jqunit
      .appendTo(this.jqview);
  },

  filter: function() {
    // filter the data by constraints
  }
};

var DataflowFilter = DataflowNode.extend(extObject);


