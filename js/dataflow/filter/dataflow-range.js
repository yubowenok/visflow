
"use strict";

var extObject = {

  iconClass: "dataflow-range-icon dataflow-square-icon",

  initialize: function(para) {

    DataflowRangeFilter.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "inv0", "in-single", "V", true),
      DataflowPort.new(this, "inv1", "in-single", "V", true),
      DataflowPort.new(this, "in", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];

    this.value = [];
    this.embedValue = [];
    this.jqvalue = [];

    this.prepare();
  },

  serialize: function() {
    var result = DataflowRangeFilter.base.serialize.call(this);
    result.embedValue = this.embedValue;
    return result;
  },

  deserialize: function(save) {
    DataflowRangeFilter.base.deserialize.call(this, save);
    this.embedValue = save.embedValue;
    if (this.embedValue == null) {
      console.error("embedValue not saved");
      this.embedValue = [];
    }
  },

  showDetails: function() {

    DataflowRangeFilter.base.showDetails.call(this); // call parent settings

    var node = this;

    $("<div>on</div>")
      .css("padding", 5)
      .prependTo(this.jqview);

    $("<div>[ <input id='v0' style='width:40%'/> , " +
      "<input id='v1' style='width:40%'/> ]</div>")
      .prependTo(this.jqview);
    [0, 1].map(function(id) {
      this.jqvalue[id] = this.jqview.find("#v" + id);
      this.jqvalue[id]
        .addClass("dataflow-input dataflow-input-node")
        .val(this.value[id] != null ? this.value[id] : this.nullValueString)
        .change(function(event) {
          var value = event.target.value;
          node.embedValue[id] = value;
          node.pushflow();
        });
      if (this.ports["inv" + id].connected())
        this.jqvalue[id].prop("disabled", true);
    }, this);
  },

  process: function() {
    var pack = [];
    [0, 1].map(function(id) {
      var port = this.ports["inv" + id];
      if (port.connected())
        pack[id] = port.pack;
      else if (this.embedValue[id] != null)
        pack[id] = DataflowConstants.new(this.embedValue[id]);
      else
        pack[id] = port.pack;
      this.value[id] = pack[id].getOne();
      this.jqvalue[id].val(this.value[id] != null ? this.value[id] : this.nullValueString);
    }, this);

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
    if (!pack[0].compatible(pack[1]))
      return core.viewManager.tip(
        "incompatible constant types passed to range filter", this.jqview.offset());

    if (this.value[0] != null && this.value[1] != null && this.value[0] > this.value[1]) {
      this.value[0] = this.value[1] = null;
      core.viewManager.tip("value1 > value2 in range filter", this.jqview.offset());
    }

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
      if (this.value[0] != null && value < this.value[0]
        || this.value[1] != null && value > this.value[1])
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
