
"use strict";

var extObject = {

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-range-icon")
      .appendTo(this.jqview);
  }

};

var DataflowRangeFilter = DataflowNode.extend(extObject);
