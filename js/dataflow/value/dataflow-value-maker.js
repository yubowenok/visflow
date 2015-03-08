
"use strict";

var extObject = {

  initialize: function(para) {
    this.base.initialize.call(this, para);

    this.viewHeight = 40; // height + padding

    this.inPorts = [];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", true)
    ];

    // overwrite with constants
    this.outPorts[0].pack = DataflowConstants.new();

    this.prepare();
  },

  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-superflat");

    this.jqinput = $("<div><input id='v' style='width:80%'/></div>")
      .prependTo(this.jqview);

    this.jqinput.find("input")
      .addClass("dataflow-input");

    var node = this;
    this.jqinput
      .change(function(event) {

        $.extend(true, node.outPorts[0].pack, DataflowConstants.new(event.target.value));

        core.dataflowManager.propagate(node);

      });
    /*
    this.jqicon = $("<div></div>")
      .addClass("dataflow-value-maker-icon")
      .appendTo(this.jqview);
      */
  }

};

var DataflowValueMaker = DataflowNode.extend(extObject);
