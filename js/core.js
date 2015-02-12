
"use strict";

// program kernel
var core;

// kernel definition
var extObject = {
  initialize: function() {
    this.viewManager = ViewManager.new();
    this.viewManager.showPanel();
    this.dataflowManager = DataflowManager.new();
  },
  setMouseMode: function(mode) {
    this.mouseMode = mode;
  }
};

var Core = Base.extend(extObject);
