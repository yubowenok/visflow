
"use strict";

var extObject = {

  iconName: "range",

  initialize: function(para) {

    DataflowRangeFilter.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "inv1", "in-single", "V", true),
      DataflowPort.new(this, "inv2", "in-single", "V", true),
      DataflowPort.new(this, "in", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];

    this.value1 = null;
    this.value2 = null;

    this.prepare();
  },

  serialize: function() {
    var result = DataflowRangeFilter.base.serialize.call(this);
    return result;
  },

  deserialize: function(save) {
    DataflowRangeFilter.base.deserialize.call(this, save);
  },

  show: function() {

    DataflowRangeFilter.base.show.call(this); // call parent settings

    $("<div>on</div>")
      .prependTo(this.jqview);

    $("<div>[ <input id='v1' style='width:40%'/> , " +
    "<input id='v2' style='width:40%'/> ]</div>")
      .prependTo(this.jqview);

    var node = this;
    this.jqview.find("input").not(".select2-input")
      .prop("disabled", true)
      .addClass("dataflow-input dataflow-input-node");

    this.jqvalue1 = this.jqview.find("#v1")
      .val(this.value1 ? this.value1 : this.nullValueString);
    this.jqvalue2 = this.jqview.find("#v2")
      .val(this.value2 ? this.value2 : this.nullValueString);
  },

  process: function() {

    var pack1 = this.ports["inv1"].pack,
        pack2 = this.ports["inv2"].pack;

    if (pack1.type !== "constants" || pack2.type !== "constants")
      return console.error("data connected to constants ports");

    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;
    if (inpack.isEmpty() || this.dimension == null) {
      outpack.copy(inpack);
      return;
    }

    if (this.lastDataId != inpack.data.dataId) {
      this.dimension = 0;
      this.lastDataId = inpack.data.dataId;
    }

    // TODO promote constant type?
    if (pack1.constantType !== "empty" && pack2.constantType !== "empty" &&
        pack1.constantType !== pack2.constantType)
      return core.viewManager.tip(
        "different constant types passed to range filter", this.jqview.offset());

    this.value1 = pack1.getOne();
    this.value2 = pack2.getOne();

    if (this.value1 != null && this.value2 != null && this.value1 > this.value2) {
      this.value1 = this.value2 = null;
      core.viewManager.tip("value1 > value2 in range filter", this.jqview.offset());
    }

    //console.log("filter process", this.value1, this.value2);

    this.jqvalue1.val(this.value1 ? this.value1 : this.nullValueString);
    this.jqvalue2.val(this.value2 ? this.value2 : this.nullValueString);

    if (inpack.data.dataId != this.lastDataId) {
      this.lastDataId = inpack.data.dataId;
      this.dimension = inpack.isEmpty() ? null : 0;
    }

    // do the actual filtering
    this.filter();
  },

  filter: function() {
    // slow implementation: linear scan
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data,
        dim = parseInt(this.dimension);

    var result = [];
    for (var index in items) {
      var value = data.values[index][dim],
          ok = 1;
      if (this.value1 && value < this.value1 || this.value2 && value > this.value2)
        ok = 0;
      if (ok) {
        result.push(index);
      }
    }
    var outpack = this.ports["out"].pack;
    outpack.copy(inpack);
    outpack.filter(result);
  }

};

var DataflowRangeFilter = DataflowFilter.extend(extObject);
