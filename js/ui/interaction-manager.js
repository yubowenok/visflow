
"use strict";

var extobject = {

  initialize: function() {
    // some declarations for clearer structure
    this.mouseMode = "none";
    this.dragstartPos = [0, 0];
    this.dragstopPos = [0, 0];
    this.dragstartPara = {};
    this.dragstopPara = {};
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
      $("#dataflow-edge-drawing")
        .css("left", this.dragstartPos[0])
        .css("top", this.dragstartPos[1])
        .css("visibility", "visible");
    }
  },
  dragmoveHandler: function(para) {
    this.dragstopPos = [para.event.pageX, para.event.pageY];
    if (this.mouseMode === "port") {
      var dx = this.dragstopPos[0] - this.dragstartPos[0],
          dy = this.dragstopPos[1] - this.dragstartPos[1];
      var length = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.atan2(dy, dx);
      //console.log(angle);
      $("#dataflow-edge-drawing")
        .css("width", length)
        .css("transform", "rotate("+ angle +"rad)");
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

  getDragstartPara: function() {
    return this.dragstartPara;
  },
  getDragstopPara: function() {
    return this.dragstopPara;
  }
};

var InteractionManager = Base.extend(extobject);
