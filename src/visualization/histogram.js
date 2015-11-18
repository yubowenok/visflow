/**
 * @fileoverview VisFlow histogram visualization.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Histogram = function(params) {
  visflow.Histogram.base.constructor.call(this, params);

  this.prepare();

  // 0: X axis, 1: Y axis
  this.dimension = 0;

  this.scaleTypes = [null, 'numerical'];
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

  this.numBins = 10; // default number of bins

  this.selectedBars = {};
};

visflow.utils.inherit(visflow.Histogram, visflow.Visualization);

/** @inheritDoc */
visflow.Histogram.prototype.PLOT_NAME = 'Histogram';

/** @inheritDoc */
visflow.Histogram.prototype.ICON_CLASS =
    'histogram-icon square-icon';

/** @inheritDoc */
visflow.Histogram.prototype.defaultProperties = {
  color: '#AAA'
};

/** @inheritDoc */
visflow.Histogram.prototype.selectedProperties = {
  color: 'white',
  border: '#FF4400'
};

/** @inheritDoc */
visflow.Histogram.prototype.selectedMultiplier = {
  width: 1.2
};

/** @inheritDoc */
visflow.Histogram.prototype.propertyTranslate = {
  size: 'ignore',
  color: 'fill',
  border: 'stroke',
  width: 'stroke-width'
};

/** @inheritDoc */
visflow.Histogram.prototype.serialize = function() {
  var result = visflow.Histogram.base.serialize.call(this);
  result.dimension = this.dimension;
  result.numBins = this.numBins;
  result.selectedBars = this.selectedBars;
  return result;
};

/** @inheritDoc */
visflow.Histogram.prototype.deserialize = function(save) {
  visflow.Histogram.base.deserialize.call(this, save);
  this.dimension = save.dimension;
  if (this.dimension == null) {
    visflow.error('dimension not saved for histogram');
    this.dimension = 0;
  }

  this.selectedBars = save.selectedBars;
  if (this.selectedBars == null) {
    visflow.error('selectedBins not saved for histogram');
    this.selectedBars = {};
  }
  this.numBins = save.numBins;
  if (this.numBins == null) {
    visflow.error('numBins not saved for histogram');
    this.numBins = 10;
  }
};

