
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
        left: core.interactionManager.currentMouseX,
        top: core.interactionManager.currentMouseY
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

  }
};

var ViewManager = Base.extend(extObject);
