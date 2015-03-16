
"use strict";

var extObject = {

  plotName: "Histogram",
  iconName: "histogram",

  // use object to specify default rendering properties
  defaultProperties: {
    "fill": "#AAA"
  },
  // show these properties when items are selected
  selectedProperties: {
    "fill": "#FF4400"
  },
  // let d3 know to use attr or style for each key
  isAttr: {
    "id": true
  },

  initialize: function(para) {
    DataflowHistogram.base.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "in", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();

    // 0: X axis, 1: Y axis
    this.dimension = 0;

    this.scaleTypes = [null, "numerical"];
    // dataScale : datavalue <-> [0, 1]
    this.dataScales = [null, null];
    // ticks to be shown on axis
    this.axisTicks = [[], []];
    // screenScale: [0, 1] <-> screen pixel (rendering region)
    this.screenScales = [null, null];

    // data bin -> screen positino
    this.histogramScale = null;
    // leave some space for axes
    this.plotMargins = [ { before: 30, after: 20 }, { before: 20, after: 40 } ];

    this.lastDataId = 0;  // default: empty data

    this.numBins = 10; // default number of bins

    this.selectedBars = {};
  },

  serialize: function() {
    var result = DataflowHistogram.base.serialize.call(this);
    result.dimension = this.dimension;
    result.lastDataId = this.lastDataId;
    result.selectedBars = this.selectedBars;
    return result;
  },

  deserialize: function(save) {
    DataflowHistogram.base.deserialize.call(this, save);
    this.lastDataId = save.lastDataId;

    this.dimension = save.dimension;
    if (this.dimension == null) {
      console.error("dimension not saved for histogram");
      this.dimension = 0;
    }

    this.selectedBars = save.selectedBars;
    if (this.selectedBars == null) {
      console.error("selectedBins not saved for histogram");
      this.selectedBars = {};
    }
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

        if (node.selectbox) { // if mouse not moved, then no selectbox
          node.selectItemsInBox([
            [selectbox.x1, selectbox.x2],
            [0, node.svgSize[1]] // no constraint on y
          ]);
          node.selectbox.remove();
          node.selectbox = null;
        }
        else {
          node.selectItemsInBox([
            [selectbox.x1, selectbox.x2],
            [selectbox.y1, selectbox.y2]
          ]);
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
          selectbox.x1 = selectbox.x2 = startPos[0];
          selectbox.y1 = selectbox.y2 = startPos[1];
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
      this.selectedBars = {}; // reset selection if shift key is not down
      this.selected = {};
    }

    // scales range are [0, height], so we need to shift mouse coordinate
    box[1][0] -= this.plotMargins[1].before;
    box[1][1] -= this.plotMargins[1].before;

    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;

    // check bins and get items
    var data = this.histogramData,
        scaleX = this.histogramScale,
        scaleY = this.dataScales[1].copy()
          .range(this.screenScales[1].range());
    for (var i = 0; i < data.length; i++) {
      var xl = scaleX(data[i].x),
          xr = scaleX(data[i].x + data[i].dx);
      if (xr < box[0][0] || xl > box[0][1])
        continue;
      for (var j = 0; j < data[i].length; j++) {
        var yl = scaleY(data[i][j].y + data[i][j].dy),  // y axis is reversed!
            yr = scaleY(data[i][j].y);
        if (yr < box[1][0] || yl > box[1][1])
          continue;
        // this bar is selected
        this.selectedBars[i+ "," + j] = true;
        for (var k in data[i][j].m) {
          this.selected[data[i][j].m[k]] = true;  // add items to selection
        }
      }
    }

    this.showVisualization();
    this.process();
    core.dataflowManager.propagate(this);
  },

  showSelectbox: function(box) {
    var node = this;
    this.selectbox = this.svg.select(".df-histogram-selectbox");
    if (this.selectbox.empty())
      this.selectbox = this.svg.append("rect")
        .attr("class", "df-histogram-selectbox");

    this.selectbox
      .attr("x", box.x1)
      .attr("y", this.plotMargins[1].before)
      .attr("width", box.x2 - box.x1)
      .attr("height", this.svgSize[1] - this.plotMargins[1].before - this.plotMargins[1].after);
  },

  prepareBins: function() {
    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;

    var scale,
        vals = [],
        binCount = this.numBins,
        dim = this.dimension,
        ticks = [];

    if (this.scaleTypes[0] == "ordinal") {
      // remap every string to [0, count - 1]
      var ordinalMap = {}, count = 0;
      for (var index in items) {
        var value = values[index][dim];
        if (ordinalMap[value] == null)
          ordinalMap[value] = count++;
      }
      for (var index in items) {
        var value = values[index][dim];
        value = ordinalMap[value];
        vals.push([value, index]);
      }
      scale = d3.scale.linear()
        .domain([0, count - 1]);
      // ordinal data not using ticks
      binCount = count;
    } else if (this.scaleTypes[0] == "numerical") {
      for (var index in items) {
        var value = values[index][dim];
        vals.push([value, index]);
      }
      scale = this.dataScales[0].copy();
      ticks = scale.ticks(binCount);
    }
    scale.range(this.screenScales[0].range());

    // histogramScale is a convolted scale on numerical fields
    // ordinal data is mapped to integers
    this.histogramScale = scale;

    var histogram = d3.layout.histogram()
      .value(function(e) {
        return e[0]; // use value
      })
      .range(scale.domain())
      .bins(ticks.length == 0 ? binCount : ticks);
    var data = this.histogramData = histogram(vals);

    if (this.scaleTypes[0] == "numerical") {
      var ticks = [];
      for (var i in data) {
        var e = data[i];
        ticks.push(d3.round(e.x, 2));
      }
      ticks.push(this.histogramScale.domain()[1]);
      this.axisTicks[0] = ticks;
    } else {
      this.axisTicks[0] = _.allKeys(ordinalMap);
    }

    this.groupHistogramBins();
  },

  groupHistogramBins: function() {
    // group the items in each bin by their properties
    var inpack = this.ports["in"].pack,
        items = inpack.items;

    var data = this.histogramData;

    var propertiesCompare = function(a, b) {
      var sa = "",
          sb = "";
      ["fill", "fill-stroke", "fill-opacity",
        "stroke", "stroke-width", "stroke-opacity"].map(function(key, i) {
          if (a.hash == null)
            sa += i + ":" + (a.properties[key] == null? "*" : a.properties[key]) + ",";
          if (b.hash == null)
            sb += i + ":" + (b.properties[key] == null? "*" : b.properties[key]) + ",";
        });

      if (a.hash == null)
        a.hash = Utils.hashString(sa);
      if (b.hash == null)
        b.hash = Utils.hashString(sb);

      if (a.hash < b.hash) return -1;
      else if (a.hash === b.hash) return 0;
      return 1;
    };

    for (var i = 0; i < data.length; i++) {
      var bin = data[i];
      for (var j = 0; j < bin.length; j++) {
        bin[j] = {
          properties: items[bin[j][1]].properties,
          index: bin[j][1]
        };
      }
      bin.sort(propertiesCompare);
      var newbin = [];
      data[i] = _.extend([], _(bin).pick("x", "y", "dx"));
      _(newbin).extend(_(bin).pick("x", "y", "dx")); // copy d3 histogram attributes

      var y = 0;
      for (var j = 0; j < bin.length; j++) {
        var k = j;
        var members = [];
        while(k < bin.length && bin[k].hash == bin[j].hash) {
          members.push(bin[k].index);
          k++;  // same group
        }
        newbin = {
          x: newbin.x,
          y: y,
          dy: k - j,
          dx: newbin.dx,
          p: bin[j].properties, // p for properties
          m: members            // m for members
        };
        data[i].push(newbin);
        y += k - j; // the current accumulative bar height
        j = k - 1;
      }
    }
  },

  prepareHistogramScale: function() {
    // arrange items into bins
    this.prepareBins();

    var height = this.svgSize[1] - this.plotMargins[1].before - this.plotMargins[1].after;

    this.dataScales[1] = d3.scale.linear()
      .domain([0, d3.max(this.histogramData, function(d) { return d.y; })])
      .range([0, 1]);
    this.screenScales[1] = d3.scale.linear()
      .domain([0, 1])
      .range([height, 0]);
    this.axisTicks[1] = this.dataScales[1].copy().nice().ticks(5);
  },

  showVisualization: function() {
    var inpack = this.ports["in"].pack,
        items = inpack.items,
        values = inpack.data.values;

    this.checkDataEmpty();
    this.prepareSvg();
    this.prepareScales();

    this.interaction();

    if (this.isEmpty)
      return;

    var data = this.histogramData;
    var node = this;
    var height = this.svgSize[1] - this.plotMargins[1].before - this.plotMargins[1].after;
    var yScale = this.dataScales[1].copy().range(this.screenScales[1].range());

    var bins = this.svg.selectAll("g")
      .data(this.histogramData).enter().append("g")
      .attr("id", function(d, i) {
        return "b" + i;
      })
      .attr("transform", function(d) {
        return "translate(" + node.histogramScale(d.x) + ","
          + node.plotMargins[1].before + ")";
      });

    var width = this.histogramScale(this.histogramData[0].dx) - this.histogramScale(0) - 1;
    if (width < 0)  // happens when only 1 value in domain
      width = this.svgSize[0] - this.plotMargins[0].before - this.plotMargins[0].after;

    var bars = this.bars = bins.selectAll(".rect")
      .data(function(d){ return d; }) // use the array as data
      .enter().append("rect")
      .attr("x", 1) // 1 pixel gap
      .attr("y", function(d) {
        return yScale(d.y + d.dy);
      })
      .attr("width", width)
      .attr("height", function(d) {
        return yScale(0) - yScale(d.dy);
      });

    for (var i = 0; i < bars.length; i++) {
      var lasty = 0;
      for (var j = 0; j < bars[i].length; j++) {
        var properties = _.extend(
          {},
          this.defaultProperties,
          bars[i][j].__data__.p
        );
        if (this.selectedBars[i + "," + j]) {
          _(properties).extend(this.selectedProperties);
        }
        var u = d3.select(bars[i][j]);
        for (var key in properties) {
          if (this.isAttr[key] == true)
            u.attr(key, properties[key]);
          else {
            u.style(key, properties[key]);
          }
        }
      }
    }

    this.showSelection();

    // axis appears on top
    this.showAxis(0);
    this.showAxis(1);
  },

  showSelection: function() {
    // otherwise no item data can be used
    if (this.isEmpty)
      return;
    // nothing, histogram does not need move to front
  },

  showOptions: function() {
    var node = this;
    var div = $("<div></div>")
      .addClass("dataflow-options-item")
      .appendTo(this.jqoptions);
    $("<label></label>")
      .addClass("dataflow-options-text")
      .text("Dimension")
      .appendTo(div);
    this.dimensionSelect = $("<select></select>")
      .addClass("dataflow-options-select")
      .appendTo(div)
      .select2()
      .change(function(event){
        node.dimension = event.target.value;
        node.showVisualization();
        node.process();

        // push dimension change to downflow
        core.dataflowManager.propagate(node);
      });

    var div2 = $("<div></div>")
      .addClass("dataflow-options-item")
      .appendTo(this.jqoptions);
    $("<label></label>")
      .addClass("dataflow-options-text")
      .text("Bins")
      .appendTo(div2);
    this.binSelect = $("<select>" +
      "<option val='5'>5</option>" +
      "<option val='10'>10</option>" +
      "<option val='25'>25</option>" +
      "<option val='50'>50</option>" +
      "<option val='100'>100</option>" +
      "</select>")
      .addClass("dataflow-options-select")
      .appendTo(div2)
      .select2()
      .change(function(event){
        node.numBins = parseInt(event.target.value);

        // clear selection, bins have changed
        node.selectedBars = {};
        node.selected = {};

        node.showVisualization();
      });

    this.binSelect.select2("val", this.numBins);

    this.prepareDimensionList();
    // show current selection, must call after prepareDimensionList
    this.dimensionSelect.select2("val", this.dimension);

  },

  showAxis: function(d) {
    var dt = !d? "x" : "y";
    var margins = this.plotMargins;
    var axis = d3.svg.axis()
      .orient(!d ? "bottom" : "left")
      .tickValues(this.axisTicks[d]);
      //.tickFormat(d3.format("s"));

    if (this.scaleTypes[d] == "ordinal"){
      axis.scale(this.dataScales[d].copy()
          .rangeBands(this.screenScales[d].range()));
    } else {
      axis.scale(this.dataScales[d].copy()
          .range(this.screenScales[d].range()));
    }
    var transX = !d ? 0 : margins[0].before,
        transY = !d ? this.svgSize[1] - margins[1].after : margins[1].before;
    var labelX = !d ? this.svgSize[0]/2: margins[1].before,
        labelY = 30;

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
        .style("text-anchor", !d ? "middle" : "")
        .attr("transform", !d ? "" : "rotate(90)")
        .attr("x", labelX)
        .attr("y", labelY);
      }
    if (!d)
      t.text(data.dimensions[this.dimension]);
  },

  prepareScales: function() {
    this.prepareDataScale();
    [0, 1].map(function(d) {
      this.prepareScreenScale(d);
    }, this);
    this.prepareHistogramScale();
  },

  prepareDataScale: function() {
    var inpack = this.ports["in"].pack;
    var items = inpack.items,
        data = inpack.data;

    var dim = this.dimension,
        dimType = data.dimensionTypes[dim];

    var scaleType = dimType == "string" ? "ordinal" : "numerical";
    this.scaleTypes[0] = scaleType;
    var scale;
    if (scaleType == "numerical") {
      scale = this.dataScales[0] = d3.scale.linear().range([0,1]);

      var minVal = Infinity, maxVal = -Infinity;
      // compute min max
      for (var index in items) {
        var value = data.values[index][dim];
        minVal = Math.min(minVal, value);
        maxVal = Math.max(maxVal, value);
      }
      // leave some spaces
      var span = maxVal - minVal;
      scale.domain([minVal - span * .25, maxVal + span * .25]);

    } else if (scaleType == "ordinal") {
      scale = this.dataScales[0] = d3.scale.ordinal().rangeBands([0,1]);  // TODO check padding
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

  prepareDimensionList: function() {
    var dims = this.ports["in"].pack.data.dimensions;
    for (var i in dims) {
      $("<option value='" + i + "'>" + dims[i] + "</option>")
        .appendTo(this.dimensionSelect);
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
      // data has changed, by default load the first dimension
      this.dimension = 0;
      this.lastDataId = data.dataId;
    }

    outpack.copy(inpack);
    outpack.filter(_.allKeys(this.selected));
  },

  selectAll: function() {
    DataflowHistogram.base.selectAll.call(this);
    this.showSelection();
  },

  clearSelection: function() {
    DataflowHistogram.base.clearSelection.call(this);
    this.showVisualization(); // TODO　not efficient
  },

  resize: function(size) {
    DataflowHistogram.base.resize.call(this, size);
    // TODO update scales for dimensions
    this.showVisualization();
  }

};

var DataflowHistogram = DataflowVisualization.extend(extObject);

