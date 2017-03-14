/**
 * @fileoverview VisFlow parallel coordinates visualization.
 */

/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.ParallelCoordinates = function(params) {
  visflow.ParallelCoordinates.base.constructor.call(this, params);

  /**
   * Mapping from axes indexes to x coordinates.
   * @protected {d3.Scale}
   */
  this.xScale = d3.scaleLinear();

  /**
   * Mapping from data dimension domain to screen y coordinates.
   * @protected {!Array<d3.Scale>}
   */
  this.yScales = [];

  /**
   * yScale types.
   * @protected {!Array<visflow.ScaleType>}
   */
  this.yScaleTypes = [];

  /**
   * Rendering properties for the polylines.
   * @private {!Array}
   */
  this.itemProps_ = [];

  /**
   * SVG group for polylines.
   * @private {!d3}
   */
  this.svgPolylines_ = _.d3();

  /**
   * SVG group for drawing temporary axes, used to determine label sizes.
   * @private {!d3}
   */
  this.svgTempAxes_ = _.d3();
};

_.inherit(visflow.ParallelCoordinates, visflow.Visualization);

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.init = function() {
  visflow.ParallelCoordinates.base.init.call(this);
  this.svgPolylines_ = this.svg.append('g')
    .classed('polylines', true);
  this.svgAxes = this.svg.append('g')
    .classed('axes', true);
  this.svgTempAxes_ = this.svg.append('g')
    .classed('axes', true);
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.selectItems = function() {
  this.selectItemsIntersectLasso_();
  this.itemProps_ = this.getItemProperties_();
  visflow.ParallelCoordinates.base.selectItems.call(this);
};

/**
 * Selects the items intersecting user lasso.
 * @private
 */
visflow.ParallelCoordinates.prototype.selectItemsIntersectLasso_ = function() {
  var brush = this.brushPoints;
  var startPos = _.first(brush);
  var endPos = _.last(brush);
  if (startPos.x == endPos.x && startPos.y == endPos.y) {
    return;
  }

  if (!visflow.interaction.shifted) {
    this.selected = {};
  }

  var inpack = this.ports['in'].pack,
    items = inpack.items,
    values = inpack.data.values;

  var points = [];
  this.options.dims.forEach(function(dim, dimIndex) {
    points[dimIndex] = [this.xScale(dimIndex)];
  }, this);

  for (var index in items) {
    if (this.selected[index] != null) {
      // Already selected.
      continue;
    }
    this.options.dims.forEach(function(dim, dimIndex) {
      var value = values[index][dim];
      points[dimIndex][1] = this.yScales[dimIndex](value);
    }, this);
    var hit = 0;
    for (var dimIndex = 0; dimIndex < this.options.dims.length - 1 && !hit;
         dimIndex++) {
      for (var i = 0; i < brush.length - 1 && !hit; i++) {
        if (visflow.utils.intersect(points[dimIndex], points[dimIndex + 1],
            [brush[i].x, brush[i].y], [brush[i + 1].x, brush[i + 1].y])) {
          this.selected[index] = true;
          hit = true;
        }
      }
    }
  }
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.drawBrush = function() {
  this.drawLasso();
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  this.drawPolylines_(this.itemProps_);
  this.showSelection();
  this.drawAxes_();
};

/**
 * Computes the item rendering properties.
 * @return {!Array}
 * @private
 */
visflow.ParallelCoordinates.prototype.getItemProperties_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;
  var values = data.values;

  // Data to be rendered.
  var itemProps = [];
  for (var itemIndex in items) {
    var index = +itemIndex;
    var prop = _.extend(
      {},
      this.defaultProperties(),
      items[index].properties,
      {
        index: index,
        points: []
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

    this.options.dims.forEach(function(dim, dimIndex) {
      var value = values[index][dim];
      prop.points.push([dimIndex, value]);
    }, this);
    itemProps.push(prop);
  }
  return itemProps;
};

/**
 * Renders the parallel coordinates polylines.
 * @param {!Array} itemProps
 * @private
 */
visflow.ParallelCoordinates.prototype.drawPolylines_ = function(itemProps) {
  var line = d3.line()
    .x(function(point) {
      return this.xScale(point[0]);
    }.bind(this))
    .y(function(point) {
      return this.yScales[point[0]](point[1]);
    }.bind(this));

  var lines = this.svgPolylines_.selectAll('path').data(itemProps,
      _.getValue('index'));

  _.fadeOut(lines.exit());

  lines = lines.enter().append('path')
    .attr('id', _.getValue('index'))
    .merge(lines)
    .attr('bound', _.getValue('bound'))
    .attr('selected', _.getValue('selected'));

  var updatedLines = this.allowTransition ? lines.transition() : lines;
  updatedLines
    .attr('d', function(prop) {
      return line(prop.points);
    })
    .style('stroke', _.getValue('color'))
    .style('stroke-width', _.getValue('width', 'px'))
    .style('opacity', _.getValue('opacity'));
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.showSelection = function() {
  // Change position of tag to make them appear on top.
  var svg = $(this.svgPolylines_.node());
  svg.children('path[bound]').appendTo(svg);
  svg.children('path[selected]').appendTo(svg);
};

/**
 * Renders the parallel coordinates axes.
 * @private
 */
visflow.ParallelCoordinates.prototype.drawAxes_ = function() {
  // Clear extra axes when dimension changes.
  var dimInfos = this.uniqueDimensions(this.options.dims);
  var uniqIds = dimInfos.map(function(dimInfo) {
    var dimInfo_ = /** @type {{
      dim: number,
      uniqId: string
    }} */(dimInfo);
    return dimInfo_.uniqId;
  });
  var exitAxes = this.svgAxes.selectAll('g.axis')
    .data(uniqIds, _.identity)
    .exit();
  _.fadeOut(exitAxes);
  dimInfos.forEach(function(dimInfo, dimIndex) {
    var dimInfo_ = /** @type {{
      dim: number,
      uniqId: string
    }} */(dimInfo);
    this.drawAxis_(dimIndex, dimInfo_.uniqId);
  }, this);
};

/**
 * Renders temporary axis for determining label width.
 * @param {number} dimIndex
 * @param {string=} opt_uniqId
 * @param {Function=} opt_check Function to be completed before the temp axis is
 *     removed.
 * @private
 */
visflow.ParallelCoordinates.prototype.drawTempAxis_ = function(dimIndex,
   opt_uniqId, opt_check) {
  // Content must be visible when we draw.
  var tempShow = !this.content.is(':visible');
  if (tempShow) {
    this.content.show();
  }

  // Transition must be disabled before we draw the axis.
  var allowTransition = this.allowTransition;
  this.allowTransition = false;

  var svgAxes = this.svgAxes;
  this.svgAxes = this.svgTempAxes_;
  this.drawAxis_(dimIndex, opt_uniqId);
  this.svgAxes = svgAxes;

  if (opt_check) {
    opt_check();
  }

  // Clear temp axis.
  this.svgTempAxes_.selectAll('*').remove();

  // Reset transition to original value.
  this.allowTransition = allowTransition;
  if (tempShow) {
    this.content.hide();
  }
};

/**
 * Shows the parallel coordinate axis for one dimension.
 * @param {number} dimIndex Index of dimension in this.options.dims.
 * @param {string=} opt_uniqId Distinct dimension id.
 * @private
 */
visflow.ParallelCoordinates.prototype.drawAxis_ = function(dimIndex,
                                                           opt_uniqId) {
  var dim = this.options.dims[dimIndex];
  var id = opt_uniqId == null ? dim : opt_uniqId;

  var svgSize = this.getSVGSize();
  var yScale = this.yScales[dimIndex];

  var axis = d3.axisLeft()
    .tickValues(this.options.ticks ? yScale.domain() : [])
    .scale(yScale);

  var g = this.svgAxes.select('#axis' + id);
  var gTransform = visflow.utils.getTransform([
    this.xScale(dimIndex),
    0
  ]);
  if (g.empty()) {
    g = this.svgAxes.append('g').datum(id)
      .attr('id', 'axis' + id)
      .classed('axis', true)
      .attr('transform', gTransform);
  }
  g.call(axis);
  var updatedG = this.allowTransition ? g.transition() : g;
  updatedG
    .style('opacity', 1)
    .attr('transform', gTransform);

  if (this.options.axisLabel) {
    var label = g.select('.vis-label');
    var labelTransform = visflow.utils.getTransform([
      0,
      svgSize.height - visflow.ParallelCoordinates.AXIS_LABEL_OFFSET
    ]);
    if (label.empty()) {
      label = g.append('text')
        .classed('vis-label', true)
        .attr('transform', labelTransform);
    }
    var data = this.ports['in'].pack.data;
    var updatedLabel = this.allowTransition ? label.transition() : label;
    updatedLabel
      .style('opacity', 1)
      .attr('transform', labelTransform)
      .text(data.dimensions[dim]);
  } else {
    _.fadeOut(g.select('.vis-label'));
  }
};

/**
 * Computes the bottom margin based
 */

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.prepareScales = function() {
  var svgSize = this.getSVGSize();

  this.updateBottomMargin_();

  var yRange = [
    svgSize.height - this.margins.bottom,
    this.plotMargins().top
  ];

  var inpack = this.ports['in'].pack;
  var data = inpack.data;
  var items = inpack.items;

  this.options.dims.forEach(function(dim, index) {
    var yScaleInfo = visflow.scales.getScale(data, dim, items, yRange);
    this.yScales[index] = yScaleInfo.scale;
    this.yScaleTypes[index] = yScaleInfo.type;
  }, this);

  // Draw x secondly, as leftMargin depends on the first y-axis.
  this.updateLeftRightMargins_();

  this.xScale = d3.scaleLinear()
    .domain([0, this.options.dims.length - 1])
    .range([
      this.margins.left,
      svgSize.width - this.margins.right
    ]);
};

/**
 * Finds all non-categorical dimensions.
 * @return {!Array<number>}
 */
visflow.ParallelCoordinates.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var dims = [];
  data.dimensionTypes.forEach(function(type, index) {
    if (type == visflow.ValueType.STRING) {
      return;
    }
    if (dims.length < visflow.ParallelCoordinates.DEFAULT_NUM_DIMENSIONS) {
      dims.push(index);
    }
  }, this);
  return dims;
};

/**
 * Updates the bottom margin based on ticks visibility.
 * @private
 */
visflow.ParallelCoordinates.prototype.updateBottomMargin_ = function() {
  this.margins.bottom = this.plotMargins().bottom +
    (this.options.axisLabel ? this.TICKS_HEIGHT : 0);
};

/**
 * Updates the left and right margin of the plot based on leftmost and rightmost
 * axis labels.
 * @private
 */
visflow.ParallelCoordinates.prototype.updateLeftRightMargins_ = function() {
  var margins = this.plotMargins();
  this.margins.left = margins.left;
  this.margins.right = margins.right;

  var leftLabelWidth = 0;
  var rightLabelWidth = 0;
  var maxLength = 0;
  if (this.options.ticks && this.yScales.length) {
    // Id is required for axis drawing routine.
    this.drawTempAxis_(0, '0', function() {
      $(this.svgTempAxes_.node())
        .find('#axis0 > .tick > text')
        .each(function(index, element) {
          maxLength = Math.max(maxLength, element.getBBox().width);
        });
      if (this.options.axisLabel) {
        leftLabelWidth = $(this.svgTempAxes_.node())
          .find('.vis-label')[0].getBBox().width;
      }
    }.bind(this));
  }
  if (this.options.axisLabel && this.yScales.length) {
    // Though this is the last axis, we still apply Id '0'.
    this.drawTempAxis_(this.options.dims.length - 1, '0', function() {
      rightLabelWidth = $(this.svgTempAxes_.node())
        .find('.vis-label')[0].getBBox().width;
    }.bind(this));
  }

  this.margins.left += Math.max(leftLabelWidth / 2, maxLength +
    visflow.ParallelCoordinates.AXIS_TICK_OFFSET);
  this.margins.right += rightLabelWidth / 2;
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.dataChanged = function() {
  this.options.dims = this.findPlotDimensions();
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.dimensionChanged = function() {
  this.itemProps_ = this.getItemProperties_();
  visflow.ParallelCoordinates.base.dimensionChanged.call(this);
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.inputChanged = function() {
  this.itemProps_ = this.getItemProperties_();
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.selectedChanged = function() {
  this.itemProps_ = this.getItemProperties_();
};
