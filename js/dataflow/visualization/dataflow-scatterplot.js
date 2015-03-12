
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowVisualization.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();


    // 0: X axis, 1: Y axis
    this.dimensions = [0, 0];

    // dataScale : datavalue <-> [0, 1]
    this.dataScales = [null, null];
    // screenScale: screen pixel <-> ?
    this.screenScales = [null, null];
    // leave some space for axes
    this.plotMargins = [ { before: 30, after: 0 }, { before: 0, after: 30 } ];
  },

  showIcon: function() {
    this.jqicon = $("<div></div>")
      .addClass("dataflow-scatterplot-icon")
      .appendTo(this.jqview);
  },

  prepareSvg: function() {

    if (this.jqsvg)
      this.jqsvg.remove();

    this.svg = d3.selectAll(this.jqvis.toArray()).append("svg");
    this.jqsvg = $(this.svg[0]);
    this.jqsvg.mousedown( function(event) {
        // block mouse
        event.stopPropagation();
      });
    this.svgSize = [this.jqsvg.width(), this.jqsvg.height()];

    if (this.ports["in"].pack.data.type == "empty" ||
      this.ports["in"].pack.items.length == 0) {
      // otherwise scales may be undefined
      this.showMessage("empty");
      return;
    }
    this.clearMessage();
  },

  showVisualization: function() {

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        data = inpack.data,
        values = data.values;

    this.prepareSvg();

    var node = this;
    this.svg.selectAll(".df-scatterplot-circle").data(items).enter().append("circle")
      .attr("class", "df-scatterplot-circle")
      .attr("cx", function(e) {
        var value = values[e.index][node.dimensions[0]];
        value = node.dataScales[0](value);
        value = node.screenScales[0](value);
        return value;
      })
      .attr("cy", function(e) {
        var value = values[e.index][node.dimensions[1]];
        value = node.dataScales[1](value);
        value = node.screenScales[1](value);
        return value;
      })
      .attr("r", function(e) {
        return e.properties.r != null ? e.properties.r : 3;
      });
  },

  prepareDataScale: function(d) {
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data;
    var dim = this.dimensions[d],
        dimType = data.dimensionTypes[dim];

    var scaleType = dimType == "string" ? "ordinal" : "numerical";
    var scale;
    if (scaleType == "numerical") {
      scale = this.dataScales[d] = d3.scale.linear().range([0,1]);

      var minVal = Infinity, maxVal = -Infinity;
      // compute min max
      for (var i in items) {
        var value = data.values[items[i].index][dim];
        minVal = Math.min(minVal, value);
        maxVal = Math.max(maxVal, value);
      }
      scale.domain([minVal, maxVal]);

    } else if (scaleType == "ordinal") {
      scale = this.dataScales[d] = d3.scale.ordinal().rangePoints([0,1], 1.0);  // TODO check padding
      // find unique values
      var has = {};
      for (var i in items) {
        var value = data.values[items[i].index][dim];
        has[value] = true;
      }
      var values = [];
      for (var value in has) {
        values.push(value);
      }
      scale.domain(values);
    }
  },

  prepareScreenScale: function(d) {
    var scale = this.screenScales[d] = d3.scale.linear();
    scale
      .domain([0, 1])
      .range([this.plotMargins[d].before, this.svgSize[d] - this.plotMargins[d].after]);
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;

    var data = inpack.data;
    if (data.type == "empty") {
      this.dimension1 = this.dimension2 = null;
      return;
    }

    // use first two dimensions
    this.dimensions = [0, 1 % data.dimensions.length];

    for (var d in [0, 1]) {
      this.prepareDataScale(d);
      this.prepareScreenScale(d);
    }

    outpack.copy(inpack);
    outpack.items = [];
  },

  resize: function(size) {
    DataflowScatterplot.base.resize.call(this, size);
    for (var d in [0, 1]) {
      this.prepareScreenScale(d);
    }
    this.showVisualization();
  }

};

var DataflowScatterplot = DataflowVisualization.extend(extObject);
