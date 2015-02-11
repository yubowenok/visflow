
"use strict";

var extObject = {
  show: function() {
    this.jqview
      .addClass("dataflow-node");


    $("<input type='button' id='load' value='Load Data'>")
      .button()
      .appendTo(this.jqview);
  }
};

var DataflowDataSource = DataflowNode.extend(extObject);
