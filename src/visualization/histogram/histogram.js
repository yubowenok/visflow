/**
 * @fileoverview VisFlow histogram visualization.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Histogram = function(params) {
  visflow.Histogram.base.constructor.call(this, params);

  /**
   * Distribution dimension.
   * @protected {number}
   */
  this.dim = 0;

  /**
   * Distribution dimension type.
   * @protected {visflow.ScaleType}
   */
  this.xScaleType;

  /**
   * Histogram data, created by assignign each item a bin.
   * @protected {!Object}
   */
  this.histogramData = {};

  /** @private {d3.selection} */
  this.svgHistogram_;
  /** @private {d3.selection} */
  this.svgAxes_;

  /**
   * Histogram scale.
   * @protected {!d3.scale}
   */
  this.xScale = d3.scale.linear();
  /** @protected {!d3.scale} */
  this.yScale = d3.scale.linear();

  // ticks to be shown on axis
  this.axisTicks = [[], []];

  /**
   * Selected histogram bars.
   * @protected {!Object}
   */
  this.selectedBars = {};

  _(this.options).extend({
    // Number of histogram bins.
    numBins: 10
  });
};

visflow.utils.inherit(visflow.Histogram, visflow.Visualization);

/** @inheritDoc */
visflow.Histogram.prototype.NODE_CLASS = 'histogram';
/** @inheritDoc */
visflow.Histogram.prototype.PLOT_NAME = 'Histogram';


/** @inheritDoc */
visflow.Histogram.prototype.MINIMIZED_CLASS =
    'histogram-icon square-icon';
/** @inheritDoc */
visflow.Histogram.prototype.PLOT_MARGINS = {
  left: 30,
  right: 20,
  top: 20,
  bottom: 40
};

/** @private @const {number} */
visflow.Histogram.prototype.BAR_INTERVAL_ = 1;

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
visflow.Histogram.prototype.init = function() {
  visflow.Histogram.base.init.call(this);
  this.svgHistogram_ = this.svg.append('g')
    .classed('histogram', true);
  this.svgAxes_ = this.svg.append('g')
    .classed('axes', true);
};

/** @inheritDoc */
visflow.Histogram.prototype.serialize = function() {
  var result = visflow.Histogram.base.serialize.call(this);
  result.dim = this.dim;
  result.selectedBars = this.selectedBars;
  return result;
};

/** @inheritDoc */
visflow.Histogram.prototype.deserialize = function(save) {
  visflow.Histogram.base.deserialize.call(this, save);
  this.dim = save.dim;
  if (this.dim == null) {
    visflow.error('dimension not saved for histogram');
    this.dim = 0;
  }

  this.selectedBars = save.selectedBars;
  if (this.selectedBars == null) {
    visflow.error('selectedBins not saved for histogram');
    this.selectedBars = {};
  }

  if (save.numBins) {
    this.options.numBins = save.numBins;
    visflow.warning('found older version histogram saving numBins');
  }
};

/** @inheritDoc */
visflow.Histogram.prototype.selectItems = function() {
  this.selectItemsIntersectBox_();
};

/**
 * Selects the histogram boxes that intersect the selectbox.
 * @private
 */
visflow.Histogram.prototype.selectItemsIntersectBox_ = function() {
  var startPos = _(this.brushPoints_).first();
  var endPos = _(this.brushPoints_).last();

  if (startPos.x == endPos.x && startPos.y == endPos.y) {
    // Nothing. Histogram allows clicking select.
  }
  var box = {
    x1: Math.min(startPos.x, endPos.x),
    x2: Math.max(startPos.x, endPos.x),
    y1: Math.min(startPos.y, endPos.y),
    y2: Math.max(startPos.y, endPos.y)
  };

  if (!visflow.interaction.shifted) {
    // Reset both selected items and bars if shift key is not down.
    this.selected = {};
    this.selectedBars = {};
  }

  var inpack = this.ports['in'].pack,
      items = inpack.items,
      values = inpack.data.values;

  // Check bins and get items
  var data = this.histogramData;
  for (var i = 0; i < data.length; i++) {
    var xl = this.xScale(data[i].x),
        xr = this.xScale(data[i].x + data[i].dx);
    if (xr < box[0][0] || xl > box[0][1]) {
      continue;
    }
    for (var j = 0; j < data[i].length; j++) {
      var yl = this.yScale(data[i][j].y + data[i][j].dy),  // y axis is reversed!
          yr = this.yScale(data[i][j].y);
      if (yr < box[1][0] || yl > box[1][1]) {
        continue;
      }
      // The bar is selected
      this.selectedBars[i+ ',' + j] = true;
      for (var k in data[i][j].m) {
        this.selected[data[i][j].m[k]] = true;  // add items to selection
      }
    }
  }

  this.showDetails();
  this.pushflow();
};

