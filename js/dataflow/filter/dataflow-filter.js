
/*
 * dataflow-filter base class
 */

"use strict";

var extObject = {

  initialize: function(para) {
    DataflowFilter.base.initialize.call(this, para);

    this.viewHeight = 90; // height + padding
    this.dimension = null;
  },

  show: function() {
    DataflowFilter.base.show.call(this);

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-longflat");

 /*
    this.jqicon = $("<div></div>")
      .appendTo(this.jqview);
*/

    var node = this;
    this.selectDimension = $("<select class='dataflow-select'><option/></select>")
      .appendTo(this.jqview)
      .select2({
        placeholder: "Select"
      })
      .change(function(event){
        node.dimension = event.target.value;
        node.update();
      });
    this.updateDimensionList();
    this.selectDimension.select2("val", this.dimension);  // must call after updateDimensionList
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


