
"use strict";

var extObject = {

  iconClass: "dataflow-contain-icon dataflow-square-icon",

  initialize: function(para) {

    DataflowContainFilter.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "inv", "in-single", "V", true),
      DataflowPort.new(this, "in", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];

    this.value = null;
    this.embedValue = null;
    this.inputMode = "text";
    this.matchMode = "exact";

    this.prepare();
  },

  serialize: function() {
    var result = DataflowContainFilter.base.serialize.call(this);
    result.inputMode = this.inputMode;
    result.matchMode = this.matchMode;
    result.embedValue = this.embedValue;
    return result;
  },

  deserialize: function(save) {
    DataflowContainFilter.base.deserialize.call(this, save);
    this.inputMode = save.inputMode;
    this.matchMode = save.matchMode;
    this.embedValue = save.embedValue;
    if (this.inputMode == null) {
      console.error("contain filter inputMode not saved");
      this.inputMode = "text";
    }
    if (this.matchMode == null) {
      console.error("contain filter matchMode not saved");
      this.matchMode = "exact";
    }
  },

  showDetails: function() {

    DataflowContainFilter.base.showDetails.call(this); // call parent settings
    var node = this;
    $("<div>contains</div>")
      .css("padding-bottom", 3)
      .appendTo(this.jqview);

    $("<div><input id='v' style='width:80%'/></div>")
      .appendTo(this.jqview);

    this.jqvalue = this.jqview.find("#v")
      .addClass("dataflow-input dataflow-input-node")
      .val(this.value ? this.value : this.nullValueString)
      .change(function(event) {
        node.embedValue = event.target.value;
        node.pushflow();
      });

    if (this.ports["inv"].connected())
      this.jqvalue.prop("disabled", true);
  },

  showOptions: function() {
    var node = this;

    this.selectInputMode = DataflowSelect.new({
      id: "inputmode",
      label: "Input Mode",
      target: this.jqoptions,
      list: [
        {
          value: "text",
          text: "Text"
        },
        {
          value: "regex",
          text: "Regular Expression"
        }
      ],
      value: this.inputMode,
      relative: true,
      change: function(event) {
        node.inputMode = event.unitChange.value;
        node.pushflow();
      }
    });

    this.selectMatchMode = DataflowSelect.new({
      id: "matchmode",
      label: "Match Mode",
      target: this.jqoptions,
      list: [
        {
          value: "exact",
          text: "Exact"
        },
        {
          value: "substring",
          text: "Substring"
        }
      ],
      value: this.matchMode,
      relative: true,
      change: function(event) {
        node.matchMode = event.unitChange.value;
        node.pushflow();
      },
    });
  },

  process: function() {
    var port = this.ports["inv"],
        pack;
    if (port.connected())
      pack = port.pack;
    else if (this.embedValue != null)
      pack = DataflowConstants.new(this.embedValue);
    else
      pack = port.pack; // empty constants

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

    this.value = pack.getAll();

    this.jqvalue.val(this.value ? pack.stringify() : this.nullValueString);

    // do the actual filtering
    this.filter();
  },

  filter: function() {
    // slow implementation: linear scan
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;
    var items = inpack.items,
        data = inpack.data,
        dim = parseInt(this.dimension);

    var result = [];
    for (var index in items) {
      var value = "" + data.values[index][dim],
          ok = 0;
      for (var j in this.value) {
        var pattern = this.value[j];

        if (this.inputMode == "regex")
          pattern = RegExp(pattern);

        var m = value.match(pattern);
        if (m != null) {

          if (this.matchMode == "exact" && m[0] === value ||
              this.matchMode == "substring") {
             result.push(index);
             break;
           }
        }
      }
    }
    outpack.copy(inpack);
    outpack.filter(result);
  }
};

var DataflowContainFilter = DataflowFilter.extend(extObject);