/**
 * Prepares the histogram data and rendering properties.
 * @private
 */
visflow.Histogram.prototype.prepareHistogram_ = function() {
  this.createHistogramData_();
  this.assignItemsIntoBins_();
  this.applyProperties_();
};

/**
 * Creates the histogram data array.
 * @private
 */
visflow.Histogram.prototype.createHistogramData_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;
  var values = [];

  // D3 histogram layout will return zero bins when xScale domain has only
  // a single value when xScale is numerical.
  var domain = this.xScale.domain();
  if (this.xScaleType == 'numerical' && domain[1] == domain[0]) {
    domain[1] = domain[0] + 1;
  }

  var histogram = d3.layout.histogram()
    .value(_.getValue('value'))
    .range(domain);

  if (this.xScaleType == 'ordinal') {
    // Remap every string to [0, count - 1].
    var ordinalMap = {}, count = 0;
    for (var index in items) {
      var value = data.values[index][this.dim];
      if (ordinalMap[value] == null) {
        ordinalMap[value] = count++;
      }
    }
    for (var index in items) {
      var value = data.values[index][this.dim];
      value = ordinalMap[value];
      values.push({
        value: value,
        index: index
      });
    }
    // Ordinal data does not use ticks.
    // Override with distinct string counts.
    histogram.bins(this.xScale.domain().length);
  } else if (this.xScaleType == 'numerical') {
    for (var index in items) {
      var value = data.values[index][this.dim];
      values.push({
        value: value,
        index: index
      });
    }
    histogram.bins(this.xScale.ticks(this.options.numBins));
  }
  this.histogramData = histogram(values);
};

/**
 * Assigns the data items into histogram bins.
 * @private
 */
visflow.Histogram.prototype.assignItemsIntoBins_ = function() {
  // group the items in each bin by their properties
  var inpack = this.ports['in'].pack,
      items = inpack.items;

  this.histogramData.forEach(function(bin, index) {
    // Copy d3 histogram coordinates.
    var barProp = _(bin).pick('x', 'y', 'dx');

    var sorted = bin.map(function(itemInfo) {
      return {
        properties: items[itemInfo.index].properties,
        index: itemInfo.index
      };
    });
    sorted.sort(visflow.utils.propertiesCompare);

    // Clear the bin element array. Only keep bar properties.
    // We will re-append sorted bar groups below.
    bin.length = 0;
    bin.id = 'b' + index;

    var y = 0, groupCount = 0;
    for (var j = 0; j < sorted.length; j++) {
      var k = j;
      var members = [];
      // Get all group members with the same rendering properties.
      while(k < sorted.length &&
          visflow.utils.propertiesCompare(sorted[k], sorted[j]) == 0) {
        members.push(sorted[k].index);
        k++;
      }
      var group = {
        id: 'g' + (++groupCount),
        x: barProp.x,
        y: y,
        dy: k - j,
        dx: barProp.dx,
        properties: sorted[j].properties,
        members: members
      };
      bin.push(group);
      y += k - j; // The current accumulative bar height
      j = k - 1;
    }
  }, this);
};

/**
 * Applies rendering properties to grouped bars.
 * @private
 */
visflow.Histogram.prototype.applyProperties_ = function() {
  this.histogramData.forEach(function(bin) {
    bin.forEach(function(group) {
      var prop = _.extend(
        {},
        this.defaultProperties,
        bin.prop
      );
      var barId = bin.id + ',' + group.id;
      if (barId in this.selectedBars) {
        _(prop).extend(this.selectedProperties);
        for (var p in this.selectedMultiplier) {
          if (p in prop) {
            prop[p] *= this.selectedMultiplier[p];
          }
        }
      }
      bin.properties = prop;
    }, this);
  }, this);
};

/** @inheritDoc */
visflow.Histogram.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  this.drawHistogram_();
  this.drawAxes_();
};

/**
 * Renders the histogram.
 * @private
 */
