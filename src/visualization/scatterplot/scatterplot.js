/**
 * @fileoverview VisFlow scatterplot visualization.
 */

'use strict';

/**
 * @param {Object} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Scatterplot = function(params) {
  visflow.Scatterplot.base.constructor.call(this, params);

  // Rendering scales.
  /** @type {!d3.scale} */
  this.xScale = d3.scale.linear();
  /** @type {!d3.scale} */
  this.yScale = d3.scale.linear();

  /** @type {string} */
  this.xScaleType;
  /** @type {string */
  this.yScaleType;

  /**
   * SVG group for points.
   * @private {d3.selection}
   */
  this.svgPoints_;
  /**
   * SVG group for axes.
   * @private {d3.selection}
   */
  this.svgAxes_;

  /**
   * Left margin computed based on the y Axis labels.
   * @private {number}
   */
  this.leftMargin_ = 0;
  /**
   * Bottom margin that depends on xTicks.
   * @private {number}
   */
  this.bottomMargin_ = 0;

  /**
   * Rendering properties for points.
   * @private {!Array}
   */
  this.itemProps_ = [];
};

visflow.utils.inherit(visflow.Scatterplot, visflow.Visualization);

/** @inheritDoc */
visflow.Scatterplot.prototype.NODE_CLASS = 'scatterplot';
/** @inheritDoc */
visflow.Scatterplot.prototype.NODE_NAME = 'Scatterplot';
/** @inheritDoc */
visflow.Scatterplot.prototype.PANEL_TEMPLATE =
    './src/visualization/scatterplot/scatterplot-panel.html';

/** @inheritDoc */
visflow.Scatterplot.prototype.DEFAULT_OPTIONS = {
  // X dimension.
  xDim: 0,
  // Y dimension.
  yDim: 0,
  // Show x-axis ticks.
  xTicks: true,
  // Show y-axis ticks.
  yTicks: true,
  // Margin percentage of x.
  xMargin: 0.1,
  // Margin percentage of y.
  yMargin: 0.1
};

/** @inheritDoc */
visflow.Scatterplot.prototype.defaultProperties = {
  color: '#333',
  border: 'black',
  width: 1,
  size: 3,
  opacity: 1
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectedProperties = {
  color: 'white',
  border: '#6699ee'
};

/** @inheritDoc */
visflow.Scatterplot.prototype.init = function() {
  visflow.Scatterplot.base.init.call(this);
  this.svgPoints_ = this.svg.append('g')
    .classed('points', true);
  this.svgAxes_ = this.svg.append('g')
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
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var values = inpack.data.values;
  for (var index in items) {
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
  for (var index in this.selected) {
    svg.children('circle#' + index).appendTo(svg);
  }
};

/**
 * Updates the bottom margin based on the xTicks.
 * @private
 */
visflow.Scatterplot.prototype.updateBottomMargin_ = function() {
  this.bottomMargin_ = this.PLOT_MARGINS.bottom +
    (this.options.xTicks ? this.TICKS_HEIGHT_ : 0);
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
  this.leftMargin_ = this.PLOT_MARGINS.left ;
  if (this.options.yTicks) {
    this.drawYAxis_();
    var maxLength = 0;
    $(this.svgAxes_.node())
      .find('.y.axis > .tick > text')
      .each(function(index, element) {
        maxLength = Math.max(maxLength, element.getBBox().width);
      });
    // In case the input data is empty.
    if (maxLength == 0) {
      maxLength = 0;
    }
    this.leftMargin_ += maxLength;
  }
  if (tempShow) {
    this.content.hide();
  }
};

/** @inheritDoc */
visflow.Scatterplot.prototype.initPanel = function(container) {
  visflow.Scatterplot.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#x-dim'),
        list: dimensionList,
        selected: this.options.xDim,
        listTitle: 'X Dimension'
      },
      change: function(event, dim) {
        this.options.xDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#y-dim'),
        list: dimensionList,
        selected: this.options.yDim,
        listTitle: 'Y Dimension'
      },
      change: function(event, dim) {
        this.options.yDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#x-ticks'),
        value: this.options.xTicks,
        title: 'X Ticks'
      },
      change: function(event, value) {
        this.options.xTicks = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#y-ticks'),
        value: this.options.yTicks,
        title: 'Y Ticks'
      },
      change: function(event, value) {
        this.options.yTicks = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#x-margin'),
        value: this.options.xMargin,
        title: 'X Domain Margin',
        accept: visflow.ValueType.FLOAT,
        scrollDelta: 0.05,
        range: [0, 100]
      },
      change: function(event, value) {
        this.options.xMargin = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Input,
      params: {
        container: container.find('#y-margin'),
        value: this.options.yMargin,
        title: 'Y Domain Margin',
        accept: visflow.ValueType.FLOAT,
        scrollDelta: 0.05,
        range: [0, 100]
      },
      change: function(event, value) {
        this.options.yMargin = value;
        this.layoutChanged();
      }
    }
  ];
  this.initInterface(units);
};

