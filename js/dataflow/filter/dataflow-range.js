
"use strict";

var extObject = {

  initialize: function(para) {
    this.base.initialize.call(this, para);
    this.inPorts = [
      {
        id: "inv1",
        type: "in-single"
      },
      {
        id: "inv2",
        type: "in-single"
      },
      {
        id: "in",
        type: "in-single"
      }
    ];
    this.outPorts = [
      {
        id: "out",
        type: "out-multiple"
      }
    ];

    this.prepare();
  },


  show: function() {

    this.base.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-range-icon")
      .appendTo(this.jqview);
  }

};

var DataflowRangeFilter = DataflowNode.extend(extObject);
