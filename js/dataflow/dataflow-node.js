
"use strict";

var extObject = {

  initialize: function(para) {
    if (para == null)
      console.error("null para passed to DataflowNode.initialize");
    this.nodeid = para.nodeid;
  },

  setJqview: function(jqview) {
    this.jqview = jqview;
  },

  show: function() {
    this.jqview
      .addClass("dataflow-node dataflow-node-shape ui-widget-content ui-widget")
      .draggable({
        // TODO ... handle?
      });

    // right-click menu
    this.jqview.contextmenu({
      delegate: this.jqview,
      menu: [
          {title: "Delete", cmd: "copy", uiIcon: "ui-icon-close"},
          /*
          {title: "----"},
          {title: "More", children: [
              {title: "Sub 1", cmd: "sub1"},
              {title: "Sub 2", cmd: "sub1"}
              ]}
              */
          ],
      select: function(event, ui) {
          //alert("select " + ui.cmd + " on " + ui.target.text());
      }
    });

    var nodeid = this.nodeid;
    this.jqview.mousedown(function(){
      core.dataflowManager.activateNode(nodeid);
    });
  }
};

var DataflowNode = Base.extend(extObject);
