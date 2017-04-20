/**
 * @fileoverview VisFlow histogram visualization.
 */

/**
 * @param {visflow.params.Node} params
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
   * Histogram data, created by assigning each item a bin.
   * @private {!Array}
   */
  this.histogramData_ = [];

  /** @private {d3|undefined} */
  this.svgHistogram_ = undefined;

  /** @protected {d3.Scale} */
  this.xScale = d3.scaleLinear();
  /** @protected {d3.Scale} */
  this.yScale = d3.scaleLinear();

  /**
   * Distribution dimension type.
   * @protected {visflow.ScaleType}
   */
  this.xScaleType = visflow.ScaleType.UNKNOWN;
  /**
   * Mapping from [0, 1] to x screen coordinates.
   * @protected {d3.Scale|undefined}
   */
  this.histogramScale = undefined;

  /**
   * Selected histogram bars.
   * @protected {!Object}
   */
  this.selectedBars = {};

  /**
   * On deserialization, we do not clear the selection on the first input change
   * call. Therefore we need a flag to identify whether it is the first input
   * change call after deserialization.
   * @private {boolean}
   */
  this.deserialized_ = false;
};

_.inherit(visflow.Histogram, visflow.Visualization);


/** @inheritDoc */
visflow.Histogram.prototype.init = function() {
  visflow.Histogram.base.init.call(this);
  this.svgHistogram_ = this.svg.append('g')
    .classed('histogram', true);
  this.svgAxes = this.svg.append('g')
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

  // Mark de-serialization.
  this.deserialized_ = true;
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
  var box = this.getSelectBox();
  if (box == null) {
    return;
  }

  if (!visflow.interaction.shifted) {
    // Reset both selected items and bars if shift key is not down.
    this.selected = {};
    this.selectedBars = {};
  }

  // Check bins and get items
  this.histogramData_.forEach(function(bin) {
    var xl = this.histogramScale(bin.x0);
    var xr = this.histogramScale(bin.x1);
    if (xl > box.x2 || xr < box.x1) {
      return;
    }
    bin.forEach(function(group) {
      // y axis is reversed
      var yl = this.yScale(group.y + group.dy);
      var yr = this.yScale(group.y);
      if (yl > box.y2 || yr < box.y1) {
        return;
      }
      // The bar is selected
      this.selectedBars[bin.id + ',' + group.id] = true;
      group.members.forEach(function(itemIndex) {
        // Add items to selection
        this.selected[itemIndex] = true;
      }, this);
    }, this);
  }, this);
  this.applyProperties_();
  this.show();
  this.pushflow();
};

/**
 * Prepares the histogram data and rendering properties.
 * @private
 */
visflow.Histogram.prototype.prepareHistogram_ = function() {
  this.createHistogramScale_();
  this.createHistogramData_();
  this.assignItemsIntoBins_();
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

  // Histogram range.
  var range;
  // Bins value for histogram layout.
  var bins;
  // Remap every string to [0, count - 1].
  var ordinalMapping;

  if (this.xScaleType == visflow.ScaleType.NUMERICAL) {
    range = this.xScale.domain();

    // If xScale domain has only a single value, the ticks will return empty
    // array. That is bins = [].
    bins = this.xScale.ticks(this.options.numBins);
    if (bins.length <= 1) {
      // D3 Histogram cannot handle 1 bin.
      bins = 1;
    }
  } else if (this.xScaleType == visflow.ScaleType.ORDINAL) {
    range = [0, this.xScale.domain().length - 1];
    ordinalMapping = this.xScale.copy()
      .range(d3.range(this.xScale.domain().length));
    // Ordinal data does not use ticks. It uses distinct string counts.
    bins = this.xScale.domain().length;
  }

  for (var index in items) {
    var value = data.values[index][this.dim];
    values.push({
      value: this.xScaleType == visflow.ScaleType.NUMERICAL ?
          value : ordinalMapping(value),
      index: index
    });
  }

  var histogram = d3.histogram()
    .value(_.getValue('value'))
    .thresholds(bins)
    .domain(range);
  this.histogramData_ = histogram(values);
};

/**
 * Creates a histogram scale. The scale's range is horizontal screen space.
 * When xScaleType is numerical, the scale's domain is the value domain.
 * Otherwise, the scale's domain is ordinal mapping length (# of strings).
 * @private
 */
