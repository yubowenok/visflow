
"use strict";

var extObject = {

  nodeShapeName: "flat",

  contextmenuDisabled: {
    "details": true,
    "options": true
  },

  initialize: function(para) {
    DataflowSet.base.initialize.call(this, para);

    this.viewHeight = 50;
  },

  show: function() {
    DataflowSet.base.show.call(this);
  },

};

var DataflowSet = DataflowNode.extend(extObject);
