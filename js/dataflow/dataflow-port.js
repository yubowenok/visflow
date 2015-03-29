
"use strict";

var extObject = {

  initialize: function(node, id, type, text, isConstants) {

    this.node = node; // parent node

    this.hashtag = "h-" + Utils.randomString(8); // for serialization

    this.id = id; // port id corresponding to its parent node
    this.type = type; // in-single, in-multiple, out-single, out-multiple

    this.text = text == null ? "" : text; // text to show on port

    this.isInPort = this.type.substr(0, 2) === "in";
    this.isSingle = this.type.match("single") != null;
    this.isConstants = isConstants === true;

    this.connections = []; // to which other ports it is connected (edges)

    this.packClass = this.isConstants ? DataflowConstants : DataflowPackage;

    this.pack = this.packClass.new(); // stored data / constants
    if (this.isInPort && !this.isSingle) {
      // for in-multiple, use array to store packs
      // this.pack will be referencing the last connected pack
      this.packs = [];
    }
  },

  connected: function() {
    return this.connections.length > 0;
  },

  connectable: function(port) {
    if (this.node === port.node)
      return "cannot connect ports of the same node";
    if (this.isSingle && this.connections.length || port.isSingle && port.connections.length)
      return "single port has already been connected";
    if (this.isConstants !== port.isConstants)
      return "cannot connect constant port with data port";
    for (var i in this.connections) {
      var edge = this.connections[i];
      if (this.isInPort && edge.sourcePort === port ||
          !this.isInPort && edge.targetPort === port)
        return "connection already exists";
    }
    var sourceNode = this.isInPort ? port.node : this.node,
        targetNode = this.isInPort ? this.node : port.node;
    if (core.dataflowManager.cycleTest(sourceNode, targetNode))
      return "Cannot make connection that results in cycle";
    return 0; // indicates NO error
  },

  connect: function(edge) {
    this.connections.push(edge);
    if (this.isInPort) {
      // make data reference, for in-multiple this references the last connected pack
      this.pack = edge.sourcePort.pack;
      if (!this.isSingle) { // in-multiple
        this.packs.push(edge.sourcePort.pack);
      }
    }
    edge.sourcePort.pack.changed = true;
    core.dataflowManager.propagate(edge.targetNode);
  },

  disconnect: function(edge) {
    for (var i in this.connections) {
      if (this.connections[i] === edge) {
        this.connections.splice(i, 1);
        if (this.isInPort && !this.isSingle) {
          this.packs.splice(i, 1);  // also remove from packs for in-multiple
        }
        break;
      }
    }
    if (this.isInPort && this.connections.length == 0) {
      this.pack = this.packClass.new();
    }
  },

  setJqview: function(jqview) {
    this.jqview = jqview;

    jqview
      .attr("id", this.id)
      .addClass("ui-widget-content dataflow-port")
      .addClass(this.isInPort ? "dataflow-port-in" : "dataflow-port-out");

    if (this.isConstants)
      jqview.addClass("dataflow-port-constants");

    $("<div></div>")
      .text(this.text)
      .addClass("dataflow-port-icon dataflow-port-icon-"
        + (this.isSingle ? "single" : "multiple"))
      .appendTo(jqview);

    this.prepareInteraction();
  },

  prepareInteraction: function() {
    var port = this,
        node = this.node;
    this.jqview
      .dblclick(function() {
        console.log(port.pack, port.pack.count()); // for debug
      })
      .mouseenter(function(event){
        for (var i in port.connections) {
          core.viewManager.addEdgeHover(port.connections[i]);
        }
      })
      .mouseleave(function(event){
        core.viewManager.clearEdgeHover();
      })
      .mousedown(function(event){
        if(event.which == 3){
          core.interactionManager.contextmenuLock = true;
          var connections = port.connections.concat();
          for(var i in connections) {
            core.dataflowManager.deleteEdge(connections[i]);
          }
        }
      })
      .draggable({
        helper : function() {
          return $("<div></div>");
        },
        start : function(event, ui) {
          core.interactionManager.dragstartHandler({
            type : "port",
            port : port,
            event : event
          });
        },
        drag : function(event, ui) {
          core.interactionManager.dragmoveHandler({
            type : "port",
            port : port,
            event : event
          });
        },
        stop : function(event, ui) {
          core.interactionManager.dragstopHandler({
            type : "port",
            event : event
          });
        }
      })
      .droppable({
        hoverClass : "dataflow-port-hover",
        tolerance : "pointer",
        accept : port.isInPort ? ".dataflow-port-out" : ".dataflow-port-in",
        greedy : true,
        drop : function(event, ui) {
          core.interactionManager.dropHandler({
            type : "port",
            port : port,
            event : event
          });
        }
      });
  }
};

var DataflowPort = Base.extend(extObject);
