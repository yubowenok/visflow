
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
        var menu = view.jqmenu.children("ul");
        menu.menu({
          select: function(event, ui) {
            if (ui.item.attr("id").substr(0,5) !== "menu_")
              return; // non-reactive menu entrie
            var type = ui.item.attr("id").substr(5); // remove "menu_" prefix
            switch(type) {
            case "datasrc":
            case "table":
            case "scatterplot":
            case "parallelcoordinates":
            case "histogram":
            case "union":
            case "intersect":
            case "minus":
              core.dataflowManager.createNode(type);
              break;
            case "nodraw":
              core.setMouseMode("none");
              break;
            case "edge":
              core.setMouseMode("edge");
              break;
            case "vismode":
              break;
            case "":
              break;
            default:
              console.error("unhandled menu item");
            }
          }
        });
        menu.menu("option", "delay", 0);

      });
  }
};

var Panel = View.extend(extObject);
