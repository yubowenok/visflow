
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
      .load("js/ui/panel-menu.html", function() {
        var menu = view.jqmenu.children("ul");
        menu.menu({
          //position: { my: "left top", at: "right top" },
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
            case "value_maker":
            case "value_extractor":
            case "range":
            case "contain":
            case "property_editor":
            case "property_mapping":
              core.dataflowManager.createNode(type);
              break;
            case "visOn":
              break;
            case "layout":
              break;
            case "new":
              core.dataflowManager.clearDataflow();
              break;
            case "save":
              core.dataflowManager.saveDataflow();
              break;
            case "load":
              core.dataflowManager.loadDataflow();
              break;
            case "":  // non-selectable menu entry
              break;
            default:
              console.error("unhandled menu item");
            }
          }
        });
      });
  }
};

var Panel = View.extend(extObject);