visflow.Histogram.prototype.drawHistogram_ = function() {
  var bins = this.svgHistogram_.selectAll('g')
    .data(this.histogramData);

  var binTransform = function(bin) {
    return visflow.utils.getTransform([
      this.xScale(bin.x),
      this.PLOT_MARGINS.top
    ])
  }.bind(this);
  bins.enter().append('g')
    .attr('id', _.getValue('id'))
    .attr('transform', binTransform);
  bins.exit()
    .transition()
    .style('opacity', 0)
    .remove();

  var updatedBins = this.allowTransition_ ? bins.transition() : bins;
  updatedBins.attr('transform', binTransform);

  var barWidth = this.xScale(this.histogramData[0].dx) -
    this.xScale(0) - this.BAR_INTERVAL_;
  if (barWidth < 0) {
    var range = this.xScale.range();
    barWidth = range[1] - range[0];
  }
  var bars = bins.selectAll('rect').data(_.identity); // use the bar group array
  var groupTransform = function(group) {
    return visflow.utils.getTransform([
      this.BAR_INTERVAL_,
      this.yScale(group.y + group.dy)
    ]);
  }.bind(this);
  bars.enter().append('rect')
    .attr('id', _.getValue('id'));
  bars.exit()
    .transition()
    .style('opacity', 0)
    .remove();
  bars
    .attr('transform', groupTransform)
    .attr('width', barWidth)
    .attr('height', function(group) {
      return this.yScale(0) - this.yScale(group.dy);
    }.bind(this));
};

/** @inheritDoc */
visflow.Histogram.prototype.showSelection = function() {
  var svg = $(this.svg.node());
  for (var id in this.selectedBars) {
    var barId = id.split(',').index;
    svg.find('#b' + barId).appendTo(svg);
  }
};

/**
 * Renders the axes.
 */
visflow.Histogram.prototype.drawAxes_ = function() {

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
visflow.Histogram.prototype.drawBrush = function() {
  this.drawSelectbox();
};

/** @inheritDoc */
visflow.Histogram.prototype.initPanel = function() {
  var dimensionList = this.getDimensionList();
  var dimSelect = new visflow.Select({
    container: container.find('#x-dim'),
    list: dimensionList,
    selected: this.dim,
    listTitle: 'Distribution Dimension'
  });
  $(dimSelect).on('visflow.change', function(event, dim) {
    this.xDim = dim;
    this.dimensionChanged();
  }.bind(this));

  /*
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

   node.showDetails();
   }
   });
   */
};


/** @inheritDoc */
visflow.Histogram.prototype.prepareScales = function() {
  var svgSize = this.getSVGSize();
  var inpack = this.ports['in'].pack;
  var data = inpack.data;
  var items = inpack.items;
  var scaleInfo = visflow.utils.getScale(data, this.dim, items,
    [
      this.PLOT_MARGINS.left,
      svgSize.width - this.PLOT_MARGINS.right
    ], {
      domainMargin: 0.1,
      ordinalRangeType: 'rangeRoundBands'
    });
  this.xScale = scaleInfo.scale;
  this.xScaleType = scaleInfo.type;

  this.prepareHistogram_();
  this.yScale = d3.scale.linear()
    .domain([0, d3.max(this.histogramData, _.getValue('y'))])
    .range([svgSize.height - this.PLOT_MARGINS.bottom, this.PLOT_MARGINS.top]);
};

/** @inheritDoc */
visflow.Histogram.prototype.dataChanged = function() {
  this.dim = this.findPlotDimension();
};

/**
 * Find the first non-categorical dimension.
 * @return {number}
 */
visflow.Histogram.prototype.findPlotDimension = function() {
  var data = this.ports['in'].pack.data;
  for (var dim = 0; dim < data.dimensionTypes.length; dim++) {
    if (data.dimensionTypes[dim] != 'string') {
      return dim;
    }
  }
  return 0;
};

/**
 * This overrides the default as data items are different in terms of histogram.
 * @override
 */
visflow.Histogram.prototype.selectAll = function() {
  // Here we only select bars.
  var data = this.histogramData;
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      this.selectedBars[i+ ',' + j] = true;
    }
  }
  // Parent class will select primitive data items, and update the rendering.
  visflow.Histogram.base.selectAll.call(this);
};

/** @inheritDoc */
visflow.Histogram.prototype.clearSelection = function() {
  this.selectedBars = {};
  visflow.Histogram.base.clearSelection.call(this);
};