visflow.Histogram.prototype.createHistogramScale_ = function() {
  var svgSize = this.getSVGSize();
  var margins = this.plotMargins();
  var range = [
    margins.left,
    svgSize.width - margins.right
  ];
  this.histogramScale = d3.scaleLinear()
    .domain(this.xScaleType == visflow.ScaleType.NUMERICAL ?
        this.xScale.domain() : [0, this.xScale.domain().length - 1])
    .range(range);
};

/**
 * Assigns the data items into histogram bins.
 * @private
 */
visflow.Histogram.prototype.assignItemsIntoBins_ = function() {
  // group the items in each bin by their properties
  var inpack = this.ports['in'].pack,
      items = inpack.items;

  this.histogramData_.forEach(function(bin, index) {
    // Copy d3 histogram coordinates.
    var barProp = /** @type {{x0: number, x1: number, length: number}} */(
      _.pick(bin, 'x0', 'x1', 'length'));

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
    bin.y = barProp.length; // Read length from d3 generated histogram bin.

    var y = 0, groupCount = 0;
    for (var j = 0; j < sorted.length; j++) {
      var k = j;
      var members = [];
      // Get all group members with the same rendering properties.
      while (k < sorted.length &&
          visflow.utils.propertiesCompare(sorted[k], sorted[j]) == 0) {
        members.push(sorted[k].index);
        k++;
      }
      var group = {
        id: 'g' + (++groupCount),
        x: barProp.x0,
        y: y,
        dy: k - j,
        dx: barProp.x1 - barProp.x0,
        // Original properties are kept intact during rendering.
        originalProperties: sorted[j].properties,
        // Properties can be modified based on whether bars are selected.
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
  this.histogramData_.forEach(function(bin) {
    bin.forEach(function(group) {
      var prop = _.extend(
        {},
        this.defaultProperties(),
        group.originalProperties
      );
      var barId = bin.id + ',' + group.id;
      if (!$.isEmptyObject(group.originalProperties)) {
        prop.bound = true;
      }
      if (barId in this.selectedBars) {
        prop.selected = true;
        _.extend(prop, this.selectedProperties());
        this.multiplyProperties(prop, this.selectedMultiplier());
      }
      group.properties = prop;
    }, this);
  }, this);
};

/** @inheritDoc */
visflow.Histogram.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  this.applyProperties_();
  this.drawHistogram_();
  this.showSelection();
  this.drawAxes_();
};

/**
 * Renders the histogram.
 * @private
 */
visflow.Histogram.prototype.drawHistogram_ = function() {
  var binTransform = function(bin) {
    return visflow.utils.getTransform([this.histogramScale(bin.x0), 0]);
  }.bind(this);

  var bins = this.svgHistogram_.selectAll('g')
    .data(this.histogramData_);

  _.fadeOut(bins.exit());

  bins = bins.enter().append('g')
    .attr('id', _.getValue('id'))
    .style('opacity', 0)
    .attr('transform', binTransform)
    .merge(bins);

  var updatedBins = this.allowTransition ? bins.transition() : bins;
  updatedBins
    .attr('transform', binTransform)
    .style('opacity', 1);

  var barWidth = this.histogramScale(this.histogramData_[0].x1 -
      this.histogramData_[0].x0) - this.histogramScale(0) - this.BAR_INTERVAL_;
  if (barWidth < 0) {
    var range = this.histogramScale.range();
    barWidth = range[1] - range[0];
  }

  var groupTransform = function(group) {
    return visflow.utils.getTransform([
      this.BAR_INTERVAL_,
      Math.floor(this.yScale(group.y + group.dy))
    ]);
  }.bind(this);

  // Gets the property values of the bar groups.
  var getPropertiesValue = function(key) {
    return function(obj) {
      return obj.properties[this];
    }.bind(key);
  };

  var bars = bins.selectAll('rect')
    .data(_.identity, function(group) { // use the bar group array
      return group.id;
    });

  _.fadeOut(bars.exit());

  bars = bars.enter().append('rect')
    .style('opacity', 0)
    .attr('id', _.getValue('id'))
    .attr('transform', groupTransform)
    .merge(bars)
    .attr('bound', getPropertiesValue('bound'))
    .attr('selected', getPropertiesValue('selected'));

  var updatedBars = this.allowTransition ? bars.transition() : bars;
  updatedBars
    .attr('transform', groupTransform)
    .attr('width', function(group) {
      return this.histogramScale(group.dx) - this.histogramScale(0);
    }.bind(this))
    .attr('height', function(group) {
      return Math.ceil(this.yScale(0) - this.yScale(group.dy));
    }.bind(this))
    .style('fill', getPropertiesValue('color'))
    .style('stroke', getPropertiesValue('border'))
    .style('stroke-width', getPropertiesValue('width'))
    .style('opacity', getPropertiesValue('opacity'));
};

/** @inheritDoc */
visflow.Histogram.prototype.showSelection = function() {
  var svg = $(this.svgHistogram_.node());
  svg.find('rect[bound]').each(function(index, element) {
    $(element).appendTo($(element).closest('g'));
  });
  svg.find('rect[selected]').each(function(index, element) {
    $(element).appendTo($(element).closest('g'));
  });
};

/**
 * Renders the axes.
 * @private
 */
visflow.Histogram.prototype.drawAxes_ = function() {
  this.drawXAxis_();
  this.drawYAxis_();
};

/**
 * Renders the x-axis to show distribution value.
 * @private
 */
visflow.Histogram.prototype.drawXAxis_ = function() {
  var svgSize = this.getSVGSize();
  var data = this.ports['in'].pack.data;
  var margins = this.plotMargins();
  this.drawAxis({
    svg: this.svgAxes.select('.x.axis'),
    scale: this.xScale,
    scaleType: visflow.ScaleType.NUMERICAL,
    classes: 'x axis',
    orient: 'bottom',
    ticks: this.xScaleType == visflow.ScaleType.ORDINAL ?
      this.xScale.domain() : this.options.numBins,
    transform: visflow.utils.getTransform([
      0,
      svgSize.height - margins.bottom
    ]),
    label: {
      text: data.dimensions[this.dim],
      transform: visflow.utils.getTransform([
        svgSize.width - margins.right,
        -svgSize.height + margins.top + margins.bottom +
          this.LABEL_OFFSET
      ])
    }
  });
};

/**
 * Renders the y-axis to show distribution counts.
 * @private
 */
visflow.Histogram.prototype.drawYAxis_ = function() {
  var margins = this.plotMargins();
  this.drawAxis({
    svg: this.svgAxes.select('.y.axis'),
    scale: this.yScale,
    scaleType: visflow.ScaleType.NUMERICAL,
    classes: 'y axis',
    orient: 'left',
    ticks: this.DEFAULT_TICKS,
    transform: visflow.utils.getTransform([
      margins.left,
      0
    ]),
    label: {
      text: '',
      transform: visflow.utils.getTransform([
        this.LABEL_OFFSET,
        margins.top
      ], 1, 90)
    }
  });
};

/** @inheritDoc */
visflow.Histogram.prototype.drawBrush = function() {
  this.drawSelectBox();
};

/** @inheritDoc */
visflow.Histogram.prototype.prepareScales = function() {
  var svgSize = this.getSVGSize();
  var inpack = this.ports['in'].pack;
  var data = inpack.data;
  var items = inpack.items;
  var margins = this.plotMargins();
  var scaleInfo = visflow.scales.getScale(data, this.dim, items, [
      margins.left,
      svgSize.width - margins.right
    ], {
      domainMargin: 0.15,
      ordinalRangeType: 'rangeBands',
      ordinalPadding: 1
    });
  this.xScale = scaleInfo.scale;
  this.xScaleType = scaleInfo.type;

  this.prepareHistogram_();

  this.yScale = d3.scaleLinear()
    .domain([
      0,
      d3.max(this.histogramData_, _.getValue('y')) * (1 + this.Y_MARGIN_)
    ])
    .range([svgSize.height - margins.bottom, margins.top]);
};

/** @inheritDoc */
visflow.Histogram.prototype.dataChanged = function() {
  this.dim = this.findPlotDimension();
  this.selected = {};
  this.selectedBars = {};
};

/** @inheritDoc */
visflow.Histogram.prototype.inputChanged = function() {
  if (this.deserialized_) {
    this.deserialized_ = false;
  } else {
    this.selected = {};
    this.selectedBars = {};
  }
};

/**
 * Find the first non-categorical dimension.
 * @return {number}
 */
visflow.Histogram.prototype.findPlotDimension = function() {
  var data = this.ports['in'].pack.data;
  for (var dim = 0; dim < data.dimensionTypes.length; dim++) {
    if (data.dimensionTypes[dim] != visflow.ValueType.STRING) {
      return dim;
    }
  }
  return 0;
};

/**
 * This overrides the default as data items are different in terms of histogram.
 * @inheritDoc
 */
visflow.Histogram.prototype.selectAll = function() {
  // Here we only select bars.
  var data = this.histogramData_;
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      this.selectedBars[i + ',' + j] = true;
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
