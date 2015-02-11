
"use strict";

var extObject = {
  initialize: function(id) {
    this.id = id;
  },
  setJqview: function(jqview) {
    this.jqview = jqview;
    jqview
      .addClass("dataflow-node ui-widget-content ui-widget")
      .draggable({
      });
  },
  show: function() {
    console.log("show() of dataflow node not implemented");
  }
};

var DataflowNode = Base.extend(extObject);
