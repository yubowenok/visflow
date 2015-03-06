
"use strict";

var extObject = {

  initialize: function(node, id, type, isConstants) {

    this.node = node; // parent node

    this.id = id; // port id corresponding to its parent node
    this.type = type; // in-single, in-multiple, out-single, out-multiple
    this.isInPort = this.type.substr(0, 2) === "in";

    this.connections = []; // to which other ports it is connected (edges)

    this.packClass = isConstants ? DataflowConstants : DataflowPackage;
    this.pack = this.packClass.new(); // stored data / constants
  },

  connect: function(edge) {
    this.connections.push(edge);
    if (this.isInPort) {
      this.pack = edge.sourcePort.pack; // make data reference
    }
    edge.sourcePort.pack.changed = true;
    core.dataflowManager.propagate(edge.sourceNode);
  },

  disconnect: function(edge) {
    for (var i in this.connections) {
      if (this.connections[i] === edge) {
        this.connections.splice(i, 1);
        break;
      }
    }
    if (this.isInPort && this.connections.length === 0) {
      this.pack = this.packClass.new();
    }
  },

  setJqview: function(jqview) {
    this.jqview = jqview;

    jqview
      .attr("id", this.id)
      .addClass("ui-widget-content dataflow-port")
      .addClass(this.isInPort ? "dataflow-port-in" : "dataflow-port-out");

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
        console.log(typeof(port.pack), port.pack); // for debug
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
