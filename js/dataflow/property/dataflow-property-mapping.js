
"use strict";

var extObject = {

  iconName: "property-mapping",
  nodeShapeName: "property-mapping", // dedicate shape

  mappingTypes: {
    "color": "color",
    "border": "color",
    "size": "number",
    "width": "number",
    "opacity": "number"
  },

  mappingRange: {
    "size": [0, 1E9],
    "width": [0, 1E9],
    "opacity": [0, 1]
  },

  mappingScrollDelta: {
    "size": 0.5,
    "width": 0.1,
    "opacity": 0.05
  },

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
    this.mapping = null;
    this.colorScale = null;
    this.numberScale = [];  // [l, r]
    this.colorScales = null;

    this.properties = {};
  },

  serialize: function() {
    var result = DataflowPropertyMapping.base.serialize.call(this);

    result.dimension = this.dimension;
    result.mapping = this.mapping;
    result.colorScale = this.colorScale;
    result.numberScale = this.numberScale;

    return result;
  },

  deserialize: function(save) {
    DataflowPropertyMapping.base.deserialize.call(this, save);

    this.dimension = save.dimension;
    this.mapping = save.mapping;
    this.colorScale = save.colorScale;
    this.numberScale = save.numberScale;
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

      // select mapping
      this.selectMapping = DataflowSelect.new({
        id: "mapping",
        label: "Mapping",
        labelWidth: 75,
        placeholder: "Select",
        containerWidth: this.jqview.width() - 75,
        change: function(event) {
          var unitChange = event.unitChange;
          node.mapping = unitChange.value;
          node.show();
          node.pushflow();
        }
      });
      this.selectMapping.jqunit.appendTo(this.jqview);
      this.prepareMappingList();
      if (this.mapping != null) {
        this.selectMapping.setValue(this.mapping, null, true);
      }

      var mappingType = this.mappingTypes[this.mapping];

      if (mappingType == "color") {
        if (this.inputNumberScale != null) {
          this.inputNumberScale[0].remove();
          this.inputNumberScale[1].remove();
          this.inputNumberScale = null;
        }
        // a select list of color scales
        this.selectColorScale = DataflowSelect.new({
          id: "scale",
          label: "Scale",
          labelWidth: 75,
          placeholder: "No Mapping",
          containerWidth: this.jqview.width() - 75,
          change: function(event) {
            //console.log("change map")
            var unitChange = event.unitChange;
            node.colorScale = unitChange.value;
            node.pushflow();
          }
        });
        this.selectColorScale.jqunit.appendTo(this.jqview);
        this.prepareScaleList();
      } else if (mappingType == "number"){  // number
        if (this.selectColorScale != null) {
          this.selectColorScale.remove();
          this.selectColorScale = null;
        }
        // two input boxes of range
        this.inputNumberScale = [];
        [
          [0, "Min"],
          [1, "Max"]
        ].map(function(unit){
          var id = unit[0];
          var input = this.inputNumberScale[id] = DataflowInput.new({
            id: id,
            label: unit[1],
            labelWidth: 40,
            containerWidth: 50,
            accept: "float",
            range: this.mappingRange[this.mapping],
            scrollDelta: this.mappingScrollDelta[this.mapping]
          });
          if (this.numberScale[id] != null) {
            input.setValue(this.numberScale[id]);
            this.numberScale[id] = input.value; // value maybe fixed
          }
          input.change(function(event){
            var unitChange = event.unitChange;
            if (unitChange.value != null) {
              node.numberScale[id] = unitChange.value;
            } else {
              node.numberScale[id] = null;
            }
            node.pushflow();
          });

          input.jqunit.appendTo(this.jqview);
          if (id == 1) {
            input.jqunit.css({
              left: 95,
              top: 65,
              position: "absolute"
            });
          }
        }, this);
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

  prepareMappingList: function() {
    ["color", "border", "size", "width", "opacity"].map(function(mapping) {
      $("<option val='" + mapping + "'>" + mapping + "</option>")
        .appendTo(this.selectMapping.input);
    }, this);
  },

  prepareScaleList: function() {
    var mappingType = this.mappingTypes[this.mapping];
    if (mappingType == "color") {
      // use color scale
      if (this.colorScales == null) {
        this.loadColorScaleList();
        // Do NOT prepareScaleList here because loadScaleList is async
      } else {
        this.selectColorScale.setList(this.colorScaleList);
        if (this.colorScale != null) {
          this.selectColorScale.setValue(this.colorScale, null, true);
          this.pushflow();
        }
      }
    } else if (mappingType == "number"){
      // nothing to do
      if (this.numberScale != null) {
        this.inputNumberScale[0].setValue(this.numberScale[0], null, true);
        this.inputNumberScale[1].setValue(this.numberScale[1], null, true);
      }
    }
    // tricky: view height may change because of setValue (add a div)
    this.updatePorts();
  },

  loadColorScaleList: function() {
    var node = this;
    $.get("js/dataflow/property/colorScales.json", function(scales) {
      var list = [];
      node.colorScales = {};
      for (var i in scales) {
        var scale = scales[i];
        // save to node, map from value to scale object
        node.colorScales[scale.value] = scale;

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
      node.colorScaleList = list;
      node.prepareScaleList();  // load complete, prepare
    });
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack,
        data = inpack.data;
    outpack.copy(inpack);

    var mappingType = this.mappingTypes[this.mapping];
    if (this.dimension == null || this.mapping == null
       || (mappingType == "color" &&
        (this.colorScale == null || this.colorScales == null))
       || (mappingType == "number" && this.numberScale == null)) {
      return; // skip
    }


    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack,
        data = inpack.data;
    var dataScale, propertyScale, scale;

    if (mappingType == "color")
      scale = this.colorScales[this.colorScale];
    else if (mappingType == "number")
      scale = {
        domain: [0, 1],
        range: this.numberScale
      };

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
      property[this.mapping] = propertyScale(dataScale(value));
      newitems[index] = {
        properties: _.extend({}, inpack.items[index].properties, property)
      };
    }
    // cannot reuse old items
    outpack.items = newitems;
  }
};

var DataflowPropertyMapping = DataflowNode.extend(extObject);
