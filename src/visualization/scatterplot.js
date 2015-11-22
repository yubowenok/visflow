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

  // Scale types.
  /** @type {string} */
  this.xScaleType = null;
  /** @type {string} */
  this.yScaleType = null;

  /**
   * SVG group for points.
   * @private {jQuery}
   */
  this.svgPoints_;

  /**
   * @protected {number}
   */
  this.leftMargin_ = 0;

  // 0: X axis, 1: Y axis
  this.selectDimensions = [];

  /**
   * Whether rendering should be using transition. When the view is resized,
   * the view shall be re-rendered without transition.
   * @private {boolean}
   */
  this.allowTransition_ = false;
};

visflow.utils.inherit(visflow.Scatterplot, visflow.Visualization);

/** @inheritDoc */
visflow.Scatterplot.prototype.NODE_CLASS = 'scatterplot';
/** @inheritDoc */
visflow.Scatterplot.prototype.PLOT_NAME = 'Scatterplot';
/** @inheritDoc */
visflow.Scatterplot.prototype.MINIMIZED_CLASS = 'scatterplot-icon square-icon';
/** @inheritDoc */
visflow.Scatterplot.prototype.PANEL_TEMPLATE =
    './src/visualization/scatterplot-panel.html';

/** @private @const {number} */
visflow.Scatterplot.prototype.LABEL_OFFSET_ = 5;
/** @private @const {number} */
visflow.Scatterplot.prototype.LABEL_FONT_SIZE_ = 5;
/** @private @const {number} */
visflow.Scatterplot.prototype.DEFAULT_TICKS_ = 5;

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
  size: 3
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectedProperties = {
  color: 'white',
  border: '#FF4400'
};

/** @inheritDoc */
visflow.Scatterplot.prototype.init = function() {
  visflow.Scatterplot.base.init.call(this);
  this.svgPoints_ = this.svg.append('g')
    .classed('points', true);
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
    visflow.error('dimensions not saved for ' + this.plotName);
    var dims = this.findPlotDimensions_();
    this.xDim = dims.x;
    this.yDim = dims.y;
  }
};

/**
 * Selects the data items in the range selection box.
 * @param {!Array<!Array<number>>} box
 */
visflow.Scatterplot.prototype.selectItemsInBox = function(box) {
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
    };
  }
  this.showDetails();
  this.pushflow();
};

/**
 * Displays the range selection box.
 */
visflow.Scatterplot.prototype.showSelectbox = function(selectbox) {
  var box = this.svg.select('.vis-selectbox');
  if (box.empty()) {
    this.selectbox = this.svg.append('rect')
      .attr('class', 'vis-selectbox');
  }
  box
    .attr('x', selectbox.x1)
    .attr('y', selectbox.y1)
    .attr('width', selectbox.x2 - selectbox.x1)
    .attr('height', selectbox.y2 - selectbox.y1);
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
    svg.find('#i' + index).appendTo(svg);
  }
};

/**
 * Updates the left margin of the plot based on the longest label for y-axis.
 * @private
 */
visflow.Scatterplot.prototype.updateLeftMargin_ = function() {
  this.drawYAxis_();

  var maxLength = Math.max.apply(this,
    $(this.svg.node())
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
  var inpack = this.ports['in'].pack;
  var data = inpack.data;
  var dimensionList = data.dimensions.map(function(dimName, index) {
    return {
      id: index,
      text: dimName
    }
  });
  var xSelect = container.children('#x-dim').children('select');
  xSelect.select2({
    data: dimensionList
  });
  var ySelect = container.children('#y-dim').children('select');
  ySelect.select2({
    data: dimensionList
  });

  container.find('.select2-container')
    .css('width', '100%');
  /*
  var node = this;
  [0, 1].map(function(d) {
    this.selectDimensions[d] = new visflow.Select({
      id: d,
      label: (!d ? 'X' : 'Y' ) + ' Axis',
      target: this.jqoptions,
      list: this.prepareDimensionList(),
      relative: true,
      value: this.dimensions[d],
      change: function(event) {
        var unitChange = event.unitChange;
        node.dimensions[unitChange.id] = unitChange.value;
        node.pushflow();
        node.showDetails(true);
      }
    });
  }, this);
  */
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
    if (this.selected[index]) {
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
    .attr('id', _.getValue('id'));
  points.exit().remove();

  var updatePoints = this.allowTransition_ ? points.transition() : points;
  updatePoints
    .attr('cx', _.getValue('cx'))
    .attr('cy', _.getValue('cy'))
    .attr('r', _.getValue('size'))
    .attr('fill', _.getValue('color'))
    .attr('stroke', _.getValue('border'))
    .attr('stroke-width', _.getValue('width'));
};

/**
 * Renders an axis label.
 * @param {{
 *   svg: !d3.selection,
 *   scale: !d3.scale,
 *   classes: string,
 *   orient: string,
 *   ticks: number,
 *   transform: string,
 *   label: {
 *     text: string,
 *     transform: string
 *   }
 * }} params
 * @private
 */
visflow.Scatterplot.prototype.drawAxis_ = function(params) {
  var svg = params.svg;
  var axis = d3.svg.axis()
    .orient(params.orient)
    .ticks(params.ticks);
  axis.scale(params.scale.copy());

  if(svg.empty()) {
    svg = this.svg.append('g')
      .classed(params.classes, true);
  }
  svg
    .attr('transform', params.transform)
    .call(axis);

  var label = svg.select('.vis-label');
  if (label.empty()) {
    label = svg.append('text')
      .classed('vis-label', true);
  }
  label
    .text(params.label.text)
    .attr('transform', params.label.transform);
};

/**
 * Renders the x-axis.
 * @private
 */
visflow.Scatterplot.prototype.drawXAxis_ = function() {
  var svgSize = this.getSVGSize();
  var data = this.ports['in'].pack.data;
  this.drawAxis_({
    svg: this.svg.select('.x.axis'),
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
        -5
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
  this.drawAxis_({
    svg: this.svg.select('.y.axis'),
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
  var yScaleInfo = visflow.utils.getScale(data, this.yDim, items, yRange);
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
  var xScaleInfo = visflow.utils.getScale(data, this.xDim, items, xRange);
  this.xScale = xScaleInfo.scale;
  this.xScaleType = xScaleInfo.type;
};

/**
 * Finds two reasonable dimensions to show.
 * @return {{x: number, y: number}}
 * @private
 */
visflow.Scatterplot.prototype.findPlotDimensions_ = function() {
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
  // When data is changed, scatterplot shall find two reasonable dimensions to
  // show as the user has not made any decisions on dimensions yet.
  var dims = this.findPlotDimensions_();
  this.xDim = dims.x;
  this.yDim = dims.y;
  visflow.Scatterplot.base.dataChanged.call(this);
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectAll = function() {
  visflow.Scatterplot.base.selectAll.call(this);
  this.showDetails();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.clearSelection = function() {
  visflow.Scatterplot.base.clearSelection.call(this);
  this.showDetails(); // TODO　not efficient
};

/** @inhertiDoc */
visflow.Scatterplot.prototype.resize = function() {
  this.allowTransition_ = false;
  visflow.Scatterplot.base.resize.call(this);
  this.allowTransition_ = true;
};