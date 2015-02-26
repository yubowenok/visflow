
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowNode.initialize.call(this, para);
  },

  show: function() {
    DataflowNode.show.call(this);
    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-flat");
  }

};

var DataflowSet = DataflowNode.extend(extObject);
