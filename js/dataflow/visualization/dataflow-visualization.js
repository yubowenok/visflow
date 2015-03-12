
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowVisualization.base.initialize.call(this, para);
    this.vismode = false;
  },

  serialize: function() {
    var result = DataflowVisualization.base.serialize.call(this);
    result.vismode = this.vismode;
    result.viewWidth = this.viewWidth;
    result.viewHeight = this.viewHeight;
    return result;
  },

  deserialize: function(save) {
    DataflowVisualization.base.deserialize.call(this, save);
    if (this.vismode != save.vismode) {
      this.vismode = save.vismode;
      this.viewWidth = save.viewWidth;
      this.viewHeight = save.viewHeight;
      this.jqview
        .css({
          width: this.viewWidth,
          height: this.viewHeight
        });
      this.deserializeChange = true;
    }
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
    DataflowVisualization.base.show.call(this);

    this.jqvis = $("<div></div>")
      .addClass("dataflow-visualization")
      .appendTo(this.jqview);

    var node = this;

    if (this.vismode === true) {
      this.jqview
        .removeClass("dataflow-node-shape")
        .addClass("dataflow-node-shape-vis")
        .resizable("enable");
      this.viewHeight = this.jqview.width();
      this.viewHeight = this.jqview.height();
      this.showVisualization();
      this.updatePorts();
    } else {
      this.jqview
        .css("width", "")
        .css("height", "")
        .removeClass("dataflow-node-shape-vis")
        .addClass("dataflow-node-shape")
        .resizable("disable");
      this.viewHeight = this.jqview.width();
      this.viewHeight = this.jqview.height();
      this.showIcon();
      this.updatePorts();
    }
  },

  // display a text message at the center of the node
  showMessage: function(msg) {
    this.jqmsg = $("<div></div>")
      .text(msg)
      .addClass("dataflow-visualization-message")
      .css("line-height", this.viewHeight + "px")
      .prependTo(this.jqview);
  },

  clearMessage: function() {
    if (this.jqmsg)
      this.jqmsg.remove();
  },

  // need to call parent classes
  resize: function(size) {
    DataflowVisualization.base.resize.call(this, size);
  },

  resizestop: function(size) {
    DataflowVisualization.base.resizestop.call(this, size);
  },

  // abstract: to implement in inheriting class
  showIcon: function() {},
  showVisualization: function() {},
  updateVisualization: function() {}

};

var DataflowVisualization = DataflowNode.extend(extObject);
