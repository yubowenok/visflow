/**
 * @fileoverview VisFlow parallel coordinates visualization.
 */

'use strict';

/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.ParallelCoordinates = function(params) {
  visflow.ParallelCoordinates.base.constructor.call(this, params);

  /**
   * Dimensions of parallel coordinates.
   * @protected {!Array<number>}
   */
  this.dimensions = [];

  /**
   * Brush stroke points.
   * @private {!Array<{x: number, y:number}>}
   */
  this.brushPoints_ = [];

  /**
   * Mapping from axes indexes to x coordinates.
   * @protected {!d3.scale}
   */
  this.xScale = d3.scale.linear();

  /**
   * Mapping from data dimension domain to screen y coordinates.
   * @protected {!Array<!d3.scale>}
   */
  this.yScales = [];

  /**
   * yScale types.
   * @protected {!Array<string>}
   */
  this.yScaleTypes = [];

  /**
   * SVG group for polylines.
   * @private {d3.selection}
   */
  this.svgPolylines_;

  /**
   * SVG group for axes.
   * @private {d3.selection}
   */
  this.svgAxes_;

  /**
   * Left margin computed based on the leftmost axis label.
   * @private {number}
   */
  this.leftMargin_ = 0;

  /**
   * Right margin computed based on the rightmost axis label.
   * @private {number}
   */
  this.rightMargin_ = 0;
};

visflow.utils.inherit(visflow.ParallelCoordinates, visflow.Visualization);

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.PANEL_TEMPLATE =
    './src/visualization/parallel-coordinates/parallel-coordinates-panel.html';
/** @inheritDoc */
visflow.ParallelCoordinates.prototype.NODE_CLASS = 'parallel-coordinates';
/** @inheritDoc */
visflow.ParallelCoordinates.prototype.MINIMIZED_CLASS =
  'parallelcoordinates-icon square-icon';
/** @inheritDoc */
visflow.ParallelCoordinates.prototype.PLOT_NAME = 'ParallelCoordinates';

/**
 * Axis label size.
 * @private @const {number}
 */
visflow.ParallelCoordinates.prototype.LABEL_FONT_SIZE_ = 6;

/**
 * Offset from the leftmost axis to the tick text.
 * @private @const {number}
 */
visflow.ParallelCoordinates.prototype.AXIS_TICK_OFFSET_ = 8;

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.PLOT_MARGINS = {
  left: 5,
  right: 5,
  top: 10,
  bottom: 20
};
/**
 * Y offset of the axes labels, to the plot bottom.
 * @private @const {number}
 */
visflow.ParallelCoordinates.prototype.AXIS_LABEL_OFFSET_ = 5;


