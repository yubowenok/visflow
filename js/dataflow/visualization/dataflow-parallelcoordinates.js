
"use strict";

var extObject = {

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-parallelcoordinates-icon")
      .appendTo(this.jqview);
  }

};

var DataflowParallelCoordinates = DataflowNode.extend(extObject);
