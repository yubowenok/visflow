
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
      .addClass("dataflow-input dataflow-input-node");

    this.jqvalue = this.jqview.find("#v")
      .val(this.value ? this.value : this.nullValueString);
    /*
    this.jqicon = $("<div></div>")
      .addClass("dataflow-contain-icon")
      .appendTo(this.jqview);
      */
  },

  process: function() {

    var pack = this.ports["inv"].pack;

    if (pack.type !== "constants")
      return console.error("data connected to constants ports");

    this.value = pack.getAll();

    //console.log(this.value);

    this.jqvalue.val(this.value ? pack.stringify() : this.nullValueString);

    // do the actual filtering
    this.filter();
  },

  filter: function() {
    // slow implementation: linear scan
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data,
        dim = parseInt(this.dimension);

    //console.log("filter", dim, data.dimensions[dim]);

    var values = {};
    for (var i in this.value) {
      values[this.value[i]] = true;
    }
    var result = [];
    for (var index in items) {
      var value = data.values[index][dim],
          ok = 1;
      if (values[value] != null) {
        result.push(index);
      }
    }
    var outpack = this.ports["out"].pack;
    outpack.copy(inpack);
    outpack.filter(result);
  }
};

var DataflowContainFilter = DataflowFilter.extend(extObject);
