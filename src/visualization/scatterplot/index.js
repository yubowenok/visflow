/**
 * @fileoverview VisFlow scatterplot visualization.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Scatterplot = function(params) {
  visflow.Scatterplot.base.constructor.call(this, params);

  // Rendering scales.
  /** @type {d3.Scale} */
  this.xScale = d3.scaleLinear();
  /** @type {d3.Scale} */
  this.yScale = d3.scaleLinear();

  /** @type {visflow.ScaleType} */
  this.xScaleType = visflow.ScaleType.UNKNOWN;
  /** @type {visflow.ScaleType} */
  this.yScaleType = visflow.ScaleType.UNKNOWN;

  /**
   * SVG group for points.
   * @private {d3|undefined}
   */
  this.svgPoints_ = undefined;

  /**
   * Rendering properties for points.
   * @private {!Array}
   */
  this.itemProps_ = [];
};

_.inherit(visflow.Scatterplot, visflow.Visualization);

/** @inheritDoc */
visflow.Scatterplot.prototype.init = function() {
  visflow.Scatterplot.base.init.call(this);
  this.svgPoints_ = this.svg.append('g')
    .classed('points', true);
  this.svgAxes = this.svg.append('g')
    .classed('axes', true);
};

/** @inheritDoc */
visflow.Scatterplot.prototype.drawBrush = function() {
  this.drawSelectBox();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectItems = function() {
  this.selectItemsInBox_();
  this.itemProps_ = this.getItemProperties_();
  visflow.Scatterplot.base.selectItems.call(this);
};

/**
 * Selects the data items in the range selection box.
 * @private
 */
visflow.Scatterplot.prototype.selectItemsInBox_ = function() {
  var box = this.getSelectBox(true);
  if (box == null) {
    return;
  }

  if (!visflow.interaction.shifted) {
    this.selected = {}; // reset selection if shift key is not down
  }
  var inpack = this.getDataInPort().pack;
  var items = inpack.items;
  var values = inpack.data.values;
  for (var itemIndex in items) {
    var index = +itemIndex;
    var point = {
      x: this.xScale(values[index][this.options.xDim]),
      y: this.yScale(values[index][this.options.yDim])
    };
    if (visflow.utils.pointInBox(point, box)) {
      this.selected[index] = true;
    }
  }
};

/** @inheritDoc */
visflow.Scatterplot.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  this.drawPoints_(this.itemProps_);
  this.showSelection();
  this.drawAxes_();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.showSelection = function() {
  // Change position of tag to make them appear on top.
  var svg = $(this.svgPoints_.node());
  svg.children('circle[bound]').appendTo(svg);
  svg.children('circle[selected]').appendTo(svg);
};

/**
 * Updates the bottom margin based on the xTicks.
 * @private
 */
visflow.Scatterplot.prototype.updateBottomMargin_ = function() {
  this.margins.bottom = this.plotMargins().bottom +
    (this.options.xTicks ? this.TICKS_HEIGHT : 0);
};

/**
 * Updates the left margin of the plot based on the longest label for y-axis.
 * @private
 */
visflow.Scatterplot.prototype.updateLeftMargin_ = function() {
  var tempShow = !this.content.is(':visible');
  if (tempShow) {
    this.content.show();
  }
  this.margins.left = this.plotMargins().left;
  if (this.options.yTicks) {
    this.drawYAxis_();
    var maxLength = 0;
    $(this.svgAxes.node())
      .find('.y.axis > .tick > text')
      .each(function(index, element) {
        maxLength = Math.max(maxLength, element.getBBox().width);
      });
    // In case the input data is empty.
    if (maxLength == 0) {
      maxLength = 0;
    }
    this.margins.left += maxLength;
  }
  if (tempShow) {
    this.content.hide();
  }
};

/**
 * Computes the rendering properties for points.
 * @return {!Array}
 * @private
 */
visflow.Scatterplot.prototype.getItemProperties_ = function() {
  var inpack = this.getDataInPort().pack;
  var values = inpack.data.values;
  var items = inpack.items;
  var itemProps = [];
  for (var itemIndex in items) {
    var index = +itemIndex;
    var prop = _.extend(
      {},
      this.defaultProperties(),
      items[index].properties,
      {
        index: index,
        x: values[index][this.options.xDim],
        y: values[index][this.options.yDim]
      }
    );
    if (!$.isEmptyObject(items[index].properties)) {
      prop.bound = true;
    }
    if (index in this.selected) {
      prop.selected = true;
      _.extend(prop, this.selectedProperties());
      this.multiplyProperties(prop, this.selectedMultiplier());
    }
    itemProps.push(prop);
  }
  return itemProps;
};

/**
 * Renders the scatterplot points.
 * @param {!Array} itemProps
 * @private
 */
visflow.Scatterplot.prototype.drawPoints_ = function(itemProps) {
  var points = this.svgPoints_.selectAll('circle')
    .data(itemProps, _.getValue('index'));

  _.fadeOut(points.exit());

  points = points.enter().append('circle')
    .attr('id', _.getValue('index'))
    .merge(points)
    .attr('bound', _.getValue('bound'))
    .attr('selected', _.getValue('selected'));

  var updatedPoints = this.transitionFeasible() ? points.transition() : points;
  updatedPoints
    .attr('cx', function(point) {
      return this.xScale(point.x);
    }.bind(this))
    .attr('cy', function(point) {
      return this.yScale(point.y);
    }.bind(this))
    .attr('r', _.getValue('size', 'px'))
    .style('fill', _.getValue('color'))
    .style('stroke', _.getValue('border'))
    .style('stroke-width', _.getValue('width', 'px'))
    .style('opacity', _.getValue('opacity'));
};

/**
 * Renders the x-axis.
 * @private
 */
visflow.Scatterplot.prototype.drawXAxis_ = function() {
  var svgSize = this.getSVGSize();
  var data = this.getDataInPort().pack.data;
  this.drawAxis({
    svg: this.svgAxes.select('.x.axis'),
    scale: this.xScale,
    scaleType: this.xScaleType,
    classes: 'x axis',
    orient: 'bottom',
    ticks: this.DEFAULT_TICKS,
    noTicks: !this.options.xTicks,
    transform: visflow.utils.getTransform([
      0,
      svgSize.height - this.margins.bottom
    ]),
    label: {
      text: data.dimensions[this.options.xDim],
      transform: visflow.utils.getTransform([
        svgSize.width - this.plotMargins().right,
        -this.LABEL_OFFSET
      ])
    }
  });
};

/**
 * Renders the y-axis
 * @private
 */
visflow.Scatterplot.prototype.drawYAxis_ = function() {
  var data = this.getDataInPort().pack.data;
  this.drawAxis({
    svg: this.svgAxes.select('.y.axis'),
    scale: this.yScale,
    scaleType: this.yScaleType,
    classes: 'y axis',
    orient: 'left',
    ticks: this.DEFAULT_TICKS,
    noTicks: !this.options.yTicks,
    transform: visflow.utils.getTransform([
      this.margins.left,
      0
    ]),
    label: {
      text: data.dimensions[this.options.yDim],
      transform: visflow.utils.getTransform([
        this.LABEL_OFFSET,
        this.margins.top
      ], 1, 90)
    }
  });
};

/**
 * Renders the scatterplot axes.
 * @private
 */
visflow.Scatterplot.prototype.drawAxes_ = function() {
  this.drawXAxis_();
  this.drawYAxis_();
};

/**
 * Prepares the scales for scatterplot.
 */
visflow.Scatterplot.prototype.prepareScales = function() {
  var inpack = this.getDataInPort().pack;
  var items = inpack.items;
  var data = inpack.data;

  this.margins = this.plotMargins();

  this.updateBottomMargin_();

  var svgSize = this.getSVGSize();
  var yRange = [
    svgSize.height - this.margins.bottom,
    this.margins.top
  ];
  var yScaleInfo = visflow.scales.getScale(data, this.options.yDim, items,
    yRange, {
      domainMargin: this.options.yMargin,
      ordinalPadding: 1.0
    });
  this.yScale = yScaleInfo.scale;
  this.yScaleType = yScaleInfo.type;

  // Compute new left margin based on selected y dimension.
  // xScale has to be created after yScale because the left margin depends on
  // yScale's domain.
  this.updateLeftMargin_();

  var xRange = [
    this.margins.left,
    svgSize.width - this.margins.right
  ];
  var xScaleInfo = visflow.scales.getScale(data, this.options.xDim, items,
    xRange, {
      domainMargin: this.options.xMargin,
      ordinalPadding: 1.0
    });
  this.xScale = xScaleInfo.scale;
  this.xScaleType = xScaleInfo.type;
};

/** @inheritDoc */
visflow.Scatterplot.prototype.transitionFeasible = function() {
  return this.allowTransition &&
    this.itemProps_.length < this.TRANSITION_ELEMENT_LIMIT;
};

/**
 * Finds two reasonable dimensions to show.
 * @return {{x: number, y: number}}
 * @override
 */
visflow.Scatterplot.prototype.findPlotDimensions = function() {
  var data = this.getDataInPort().pack.data;
  var chosen = [];
  for (var i = 0; i < data.dimensionTypes.length; i++) {
    if (data.dimensionTypes[i] != visflow.ValueType.STRING) {
      chosen.push(i);
    }
    if (chosen.length == 2) {
      break;
    }
  }
  return {
    x: chosen[0] == null ? 0 : chosen[0],
    y: chosen[1] == null ? 0 : chosen[1]
  };
};

/**
 * Sets the X dimension of the scatterplot.
 * @param {string} dim
 */
visflow.Scatterplot.prototype.setXDimension = function(dim) {
  var data = this.getDataInPort().pack.data;
  this.options.xDim = data.dimensions.indexOf(dim);
  this.dimensionChanged();
};

/**
 * Sets the Y dimension of the scatterplot.
 * @param {string} dim
 */
visflow.Scatterplot.prototype.setYDimension = function(dim) {
  var data = this.getDataInPort().pack.data;
  this.options.yDim = data.dimensions.indexOf(dim);
  this.dimensionChanged();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.setDimensions = function(dims) {
  var dimensions = this.getDimensionNames();
  if (dims.length >= 1) {
    // If the plot already presents the dim, we swap the current xDim and yDim.
    var newDim = dimensions.indexOf(dims[0]);
    if (this.options.yDim == newDim) {
      this.options.yDim = this.options.xDim;
    }
    this.options.xDim = newDim;
  }
  if (dims.length >= 2) {
    // Setting 2 dimensions is not ambiguous.
    this.options.yDim = dimensions.indexOf(dims[1]);
  }
  this.dimensionChanged();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.dataChanged = function() {
  // When data is changed, scatterplot shall find two reasonable dimensions to
  // show as the user has not made any decisions on dimensions yet.
  var dims = this.findPlotDimensions();
  this.options.xDim = dims.x;
  this.options.yDim = dims.y;
};

/** @inheritDoc */
visflow.Scatterplot.prototype.inputChanged = function() {
  this.itemProps_ = this.getItemProperties_();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.dimensionChanged = function() {
  this.itemProps_ = this.getItemProperties_();
  visflow.Scatterplot.base.dimensionChanged.call(this);
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectedChanged = function() {
  this.itemProps_ = this.getItemProperties_();
};
