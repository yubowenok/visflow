
"use strict";

var extObject = {

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-table-icon")
      .appendTo(this.jqview);
  }

};

var DataflowTable = DataflowNode.extend(extObject);
