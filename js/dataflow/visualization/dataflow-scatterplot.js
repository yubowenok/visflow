
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

    this.dimension1 = null;
    this.dimension2 = null;
  },

  showIcon: function() {
    this.jqicon = $("<div></div>")
      .addClass("dataflow-scatterplot-icon")
      .appendTo(this.jqview);
  },

  showVisualization: function() {

    var inpack = this.ports["in"].pack;

    var items = inpack.items,
        data = inpack.data;

    this.svg = d3.selectAll(this.jqvis.toArray()).append("svg");

    if (data.type == "empty") {
      this.jqEmptyMsg = $("<div>empty data</div>")
        .css("position", "absolute")
        .css("width", "100%")
        .css("text-align", "center")
        .css("line-height", this.viewHeight + "px")
        .prependTo(this.jqview);
      return;
    }
    if (this.jqEmptyMsg)
      this.jqEmptyMsg.remove();

    this.prepareScales();

    var node = this;
    this.svg.selectAll(".scp-circle").data(items).enter().append("circle")
      .attr("class", "scp-circle")
      .attr("cx", function(e, i) {
        return i * 10;
      })
      .attr("cy", function(e, i) {
        return i * 10;
      })
      .attr("r", 5);
  },

  prepareScales: function() {
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data;
    var dim1 = this.dimension1,
        dim2 = this.dimension2,
        dimType1 = data.dimensionTypes[dim1],
        dimType2 = data.dimensinoTypes[dim2];
    this.scaleX = dimType1 == "string" ? d3.scale.ordinal() : d3.scale.linear();
    this.scaleY = dimType2 == "string" ? d3.scale.ordinal() : d3.scale.linear();

    for (var i in items) {
      var index = items[i].index;
    }
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
    this.dimension1 = 0;
    this.dimension2 = 1 % data.dimensions.length;

    outpack.copy(inpack);
    outpack.items = [];
  }

};

var DataflowScatterplot = DataflowVisualization.extend(extObject);
