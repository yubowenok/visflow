
"use strict";

var extObject = {

  nodeShapeName: "none",

  initialize: function(para) {
    if (para == null)
      return console.error("null para passed to DataflowNode.initialize");
    this.hashtag = "h-" + Utils.randomString(8); // for serialization

    this.nodeId = para.nodeId;
    this.type = para.type;

    this.viewWidth = 100;
    this.viewHeight = 100;
    this.portHeight = 20;
    this.portGap = 4;

    // no ports by default
    this.inPorts = [];
    this.outPorts = [];
    this.ports = {};

    // default not showing icon
    this.detailsOn = true;

    this.optionsOffset = null;
  },

  serialize: function() {
    var result = {
      nodeId: this.nodeId,
      hashtag: this.hashtag,
      type: this.type,
      css: {
        left: this.jqview.position().left,
        top: this.jqview.position().top
      },
      detailsOn: this.detailsOn,
      optionsOn: this.optionsOn,
      optionsOffset: this.optionsOffset
    };

    return result;
  },

  deserialize: function(save) {
    this.detailsOn = save.detailsOn;
    if (this.detailsOn == null) {
      this.detailsOn = true;
      console.error("detailsOn not saved");
    }
    this.optionsOffset = save.optionsOffset;
    this.optionsOn = save.optionsOn;
  },

  // prepares all necessary data structures for references
  // called after initialize
  prepare: function() {
    this.preparePorts();
  },

  preparePorts: function() {
    var allports = this.inPorts.concat(this.outPorts);
    for (var i in allports) {
      this.ports[allports[i].id] = allports[i];
    }
  },

  setJqview: function(jqview) {
    this.jqview = jqview;
    jqview.addClass(this.hashtag);
  },

  show: function() {
    // this removes everything created (including those from inheriting classes)
    // inheriting classes shall not remove again
    this.jqview.children()
      .not(".ui-resizable-handle")
      .remove();

    if (this.detailsOn) {
      this.jqview
        .addClass("dataflow-node dataflow-node-shape ui-widget-content ui-widget");

      if (this.nodeShapeName != "none") {
        this.jqview
          .removeClass("dataflow-node-shape")
          .addClass("dataflow-node-shape-" + this.nodeShapeName);
      }

      this.prepareNodeInteraction();
      this.prepareContextMenu();
    } else {
      this.jqview
        .removeClass("dataflow-node-shape-" + this.nodeShapeName)
        .addClass("dataflow-node-shape");
      this.showIcon();
    }

    this.showPorts();
    this.options();
  },

  showIcon: function() {
    this.jqicon = $("<div></div>")
      .addClass("dataflow-" + this.iconName + "-icon")
      .appendTo(this.jqview);
  },

  // option handle, to implement options, write showOptions()
  options: function() {
    var node = this;
    if (this.optionsOn == true) {
      if (this.jqoptions) { // already shown, clear
        this.jqoptions.remove();
      }
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
      if (this.jqoptions) {
        this.jqoptions.remove();
        this.jqoptions = null;
      }
    }
  },

  prepareNodeInteraction: function() {
    if (this.nodeInteractionOn) // prevent making interaction twice
      return;
    this.nodeInteractionOn = true;

    var node = this,
        jqview = this.jqview;

    this.jqview
      .mouseover(function() {
        jqview.addClass("dataflow-node-hover");
      })
      .mouseleave(function() {
        jqview.removeClass("dataflow-node-hover");
      })
      .mousedown(function(event, ui) {
        if (event.which === 1) // left click
          core.dataflowManager.activateNode(node.nodeId);
        else if (event.which === 3)
          $(".ui-contextmenu")
            .css("z-index", 1000); // over other things
        core.interactionManager.mousedownHandler({
          type: "node",
          event: event,
          node: node
        });
      })
      .mouseup(function(event, ui) {
        core.interactionManager.mouseupHandler({
          type: "node",
          event: event,
          node: node
        });
      })
      .resizable({
        handles: "all",
        resize: function(event, ui) {
          node.resize(ui.size);
        },
        stop: function(event, ui) {
          node.resizestop(ui.size);
        }
      })
      .draggable({
        start: function(event, ui) {
          core.interactionManager.dragstartHandler({
            type: "node",
            event: event,
            node: node
          });
        },
        drag: function(event, ui) {
          core.interactionManager.dragmoveHandler({
            type: "node",
            event: event,
            node: node
          });
          node.updateEdges();
        },
        stop: function(event, ui) {
          core.interactionManager.dragstopHandler({
            type: "node",
            event: event
          });
        }
     });

    // remove resizable handler icon at se
    this.jqview.find(".ui-icon-gripsmall-diagonal-se")
      .removeClass("ui-icon ui-icon-gripsmall-diagonal-se");
    this.jqview.resizable("disable");
  },

  prepareContextMenu: function() {
    var node = this;

    // right-click menu
    this.jqview.contextmenu({
      delegate: this.jqview,
      addClass: "ui-contextmenu",
      menu: [
          {title: "Toggle Details", cmd: "details", uiIcon: "ui-icon-document"},
          {title: "Toggle Options", cmd: "options", uiIcon: "ui-icon-note"},
          {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"},
          ],
      select: function(event, ui) {
        if (ui.cmd == "details") {
          node.details = !node.details;
        } else if (ui.cmd == "options") {
          node.optionsOn = !node.optionsOn;
          node.options();
        } else if (ui.cmd === "delete") {
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

  updateEdges: function() {
    for (var key in this.ports) {
      var port = this.ports[key];
      for (var i in port.connections) {
        var edge = port.connections[i];
        edge.update();
      }
    }
  },

  showPorts: function() {
    this.jqview.find(".dataflow-port").remove();

    var portStep = this.portHeight + this.portGap;
    var node = this;
    var inTopBase = (this.viewHeight - this.inPorts.length * portStep + this.portGap) / 2;
    for (var i in this.inPorts) {
      var port = this.inPorts[i];
      var jqview = $("<div></div>")
        .css("top", inTopBase + i * portStep)
        .appendTo(this.jqview);
      port.setJqview(jqview);
    }
    var outTopBase = (this.viewHeight - this.outPorts.length * portStep + this.portGap) / 2;
    for (var i in this.outPorts) {
      var port = this.outPorts[i];
      var jqview = $("<div></div>")
        .css("top", outTopBase + i * portStep)
        .appendTo(this.jqview);
      port.setJqview(jqview);
    }
  },

  updatePorts: function() {
      var node = this;
      var portStep = this.portHeight + this.portGap;
      var inTopBase = (this.viewHeight - this.inPorts.length * portStep + this.portGap) / 2;
      for (var i in this.inPorts) {
        var port = this.inPorts[i];
        port.jqview
          .css("top", inTopBase + i * portStep);
        for (var j in port.connections) {
          port.connections[j].update();
        }
      }
      var outTopBase = (this.viewHeight - this.outPorts.length * portStep + this.portGap) / 2;
      for (var i in this.outPorts) {
        var port = this.outPorts[i];
        port.jqview
          .css("top", outTopBase + i * portStep);
        for (var j in port.connections) {
          port.connections[j].update();
        }
      }
  },

  hide: function() {
    $(this.jqview).children().remove();
    core.viewManager.removeNodeView(this.jqview);
  },

  inPortsChanged: function() {
    for (var i in this.inPorts) {
      if (this.inPorts[i].pack.changed)
        return true;
    }
    return false;
  },

  update: function() {
    if (!this.inPortsChanged()) {
      return; // everything not changed, do not process
    }

    this.process();
    this.show();

    for (var i in this.outPorts) {
      this.outPorts[i].pack.changed = true; // mark changes
    }
  },

  process: function() {
    // process input data and generate output
    // write this function in inheritting classes

    // WARNING: you cannot call propagate in process, otherwise
    // dataflowManager will endlessly call process
  },

  // called when node is resized
  resize: function(size) {
    this.viewWidth = size.width;
    this.viewHeight = size.height;
    this.updatePorts();
  },

  resizestop: function(size) {
    this.resize(size);
  },

  // abstract
  showOptions: function(){}
};

var DataflowNode = Base.extend(extObject);

