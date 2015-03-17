
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

    var jqview = this.jqview;
    this.jqview
      .mouseover(function(event) {
        // make a shadow
        jqview.children(".dataflow-edge-segment").clone()
          .appendTo("#dataflow")
          .addClass("dataflow-edge-segment-hover dataflow-edge-clone");
        jqview.children().clone()
          .appendTo("#dataflow")
          .addClass("dataflow-edge-clone");
        edge.sourcePort.jqview
          .clone()
          .appendTo("#dataflow")
          .addClass("dataflow-edge-clone")
          .css(edge.sourcePort.jqview.offset());
        edge.targetPort.jqview
          .clone()
          .appendTo("#dataflow")
          .addClass("dataflow-edge-clone")
          .css(edge.targetPort.jqview.offset());
      })
      .mouseout(function(event) {
        core.viewManager.clearEdgeHover();
      });
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

    var hseg = 3,
        hArrow = 9,
        wArrow = 25;
    var topOffset = {
      up: wArrow,
      down: -wArrow - 5
    };
    // edge segment has height, the anchor point is considered to be
    // at the middle of the segment, we need to shift this biase when computing position
    sx -= hseg / 2;
    ex -= hseg / 2;
    sy -= hseg / 2;
    ey -= hseg / 2;
    var yDir = ey > sy ? "down" : "up";
    var yAngle = Math.atan2(ey - sy, 0);
    if (ex >= sx) {
      var headWidth = Math.max(0, (ex - sx) / 2 - wArrow);
      var head = $("<div></div>")
        .appendTo(this.jqview)
        .addClass("dataflow-edge-segment")
        .css({
          width: headWidth + hseg / 2,
          left: sx,
          top: sy
        });

      var tailWidth = ex - sx - headWidth;
      if (tailWidth < wArrow && Math.abs(ey - sy) >= wArrow) {
        // tail too short, and sufficient y space
        headWidth = ex - sx;
        // go right and then up
        if (head)
          head.css("width", headWidth);
        $("<div></div>")
          .appendTo(this.jqview)
          .addClass("dataflow-edge-segment")
          .css({
            width: Math.abs(ey - sy) + hseg / 2,
            left: sx + headWidth,
            top: sy,
            transform: "rotate(" + yAngle + "rad)"
          });
        this.jqarrow.css({
          left: ex + hseg / 2,
          top: ey + topOffset[yDir],
          transform: "rotate(" + yAngle + "rad)"
        });
      } else {
        // go right, up, then right
        $("<div></div>")
          .appendTo(this.jqview)
          .addClass("dataflow-edge-segment")
          .css({
            width: Math.abs(ey - sy) + hseg / 2,
            left: sx + headWidth,
            top: sy,
            transform: "rotate(" + Math.atan2(ey - sy, 0) + "rad)"
          });
        $("<div></div>")
          .appendTo(this.jqview)
          .addClass("dataflow-edge-segment")
          .css({
            width: ex - sx - headWidth + hseg / 2,
            left: sx + headWidth,
            top: ey
          });
        this.jqarrow.css({
          left: ex - wArrow,
          top: ey + hseg / 2 - hArrow / 2,
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
          width: headWidth + hseg / 2,
          left: sx,
          top: sy,
          transform: "rotate(" + Math.atan2(midy - sy, 0) + "rad)"
        });
      $("<div></div>")
        .appendTo(this.jqview)
        .addClass("dataflow-edge-segment")
        .css({
          width: Math.abs(ex - sx) + hseg / 2,
          left: sx,
          top: midy,
          transform: "rotate(" + Math.atan2(0, ex - sx) + "rad)"
        });
      var tailWidth = Math.abs(ey - midy);
      $("<div></div>")
        .appendTo(this.jqview)
        .addClass("dataflow-edge-segment")
        .css({
          width: tailWidth + hseg / 2,
          left: ex,
          top: midy,
          transform: "rotate(" + Math.atan2(ey - midy, 0) + "rad)"
        });
      this.jqarrow.css({
        left: ex + hseg / 2,
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
