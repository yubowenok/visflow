
"use strict";

var extObject = {

  initialize: function(para) {

    DataflowContainFilter.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "inv", "in-single", true),
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];

    this.value = null;

    this.prepare();
  },

  serialize: function() {
    var result = DataflowContainFilter.base.serialize.call(this);
    return result;
  },

  deserialize: function(save) {
    DataflowContainFilter.base.deserialize.call(this, save);
  },

  show: function() {

    DataflowContainFilter.base.show.call(this); // call parent settings

    $("<div>contains</div>")
      .appendTo(this.jqview);

    $("<div><input id='v' style='width:80%'/></div>")
      .appendTo(this.jqview);

    this.jqview.find("input")
      .prop("disabled", true)
      .addClass("dataflow-input");

    this.value = Infinity;

    this.jqvalue = this.jqview.find("#v")
      .val(this.value);
    /*
    this.jqicon = $("<div></div>")
      .addClass("dataflow-contain-icon")
      .appendTo(this.jqview);
      */
  }

};

var DataflowContainFilter = DataflowFilter.extend(extObject);
