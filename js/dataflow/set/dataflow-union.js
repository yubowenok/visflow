
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowSet.initialize.call(this, para);

    this.viewHeight = 50;

    this.inPorts = [
      {
        id: "ina",
        type: "in-single"
      },
      {
        id: "inb",
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

    DataflowSet.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-union-icon")
      .appendTo(this.jqview);
  }

};

var DataflowUnion = DataflowSet.extend(extObject);
