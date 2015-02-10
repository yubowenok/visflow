
// menu panel

"use strict";

var extObject = {
  initialize: function(para) {
    this.base.initialize.call(this, para); // call parent constructor
    para.jqview
      .addClass("panel");
  },
  show: function() {
    var view = this;

    this.jqheader = $("<h3>Panel</h3>")
      .appendTo(this.jqview)
      .addClass("ui-widget-header view-header");
    this.jqview
      .draggable({
        handle: "h3"
      });
    this.jqmenu = $("<div></div>")
      .appendTo(this.jqview)
      .load("js/ui/menu.html", function() {
        view.jqmenu.children("ul").menu();
      });
  }
};

var Panel = View.extend(extObject);
