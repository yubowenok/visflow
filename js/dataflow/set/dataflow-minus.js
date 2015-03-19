
"use strict";

var extObject = {

  iconName: "minus",

  initialize: function(para) {
    DataflowMinus.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "inx", "in-single", "D"), // to be subtract from
      DataflowPort.new(this, "in", "in-multiple", "D") // to subtract
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];

    this.prepare();
  },

  show: function() {
    DataflowMinus.base.show.call(this); // call parent settings
    this.showIcon();
  },

  process: function() {
    var xpack = this.ports["inx"].pack,
        inpacks = this.ports["in"].packs,
        outpack = this.ports["out"].pack;

    outpack.copy(xpack);  // pick the X pack, potentially empty

    if (inpacks.length == 0 || xpack.isEmpty()) {
      // nothing to minus
      return;
    }

    for (var i in inpacks) {
      var inpack = inpacks[i];
      if (!outpack.data.matchDataFormat(inpack.data))
        return console.error("cannot make intersection of two different types of datasets");

      for (var index in inpack.items) {
        if (outpack.items[index] != null) {
          delete outpack.items[index];
        }
      }
    }
  }
};

var DataflowMinus = DataflowSet.extend(extObject);
