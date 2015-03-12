
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
    this.dimensionLists = [[], []];

    this.scaleTypes = [null, null];
    // dataScale : datavalue <-> [0, 1]
    this.dataScales = [null, null];
    // screenScale: [0, 1] <-> screen pixel (rendering region)
    this.screenScales = [null, null];
    // leave some space for axes
    this.plotMargins = [ { before: 30, after: 10 }, { before: 10, after: 30 } ];

    this.isEmpty = true;

    this.lastDataId = 0;  // default: empty data
  },

  serialize: function() {
    var result = DataflowScatterplot.base.serialize.call(this);
    result.dimensions = this.dimensions;
    return result;
  },

  deserialize: function(save) {
    DataflowScatterplot.base.deserialize.call(this, save);
    this.dimensions = save.dimensions;
    if (this.dimensions == null) {
      console.error("dimensions not saved");
      this.dimensions = [0, 0];
    }
    /*
    if (save.selected == null)
      save.selected = {};
    this.selected = save.selected;
    if (this.selected instanceof Array) {
      console.error("Array appears as selected!!!");
      this.selected = {};
    }
    if ($.isEmptyObject(this.selected) == false)
      this.deserializeChange = true;
      */

    if (this.deserializeChange) {
      this.show();
    }
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
        if(core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      });
    this.svgSize = [this.jqsvg.width(), this.jqsvg.height()];

    this.clearMessage();
    if (this.ports["in"].pack.data.type == "empty" ||
      this.ports["in"].pack.items.length == 0) {
      // otherwise scales may be undefined
      this.showMessage("empty data in scatterplot");
      this.isEmpty = true;
      return;
    }

    this.isEmpty = false;

    [0, 1].map(function(d) {
      this.prepareDataScale(d);
      this.prepareScreenScale(d);
    }, this);
  },

  showVisualization: function() {
    var inpack = this.ports["in"].pack,
        items = inpack.items,
        data = inpack.data,
        values = data.values;

    this.prepareSvg();

    if (this.isEmpty)
      return;

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

    [0, 1].map(function(d) {
      this.showAxis(d);
    }, this);
  },

  showOptions: function() {
    [0, 1].map(function(d) {
      var node = this;
      var div = $("<div></div>")
        .addClass("dataflow-options-item")
        .appendTo(this.jqoptions);
      $("<label></label>")
        .addClass("dataflow-options-text")
        .text( (!d ? "X" : "Y" ) + " Axis:")
        .appendTo(div);
      this.dimensionLists[d] = $("<select class='dataflow-select'></select>")
        .addClass("dataflow-options-select")
        .appendTo(div)
        .select2()
        .change(function(event){
          node.dimensions[d] = event.target.value;
          node.showVisualization();
          node.process();

          // push dimension change to downflow
          core.dataflowManager.propagate(node);
        });

      this.prepareDimensionList(d);
      // show current selection, must call after prepareDimensionList
      this.dimensionLists[d].select2("val", this.dimensions[d]);

    }, this);
  },

  showAxis: function(d) {
    var margins = this.plotMargins;
    var axis = d3.svg.axis()
      .orient(!d ? "bottom" : "left")
      .ticks(5);
    if (this.scaleTypes[d] == "ordinal"){
      axis.scale(this.dataScales[d]
          .rangePoints(this.screenScales[d].range(), 1.0));
    } else {
      axis.scale(this.dataScales[d]
          .range(this.screenScales[d].range()));
    }
    var transX = !d ? 0 : margins[0].before,
        transY = !d ? this.svgSize[1] - margins[1].after : 0;
    var labelX = !d ? this.svgSize[0] - margins[0].after : margins[1].before,
        labelY = -5;

    var data = this.ports["in"].pack.data;
    this.svg.append("g")
      .attr("class", (!d ? "x" : "y") + " axis")
      .attr("transform", "translate(" + transX + "," + transY + ")")
      .call(axis)
      .append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .style("text-anchor", !d ? "end" : "")
        .attr("transform", !d ? "" : "rotate(90)")
        .text(data.dimensions[this.dimensions[d]]);
  },

  prepareDataScale: function(d) {
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data;

    var dim = this.dimensions[d],
        dimType = data.dimensionTypes[dim];

    var scaleType = dimType == "string" ? "ordinal" : "numerical";
    this.scaleTypes[d] = scaleType;
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
      var span = maxVal - minVal;
      scale.domain([minVal - span * .15, maxVal + span * .15]);

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
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data;

    var scale = this.screenScales[d] = d3.scale.linear();

    var interval = [this.plotMargins[d].before, this.svgSize[d] - this.plotMargins[d].after];
    if (d) {
      var t = interval[0];
      interval[0] = interval[1];
      interval[1] = t;
    }
    scale
      .domain([0, 1])
      .range(interval);
  },

  prepareDimensionList: function(d) {
    var dims = this.ports["in"].pack.data.dimensions;
    for (var i in dims) {
      $("<option value='" + i + "'>" + dims[i] + "</option>")
        .appendTo(this.dimensionLists[d]);
    }
  },

  process: function() {
    var inpack = this.ports["in"].pack,
        outpack = this.ports["out"].pack;

    var data = inpack.data;
    if (data.type == "empty") {
      this.dimensions = [0, 0];
      return;
    }

    if (data.dataId != this.lastDataId) {
      // data has changed, use first 2 non-string dimensions
      var chosen = [];
      for (var i in data.dimensionTypes) {
        if (data.dimensionTypes[i] != "string") {
          chosen.push(i);
        }
        if (chosen.length == 2)
          break;
      }
      this.dimensions = [chosen[0], chosen[1 % chosen.length]];
    }

    this.lastDataId = data.dataId;

    [0, 1].map(function(d) {
      // when data changed, use modulo dimension id
      this.dimensions[d] %= data.dimensions.length;
    }, this);

    outpack.copy(inpack);
    outpack.items = [];
  },

  resize: function(size) {
    DataflowScatterplot.base.resize.call(this, size);
    [0, 1].map(function(d) {
      this.prepareScreenScale(d);
    }, this);
    this.showVisualization();
  }

};

var DataflowScatterplot = DataflowVisualization.extend(extObject);
