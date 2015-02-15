
"use strict";

var extObject = {

  initialize: function(para) {
    if (para == null)
      console.error("null para passed to DataflowNode.initialize");
    this.nodeid = para.nodeid;

    this.viewHeight = 100;

    // no ports by default
    this.inPorts = [];
    this.outPorts = [];
  },

  setJqview: function(jqview) {
    this.jqview = jqview;
  },

  show: function() {
    this.jqview
      .addClass("dataflow-node dataflow-node-shape ui-widget-content ui-widget")
      .draggable({
        // TODO ... handle?
      });

    // right-click menu
    this.jqview.contextmenu({
      delegate: this.jqview,
      addClass: "ui-contextmenu",
      menu: [
          {title: "Delete", cmd: "copy", uiIcon: "ui-icon-close"},
          /*
          {title: "----"},
          {title: "More", children: [
              {title: "Sub 1", cmd: "sub1"},
              {title: "Sub 2", cmd: "sub1"}
              ]}
              */
          ],
      select: function(event, ui) {
          //alert("select " + ui.cmd + " on " + ui.target.text());
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

    this.showPorts();
  },

  showPorts: function() {
    var node = this;
    var inTopBase = this.viewHeight/2 - this.inPorts.length * 10;
    for (var i in this.inPorts) {
      var port = this.inPorts[i];
      var div = $("<div></div>")
        .addClass("ui-widget-content dataflow-port dataflow-port-in")
        .attr("id", port.id)
        .css("top", inTopBase + i * 20)
        .appendTo(this.jqview);
      $("<div></div>")
        .addClass("dataflow-port dataflow-port-icon-" + port.type)
        .appendTo(div);

      div
        .draggable({
          helper: function(){ return $("<div></div>"); },
          start: function(event, ui) {
            core.interactionManager.dragstartHandler({
              type: "port",
              node: node,
              port: port.id,
              event: event
            });
          },
          drag: function(event, ui) {
            core.interactionManager.dragmoveHandler({
              type: "port",
              node: node,
              port: port.id,
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
          drop: function( event, ui ) {
            console.log("dropped");
          }
        });
    }
    var outTopBase = this.viewHeight/2 - this.outPorts.length * 10;
    for (var i in this.outPorts) {
      var port = this.outPorts[i];
      var div = $("<div></div>")
        .addClass("ui-widget-content dataflow-port dataflow-port-out")
        .attr("id", port.id)
        .css("top", outTopBase + i * 20)
        .appendTo(this.jqview);
      $("<div></div>")
        .addClass("dataflow-port dataflow-port-icon-" + port.type)
        .appendTo(div);

      div
        .draggable({
          helper: function(){ return $("<div></div>"); },
          start: function(event, ui) {
            core.interactionManager.dragstartHandler({
              type: "port",
              node: node,
              port: port.id,
              event: event
            });
          },
          drag: function(event, ui) {
            core.interactionManager.dragmoveHandler({
              type: "port",
              node: node,
              port: port.id,
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
          drop: function( event, ui ) {
            console.log("dropped");
          }
        });
    }
  }
};

var DataflowNode = Base.extend(extObject);
