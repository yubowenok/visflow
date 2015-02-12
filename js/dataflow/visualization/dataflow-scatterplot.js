
"use strict";

var extObject = {

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-scatterplot-icon")
      .appendTo(this.jqview);
  }

};

var DataflowScatterplot = DataflowNode.extend(extObject);
