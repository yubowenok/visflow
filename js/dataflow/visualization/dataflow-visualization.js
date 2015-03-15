
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowVisualization.base.initialize.call(this, para);
    this.visOn = false;
    this.optionsOn = false;
    this.visWidth = null;
    this.visHeight = null;

    // selection applies to all visualization
    this.selected = {};

    this.optionsOffset = null;
  },

  serialize: function() {
    var result = DataflowVisualization.base.serialize.call(this);

    // mode toggles
    result.visOn = this.visOn;
    result.optionsOn = this.optionsOn;
    // option position
    result.optionsOffset = this.optionsOffset;


    // view sizes
    result.viewWidth = this.viewWidth;
    result.viewHeight = this.viewHeight;
    result.visWidth = this.visWidth;
    result.visHeight = this.visHeight;

    // selection
    result.selected = this.selected;

    return result;
  },

  deserialize: function(save) {
    DataflowVisualization.base.deserialize.call(this, save);
    this.visWidth = save.visWidth;
    this.visHeight = save.visHeight;
    this.optionsOffset = save.optionsOffset;

    this.visOn = save.visOn;
    this.optionsOn = save.optionsOn;
    this.viewWidth = save.viewWidth;
    this.viewHeight = save.viewHeight;
    this.selected = save.selected;


    if (this.selected instanceof Array || this.selected == null) {
      console.error("incorrect selection saved: array/null");
      this.selected = {};
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
      },
      beforeOpen: function(event, ui) {
        if (core.interactionManager.contextmenuLock)
          return false;
        core.interactionManager.contextmenuLock = true;
      },
      close: function(event, ui) {
        core.interactionManager.contextmenuLock = false;
      }
    });
  },

  prepareSvg: function() {
    if (this.jqsvg)
      this.jqsvg.remove();

    this.svg = d3.selectAll(this.jqvis.toArray()).append("svg");
    this.jqsvg = $(this.svg[0]);

    this.svgSize = [this.jqsvg.width(), this.jqsvg.height()];

    this.clearMessage();
    if (this.ports["in"].pack.isEmpty()) {
      // otherwise scales may be undefined
      this.showMessage("empty data in " + this.plotName);
      this.isEmpty = true;
      return;
    }

    this.isEmpty = false;
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
      this.showSelection();
      this.interaction();
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
    var node = this;
    if (this.optionsOn == true) {
      this.jqoptions = $("<div></div>")
        .addClass("dataflow-options")
        .addClass("ui-widget-content ui-widget")
        .appendTo(this.jqview)
        .draggable({
          stop: function(event) {
            var offset = $(event.target).position();  // relative position
            node.optionsOffset = offset;
          }
        });
      if (this.optionsOffset != null) {
        this.jqoptions.css(this.optionsOffset);
      }
      this.showOptions();
    } else {
      if (this.jqoptions)
        this.jqoptions.remove();
    }
  },

  validateSelection: function() {
    var inpack = this.ports["in"].pack;
    // some selection items no longer exists in the input
    // we shall remove those selection
    for (var index in this.selected) {
      if (inpack.items[index] == null){
        delete this.selected[index];
      }
    }
  },

  selectAll: function() {
    var inpack = this.ports["in"].pack;
    this.selected = {};
    for (var index in inpack.items) {
      this.selected[index] = true;
    }
    this.process();
    core.dataflowManager.propagate(this);
  },

  clearSelection: function() {
    this.selected = {};
    this.process();
    core.dataflowManager.propagate(this);
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
  interaction: function() {},
  showIcon: function() {},
  showVisualization: function() {},
  showOptions: function() {},
  showSelection: function() {},
  updateVisualization: function() {},
  prepareInteraction: function() {},
  prepareScales: function() {}

};

var DataflowVisualization = DataflowNode.extend(extObject);