/**
 * Computes the rendering properties for points.
 * @return {!Array}
 * @private
 */
visflow.Scatterplot.prototype.getItemProperties_ = function() {
  var inpack = this.ports['in'].pack;
  var values = inpack.data.values;
  var items = inpack.items;
  var itemProps = [];
  for (var index in items) {
    var prop = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        index: index,
        x: values[index][this.options.xDim],
        y: values[index][this.options.yDim]
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
  points.enter().append('circle')
    .attr('id', _.getValue('index'));
  _(points.exit()).fadeOut();

  var updatedPoints = this.transitionFeasible() ? points.transition() : points;
  updatedPoints
    .attr('cx', function(point) {
      return this.xScale(point.x);
    }.bind(this))
    .attr('cy', function(point) {
      return this.yScale(point.y);
    }.bind(this))
    .attr('r', _.getValue('size'))
    .style('fill', _.getValue('color'))
    .style('stroke', _.getValue('border'))
    .style('stroke-width', _.getValue('width'))
    .style('opacity', _.getValue('opacity'));
};

/**
 * Renders the x-axis.
 * @private
 */
visflow.Scatterplot.prototype.drawXAxis_ = function() {
  var svgSize = this.getSVGSize();
  var data = this.ports['in'].pack.data;
  this.drawAxis({
    svg: this.svgAxes_.select('.x.axis'),
    scale: this.xScale,
    scaleType: this.xScaleType,
    classes: 'x axis',
    orient: 'bottom',
    ticks: this.DEFAULT_TICKS_,
    noTicks: !this.options.xTicks,
    transform: visflow.utils.getTransform([
      0,
      svgSize.height - this.bottomMargin_
    ]),
    label: {
      text: data.dimensions[this.options.xDim],
      transform: visflow.utils.getTransform([
        svgSize.width - this.PLOT_MARGINS.right,
        -this.LABEL_OFFSET_
      ])
    }
  });
};

/**
 * Renders the y-axis
 * @private
 */
visflow.Scatterplot.prototype.drawYAxis_ = function() {
  var data = this.ports['in'].pack.data;
  this.drawAxis({
    svg: this.svgAxes_.select('.y.axis'),
    scale: this.yScale,
    scaleType: this.yScaleType,
    classes: 'y axis',
    orient: 'left',
    ticks: this.DEFAULT_TICKS_,
    noTicks: !this.options.yTicks,
    transform: visflow.utils.getTransform([
      this.leftMargin_,
      0
    ]),
    label: {
      text: data.dimensions[this.options.yDim],
      transform: visflow.utils.getTransform([
        this.LABEL_OFFSET_,
        this.PLOT_MARGINS.top
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
  var inpack = this.ports['in'].pack;
  var items = inpack.items,
      data = inpack.data;

  this.updateBottomMargin_();

  var svgSize = this.getSVGSize();
  var yRange = [
    svgSize.height - this.bottomMargin_,
    this.PLOT_MARGINS.top
  ];
  var yScaleInfo = visflow.scales.getScale(data, this.options.yDim, items, yRange, {
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
    this.leftMargin_,
    svgSize.width - this.PLOT_MARGINS.right
  ];
  var xScaleInfo = visflow.scales.getScale(data, this.options.xDim, items, xRange, {
    domainMargin: this.options.xMargin,
    ordinalPadding: 1.0
  });
  this.xScale = xScaleInfo.scale;
  this.xScaleType = xScaleInfo.type;
};

/** @inheritDoc */
visflow.Scatterplot.prototype.transitionFeasible = function() {
  return this.allowTransition_ &&
    this.itemProps_.length < this.TRANSITION_ELEMENT_LIMIT_;
};

/**
 * Finds two reasonable dimensions to show.
 * @return {{x: number, y: number}}
 * @override
 */
visflow.Scatterplot.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var chosen = [];
  for (var i in data.dimensionTypes) {
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
