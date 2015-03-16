
"use strict";

var extObject = {

  // use object to specify default rendering properties
  defaultProperties: {
    "fill": "#555",
    "stroke": "black",
    "stroke-width": "1px",
    "fill-opacity": 0.75,
    "r" : 3
  },
  // show these properties when items are selected
  selectedProperties: {
    "fill": "#FF4400",
    "stroke": "black",
    "fill-opacity": 1.0
  },
  // let d3 know to use attr or style for each key
  isAttr: {
    "id": true,
    "r": true,
    "cx": true,
    "cy": true
  },

  initialize: function(para) {
    DataflowScatterplot.base.initialize.call(this, para);

    this.plotName = "Scatterplot";

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
    this.plotMargins = [ { before: 40, after: 10 }, { before: 10, after: 30 } ];

    this.lastDataId = 0;  // default: empty data
  },

  serialize: function() {
    var result = DataflowScatterplot.base.serialize.call(this);
    result.dimensions = this.dimensions;
    result.lastDataId = this.lastDataId;
    return result;
  },

  deserialize: function(save) {
    DataflowScatterplot.base.deserialize.call(this, save);

    this.dimensions = save.dimensions;
    this.lastDataId = save.lastDataId;
    if (this.dimensions == null) {
      console.error("dimensions not saved for " + this.plotName);
      this.dimensions = [0, 0];
    }
  },

  showIcon: function() {
    this.jqicon = $("<div></div>")
      .addClass("dataflow-scatterplot-icon")
      .appendTo(this.jqview);
  },

  prepareInteraction: function() {
    var node = this,
        mode = "none";
    var startPos = [0, 0],
        lastPos = [0, 0],
        endPos = [0, 0];
    var selectbox = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0
    };

    var mouseupHandler = function(event) {
      if (mode == "selectbox") {
        node.selectItemsInBox([
            [selectbox.x1, selectbox.x2],
            [selectbox.y1, selectbox.y2]
          ]);
        if (node.selectbox) {
          node.selectbox.remove();
          node.selectbox = null;
        }
      }
      mode = "none";
      if (core.interactionManager.visualizationBlocking)
        event.stopPropagation();
    };

    this.jqsvg
      .mousedown(function(event) {
        if (core.interactionManager.ctrled) // ctrl drag mode blocks
          return;

        startPos = Utils.getOffset(event, $(this));

        if (event.which == 1) { // left click triggers selectbox
          mode = "selectbox";
        }
        if (core.interactionManager.visualizationBlocking)
          event.stopPropagation();
      })
      .mousemove(function(event) {
        if (mode == "selectbox") {
          endPos = Utils.getOffset(event, $(this));
          selectbox.x1 = Math.min(startPos[0], endPos[0]);
          selectbox.x2 = Math.max(startPos[0], endPos[0]);
          selectbox.y1 = Math.min(startPos[1], endPos[1]);
          selectbox.y2 = Math.max(startPos[1], endPos[1]);
          node.showSelectbox(selectbox);
        }
        // we shall not block mousemove (otherwise dragging edge will be problematic)
        // as we can start a drag on edge, but when mouse enters the visualization, drag will hang there
      })
      .mouseup(mouseupHandler)
      .mouseout(function(event) {
        if ($(this).parent().length == 0) {
          return; // during svg update, the parent of mouseout event is unstable
        }
        // when mouse is over drawn objects, mouseout is also triggered!
        var pos = Utils.getOffset(event, $(this));
        if (pos[0] < 0 || pos[0] >= node.svgSize[0] || pos[1] < 0 || pos[1] >= node.svgSize[1]) {
          // out of svg, then do the same as mouseup
          mouseupHandler(event);
        }
      });
  },

  selectItemsInBox: function(box) {
    if (!core.interactionManager.shifted) {
      this.selected = {}; // reset selection if shift key is not down
    }

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;
    for (var index in items) {
      var ok = 1;
      [0, 1].map(function(d) {
        var value = values[index][this.dimensions[d]];
        value = this.dataScales[d](value);
        value = this.screenScales[d](value);
        if (value < box[d][0] || value > box[d][1]) {
          ok = 0;
        }
      }, this);

      if (ok) {
        this.selected[index] = true;
      }
    }

    this.showVisualization();
    this.process();
    core.dataflowManager.propagate(this);
  },

  showSelectbox: function(box) {
    var node = this;
    this.selectbox = this.svg.select(".df-scatterplot-selectbox");
    if (this.selectbox.empty())
      this.selectbox = this.svg.append("rect")
        .attr("class", "df-scatterplot-selectbox");

    this.selectbox
      .attr("x", box.x1)
      .attr("y", box.y1)
      .attr("width", box.x2 - box.x1)
      .attr("height", box.y2 - box.y1);
  },

  showVisualization: function(useTransition) {
    var inpack = this.ports["in"].pack,
        items = inpack.items,
        data = inpack.data,
        values = data.values;

    this.checkDataEmpty();
    this.prepareSvg(useTransition);

    this.prepareScales();
    this.interaction();

    if (this.isEmpty)
      return;

    var node = this;

    if (!useTransition) {
      this.svgPoints = this.svg.append("g");
    }

    for (var index in items) {
      var c = [];
      [0, 1].map(function(d) {
        var value = values[index][node.dimensions[d]];
        value = node.dataScales[d](value);
        value = node.screenScales[d](value);
        c[d] = value;
      }, this);

      var properties = _.extend(
        {},
        this.defaultProperties,
        items[index].properties,
        {
          id: "i" + index,
          cx: c[0],
          cy: c[1]
        }
      );
      var u;
      if (useTransition) {
        u = this.svgPoints.select("#i" + index).transition();
      } else {
        u = this.svgPoints.append("circle");
      }
      for (var key in properties) {
        if (this.isAttr[key] == true)
          u.attr(key, properties[key]);
        else
          u.style(key, properties[key]);
      }
    }

    this.showSelection(useTransition);

    // axis appears on top
    [0, 1].map(function(d) {
      this.showAxis(d);
    }, this);

  },

  showSelection: function(useTransition) {
    // otherwise no item data can be used
    if (this.isEmpty)
      return;

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values,
        node = this;

    for (var index in this.selected) {
      var c = [];
      [0, 1].map(function(d) {
        var value = values[index][node.dimensions[d]];
        value = node.dataScales[d](value);
        value = node.screenScales[d](value);
        c[d] = value;
      }, this);

      var properties = _.extend(
        {},
        this.defaultProperties,
        items[index].properties,
        this.selectedProperties,
        {
          id: "i" + index,
          cx: c[0],
          cy: c[1]
        }
      );

      var d3sel = this.svg.selectAll("#i" + index);
      var jqu = $(d3sel[0])
        .appendTo($(this.svgPoints[0]));  // change position of tag to make them appear on top
      var u = d3sel;
      if (useTransition) {
        u = u.transition();
      }
      for (var key in properties) {
        if (this.isAttr[key] == true)
          u.attr(key, properties[key]);
        else
          u.style(key, properties[key]);
      }
    }
  },


  showOptions: function() {
    [0, 1].map(function(d) {
      var node = this;
      var div = $("<div></div>")
        .addClass("dataflow-options-item")
        .appendTo(this.jqoptions);
      $("<label></label>")
        .addClass("dataflow-options-text")
        .text( (!d ? "X" : "Y" ) + " Axis")
        .appendTo(div);
      this.dimensionLists[d] = $("<select></select>")
        .addClass("dataflow-options-select")
        .appendTo(div)
        .select2()
        .change(function(event){
          node.dimensions[d] = event.target.value;
          node.showVisualization(true);
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
    var dt = !d? "x" : "y";
    var margins = this.plotMargins;
    var axis = d3.svg.axis()
      .orient(!d ? "bottom" : "left")
      .ticks(5);
    if (this.scaleTypes[d] == "ordinal"){
      axis.scale(this.dataScales[d].copy()
          .rangePoints(this.screenScales[d].range(), 1.0));
    } else {
      axis.scale(this.dataScales[d].copy()
          .range(this.screenScales[d].range()));
    }
    var transX = !d ? 0 : margins[0].before,
        transY = !d ? this.svgSize[1] - margins[1].after : 0;
    var labelX = !d ? this.svgSize[0] - margins[0].after : margins[1].before,
        labelY = -5;

    var data = this.ports["in"].pack.data;

    var u = this.svg.select("." + dt +".axis");
    if (u.empty()) {
      u = this.svg.append("g")
       .attr("class", dt + " axis")
       .attr("transform", "translate(" + transX + "," + transY + ")");
    }
    u.call(axis);
    var t = u.select(".df-visualization-label");
    if (t.empty()) {
      t = u.append("text")
        .attr("class", "df-visualization-label")
        .style("text-anchor", !d ? "end" : "")
        .attr("transform", !d ? "" : "rotate(90)")
        .attr("x", labelX)
        .attr("y", labelY);
      }
    t.text(data.dimensions[this.dimensions[d]]);
  },

  prepareScales: function() {
    [0, 1].map(function(d) {
      this.prepareDataScale(d);
      this.prepareScreenScale(d);
    }, this);
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
      for (var index in items) {
        var value = data.values[index][dim];
        minVal = Math.min(minVal, value);
        maxVal = Math.max(maxVal, value);
      }
      var span = maxVal - minVal;

      // leave some spaces on the margin
      scale.domain([minVal - span * .15, maxVal + span * .15]);

    } else if (scaleType == "ordinal") {
      scale = this.dataScales[d] = d3.scale.ordinal().rangePoints([0,1], 1.0);  // TODO check padding
      // find unique values
      var has = {};
      for (var index in items) {
        var value = data.values[index][dim];
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
    if (inpack.isEmpty()) {
      return;
    }

    this.validateSelection();

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
      this.lastDataId = data.dataId;
    }

    outpack.copy(inpack);
    outpack.filter(_.allKeys(this.selected));
  },

  selectAll: function() {
    DataflowScatterplot.base.selectAll.call(this);
    this.showSelection();
  },

  clearSelection: function() {
    DataflowScatterplot.base.clearSelection.call(this);
    this.showVisualization(); // TODO　not efficient
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
