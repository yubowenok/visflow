
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
  },

  show: function() {
    $("<div></div>")
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

    var length = Math.sqrt(dx * dx + dy * dy);
    var angle = Math.atan2(dy, dx);
    this.jqview
      .addClass("dataflow-edge")
      .css("width", length)
      .css("left", sx)
      .css("top", sy)
      .css("transform", "rotate(" + angle + "rad)");
  },

  hide: function() {
    $(this.jqview).children().remove();
    core.viewManager.removeEdgeView(this.jqview);
  }

};

var DataflowEdge = Base.extend(extObject);
