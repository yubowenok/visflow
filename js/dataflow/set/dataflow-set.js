
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
  },

  prepareContextMenu: function() {
    DataflowSet.base.prepareContextMenu.call(this);
    this.jqview.contextmenu("showEntry", "details", false);
  }

};

var DataflowSet = DataflowNode.extend(extObject);
