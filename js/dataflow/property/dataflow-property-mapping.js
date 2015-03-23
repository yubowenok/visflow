
"use strict";

var extObject = {

  iconName: "property-mapping",
  nodeShapeName: "property-mapping", // dedicate shape

  contextmenuDisabled: {
    "options": true
  },

  initialize: function(para) {
    DataflowPropertyMapping.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single", "D")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple", "D")
    ];
    this.prepare();

    this.dimension = null;
    this.scale = null;
    this.scales = null;
    this.properties = {};
  },

  serialize: function() {
    var result = DataflowPropertyMapping.base.serialize.call(this);
    result.scale = this.scale;
    result.dimension = this.dimension;
    return result;
  },

  deserialize: function(save) {
    DataflowPropertyMapping.base.deserialize.call(this, save);

    this.scale = save.scale;
    this.dimension = save.dimension;
    if (this.scale == "red-green1") {
      this.scale = "red-green";
    }
  },

  show: function() {
    DataflowPropertyMapping.base.show.call(this); // call parent settings

    var node = this;
    if (this.detailsOn) {
      // select dimension
      this.selectDimension = DataflowSelect.new({
        id: "dimension",
        label: "Dimension",
        labelWidth: 75,
        placeholder: "Select",
        containerWidth: this.jqview.width() - 75,
        change: function(event) {
          //console.log("change dim");
          var unitChange = event.unitChange;
          node.dimension = unitChange.value;
          node.pushflow();
        }
      });
      this.selectDimension.jqunit.appendTo(this.jqview);
      this.prepareDimensionList();
      if (this.dimension != null) {
        this.selectDimension.setValue(this.dimension, null, true);
        // not pushflow here, push after async scales load
      }
      // select scale
      this.selectScale = DataflowSelect.new({
        id: "mapping",
        label: "Mapping",
        labelWidth: 75,
        placeholder: "Select",
        containerWidth: this.jqview.width() - 75,
        change: function(event) {
          //console.log("change map")
          var unitChange = event.unitChange;
          node.scale = unitChange.value;
          node.pushflow();
        }
      });
      this.selectScale.jqunit.appendTo(this.jqview);
      if (this.scales == null) {
        this.loadScaleList();
        // Do NOT prepareScaleList here because loadScaleList is async
      } else {
        this.prepareScaleList();
      }

    }
    this.updatePorts();
  },

  prepareDimensionList: function() {
    var dims = this.ports["in"].pack.data.dimensions;
    var list = [];
    for (var i in dims) {
      list.push({
        value: i,
        text: dims[i]
      });
    }
    this.selectDimension.setList(list);
  },

  prepareScaleList: function() {
    this.selectScale.setList(this.scaleList);
    if (this.scale != null) {
      this.selectScale.setValue(this.scale, null, true);
    }
    // tricky: view height may change because of setValue (add a div)
    this.updatePorts();
  },

  loadScaleList: function() {
    var node = this;
    $.get("js/dataflow/property/mappings.json", function(scales) {
      var list = [];

      node.scales = {};

      for (var i in scales) {
        var scale = scales[i];

        // save to node, map from value to scale object
        node.scales[scale.value] = scale;

        var div = $("<div></div>")
          .addClass("dataflow-scalevis");
        var gradient = "linear-gradient(to right,";
        if (scale.type == "color") {
          for (var j in scale.range) {
            gradient += scale.range[j];
            gradient += j == scale.range.length - 1 ? ")" : ",";
          }
          div.css("background", gradient);
        } else if (scale.type == "color-category10") {
          scale.domain = d3.range(10);
          scale.range = d3.scale.category10().range();
          var n = scale.range.length;
          for (var j = 0; j < n; j++) {
            gradient += scale.range[j] + " " + (j * 100 / n) + "%,";
            gradient += scale.range[j] + " " + ((j + 1) * 100 / n) + "%";
            gradient += j == scale.range.length - 1 ? ")" : ",";
          }
          div.css("background", gradient);
        }
        list.push({
          value: scale.value,
          text: scale.text,
          div: div
        });
      }
      node.scaleList = list;
      node.prepareScaleList();
    });
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack,
        data = inpack.data;
    outpack.copy(inpack);
    if (this.dimension == null || this.scale == null  // not selected
       || this.scales == null) { // async not complete
      return; // skip
    }

    var dataScale, propertyScale;
    var scale = this.scales[this.scale];

    if (data.dimensionTypes[this.dimension] != "string") {
      // get min/max value
      var minValue = null, maxValue = null;
      for (var index in inpack.items) {
        var item = inpack.items[index],
            value = data.values[index][this.dimension];
        if (minValue == null) {
          minValue = value;
          maxValue = value;
        }
        if (value < minValue)
          minValue = value;
        if (value > maxValue)
          maxValue = value;
      }
      dataScale = d3.scale.linear()
      .domain([minValue, maxValue])
      .range([0, 1]);
      propertyScale = d3.scale.linear()
      .domain(scale.domain)
      .range(scale.range);
    } else {
      var values = {};
      for (var index in inpack.items) {
        var item = inpack.items[index],
            value = data.values[index][this.dimension];
        values[value] = true;
      }
      values = _.allKeys(values);
      var indexes = d3.range(scale.range.length);
      dataScale = d3.scale.ordinal()
        .domain(values)
        .range(indexes);
      propertyScale = d3.scale.linear()
        .domain(indexes)
        .range(scale.range);
    }
    var newitems = {};
    for (var index in inpack.items) {
      var value = data.values[index][this.dimension];
      var property = {};
      property[scale.property] = propertyScale(dataScale(value));
      newitems[index] = {
        properties: _.extend({}, inpack.items[index].properties, property)
      };
    }
    // cannot reuse old items
    outpack.items = newitems;
  }
};

var DataflowPropertyMapping = DataflowNode.extend(extObject);
