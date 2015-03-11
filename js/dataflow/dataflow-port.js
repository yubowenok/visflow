
"use strict";

var extObject = {

  initialize: function(node, id, type, isConstants) {

    this.node = node; // parent node

    this.hashtag = "#" + Utils.randomString(8); // for serialization

    this.id = id; // port id corresponding to its parent node
    this.type = type; // in-single, in-multiple, out-single, out-multiple
    this.isInPort = this.type.substr(0, 2) === "in";
    this.isSingle = this.type.match("single") != null;
    this.isConstants = isConstants === true;

    this.connections = []; // to which other ports it is connected (edges)

    this.packClass = this.isConstants ? DataflowConstants : DataflowPackage;
    this.pack = this.packClass.new(); // stored data / constants
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
      return core.viewManager.tip("Cannot make connection that results in cycle");
    return 0;
  },

  connect: function(edge) {
    this.connections.push(edge);
    if (this.isInPort) {
      this.pack = edge.sourcePort.pack; // make data reference
    }
    edge.sourcePort.pack.changed = true;
    core.dataflowManager.propagate(edge.targetNode);
  },

  disconnect: function(edge) {
    for (var i in this.connections) {
      if (this.connections[i] === edge) {
        this.connections.splice(i, 1);
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
      .addClass("dataflow-port-icon dataflow-port-icon-" + this.type)
      .appendTo(jqview);

    this.prepareInteraction();
  },

  prepareInteraction: function() {
    var port = this,
        node = this.node;
    this.jqview
      .dblclick(function() {
        console.log(port.pack, port.connections); // for debug
      })
      .draggable({
        helper : function() {
          return $("<div></div>");
        },
        start : function(event, ui) {
          core.interactionManager.dragstartHandler({
            type : "port",
            node : node,
            portId : event.target.id,
            event : event
          });
        },
        drag : function(event, ui) {
          core.interactionManager.dragmoveHandler({
            type : "port",
            node : node,
            portId : event.target.id,
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
            node : node,
            portId : event.target.id,
            event : event
          });
        }
      });
  }
};

var DataflowPort = Base.extend(extObject);
