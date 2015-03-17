
"use strict";

var extObject = {

  iconName: "contain",

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
    this.inputMode = "text";
    this.matchMode = "exact";

    this.prepare();
  },

  serialize: function() {
    var result = DataflowContainFilter.base.serialize.call(this);
    result.inputMode = this.inputMode;
    result.matchMode = this.matchMode;
    return result;
  },

  deserialize: function(save) {
    DataflowContainFilter.base.deserialize.call(this, save);
    this.inputMode = save.inputMode;
    this.matchMode = save.matchMode;
    if (this.inputMode == null) {
      console.error("contain filter inputMode not saved");
      this.inputMode = "text";
    }
    if (this.matchMode == null) {
      console.error("contain filter matchMode not saved");
      this.matchMode = "exact";
    }
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
  },

  showOptions: function() {
    var node = this;
    var div = $("<div></div>")
      .addClass("dataflow-options-item")
      .appendTo(this.jqoptions);
    $("<label></label>")
      .addClass("dataflow-options-text")
      .text("Input Mode")
      .appendTo(div);
    this.inputModeSelect = $("<select>"
      + "<option value='text'>Text</option>"
      + "<option value='regex'>Regular Expression</option>"
      + "</select>")
      .addClass("dataflow-options-select")
      .appendTo(div)
      .select2()
      .change(function(event){
        node.inputMode = event.target.value;
        node.process();

        // push filter mode change to downflow
        core.dataflowManager.propagate(node);
      });
    this.inputModeSelect.select2("val", this.inputMode);

    var div2 = $("<div></div>")
      .addClass("dataflow-options-item")
      .appendTo(this.jqoptions);
    $("<label></label>")
      .addClass("dataflow-options-text")
      .text("Match Mode")
      .appendTo(div);
    this.matchModeSelect = $("<select>"
      + "<option value='exact'>Exact</option>"
      + "<option value='substring'>Substring</option>"
      + "</select>")
      .addClass("dataflow-options-select")
      .appendTo(div)
      .select2()
      .change(function(event){
        node.matchMode = event.target.value;
        node.process();

        // push filter mode change to downflow
        core.dataflowManager.propagate(node);
      });
    this.matchModeSelect.select2("val", this.matchMode);
  },

  process: function() {

    var pack = this.ports["inv"].pack;

    if (pack.type !== "constants")
      return console.error("data connected to constants ports");

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
