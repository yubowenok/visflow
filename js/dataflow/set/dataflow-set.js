
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowNode.initialize.call(this, para);

    this.viewHeight = 50;
  },

  show: function() {
    DataflowNode.show.call(this);
    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-flat");
  }

};

var DataflowSet = DataflowNode.extend(extObject);
