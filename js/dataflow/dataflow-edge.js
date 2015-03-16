
"use strict";

var extObject = {
  initialize: function(para) {
    if (para == null)
      return console.error("null para passed to DataflowEdge.initialize");

    this.edgeId = para.edgeId;
    this.sourceNode = para.sourceNode;
    this.sourcePort = para.sourcePort;
    this.targetNode = para.targetNode;
    this.targetPort = para.targetPort;
  },

  serialize: function() {
    var result = {
      edgeId: this.edgeId,
      sourceNodeHash: this.sourceNode.hashtag,
      targetNodeHash: this.targetNode.hashtag,
      sourcePortId: this.sourcePort.id,
      targetPortId: this.targetPort.id
    };
    return result;
  },

  setJqview: function(jqview) {
    this.jqview = jqview;
    this.jqview.addClass("dataflow-edge");
  },

  show: function() {
    this.jqarrow = $("<div></div>")
      .addClass("dataflow-edge-arrow")
      .appendTo(this.jqview);

    // right-click menu
    var edge = this;
    this.jqview.contextmenu({
      delegate: this.jqview,
      addClass: "ui-contextmenu",
      menu: [
          {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"},
          ],
      select: function(event, ui) {
         if (ui.cmd === "delete") {
          core.dataflowManager.deleteEdge(edge);
        }
      },
      beforeOpen: function(event, ui) {
        if (core.interactionManager.contextmenuLock)
          return false;
        core.interactionManager.contextmenuLock = true;
      },
      close: function(event, ui) {
        core.interactionManager.contextmenuLock = false;
      }
    });

    this.update();
  },

  update: function() {
    var sx = this.sourcePort.jqview.offset().left + this.sourcePort.jqview.width() / 2,
        sy = this.sourcePort.jqview.offset().top + this.sourcePort.jqview.height() / 2,
        ex = this.targetPort.jqview.offset().left + this.targetPort.jqview.width() / 2,
        ey = this.targetPort.jqview.offset().top + this.targetPort.jqview.height() / 2,
        dx = ex - sx,
        dy = ey - sy;

    // draw edges in 2 or 3 segments, hacky...

    //var length = Math.sqrt(dx * dx + dy * dy);
    //var angle = Math.atan2(dy, dx);
    this.jqview.children().not(".dataflow-edge-arrow").remove();

    var topOffset = {
      up: 20,
      down: -27
    };
    var yDir = ey > sy ? "down" : "up";
    var yAngle = Math.atan2(ey - sy, 0);
    if (ex >= sx) {
      var headWidth = Math.max(0, (ex - sx) / 2 - 25);
      var head = $("<div></div>")
        .appendTo(this.jqview)
        .addClass("dataflow-edge-segment")
        .css({
          width: headWidth,
          left: sx,
          top: sy
        });

      var tailWidth = ex - sx - headWidth;
      if (tailWidth < 25 && Math.abs(ey - sy) >= 25) {
        // tail too short, and sufficient y space
        headWidth = ex - sx;
        // go right and then up
        if (head)
          head.css("width", headWidth);
        $("<div></div>")
          .appendTo(this.jqview)
          .addClass("dataflow-edge-segment")
          .css({
            width: Math.abs(ey - sy),
            left: sx + headWidth,
            top: sy,
            transform: "rotate(" + yAngle + "rad)"
          });
        this.jqarrow.css({
          left: ex,
          top: ey + topOffset[yDir],
          transform: "rotate(" + yAngle + "rad)"
        });
      } else {
        // go right, up, then right
        $("<div></div>")
          .appendTo(this.jqview)
          .addClass("dataflow-edge-segment")
          .css({
            width: Math.abs(ey - sy),
            left: sx + headWidth,
            top: sy,
            transform: "rotate(" + Math.atan2(ey - sy, 0) + "rad)"
          });
        $("<div></div>")
          .appendTo(this.jqview)
          .addClass("dataflow-edge-segment")
          .css({
            width: ex - sx - headWidth,
            left: sx + headWidth,
            top: ey
          });
        this.jqarrow.css({
          left: ex - 24,
          top: ey - 3,
          transform: ""
        });
      }
    }
    else {  // ex < ey
      var midy;
      var sourceYrange = [
          this.sourceNode.jqview.offset().top,
          this.sourceNode.jqview.offset().top + this.sourceNode.jqview.outerHeight()
        ],
          targetYrange = [
          this.targetNode.jqview.offset().top,
          this.targetNode.jqview.offset().top + this.targetNode.jqview.outerHeight()
        ];
      if ( sourceYrange[0] <= targetYrange[1] &&
           sourceYrange[1] >= targetYrange[0] ) {
         // two nodes have intersecting y range, get around
         if (yDir == "up") {
           midy = targetYrange[0] - 20; // up is from human view (reversed screen coordinate)
         } else {
           midy = targetYrange[1] + 20;
         }
      } else {
        midy = (Math.max(sourceYrange[0], targetYrange[0])
        + Math.min(sourceYrange[1], targetYrange[1]))/2;
      }
      // 2 turns
      var headWidth = Math.abs(midy - sy);
      $("<div></div>")
        .appendTo(this.jqview)
        .addClass("dataflow-edge-segment")
        .css({
          width: headWidth,
          left: sx,
          top: sy,
          transform: "rotate(" + Math.atan2(midy - sy, 0) + "rad)"
        });
      $("<div></div>")
        .appendTo(this.jqview)
        .addClass("dataflow-edge-segment")
        .css({
          width: Math.abs(ex - sx),
          left: sx,
          top: midy,
          transform: "rotate(" + Math.atan2(0, ex - sx) + "rad)"
        });
      var tailWidth = Math.abs(ey - midy);
      $("<div></div>")
        .appendTo(this.jqview)
        .addClass("dataflow-edge-segment")
        .css({
          width: tailWidth,
          left: ex,
          top: midy,
          transform: "rotate(" + Math.atan2(ey - midy, 0) + "rad)"
        });
      this.jqarrow.css({
        left: ex,
        top: ey + topOffset[ey > midy ? "down" : "up"],
        transform: "rotate(" + Math.atan2(ey - midy, 0) + "rad)"
      });
    }

    this.jqarrow.appendTo(this.jqview); // re-append to appear on top
    //.css("transform", "rotate(" + angle + "rad)");
  },

  hide: function() {
    this.jqview.children().remove();
    core.viewManager.removeEdgeView(this.jqview);
  }

};

var DataflowEdge = Base.extend(extObject);
