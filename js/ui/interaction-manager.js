
"use strict";

var extobject = {

  initialize: function() {
    // some declarations for clearer structure

    this.mouseMode = "none";  // node, port, selectbox

    this.dragstartPos = [0, 0];
    this.draglastPos = [0, 0];
    this.dragstopPos = [0, 0];
    this.dragstartPara = {};
    this.dragstopPara = {};
    this.dropPossible = false;

    this.mousedownPos = [0, 0];
    this.mouseupPos = [0, 0];
    this.mouselastPos = [0, 0];

    this.jqdataflow = $("#dataflow");
    this.selectbox = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0
    };
    this.prepareInteraction();

    this.shifted = false;
    this.ctrled = false;
  },

  trackMousemove: function(disabled) {
    var manager = this;
    if (disabled) {
      this.jqdataflow.off("mousemove");
    } else {
      this.jqdataflow.mousemove(function(event, ui){
        manager.currentMouseX = event.pageX;
        manager.currentMouseY = event.pageY;
      });
    }
  },

  prepareInteraction: function() {
    this.trackMousemove();

    this.jqselectbox = $("#dataflow-selectbox");
    this.jqselectbox.hide();
    var manager = this;
    this.jqdataflow
      .mousedown(function(event, ui) {
        manager.mousedownHandler({
          type: "background",
          event: event
        });
      })
      .mousemove(function(event, ui) {
        manager.mousemoveHandler({
          type: "background",
          event: event
        });
      })
      .mouseup(function(event, ui) {
        manager.mouseupHandler({
          type: "background",
          event: event
        });
      });

    // track keyboard: shift key
    $(document).keydown(function(event) {
      if (event.keyCode == 16) {
        manager.shifted = true;
      } else if (event.keyCode == 17) {
        manager.ctrled = true;
        manager.jqdataflow.css("cursor", "move");
      }
      return true;
    });
    $(document).keyup(function(event) {
      if (event.keyCode == 16) {
        manager.shifted = false;
      } else if (event.keyCode == 17) {
        manager.ctrled = false;
        manager.jqdataflow.css("cursor", "");
      }
      return true;
    });

  },

  mousedownHandler: function(para) {
    var type = para.type,
        event = para.event;
    this.mousedownPos = [event.pageX, event.pageY];
    this.mouselastPos = [event.pageX, event.pageY];

    if (this.mouseMode != "none")
      return;

    if (type == "background") {
      if (this.ctrled) {
        this.mouseMode = "pan";
      } else {
        this.selectbox.x1 = event.pageX;
        this.selectbox.y1 = event.pageY;
        this.mouseMode = "selectbox";
      }
    } else if (type == "node") {
      this.mouseMode = "node";
    }
  },
  mousemoveHandler: function(para) {
    var type = para.type,
        event = para.event;
    //if (this.mouseMode != type)
    //  return;
    if (type == "background") {
      if (this.mouseMode == "pan") {
        var dx = event.pageX - this.mouselastPos[0],
            dy = event.pageY - this.mouselastPos[1];
        core.dataflowManager.moveNodes(dx, dy, core.dataflowManager.nodes);
      } else if (this.mouseMode == "selectbox") {
        this.selectbox.x2 = event.pageX;
        this.selectbox.y2 = event.pageY;
        var w = Math.abs(this.selectbox.x2 - this.selectbox.x1),
            h = Math.abs(this.selectbox.y2 - this.selectbox.y1),
            l = Math.min(this.selectbox.x1, this.selectbox.x2),
            t = Math.min(this.selectbox.y1, this.selectbox.y2);
        var box = {
            width: w,
            height: h,
            left: l,
            top: t
        };
        this.jqselectbox
          .css(box)
          .show();
        var hovered = core.dataflowManager.getNodesInSelectbox(box);
        core.dataflowManager.clearNodeHover();
        core.dataflowManager.addNodeHover(hovered);
      }
    }
    this.mouselastPos = [event.pageX, event.pageY];
  },
  mouseupHandler: function(para) {
    var type = para.type,
        event = para.event;
    this.mouseupPos = [event.pageX, event.pageY];
    var dx = this.mouseupPos[0] - this.mousedownPos[0],
        dy = this.mousedownPos[1] - this.mousedownPos[1];
    this.mouseMoved = Math.abs(dx) + Math.abs(dy) > 0;

    if (type == "background") {
      if (this.mouseMode == "pan") {
        this.jqdataflow.css("cursor", "");
      } else if (this.mouseMode == "selectbox") {
        this.jqselectbox.hide();
        if (!this.mouseMoved){
          // mouse not moved for select box
          // trigger empty click
          this.clickHandler({
            type: "empty",
            event: event
          });
        } else if (!this.ctrled) {  // not panning, then selecting
          if (!this.shifted)
            core.dataflowManager.clearNodeSelection();
          core.dataflowManager.addHoveredToSelection();
        }
      }
    } else if (type == "node") {
      if (!this.mouseMoved) {
        if (!this.shifted)
          core.dataflowManager.clearNodeSelection();
        core.dataflowManager.addNodeSelection(para.node);
      }
    }
    this.mouseMode = "none";
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
      this.jqdataflow.css("cursor", "move");

      if (core.dataflowManager.isNodeSelected(para.node)) {
        // already selected, then drag all selection
      } else {
        // make a new exclusive selection
        core.dataflowManager.clearNodeSelection();
        core.dataflowManager.addNodeSelection(para.node);
      }
    }
    this.draglastPos = [event.pageX, event.pageY];
  },

  dragmoveHandler: function(para) {
    var type = para.type,
        event = para.event;
    this.dragstopPos = [para.event.pageX, para.event.pageY];
    if (this.mouseMode != type)
      return;
    if (type == "port") {
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
    } else if (type == "node") {
      var dx = event.pageX - this.draglastPos[0],
          dy = event.pageY - this.draglastPos[1];

      // the dragged node is moving together (with more offset)
      // the more offset will be reset immediately by jquery draggable however
      core.dataflowManager.moveNodes(dx, dy, core.dataflowManager.nodesSelected);  // delta & nodes
      this.draglastPos = [event.pageX, event.pageY];
    }
  },

  dragstopHandler: function(para) {
    var type = para.type,
        event = para.event;
    this.dragstopPara = para;
    this.dragstopPos = [para.event.pageX, para.event.pageY];
    if (type == "port") {
      $("#dataflow-edge-drawing")
        .css("visibility", "hidden");
    } else if (type == "node"){
      this.jqdataflow.css("cursor", "");
    }
    this.mouseMode = "none";
  },

  dropHandler: function(para) {
    var type = para.type,
        event = para.event;
    if (type === "port" && this.dropPossible) {
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

  clickHandler: function(para) {
    var type = para.type,
        event = para.event;
    if (type == "empty") {
      core.dataflowManager.clearNodeSelection();
    }
  }

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
