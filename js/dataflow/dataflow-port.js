
"use strict";

var extObject = {

  initialize: function(node, id, type) {

    this.node = node; // parent node

    this.id = id; // port id corresponding to its parent node
    this.type = type; // in-single, in-multiple, out-single, out-multiple
    this.isInPort = this.type.substr(0, 2) === "in";

    this.connections = []; // to which other ports it is connected (edges)

    this.data = DataflowData.new(); // stored data
  },

  connect: function(edge) {
    this.connections.push(edge);
    if (this.isInPort)
      this.data = edge.sourcePort.data; // make data reference
  },

  setJqview: function(jqview) {
    this.jqview = jqview;

    jqview
      .attr("id", this.id)
      .addClass("ui-widget-content dataflow-port")
      .addClass(this.isInPort ? "dataflow-port-in" : "dataflow-port-out");

    $("<div></div>")
      .addClass("dataflow-port dataflow-port-icon-" + this.type)
      .appendTo(jqview);

    this.prepareInteraction();
  },

  prepareInteraction: function() {
    var port = this,
        node = this.node;
    this.jqview
      .draggable({
        helper : function() {
          return $("<div></div>");
        },
        start : function(event, ui) {
          core.interactionManager.dragstartHandler({
            type : "port",
            node : node,
            portid : event.target.id,
            event : event
          });
        },
        drag : function(event, ui) {
          core.interactionManager.dragmoveHandler({
            type : "port",
            node : node,
            portid : event.target.id,
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
            portid : event.target.id,
            event : event
          });
        }
      });
  }
};

var DataflowPort = Base.extend(extObject);
