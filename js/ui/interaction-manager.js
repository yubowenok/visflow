
"use strict";

var extobject = {

  initialize: function() {
    // some declarations for clearer structure

    this.mouseMode = "none";  // node, port, selectbox

    this.dragstartPos = [0, 0];
    this.dragstopPos = [0, 0];
    this.dragstartPara = {};
    this.dragstopPara = {};
    this.dropPossible = false;

    this.selectbox = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0
    };
    this.prepareSelectbox();
  },

  trackMousemove: function(disabled) {
    var manager = this;
    if (disabled) {
      $("#dataflow").off("mousemove");
    } else {
      $("#dataflow").mousemove(function(event, ui){
        manager.currentMouseX = event.pageX;
        manager.currentMouseY = event.pageY;
        manager.mousemoveHandler({
          event: event
        });
      });
    }
  },

  prepareSelectbox: function() {
    this.jqselectbox = $("#dataflow-selectbox");
    this.jqselectbox.hide();
    var manager = this;
    $("#dataflow")
      .mousedown(function(event, ui) {
        manager.mousedownHandler({
          type: "selectbox",
          event: event
        });
        event.preventDefault();
      })
      .mousemove(function(event, ui) {
        manager.mousemoveHandler({
          type: "selectbox",
          event: event
        });
        event.preventDefault();
      })
      .mouseup(function(event, ui) {
        manager.mouseupHandler({
          type: "selectbox",
          event: event
        });
        event.preventDefault();
      });
  },
  mousedownHandler: function(para) {
    var type = para.type,
        event = para.event;
    if (type == "selectbox" && this.mouseMode == "none") {
      this.selectbox.x1 = event.pageX;
      this.selectbox.y1 = event.pageY;
      this.jqselectbox
        .css({
          width: 0,
          height: 0
        })
        .show();
      this.mouseMode = "selectbox";
    }
  },
  mousemoveHandler: function(para) {
    var type = para.type,
        event = para.event;
    if (type == "selectbox" && this.mouseMode == "selectbox") {
      this.selectbox.x2 = event.pageX;
      this.selectbox.y2 = event.pageY;
      var w = Math.abs(this.selectbox.x2 - this.selectbox.x1),
          h = Math.abs(this.selectbox.y2 - this.selectbox.y1),
          l = Math.min(this.selectbox.x1, this.selectbox.x2),
          t = Math.min(this.selectbox.y1, this.selectbox.y2);
      this.jqselectbox
        .css({
          width: w,
          height: h,
          left: l,
          top: t
        });
    }
  },
  mouseupHandler: function(para) {
    var type = para.type,
        event = para.event;
    if (type == "selectbox") {
      this.jqselectbox.hide();
      this.mouseMode = "none";
    }
  },

  dragstartHandler: function(para) {
    var type = para.type,
        event = para.event;
    this.dragstartPara = para;
    if (type == "port") {
      this.mouseMode = "port";
      var jqtarget = $(para.event.target);
      var x = jqtarget.offset().left + jqtarget.outerWidth() / 2,
          y = jqtarget.offset().top + jqtarget.outerHeight() / 2;
      //console.log(jqtarget,x,y, jqtarget.outerWidth());
      this.dragstartPos = [x, y];
      this.dropPossible = true;
    } else if (type == "node") {
      this.mouseMode = "node";
    }
  },

  dragmoveHandler: function(para) {
    var type = para.type,
        event = para.event;
    this.dragstopPos = [para.event.pageX, para.event.pageY];
    if (type == "port" && this.mouseMode == "port") {
      var dx = this.dragstopPos[0] - this.dragstartPos[0],
          dy = this.dragstopPos[1] - this.dragstartPos[1];

      if (para.portId.substr(0,2) === "in") {
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
    var type = para.type,
        event = para.event;
    this.dragstopPara = para;
    this.dragstopPos = [para.event.pageX, para.event.pageY];
    if (type == "port") {
      this.mouseMode = "none";
      $("#dataflow-edge-drawing")
        .css("visibility", "hidden");
    } else if (type == "node"){
      this.mouseMode = "none";
    }
  },

  dropHandler: function(para) {
    if (para.type === "port" && this.dropPossible) {
      // connect ports
      var port1 = {
        node: this.dragstartPara.node,
        portId: this.dragstartPara.portId,
      };
      var port2 = {
        node: para.node,
        portId: para.portId
      };
      if (port1.portId.substr(0,2) === "in") {
        // always connect from out to in
        var porttmp = port1;
        port1 = port2;
        port2 = porttmp;
      }
      core.dataflowManager.createEdge(port1, port2);
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
