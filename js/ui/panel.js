
// menu panel

"use strict";

var extObject = {
  initialize: function(para) {
    this.base.initialize.call(this, para); // call parent constructor
    para.jqview
      .addClass("panel");
  },
  show: function() {
    this.jqheader = $("<h3>Panel</h3>")
      .appendTo(this.jqview)
      .addClass("ui-widget-header view-header");
    this.jqview
      .draggable({
        handle: "h3"
      });
  }
};

var Panel = View.extend(extObject);
