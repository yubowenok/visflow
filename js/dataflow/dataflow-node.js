
"use strict";

var extObject = {

  initialize: function(para) {
    if (para == null)
      return console.error("null para passed to DataflowNode.initialize");
    this.nodeId = para.nodeId;

    this.hashtag = "#" + Utils.randomString(8); // for debug

    this.viewHeight = 100;
    this.portHeight = 20;
    this.portGap = 4;

    // no ports by default
    this.inPorts = [];
    this.outPorts = [];
    this.ports = {};
  },

  // prepares all necessary data structures for references
  // called after initialize
  prepare: function() {
    this.preparePorts();
  },

  preparePorts: function() {
    var allports = this.inPorts.concat(this.outPorts);
    for (var i in allports) {
      this.ports[allports[i].id] = allports[i];
    }
  },

  setJqview: function(jqview) {
    this.jqview = jqview;
    jqview.addClass(this.hashtag);
  },

  show: function() {

    // this removes anything created (including those from inheriting classes)
    // inheriting classes shall not remove again
    this.jqview.children().remove();

    var node = this;
    this.jqview
      .addClass("dataflow-node dataflow-node-shape ui-widget-content ui-widget")
      .draggable({
        drag: function(event, ui) {
          node.updateEdges();
        }
      });

    var nodeId = this.nodeId;
    this.jqview.mousedown(function(event){
      if (event.which === 1) // left click
        core.dataflowManager.activateNode(nodeId);
      else if (event.which === 3)
        $(".ui-contextmenu")
          .css("z-index", core.viewManager.getTopZindex() + 1); // over other things
    });

    this.prepareContextMenu();
    this.showPorts();
  },

  prepareContextMenu: function() {
    var node = this;
    // right-click menu
    this.jqview.contextmenu({
      delegate: this.jqview,
      addClass: "ui-contextmenu",
      menu: [
          {title: "Delete", cmd: "delete", uiIcon: "ui-icon-close"},
          /*
          {title: "----"},
          {title: "More", children: [
              {title: "Sub 1", cmd: "sub1"},
              {title: "Sub 2", cmd: "sub1"}
              ]}
              */
          ],
      select: function(event, ui) {
        if (ui.cmd === "delete") {
          core.dataflowManager.deleteNode(node);
        }
        //alert("select " + ui.cmd + " on " + ui.target.text());
      }
    });
  },

  updateEdges: function() {
    for (var key in this.ports) {
      var port = this.ports[key];
      for (var i in port.connections) {
        var edge = port.connections[i];
        edge.update();
      }
    }
  },

  showPorts: function() {
    this.jqview.find(".dataflow-port").remove();

    console.log(this.viewHeight);

    var portStep = this.portHeight + this.portGap;
    var node = this;
    var inTopBase = (this.viewHeight - this.inPorts.length * portStep + this.portGap) / 2;
    for (var i in this.inPorts) {
      var port = this.inPorts[i];
      var jqview = $("<div></div>")
        .css("top", inTopBase + i * portStep)
        .appendTo(this.jqview);
      port.setJqview(jqview);
    }
    var outTopBase = (this.viewHeight - this.outPorts.length * portStep + this.portGap) / 2;
    for (var i in this.outPorts) {
      var port = this.outPorts[i];
      var jqview = $("<div></div>")
        .css("top", outTopBase + i * portStep)
        .appendTo(this.jqview);
      port.setJqview(jqview);
    }
  },

  updatePorts: function() {
      var node = this;
      var portStep = this.portHeight + this.portGap;
      var inTopBase = (this.viewHeight - this.inPorts.length * portStep + this.portGap) / 2;
      for (var i in this.inPorts) {
        var port = this.inPorts[i];
        port.jqview
          .css("top", inTopBase + i * portStep);
        for (var j in port.connections) {
          port.connections[j].update();
        }
      }
      var outTopBase = (this.viewHeight - this.outPorts.length * portStep + this.portGap) / 2;
      for (var i in this.outPorts) {
        var port = this.outPorts[i];
        port.jqview
          .css("top", outTopBase + i * portStep);
        for (var j in port.connections) {
          port.connections[j].update();
        }
      }
  },

  hide: function() {
    $(this.jqview).children().remove();
  },

  inPortsChanged: function() {
    for (var i in this.inPorts) {
      if (this.inPorts[i].pack.changed)
        return true;
    }
    return false;
  },

  update: function() {
    if (!this.inPortsChanged())
        return; // everything not changed, do not process
    console.log("process " + this.hashtag);

    this.process();
    this.show();

    for (var i in this.outPorts) {
      this.outPorts[i].pack.changed = true; // mark changes
    }
  },

  process: function() {
    // process input data and generate output
    // write this function in inheritting classes
  }

};

var DataflowNode = Base.extend(extObject);