/** @inheritDoc */
visflow.Histogram.prototype.prepareInteraction = function() {
  visflow.Histogram.base.prepareInteraction.call(this);
  var node = this,
      mode = 'none';
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
    if (mode == 'selectbox') {

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
    mode = 'none';
    if (visflow.interactionManager.visualizationBlocking)
      event.stopPropagation();
  };
  this.jqsvg
    .mousedown(function(event) {
      if (visflow.interactionManager.ctrled) // ctrl drag mode blocks
        return;

      startPos = visflow.utils.getOffset(event, $(this));

      if (event.which == 1) { // left click triggers selectbox
        mode = 'selectbox';
        selectbox.x1 = selectbox.x2 = startPos[0];
        selectbox.y1 = selectbox.y2 = startPos[1];
      }
      if (visflow.interactionManager.visualizationBlocking)
        event.stopPropagation();
    })
    .mousemove(function(event) {

      if (mode == 'selectbox') {
        endPos = visflow.utils.getOffset(event, $(this));
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
    .mouseleave(function(event) {
      if ($(this).parent().length == 0) {
        return; // during svg update, the parent of mouseout event is unstable
      }
      mouseupHandler(event);
    });
};

/** @inheritDoc */
visflow.Histogram.prototype.selectItemsInBox = function(box) {
  if (!visflow.interactionManager.shifted) {
    this.selectedBars = {}; // reset selection if shift key is not down
    this.selected = {};
  }

  // scales range are [0, height], so we need to shift mouse coordinate
  box[1][0] -= this.plotMargins[1].before;
  box[1][1] -= this.plotMargins[1].before;

  var inpack = this.ports['in'].pack,
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
      this.selectedBars[i+ ',' + j] = true;
      for (var k in data[i][j].m) {
        this.selected[data[i][j].m[k]] = true;  // add items to selection
      }
    }
  }

  this.showVisualization();
  this.pushflow();
};

/**
 * Displays the selection box.
 * @param box
 */
visflow.Histogram.prototype.showSelectbox = function(box) {
  var node = this;
  this.selectbox = this.svg.select('.vis-selectbox');
  if (this.selectbox.empty())
    this.selectbox = this.svg.append('rect')
      .attr('class', 'vis-selectbox');

  this.selectbox
    .attr('x', box.x1)
    .attr('y', this.plotMargins[1].before)
    .attr('width', box.x2 - box.x1)
    .attr('height', this.svgSize[1] - this.plotMargins[1].before - this.plotMargins[1].after);
};

/**
 * Prepares the histogram bins.
 */
visflow.Histogram.prototype.prepareBins = function() {
  var inpack = this.ports['in'].pack,
      items = inpack.items,
      values = inpack.data.values;

  var scale,
      vals = [],
      binCount = this.numBins,
      dim = this.dimension,
      ticks = [];

  if (this.scaleTypes[0] == 'ordinal') {
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
  } else if (this.scaleTypes[0] == 'numerical') {
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

  if (this.scaleTypes[0] == 'numerical') {
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
};

/**
 * Assigns the data items into histogram bins.
 */
visflow.Histogram.prototype.groupHistogramBins = function() {
  // group the items in each bin by their properties
  var inpack = this.ports['in'].pack,
      items = inpack.items;

  var data = this.histogramData;

  var propertiesCompare = function(a, b) {
    var sa = [],
        sb = [];
    // TODO using hashes in compare may result in unstable behavior when upflow
    // changes the rendering properties
    ['color', 'border', 'width', 'opacity'].map(function(key, i) {
      var pa = a.properties[key],
          pb = b.properties[key];
      if (pa == null) pa = '';
      if (pb == null) pb = '';
      if (key == 'color') {
        pa = d3.rgb(pa).hsl();
        pa = [isNaN(pa.h) ? 0 : pa.h, isNaN(pa.s) ? 0 : pa.s, pa.l];
        pb = d3.rgb(pb).hsl();
        pb = [isNaN(pb.h) ? 0 : pb.h, isNaN(pb.s) ? 0 : pb.s, pb.l];
      } else {
        pa = [pa];
        pb = [pb];
      }
      if (a.hash == null)
        sa = sa.concat(pa);
      if (b.hash == null)
        sb = sb.concat(pb);
    }, this);
    if (a.hash == null)
      a.hash = sa; //visflow.utils.hashString(sa);
    if (b.hash == null)
      b.hash = sb; //visflow.utils.hashString(sb);
    return visflow.utils.compare(a.hash, b.hash);
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
    data[i] = _.extend([], _(bin).pick('x', 'y', 'dx'));
    _(newbin).extend(_(bin).pick('x', 'y', 'dx')); // copy d3 histogram attributes

    var y = 0;
    for (var j = 0; j < bin.length; j++) {
      var k = j;
      var members = [];
      while(k < bin.length && visflow.utils.compare(bin[k].hash, bin[j].hash) == 0) {
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
};

/**
 * Prepares the histogram scale.
 */
visflow.Histogram.prototype.prepareHistogramScale = function() {
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
};

/** @inheritDoc */
visflow.Histogram.prototype.showVisualization = function() {
  var inpack = this.ports['in'].pack,
      items = inpack.items,
      values = inpack.data.values;

  this.checkDataEmpty();
  this.prepareSvg();
  if (this.isEmpty)
    return;
  this.prepareScales();
  this.interaction();

  var data = this.histogramData;
  var node = this;
  var height = this.svgSize[1] - this.plotMargins[1].before - this.plotMargins[1].after;
  var yScale = this.dataScales[1].copy().range(this.screenScales[1].range());

  var bins = this.svg.selectAll('g')
    .data(this.histogramData).enter().append('g')
    .attr('id', function(e, i) {
      return 'b' + i;
    })
    .attr('transform', function(e) {
      return 'translate(' + node.histogramScale(e.x) + ','
        + node.plotMargins[1].before + ')';
    });

  var width = this.histogramScale(this.histogramData[0].dx) - this.histogramScale(0) - 1;
  if (width < 0)  // happens when only 1 value in domain
    width = this.svgSize[0] - this.plotMargins[0].before - this.plotMargins[0].after;

  var bars = this.bars = bins.selectAll('.rect')
    .data(function(d){ return d; }) // use the array as data
    .enter().append('rect')
    .attr('id', function(e, j) {
      return 'r' + j;
    })
    .attr('x', 1)
    .attr('y', function(e) {
      return Math.ceil(yScale(e.y + e.dy));
    })
    .attr('width', width)
    .attr('height', function(e) {
      return Math.ceil(yScale(0) - yScale(e.dy));
    });

  for (var i = 0; i < bars.length; i++) {
    var lasty = 0;
    for (var j = 0; j < bars[i].length; j++) {
      var properties = _.extend(
        {},
        this.defaultProperties,
        bars[i][j].__data__.p
      );
      if (this.selectedBars[i + ',' + j]) {
        _(properties).extend(this.selectedProperties);
        for (var p in this.selectedMultiplier) {
          var v = properties[p];
          if (v != null) {
            properties[p] = v * this.selectedMultiplier[p];
          }
        }
      }
      var u = d3.select(bars[i][j]);

      for (var key in properties) {
        var value = properties[key];
        if (this.propertyTranslate[key] != null)
          key = this.propertyTranslate[key];
        if (key == 'ignore')
          continue;
        if (this.isAttr[key] == true)
          u.attr(key, value);
        else
          u.style(key, value);
      }
    }
  }

  this.showSelection();

  // axis appears on top
  this.showAxis(0);
  this.showAxis(1);
};

/** @inheritDoc */
visflow.Histogram.prototype.showSelection = function() {
  // otherwise no item data can be used
  if (this.isEmpty)
    return;

  // find all bars that have selection
  var bars = {};
  for (var id in this.selectedBars) {
    var ij = id.split(',');
    bars[ij[0]] = true;
  }
  // move to top
  for (var i in bars) {
    this.jqsvg.find('#b' + i)
      .appendTo(this.jqsvg);
  }
};

/** @inheritDoc */
visflow.Histogram.prototype.showOptions = function() {
  this.selectDimension = new visflow.Select({
    id: 'dimension',
    label: 'Dimension',
    target: this.jqoptions,
    list: this.prepareDimensionList(),
    relative: true,
    value: this.dimension,
    change: function(event) {
      var unitChange = event.unitChange;
      this.dimension = unitChange.value;
      this.pushflow();
      this.showVisualization();
    }.bind(this)
  });

  this.inputBins = new visflow.Input({
    id: 'bins',
    label: 'Bins',
    target: this.jqoptions,
    relative: true,
    accept: 'int',
    range: [1, 100],
    scrollDelta: 1,
    value: this.numBins,
    change: function(event) {
      var unitChange = event.unitChange;

      node.numBins = parseInt(unitChange.value);
      // clear selection, bins have changed
      node.selectedBars = {};
      node.selected = {};

      node.showVisualization();
    }
  });
};

/**
 * Displays histogram axis.
 * @param {number} d Axis index. 0 or 1.
 */
visflow.Histogram.prototype.showAxis = function(d) {
  var dt = !d? 'x' : 'y';
  var margins = this.plotMargins;
  var axis = d3.svg.axis()
    .orient(!d ? 'bottom' : 'left')
    .tickValues(this.axisTicks[d]);
    //.tickFormat(d3.format('s'));

  if (this.scaleTypes[d] == 'ordinal'){
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

  var data = this.ports['in'].pack.data;

  var u = this.svg.select('.' + dt +'.axis');
  if (u.empty()) {
    u = this.svg.append('g')
     .attr('class', dt + ' axis')
     .attr('transform', 'translate(' + transX + ',' + transY + ')');
  }
  u.call(axis);
  var t = u.select('.vis-label');
  if (t.empty()) {
    t = u.append('text')
      .attr('class', 'vis-label')
      .style('text-anchor', !d ? 'middle' : '')
      .attr('transform', !d ? '' : 'rotate(90)')
      .attr('x', labelX)
      .attr('y', labelY);
    }
  if (!d)
    t.text(data.dimensions[this.dimension]);
};

/** @inheritDoc */
visflow.Histogram.prototype.prepareScales = function() {
  this.prepareDataScale();
  [0, 1].map(function(d) {
    this.prepareScreenScale(d);
  }, this);
  this.prepareHistogramScale();
};

/** @inheritDoc */
visflow.Histogram.prototype.prepareDataScale = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items,
      data = inpack.data;

  var dim = this.dimension,
      dimType = data.dimensionTypes[dim];

  var scaleType = dimType == 'string' ? 'ordinal' : 'numerical';
  this.scaleTypes[0] = scaleType;
  var scale;
  if (scaleType == 'numerical') {
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

  } else if (scaleType == 'ordinal') {
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
};

/** @inheritDoc */
visflow.Histogram.prototype.prepareScreenScale = function(d) {
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
};

/** @inheritDoc */
visflow.Histogram.prototype.dataChanged = function() {
  // data has changed, by default load the first dimension
  var data = this.ports['in'].pack.data;
  for (var i in data.dimensionTypes) {
    if (data.dimensionTypes[i] != 'string') {
      this.dimension = i;
      break;
    }
  }
};

/** @inheritDoc */
visflow.Histogram.prototype.selectAll = function() {
  visflow.Histogram.base.selectAll.call(this);
  // parent class already selects all elements
  // here we only select bars
  var data = this.histogramData;
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      this.selectedBars[i+ ',' + j] = true;
    }
  }
  this.showVisualization();
};

/** @inheritDoc */
visflow.Histogram.prototype.clearSelection = function() {
  visflow.Histogram.base.clearSelection.call(this);
  this.selectedBars = {};
  this.showVisualization();
};

/** @inheritDoc */
visflow.Histogram.prototype.resize = function(size) {
  visflow.Histogram.base.resize.call(this, size);
  this.showVisualization();
};
