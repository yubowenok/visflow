
"use strict";

var extObject = {

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
  },

  serialize: function() {
    var result = {
      nodeId: this.nodeId,
      hashtag: this.hashtag,
      type: this.type,
      css: {
        left: this.jqview.position().left,
        top: this.jqview.position().top
      }
    };
    return result;
  },

  deserialize: function(save) {

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

    // this removes anything created (including those from inheriting classes)
    // inheriting classes shall not remove again
    this.jqview.children()
      .not(".ui-resizable-handle")
      .remove();

    var node = this,
        jqview = this.jqview;

    this.jqview
      .addClass("dataflow-node dataflow-node-shape ui-widget-content ui-widget")
      .mouseover(function() {
        jqview.addClass("dataflow-node-hover");
      })
      .mouseleave(function() {
        jqview.removeClass("dataflow-node-hover");
      })
      .mousedown(function(event, ui) {
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

    var nodeId = this.nodeId;
    this.jqview.mousedown(function(event){
      if (event.which === 1) // left click
        core.dataflowManager.activateNode(nodeId);
      else if (event.which === 3)
        $(".ui-contextmenu")
          .css("z-index", 1000); // over other things
    });

    this.prepareContextMenu();
    this.showPorts();
  },

  prepareContextMenu: function() {
    var node = this;
    // right-click menu
    this.jqview.contextmenu({
      delegate: this.jqview,
      addClass: "ui-contextmenu",
      menu: [
          {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"},
          /*
          {title: "----"},
          {title: "More", children: [
              {title: "Sub 1", cmd: "sub1"},
              {title: "Sub 2", cmd: "sub1"}
              ]}
              */
          ],
      select: function(event, ui) {
        if (ui.cmd === "delete") {
          core.dataflowManager.deleteNode(node);
        }
        //alert("select " + ui.cmd + " on " + ui.target.text());
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
  }
};

var DataflowNode = Base.extend(extObject);

