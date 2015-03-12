
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowVisualization.base.initialize.call(this, para);
    this.visOn = false;
    this.optionsOn = false;
    this.visWidth = null;
    this.visHeight = null;
  },

  serialize: function() {
    var result = DataflowVisualization.base.serialize.call(this);
    result.visOn = this.visOn;
    result.optionsOn = this.optionsOn;
    result.viewWidth = this.viewWidth;
    result.viewHeight = this.viewHeight;
    result.visWidth = this.visWidth;
    result.visHeight = this.visHeight;
    return result;
  },

  deserialize: function(save) {
    DataflowVisualization.base.deserialize.call(this, save);
    this.visWidth = this.visWidth;
    this.visHeight = this.visHeight;
    if (save.visOn === true) {
      this.visOn = save.visOn;
      this.optionsOn = save.optionsOn;
      this.viewWidth = save.viewWidth;
      this.viewHeight = save.viewHeight;
      this.deserializeChange = true;
    }
  },

  prepareContextMenu: function() {
    var node = this;
    // right-click menu

    this.jqview.contextmenu({
      delegate: this.jqview,
      addClass: "ui-contextmenu",
      menu: [
          {title: "Toggle Visualization", cmd: "vis", uiIcon: "ui-icon-image"},
          {title: "Toggle Options", cmd: "options", uiIcon: "ui-icon-note"},
          {title: "Select All", cmd: "selall"},
          {title: "Clear Selection", cmd: "selclear"},
          {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"}
        ],
      select: function(event, ui) {
        if (ui.cmd == "vis") {
          node.visOn = !node.visOn;
          node.show();
          node.prepareContextMenu();
        } else if (ui.cmd == "options") {
          node.optionsOn = !node.optionsOn;
          node.options();
        } else if (ui.cmd == "selall") {
          node.selectAll();
        } else if (ui.cmd == "selclear") {
          node.clearSelection();
        } else if (ui.cmd == "delete") {
          core.dataflowManager.deleteNode(node);
        }
      }
    });
  },


  show: function() {
    DataflowVisualization.base.show.call(this);

    var node = this;

    if (this.visOn === true) {
      this.jqvis = $("<div></div>")
      .addClass("dataflow-visualization")
      .appendTo(this.jqview);

      this.jqview
        .removeClass("dataflow-node-shape")
        .addClass("dataflow-node-shape-vis")
        .css("width", this.visWidth)
        .css("height", this.visHeight)
        .resizable("enable");
      this.viewWidth = this.jqview.width();
      this.viewHeight = this.jqview.height();

      this.showVisualization();
      this.options();
    } else {
      if (this.jqvis)
        this.jqvis.remove();
      this.jqview
        .css("width", "")
        .css("height", "")
        .removeClass("dataflow-node-shape-vis")
        .addClass("dataflow-node-shape")
        .resizable("disable");
      this.viewWidth = this.jqview.width();
      this.viewHeight = this.jqview.height();
      this.showIcon();
    }

    // must be called AFTER viewWidth & viewHeight are set
    this.updatePorts();
  },

  // option handle, to implement options, write showOptions()
  options: function() {
    if (this.optionsOn == true) {
      this.jqoptions = $("<div></div>")
        .addClass("dataflow-options")
        .addClass("ui-widget-content ui-widget")
        .appendTo(this.jqview);
      this.showOptions();
    } else {
      if (this.jqoptions)
        this.jqoptions.remove();
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
    if (this.visOn) {
      this.visWidth = size.width;
      this.visHeight = size.height;
    }
  },

  resizestop: function(size) {
    DataflowVisualization.base.resizestop.call(this, size);
  },

  // abstract: to implement in inheriting class
  showIcon: function() {},
  showVisualization: function() {},
  showOptions: function() {},
  updateVisualization: function() {},
  clearSelection: function() {},
  selectAll: function() {}

};

var DataflowVisualization = DataflowNode.extend(extObject);
