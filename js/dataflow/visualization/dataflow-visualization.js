
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowNode.initialize.call(this, para);
    this.vismode = false;
  },

  prepareContextMenu: function() {
    var node = this;
    // right-click menu

    if (!this.vismode) {
      this.jqview.contextmenu({
        delegate: this.jqview,
        addClass: "ui-contextmenu",
        menu: [
            {title: "Visualization On", cmd: "vis", uiIcon: "ui-icon-image"},
            {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"}
            ],
        select: function(event, ui) {
          if (ui.cmd === "vis") {
            node.vismode = !node.vismode;
            node.show();
            node.prepareContextMenu();
          } else if (ui.cmd === "delete") {
            core.dataflowManager.deleteNode(node);
          }
        }
      });
    } else {
      this.jqview.contextmenu({
        menu: [
            {title: "Visualization Off", cmd: "vis", uiIcon: "ui-icon-minus"},
            {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"}
        ]
      });
    }

  },

  show: function() {

    var node = this;

    DataflowNode.show.call(this);
    if (this.vismode === true) {
      this.jqview
        .removeClass("dataflow-node-shape")
        .addClass("dataflow-vis-shape");
      this.showVisualization();

      this.jqview.resizable({
        handles: "all",
        resize: function(event, ui) {
          node.resize(ui.size);
        }
      });
      this.jqview.find(".ui-icon-gripsmall-diagonal-se")
        .removeClass("ui-icon ui-icon-gripsmall-diagonal-se");

      this.viewHeight = this.jqview.outerHeight();
      this.updatePorts();
    } else {
      this.jqview
        .removeClass("dataflow-vis-shape")
        .addClass("dataflow-node-shape");
      this.showIcon();

      this.viewHeight = this.jqview.outerHeight();
      this.updatePorts();
    }
  },

  showIcon: function() {
  },

  showVisualization: function() {
  },

  updateVisualization: function() {

  },

  resize: function(para) {
    this.viewHeight = para.height;
    this.updatePorts();
    this.updateVisualization();
  }
};

var DataflowVisualization = DataflowNode.extend(extObject);
