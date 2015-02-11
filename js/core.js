
"use strict";

// program kernel
var core;

// kernel definition
var extObject = {
  initialize: function() {
    this.viewManager = ViewManager.new();
    this.viewManager.showPanel();
    this.dataflowManager = DataflowManager.new();
  }
};

var Core = Base.extend(extObject);
