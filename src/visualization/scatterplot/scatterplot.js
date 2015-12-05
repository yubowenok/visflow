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

  // Dimension indices.
  /** @type {number} */
  this.xDim = 0;
  /** @type {number} */
  this.yDim = 0;

  // Rendering scales.
  /** @type {!d3.scale} */
  this.xScale = d3.scale.linear();
  /** @type {!d3.scale} */
  this.yScale = d3.scale.linear();

  /** @type {string} */
  this.xScaleType = null;

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
};

visflow.utils.inherit(visflow.Scatterplot, visflow.Visualization);

/** @inheritDoc */
visflow.Scatterplot.prototype.NODE_CLASS = 'scatterplot';
/** @inheritDoc */
visflow.Scatterplot.prototype.NODE_NAME = 'Scatterplot';
/** @inheritDoc */
visflow.Scatterplot.prototype.PANEL_TEMPLATE =
    './src/visualization/scatterplot/scatterplot-panel.html';


/** @private @const {number} */
visflow.Scatterplot.prototype.LABEL_FONT_SIZE_ = 5.5;

/**
 * Margin space for axes.
 * @const {!Array<{before:number, after:number}>}
 */
visflow.Scatterplot.prototype.PLOT_MARGINS = {
  left: 15,
  right: 10,
  top: 10,
  bottom: 20
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
visflow.Scatterplot.prototype.serialize = function() {
  var result = visflow.Scatterplot.base.serialize.call(this);
  result.xDim = this.xDim;
  result.yDim = this.yDim;
  return result;
};

/** @inheritDoc */
visflow.Scatterplot.prototype.deserialize = function(save) {
  visflow.Scatterplot.base.deserialize.call(this, save);

  this.xDim = save.xDim;
  this.yDim = save.yDim;
  if (this.xDim == null || this.yDim == null) {
    visflow.error('dimensions not saved for ' + this.NODE_NAME);
    var dims = this.findPlotDimensions();
    this.xDim = dims.x;
    this.yDim = dims.y;
  }
};


/** @inheritDoc */
visflow.Scatterplot.prototype.drawBrush = function() {
  this.drawSelectBox();
};


/** @inheritDoc */
visflow.Scatterplot.prototype.selectItems = function() {
  this.selectItemsInBox_();
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
  var inpack = this.ports['in'].pack,
      items = inpack.items,
      values = inpack.data.values;
  for (var index in items) {

    var point = {
      x: this.xScale(values[index][this.xDim]),
      y: this.yScale(values[index][this.yDim])
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
  this.drawPoints_();
  this.showSelection();
  this.drawAxes_();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.showSelection = function() {
  // Change position of tag to make them appear on top.
  var svg = $(this.svgPoints_.node());
  for (var index in this.selected) {
    svg.find('circle#p' + index).appendTo(svg);
  }
};

/**
 * Updates the left margin of the plot based on the longest label for y-axis.
 * @private
 */
visflow.Scatterplot.prototype.updateLeftMargin_ = function() {
  this.drawYAxis_();

  var maxLength = Math.max.apply(this,
    $(this.svgAxes_.node())
      .find('.y.axis > .tick > text')
      .map(function() {
        return $(this).text().length;
      })
  );
  // In case the input data is empty.
  maxLength = Math.max(maxLength, 0);

  this.leftMargin_ = this.PLOT_MARGINS.left + maxLength * this.LABEL_FONT_SIZE_;
};

/** @inheritDoc */
visflow.Scatterplot.prototype.initPanel = function(container) {
  visflow.Scatterplot.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

  var xSelect = new visflow.Select({
    container: container.find('#x-dim'),
    list: dimensionList,
    selected: this.xDim,
    listTitle: 'X Dimension'
  });
  $(xSelect).on('visflow.change', function(event, dim) {
    this.xDim = dim;
    this.dimensionChanged();
  }.bind(this));
  var ySelect = new visflow.Select({
    container: container.find('#y-dim'),
    list: dimensionList,
    selected: this.yDim,
    listTitle: 'Y Dimension'
  });
  $(ySelect).on('visflow.change', function(event, dim) {
    this.yDim = dim;
    this.dimensionChanged();
  }.bind(this));
};

/**
 * Renders the scatterplot points.
 * @private
 */
visflow.Scatterplot.prototype.drawPoints_ = function() {
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
        id: 'p' + index,
        cx: this.xScale(values[index][this.xDim]),
        cy: this.yScale(values[index][this.yDim])
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

  var points = this.svgPoints_.selectAll('circle')
    .data(itemProps, _.getValue('id'));
  points.enter().append('circle')
    .attr('id', _.getValue('id'))
    .style('opacity', 0);
  _(points.exit()).fadeOut();

  var updatedPoints = this.allowTransition_ ? points.transition() : points;
  updatedPoints
    .attr('cx', _.getValue('cx'))
    .attr('cy', _.getValue('cy'))
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
    classes: 'x axis',
    orient: 'bottom',
    ticks: this.DEFAULT_TICKS_,
    transform: visflow.utils.getTransform([
      0,
      svgSize.height - this.PLOT_MARGINS.bottom
    ]),
    label: {
      text: data.dimensions[this.xDim],
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
    classes: 'y axis',
    orient: 'left',
    ticks: this.DEFAULT_TICKS_,
    transform: visflow.utils.getTransform([
      this.leftMargin_,
      0
    ]),
    label: {
      text: data.dimensions[this.yDim],
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

  var svgSize = this.getSVGSize();
  var yRange = [
    svgSize.height - this.PLOT_MARGINS.bottom,
    this.PLOT_MARGINS.top
  ];
  var yScaleInfo = visflow.utils.getScale(data, this.yDim, items, yRange, {
    domainMargin: 0.1,
    ordinalPadding: 1.0
  });
  this.yScale = yScaleInfo.scale;

  // Compute new left margin based on selected y dimension.
  // xScale has to be created after yScale because the left margin depends on
  // yScale's domain.
  this.updateLeftMargin_();

  var xRange = [
    this.leftMargin_,
    svgSize.width - this.PLOT_MARGINS.right
  ];
  var xScaleInfo = visflow.utils.getScale(data, this.xDim, items, xRange, {
    domainMargin: 0.1,
    ordinalPadding: 1.0
  });
  this.xScale = xScaleInfo.scale;
  this.xScaleType = xScaleInfo.type;
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
    if (data.dimensionTypes[i] != 'string') {
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
  visflow.Scatterplot.base.dataChanged.call(this);
  // When data is changed, scatterplot shall find two reasonable dimensions to
  // show as the user has not made any decisions on dimensions yet.
  var dims = this.findPlotDimensions();
  this.xDim = dims.x;
  this.yDim = dims.y;
};
