
"use strict";

var extobject = {

  initialize: function() {
    // some declarations for clearer structure
    this.mouseMode = "none";
    this.dragstartPos = [0, 0];
    this.dragstopPos = [0, 0];
    this.dragstartPara = {};
    this.dragstopPara = {};
    this.dropPossible = false;
  },

  trackMousemove: function(disabled) {
    var manager = this;
    if (disabled) {
      $("#dataflow").off("mousemove");
    } else {
      $("#dataflow").mousemove(function(event, ui){
        manager.mousemoveHandler({
          event: event
        });
      });
    }
  },

  mousemoveHandler: function(para) {
  },
  mousedownHandler: function(para) {
  },
  mouseupHandler: function(para) {
  },

  dragstartHandler: function(para) {
    this.dragstartPara = para;
    if (para.type === "port") {
      this.mouseMode = "port";
      var jqtarget = $(para.event.target);
      var x = jqtarget.offset().left + jqtarget.outerWidth() / 2,
          y = jqtarget.offset().top + jqtarget.outerHeight() / 2;
      //console.log(jqtarget,x,y, jqtarget.outerWidth());
      this.dragstartPos = [x, y];
      this.dropPossible = true;
    }
  },
  dragmoveHandler: function(para) {
    this.dragstopPos = [para.event.pageX, para.event.pageY];
    if (this.mouseMode === "port") {
      var dx = this.dragstopPos[0] - this.dragstartPos[0],
          dy = this.dragstopPos[1] - this.dragstartPos[1];

      if (para.portid.substr(0,2) === "in") {
        dx = -dx;
        dy = -dy;
        $("#dataflow-edge-drawing")
          .css("left", this.dragstopPos[0])
          .css("top", this.dragstopPos[1]);
      } else {
        $("#dataflow-edge-drawing")
        .css("left", this.dragstartPos[0])
        .css("top", this.dragstartPos[1]);
      }
      var length = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.atan2(dy, dx);
      //console.log(angle);
      $("#dataflow-edge-drawing")
        .css("width", length)
        .css("transform", "rotate("+ angle +"rad)")
        .css("visibility", "visible");
    }
  },
  dragstopHandler: function(para) {
    this.dragstopPara = para;
    this.dragstopPos = [para.event.pageX, para.event.pageY];
    if (para.type === "port") {
      this.mouseMode = "none";
      $("#dataflow-edge-drawing")
        .css("visibility", "hidden");
    }
  },

  dropHandler: function(para) {
    if (para.type === "port" && this.dropPossible) {
      // connect ports
      var port1 = {
        node: this.dragstartPara.node,
        portid: this.dragstartPara.portid,
      };
      var port2 = {
        node: para.node,
        portid: para.portid
      };
      if (port1.portid.substr(0,2) === "in") {
        // always connect from out to in
        var porttmp = port1;
        port1 = port2;
        port2 = porttmp;
      }
      core.dataflowManager.createEdge(port1, port2, para.event);
      this.dropPossible = false; // prevent dropped on overlapping droppable
    }
  },

/*
  getDragstartPara: function() {
    return this.dragstartPara;
  },
  getDragstopPara: function() {
    return this.dragstopPara;
  }
  */
};

var InteractionManager = Base.extend(extobject);
