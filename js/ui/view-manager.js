
"use strict";

var extObject = {
  showPanel: function() {
    var jqview = $("<div></div>").appendTo("body");
    this.panel = Panel.new({
      jqview: jqview,
      id: "panel"
    });
    this.panel.show();
  },
  hidePanel: function() {
    this.panel.close();
  }
};

var ViewManager = Base.extend(extObject);
