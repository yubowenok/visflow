
"use strict";

var extObject = {

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-contain-icon")
      .appendTo(this.jqview);
  }

};

var DataflowContainFilter = DataflowNode.extend(extObject);
