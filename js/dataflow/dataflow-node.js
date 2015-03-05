
"use strict";

var extObject = {

  initialize: function(para) {
    if (para == null)
      return console.error("null para passed to DataflowNode.initialize");
    this.nodeid = para.nodeid;

    this.viewHeight = 100;

    // no ports by default
    this.inPorts = [];
    this.outPorts = [];
    this.ports = {};
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
  },

  show: function() {

    this.jqview.children().remove();

    var node = this;
    this.jqview
      .addClass("dataflow-node dataflow-node-shape ui-widget-content ui-widget")
      .draggable({
        drag: function(event, ui) {
          node.updateEdges();
        }
      });

    var nodeid = this.nodeid;
    this.jqview.mousedown(function(event){
      if (event.which === 1) // left click
        core.dataflowManager.activateNode(nodeid);
      else if (event.which === 3)
        $(".ui-contextmenu")
          .css("z-index", core.viewManager.getTopZindex() + 1); // over other things
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
    var node = this;
    var inTopBase = this.viewHeight / 2 - this.inPorts.length * 10;
    for (var i in this.inPorts) {
      var port = this.inPorts[i];
      port.jqview = $("<div></div>")
        .addClass("ui-widget-content dataflow-port dataflow-port-in")
        .attr("id", port.id)
        .css("top", inTopBase + i * 20)
        .appendTo(this.jqview);
      $("<div></div>")
        .addClass("dataflow-port dataflow-port-icon-" + port.type)
        .appendTo(port.jqview);

      port.jqview
        .draggable({
          helper: function(){ return $("<div></div>"); },
          start: function(event, ui) {
            core.interactionManager.dragstartHandler({
              type: "port",
              node: node,
              portid: event.target.id,
              event: event
            });
          },
          drag: function(event, ui) {
            core.interactionManager.dragmoveHandler({
              type: "port",
              node: node,
              portid: event.target.id,
              event: event
            });
          },
          stop: function(event, ui) {
            core.interactionManager.dragstopHandler({
              type: "port",
              event: event
            });
          }
        })
        .droppable({
          hoverClass: "dataflow-port-hover",
          tolerance: "pointer",
          accept: ".dataflow-port-out",
          greedy: true,
          drop: function(event, ui) {
            core.interactionManager.dropHandler({
              type: "port",
              node: node,
              portid: event.target.id,
              event: event
            });
          }
        });
    }
    var outTopBase = this.viewHeight / 2 - this.outPorts.length * 10;
    for (var i in this.outPorts) {
      var port = this.outPorts[i];
      port.jqview = $("<div></div>")
        .addClass("ui-widget-content dataflow-port dataflow-port-out")
        .attr("id", port.id)
        .css("top", outTopBase + i * 20)
        .appendTo(this.jqview);
      $("<div></div>")
        .addClass("dataflow-port dataflow-port-icon-" + port.type)
        .appendTo(port.jqview);

      port.jqview
        .draggable({
          helper: function(){ return $("<div></div>"); },
          start: function(event, ui) {
            core.interactionManager.dragstartHandler({
              type: "port",
              node: node,
              portid: event.target.id,
              event: event
            });
          },
          drag: function(event, ui) {
            core.interactionManager.dragmoveHandler({
              type: "port",
              node: node,
              portid: event.target.id,
              event: event
            });
          },
          stop: function(event, ui) {
            core.interactionManager.dragstopHandler({
              type: "port",
              event: event
            });
          }
        })
        .droppable({
          hoverClass: "dataflow-port-hover",
          tolerance: "pointer",
          accept: ".dataflow-port-in",
          greedy: true,
          drop: function(event, ui) {
            core.interactionManager.dropHandler({
              type: "port",
              node: node,
              portid: event.target.id,
              event: event
            });
          }
        });
    }
  },

  updatePorts: function() {
      var node = this;
      var inTopBase = this.viewHeight / 2 - this.inPorts.length * 10;
      for (var i in this.inPorts) {
        var port = this.inPorts[i];
        port.jqview
          .css("top", inTopBase + i * 20);
        for (var j in port.connections) {
          port.connections[j].update();
        }
      }
      var outTopBase = this.viewHeight / 2 - this.outPorts.length * 10;
      for (var i in this.outPorts) {
        var port = this.outPorts[i];
        port.jqview
          .css("top", inTopBase + i * 20);
        for (var j in port.connections) {
          port.connections[j].update();
        }
      }
  },

  hide: function() {
    $(this.jqview).children().remove();
  },

  process: function() {
    // process all the input data and generate output
  }

};

var DataflowNode = Base.extend(extObject);