/** @inheritDoc */
visflow.ParallelCoordinates.prototype.defaultProperties = {
  color: 'black',
  size: 1,
  fill: 'none',
  opacity: 0.5
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.selectedProperties = {
  color: '#6699ee'
};


/** @inheritDoc */
visflow.ParallelCoordinates.prototype.init = function() {
  visflow.Scatterplot.base.init.call(this);
  this.svgPolylines_ = this.svg.append('g')
    .classed('polylines', true);
  this.svgAxes_ = this.svg.append('g')
    .classed('axes', true);
};


/** @inheritDoc */
visflow.ParallelCoordinates.prototype.serialize = function() {
  var result = visflow.ParallelCoordinates.base.serialize.call(this);
  result.dimensions = this.dimensions;
  return result;
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.deserialize = function(save) {
  visflow.ParallelCoordinates.base.deserialize.call(this, save);

  this.dimensions = save.dimensions;
  if (this.dimensions == null) {
    visflow.error('dimensions not saved for ' + this.PLOT_NAME);
    this.dimensions = [0, 0];
  }
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.selectItems = function() {
  this.selectItemsIntersectLasso_();
};

/**
 * Selects the items intersecting user lasso.
 * @private
 */
visflow.ParallelCoordinates.prototype.selectItemsIntersectLasso_ = function() {
  if (!visflow.interaction.shifted) {
    this.selected = {};
  }

  var brush = this.brushPoints_;
  var startPos = _(brush).first();
  var endPos = _(brush).last();
  if (startPos.x == endPos.x && startPos.y == endPos.y) {
    return;
  }

  var inpack = this.ports['in'].pack,
    items = inpack.items,
    values = inpack.data.values;

  var points = [];
  this.dimensions.forEach(function(dim, dimIndex) {
    points[dimIndex] = [this.xScale(dimIndex)];
  }, this);

  for (var index in items) {
    if (this.selected[index] != null) {
      // Already selected.
      continue;
    }
    this.dimensions.forEach(function(dim, dimIndex) {
      var value = values[index][dim];
      points[dimIndex][1] = this.yScales[dimIndex](value);
    }, this);
    var hit = 0;
    for (var dimIndex = 0; dimIndex < this.dimensions.length - 1 && !hit;
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
  this.showDetails();
  this.pushflow();
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
  this.drawPolylines_();
  this.showSelection();
  this.drawAxes_();
};

/**
 * Renders the parallel coordinates polylines.
 * @private
 */
visflow.ParallelCoordinates.prototype.drawPolylines_ = function() {
  var inpack = this.ports['in'].pack,
    items = inpack.items,
    data = inpack.data,
    values = data.values;

  // Data to be rendered.
  var itemProps = [];
  for (var index in items) {
    var prop = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        id: 'l' + index,
        points: []
      }
    );
    if (index in this.selected) {
      _(prop).extend(this.selectedProperties);
      for (var p in this.selectedMultiplier) {
        if (p in prop) {
          prop[p] *= this.selectedMultiplier[p];
        }
      }
    }

    this.dimensions.forEach(function(dim, dimIndex) {
      var value = values[index][dim];
      prop.points.push([
        this.xScale(dimIndex),
        this.yScales[dimIndex](value)
      ])
    }, this);
    itemProps.push(prop);
  }

  var lines = this.svgPolylines_.selectAll('path').data(itemProps,
    function(prop) {
      return prop.id;
    });
  lines.enter().append('path')
    .attr('id', _.getValue('id'));
  lines.exit().transition()
    .style('opacity', 0)
    .remove();

  var line = d3.svg.line().interpolate('linear');
  var updatedLines = this.allowTransition_ ? lines.transition() : lines;
  updatedLines
    .attr('d', function(prop) {
      return line(prop.points);
    })
    .style('stroke', _.getValue('color'))
    .style('stroke-width', _.getValue('size'))
    .style('opacity', _.getValue('opacity'));
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.showSelection = function() {
  // Change position of tag to make them appear on top.
  var svg = $(this.svgPolylines_.node());
  for (var index in this.selected) {
    svg.find('path#l' + index).appendTo(svg);
  }
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.initPanel = function(container) {
  visflow.ParallelCoordinates.base.initPanel.call(this, container);
  var data = this.ports['in'].pack.data;
  var dimensionList = data.dimensions.map(function(dim, index) {
    return {
      id: index,
      text: dim
    };
  });

  var list = new visflow.EditableList({
    container: container.find('#dims'),
    list: dimensionList,
    selected: this.dimensions,
    listTitle: 'Dimensions',
    addTitle: 'Add Dimension'
  });
  $(list).on('visflow.change', function(event, items) {
    this.dimensions = items;
    this.dimensionChanged();
  }.bind(this));
};

/**
 * Creates a unique dimension array for potentially duplicated dimensions.
 * @private
 * @return {!Array<{dim: number, uniqueDim: string}>}
 */
visflow.ParallelCoordinates.prototype.uniqueDimensions_ = function() {
  var result = [];
  var counter = {};
  this.dimensions.forEach(function(dim) {
    if (!(dim in counter)) {
      counter[dim] = 0;
    }
    result.push({
      uniqId: dim + '-' + (++counter[dim]),
      dim: dim
    });
  });
  return result;
};

/**
 * Renders the parallel coordinates axes.
 * @private
 */
visflow.ParallelCoordinates.prototype.drawAxes_ = function() {
  // Clear extra axes when dimension changes.
  var dimInfos = this.uniqueDimensions_();
  var uniqIds = dimInfos.map(function(dimInfo) {
    return dimInfo.uniqId;
  });
  this.svgAxes_.selectAll('g.axis').data(uniqIds, _.identity).exit()
    .transition()
    .style('opacity', 0)
    .remove();
  dimInfos.forEach(function(dimInfo, dimIndex) {
    this.drawAxis_(dimIndex, dimInfo.uniqId);
  }, this);
};

/**
 * Shows the parallel coordinate axis for one dimension.
 * @param {number} dimIndex Index of dimension in this.dimensions.
 * @param {string=} opt_uniqId Distinct dimension id.
 */
visflow.ParallelCoordinates.prototype.drawAxis_ = function(dimIndex,
                                                           opt_uniqId) {
  var dim = this.dimensions[dimIndex];
  var id = opt_uniqId == null ? dim : opt_uniqId;

  var svgSize = this.getSVGSize();
  var yScale = this.yScales[dimIndex];
  var axis = d3.svg.axis()
    .orient('left')
    .tickValues(yScale.domain());

  if (this.yScaleTypes[dimIndex] == 'ordinal'){
    axis.scale(yScale.copy().rangePoints(yScale.range()));
  } else {
    axis.scale(yScale.copy());
  }

  var data = this.ports['in'].pack.data;

  var g = this.svgAxes_.select('#axis' + id).datum(id);
  var gTransform = visflow.utils.getTransform([
    this.xScale(dimIndex),
    0
  ]);
  if (g.empty()) {
    g = this.svgAxes_.append('g')
      .attr('id', 'axis' + id)
      .classed('axis', true)
      .attr('transform', gTransform);
  }
  g.call(axis);
  var updatedG = this.allowTransition_ ? g.transition() : g;
  updatedG.attr('transform', gTransform);


  var label = g.select('.vis-label');
  var labelTransform = visflow.utils.getTransform([
    0,
    svgSize.height - this.AXIS_LABEL_OFFSET_
  ]);
  if (label.empty()) {
    label = g.append('text')
      .classed('vis-label', true)
      .attr('transform', labelTransform);
  }
  var updatedLabel = this.allowTransition_ ? label.transition() : label;
  updatedLabel
    .attr('transform', labelTransform)
    .text(data.dimensions[dim]);
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.prepareScales = function() {
  var svgSize = this.getSVGSize();
  var yRange = [
    svgSize.height - this.PLOT_MARGINS.bottom,
    this.PLOT_MARGINS.top
  ];

  var inpack = this.ports['in'].pack;
  var data = inpack.data;
  var items = inpack.items;

  this.dimensions.forEach(function(dim, index) {
    var yScaleInfo = visflow.utils.getScale(data, dim, items, yRange);
    this.yScales[index] = yScaleInfo.scale;
    this.yScaleTypes[index] = yScaleInfo.type;
  }, this);

  // Draw x secondly, as leftMargin depends on the first y-axis.
  this.updateLeftRightMargins_();

  this.xScale = d3.scale.linear()
    .domain([0, this.dimensions.length - 1])
    .range([
      this.leftMargin_,
      svgSize.width - this.rightMargin_
    ]);
};


/**
 * Finds all non-categorical dimensions.
 * @returns {!Array<number>}
 */
visflow.ParallelCoordinates.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var dimensions = [];
  data.dimensionTypes.forEach(function(type, index) {
    if (type == 'string') {
      return;
    }
    dimensions.push(index);
  });
  return dimensions;
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.dataChanged = function() {
  this.dimensions = this.findPlotDimensions();
};

/**
 * Updates the left and right margin of the plot based on leftmost and rightmost
 * axis labels.
 * @private
 */
visflow.ParallelCoordinates.prototype.updateLeftRightMargins_ = function() {
  if (this.dimensions.length == 0) {
    return;
  }

  this.drawAxis_(0);
  // Remove axis0 to avoid transition different from other axes.
  this.svgAxes_.select('#axis' + this.dimensions[0]).remove();

  var maxLength = Math.max.apply(this,
    $(this.svgAxes_.node())
      .find('#axis0 > .tick > text')
      .map(function() {
        return $(this).text().length;
      })
  );
  var data = this.ports['in'].pack.data;
  var axisLabelMargin = data.dimensions[_(this.dimensions).first()].length / 2 *
      this.LABEL_FONT_SIZE_;
  var axisTickMargin = maxLength * this.LABEL_FONT_SIZE_ +
      this.AXIS_TICK_OFFSET_;

  this.leftMargin_ = Math.max(axisLabelMargin, axisTickMargin) +
      this.PLOT_MARGINS.left;
  this.rightMargin_ = this.PLOT_MARGINS.right +
      data.dimensions[_(this.dimensions).last()].length / 2 *
      this.LABEL_FONT_SIZE_;
};
