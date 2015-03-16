
"use strict";

var extObject = {

  iconName: "value-maker",

  initialize: function(para) {
    DataflowValueMaker.base.initialize.call(this, para);

    this.viewHeight = 40; // height + padding

    this.inPorts = [];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", true)
    ];

    // stored input value
    this.valueString = "";
    this.value = DataflowConstants.new(this.valueString);
    // overwrite with constants
    this.outPorts[0].pack = this.value;

    this.prepare();
  },

  serialize: function() {
    var result = DataflowValueMaker.base.serialize.call(this);
    result.valueString = this.valueString;
    return result;
  },

  deserialize: function(save) {
    DataflowValueMaker.base.deserialize.call(this, save);
    this.setValueString(save.valueString);
  },

  show: function() {

    DataflowValueMaker.base.show.call(this); // call parent settings

    this.jqview
      .removeClass("dataflow-node-shape")
      .addClass("dataflow-node-shape-superflat");

    $("<div><input id='v' style='width:80%'/></div>")
      .prependTo(this.jqview);

    this.jqinput = this.jqview.find("input")
      .addClass("dataflow-input dataflow-input-node");

    var node = this;
    this.jqinput
      .change(function(event) {
        node.setValueString(event.target.value);
      });
  },

  prepareContextMenu: function() {
    DataflowValueMaker.base.prepareContextMenu.call(this);
    this.jqview.contextmenu("showEntry", "details", false);
  },

  setValueString: function(str) {
    if (str == this.valueString)
      return;

    this.valueString = str;
    this.value = DataflowConstants.new(str);
    this.jqinput.val(str);

    $.extend(this.ports["out"].pack, this.value);

    core.dataflowManager.propagate(this);
  }

};

var DataflowValueMaker = DataflowNode.extend(extObject);
