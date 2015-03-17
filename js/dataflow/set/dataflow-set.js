
"use strict";

var extObject = {

  nodeShapeName: "flat",

  initialize: function(para) {
    DataflowSet.base.initialize.call(this, para);

    this.viewHeight = 50;
  },

  show: function() {
    DataflowSet.base.show.call(this);
  },

  prepareContextMenu: function() {
    DataflowSet.base.prepareContextMenu.call(this);
    this.jqview.contextmenu("showEntry", "details", false);
  }

};

var DataflowSet = DataflowNode.extend(extObject);
