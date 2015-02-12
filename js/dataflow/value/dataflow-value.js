
"use strict";

var extObject = {

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-set-shape");

    this.jqicon = $("<div></div>")
      .addClass("dataflow-value-icon")
      .appendTo(this.jqview);
  }

};

var DataflowValueExtractor = DataflowNode.extend(extObject);
