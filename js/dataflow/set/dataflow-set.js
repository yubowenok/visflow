
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowSet.base.initialize.call(this, para);

    this.viewHeight = 50;
  },

  show: function() {
    DataflowSet.base.show.call(this);
    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-flat");
  }

};

var DataflowSet = DataflowNode.extend(extObject);
