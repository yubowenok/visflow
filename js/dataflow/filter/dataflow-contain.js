
"use strict";

var extObject = {

  initialize: function(para) {

    DataflowContainFilter.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "inv", "in-single"),
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];

    this.prepare();
  },

  show: function() {

    DataflowContainFilter.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-contain-icon")
      .appendTo(this.jqview);
  }

};

var DataflowContainFilter = DataflowFilter.extend(extObject);
