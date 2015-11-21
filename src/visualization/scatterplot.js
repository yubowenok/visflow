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
  this.xDim = 1;
  /** @type {number} */
  this.yDim = 4;

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

  // 0: X axis, 1: Y axis
  this.dimensions = [0, 0];
  this.selectDimensions = [];
};

visflow.utils.inherit(visflow.Scatterplot, visflow.Visualization);

/** @inheritDoc */
visflow.Scatterplot.prototype.PLOT_NAME = 'Scatterplot';
/** @inheritDoc */
visflow.Scatterplot.prototype.MINIMIZED_CLASS =
    'scatterplot-icon square-icon';

/**
 * Margin space for axes.
 * @const {!Array<{before:number, after:number}>}
 */
visflow.Scatterplot.prototype.PLOT_MARGINS = {
  left: 40,
  right: 10,
  top: 10,
  bottom: 30
};

/** @inheritDoc */
visflow.Scatterplot.prototype.defaultProperties = {
  color: '#555',
  border: 'black',
  width: 1,
  size: 3
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectedProperties = {
  color: 'white',
  border: '#FF4400'
};

/**
 * Translate what user see to css property.
 */
visflow.Scatterplot.prototype.propertyTranslate = {
  size: 'r',
  color: 'fill',
  border: 'stroke',
  width: 'stroke-width'
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
  result.dimensions = this.dimensions;
  return result;
};

/** @inheritDoc */
visflow.Scatterplot.prototype.deserialize = function(save) {
  visflow.Scatterplot.base.deserialize.call(this, save);

  this.dimensions = save.dimensions;
  if (this.dimensions == null) {
    visflow.error('dimensions not saved for ' + this.plotName);
    this.dimensions = [0, 0];
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

    var xDim = this.dimensions[0];
    var yDim = this.dimensions[1];
    var point = {
      x: this.xScale(values[index][xDim]),
      y: this.yScale(values[index][yDim])
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
visflow.Scatterplot.prototype.showSelectbox = function(box) {
  this.selectbox = this.svg.select('.vis-selectbox');
  if (this.selectbox.empty())
    this.selectbox = this.svg.append('rect')
      .attr('class', 'vis-selectbox');

  this.selectbox
    .attr('x', box.x1)
    .attr('y', box.y1)
    .attr('width', box.x2 - box.x1)
    .attr('height', box.y2 - box.y1);
};

/** @inheritDoc */
visflow.Scatterplot.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }

  var inpack = this.ports['in'].pack,
      items = inpack.items,
      data = inpack.data,
      values = data.values;

  //this.prepareSvg(useTransition);
  /*
  if (!useTransition) {
    this.svgPoints = this.svg.append('g');
  }
  */

  // Data to be rendered.
  var itemProps = [];
  for (var index in items) {
    var prop = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        index: index,
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

  /*
  if (!useTransition) {
    points = this.svgPoints.selectAll('circle').data(ritems, function(e) {
      return e.id;
    }).enter()
      .append('circle')[0];
  }
  else {
  */
  var points = this.svgPoints_.selectAll('circle')
    .data(itemProps, function(e) {
      return e.index;
    });
  points.enter().append('circle');
  points.exit().remove();
  points
    .attr('cx', _.getValue('cx'))
    .attr('cy', _.getValue('cy'))
    .attr('r', _.getValue('size'));
  /*
  for (var i = 0; i < points.length; i++) {
    var properties = points[i].__data__;
    var u = d3.select(points[i]);
    if (useTransition)
      u = u.interrupt().transition();

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
  */

  this.showSelection();

  // axis appears on top
  //this.drawAxes_();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.showSelection = function() {
  // otherwise no item data can be used
  if (this.isEmpty)
    return;
  // change position of tag to make them appear on top
  for (var index in this.selected) {
    var jqu = this.jqsvg.find('#i' + index)
      .appendTo($(this.svgPoints[0]));
  }
};

/** @inheritDoc */
visflow.Scatterplot.prototype.showPanel = function() {
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
 * Renders the scatterplot axes.
 * @private
 */
visflow.Scatterplot.prototype.drawAxes_ = function() {
  var svgSize = this.getSVGSize();
  var xAxis = d3.svg.axis().orient('bottom').ticks(5);
  xAxis.scale(this.xScale.copy());
  var yAxis = d3.svg.axis().orient('left').ticks(5);
  yAxis.scale(this.yScale.copy());

  var x = this.svg.select('.x.axis');
  if (x.empty()) {
    x = this.svg.append('g')
      .classed('x axis', true)
      .attr('transform', visflow.utils.getTransform([
        0,
        svgSize[0] - this.PLOT_MARGINS.bottom
      ]));
  }
  x.call(xAxis);

  var y = this.svg.select('.y.axis');
  if (y.empty()) {
    y = this.svg.append('g')
      .classed('y axis', true)
      .attr('transform', visflow.utils.getTransform([
        this.PLOT_MARGINS.before,
        0
      ]));
  }
  y.call(yAxis);

  var xLabelTranslate = [
    svgSize.width - this.PLOT_MARGINS.right,
    -5
  ];
  var yLabelTranslate = [
    this.PLOT_MARGINS.top,
    -5
  ];

  var data = this.ports['in'].pack.data;

  var xLabel = x.select('.vis-label');
  if (xLabel.empty()) {
    xLabel = x.append('text')
      .classed('vis-label', true)
      .attr('transform', visflow.utils.getTransform(xLabelTranslate));
  }
  xLabel.text(data.dimensions[this.xDim]);

  var yLabel = y.select('.vis-label');
  if (yLabel.empty()) {
    yLabel = y.append('text')
      .classed('vis-label', true)
      .attr('transform', visflow.utils.getTransform(yLabelTranslate));
  }
  yLabel.text(data.dimensions[this.yDim]);
};

/**
 * Prepares the scales for scatterplot.
 */
visflow.Scatterplot.prototype.prepareScales = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items,
      data = inpack.data;

  var svgSize = this.getSVGSize();
  var xRange = [
    this.PLOT_MARGINS.left,
    svgSize.width - this.PLOT_MARGINS.right
  ];
  var xScaleInfo = visflow.utils.getScale(data, this.xDim, items, xRange);
  this.xScale = xScaleInfo.scale;
  this.xScaleType = xScaleInfo.type;

  var yRange = [
    svgSize.height - this.PLOT_MARGINS.bottom,
    this.PLOT_MARGINS.top
  ];
  var yScaleInfo = visflow.utils.getScale(data, this.yDim, items, yRange);
  this.yScale = yScaleInfo.scale;
  this.yScaleType = yScaleInfo.type;
};

/** @inheritDoc */
visflow.Scatterplot.prototype.prepareScreenScale = function(d) {
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
visflow.Scatterplot.prototype.dataChanged = function() {
  visflow.Scatterplot.base.dataChanged.call(this);
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
  this.dimensions = [chosen[0], chosen[1 % chosen.length]];
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

/** @inheritDoc */
visflow.Scatterplot.prototype.resize = function(size) {
  visflow.Scatterplot.base.resize.call(this, size);
  this.prepareScales();
  this.showDetails();
};
