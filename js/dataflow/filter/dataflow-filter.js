
/*
 * dataflow-filter base class
 */

"use strict";

var extObject = {

  initialize: function(para) {
    DataflowFilter.base.initialize.call(this, para);

    this.viewHeight = 90; // height + padding
  },

  show: function() {
    DataflowFilter.base.show.call(this);

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-longflat");

    this.jqicon = $("<div></div>")
      .appendTo(this.jqview);

    this.selectDimension = $("<select><option/></select>")
      .addClass("dataflow-select")
      .appendTo(this.jqview)
      .select2({
        placeholder: "Select"
      });

    this.updateDimensionList();
  },

  updateDimensionList: function() {
    var dims = this.ports["in"].pack.data.dimensions;
    console.log(dims);
    for (var i in dims) {
      $("<option value='" + i + "'>" + dims[i] + "</option>")
        .appendTo(this.selectDimension);
    }
  }
};

var DataflowFilter = DataflowNode.extend(extObject);


