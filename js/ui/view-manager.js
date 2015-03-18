
"use strict";

var extObject = {

  initialize: function() {
    this.topZindex = 0;
  },

  showPanel: function() {
    var jqview = $("<div></div>").appendTo("body");
    this.panel = Panel.new({
      jqview: jqview,
      id: "panel"
    });
    this.panel.show();
  },

  hidePanel: function() {
    this.panel.close();
  },

  createNodeView: function(para) {
    if (para == null)
      para = {};
    var jqview = $("<div></div>")
      .appendTo("#dataflow");
    jqview.css(para);
    return jqview;
  },

  createEdgeView: function(para) {
    if(para == null)
      para = {};
    var jqview = $("<div></div>")
      .appendTo("#dataflow-edges");
    jqview.css(para);
    return jqview;
  },

  removeNodeView: function(jqview) {
    $(jqview).remove();
  },

  removeEdgeView: function(jqview) {
    $(jqview).remove();
  },

  clearDataflowViews: function() {
    $(".dataflow-node").remove();
    $("#dataflow-edges").children().remove();
    // after this, nodes and edges cannot reuse their jqview
  },

  clearEdgeHover: function() {
    $("#dataflow").find(".dataflow-edge-clone")
      .remove();
  },

  hideColorpickers: function() {
    $(".iris-picker").hide();
  },

  bringFrontView: function(jqview) {
    jqview
      .css("z-index", ++this.topZindex);
  },

  getTopZindex: function() {
    return this.topZindex;
  },

  tip: function(text, csspara) {
    // csspara is the css object to define the tip's position, style, etc
    if (csspara == null)
      // by default show at mouse cursor
      csspara = {
        left: core.interactionManager.currentMouseX + 5,
        top: core.interactionManager.currentMouseY + 5
      };

    $("<div></div>")
      .addClass("tip-mouse ui-tooltip ui-tooltip-content")
      .text(text)
      .css(csspara)
      .appendTo("body")
      .delay(1000)
      .animate({
        opacity: 0
      }, 500, function() {
        $(this).remove();
      });
  },

  // check if two rectangular boxes intersect
  intersectBox: function(box1, box2) {
    var x1l = box1.left,
        x1r = box1.left + box1.width,
        y1l = box1.top,
        y1r = box1.top + box1.height;
    var x2l = box2.left,
        x2r = box2.left + box2.width,
        y2l = box2.top,
        y2r = box2.top + box2.height;
    return x1l <= x2r && x2l <= x1r && y1l <= y2r && y2l <= y1r;
  }
};

var ViewManager = Base.extend(extObject);
