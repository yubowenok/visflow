
"use strict";

var extobject = {

  initialize: function() {
    // some declarations for clearer structure
    this.mouseMode = "none";
    this.dragstartPos = [0, 0];
    this.dragendPos = [0, 0];
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
    if (para.type === "port") {
      this.mouseMode = "port";
      var jqtarget = $(para.event.target);
      var x = jqtarget.offset().left - $("body").offset().left + jqtarget.outerWidth() / 2,
          y = jqtarget.offset().top - $("body").offset().top + jqtarget.outerHeight() / 2;
      //console.log(jqtarget,x,y, jqtarget.outerWidth());
      this.dragstartPos = [x, y];
      $("#dataflow-edge-drawing")
        .css("left", this.dragstartPos[0])
        .css("top", this.dragstartPos[1])
        .css("visibility", "visible");
    }
  },
  dragmoveHandler: function(para) {
    this.dragendPos = [para.event.pageX, para.event.pageY];
    if (this.mouseMode === "port") {
      var dx = this.dragendPos[0] - this.dragstartPos[0],
          dy = this.dragendPos[1] - this.dragstartPos[1];
      var length = Math.sqrt(dx*dx + dy*dy);
      var angle = Math.atan2(dy, dx);
      //console.log(angle);
      $("#dataflow-edge-drawing")
        .css("width", length)
        .css("transform", "rotate("+ angle +"rad)");
    }
  },
  dragstopHandler: function(para) {
    this.dragendPos = [para.event.pageX, para.event.pageY];
    if (para.type === "port") {
      this.mouseMode = "none";
    }
  }
};

var InteractionManager = Base.extend(extobject);
