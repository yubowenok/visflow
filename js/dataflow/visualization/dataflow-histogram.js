
"use strict";

var extObject = {

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-histogram-icon")
      .appendTo(this.jqview);
  }

};

var DataflowHistogram = DataflowNode.extend(extObject);
