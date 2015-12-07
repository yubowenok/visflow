/**
 * @fileoverview VisFlow line chart visualization.
 */

'use strict';

/**
 * @param {Object} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.LineChart = function(params) {
  visflow.LineChart.base.constructor.call(this, params);

  // Rendering scales.
  /** @type {!d3.scale} */
  this.xScale = d3.scale.linear();
  /** @type {!d3.scale} */
  this.yScale = d3.scale.linear();

  /** @type {string} */
  this.xScaleType;
  /** @type {string} */
  this.yScaleType;

  /**
   * Grouped item indices for lines.
   * @private {!Array<!Array<number>>}
   * @private
   */
  this.itemGroups_ = [];

  /**
   * SVG group for points.
   * @private {d3.selection}
   */
  this.svgPoints_;
  /**
   * SVG group for the line.
   * @private {d3.selection}
   */
  this.svgLines_;
  /**
   * SVG gruop for axes.
   * @private {d3.selection}
   */
  this.svgAxes_;

  /**
   * Whether x axis have duplicated values.
   * @private {boolean}
   */
  this.xCollided_ = false;
  /**
   * The collided value.
   * @private {string}
   */
  this.xCollidedMsg_ = '';

  /**
   * Left margin computed based on the y Axis labels.
   * @private {number}
   */
  this.leftMargin_ = 0;
  /**
   * Bottom margin that depends on whether xTicks are shown.
   * @private {number}
   */
  this.bottomMargin_ = 0;

  /**
   * Line rendering properties.
   * @private {!Array}
   */
  this.lineProps_ = [];
  /**
   * Item rendering properties.
   * @private {!Array}
   */
  this.itemProps_ = [];
};

visflow.utils.inherit(visflow.LineChart, visflow.Visualization);

/** @inheritDoc */
visflow.LineChart.prototype.NODE_CLASS = 'line-chart';
/** @inheritDoc */
visflow.LineChart.prototype.NODE_NAME = 'Line Chart';
/** @inheritDoc */
visflow.LineChart.prototype.PANEL_TEMPLATE =
  './src/visualization/line-chart/line-chart-panel.html';

/** @inheritDoc */
visflow.LineChart.prototype.DEFAULT_OPTIONS = {
  // Series dimension.
  xDim: visflow.data.INDEX_DIM,
  // Value dimension.
  yDim: 0,
  // Group by dimension, must be key.
  groupBy: '',
  // Show points.
  points: false,
  // Show legends.
  legends: true,
  // Use curve to draw lines.
  curve: false,
  // Show x-axis ticks.
  xTicks: true,
  // Show y-axis ticks.
  yTicks: true
};

/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_OFFSET_X_ = 10;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_OFFSET_Y_ = 15;
/**
 * This includes the colorbox size.
 * @private @const {number}
 */
visflow.LineChart.prototype.LEGEND_LABEL_OFFSET_X_ = 15;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_LABEL_OFFSET_Y_ = 10;

/** @inheritDoc */
visflow.LineChart.prototype.defaultProperties = {
  color: '#333',
  border: 'black',
  width: 1.5,
  size: 3,
  opacity: 1
};

/** @inheritDoc */
visflow.LineChart.prototype.selectedProperties = {
  color: 'white',
  border: '#6699ee'
};

/** @inheritDoc */
visflow.LineChart.prototype.init = function() {
  visflow.LineChart.base.init.call(this);
  this.svgLines_ = this.svg.append('g')
    .classed('lines', true);
  this.svgPoints_ = this.svg.append('g')
    .classed('points', true);
  this.svgAxes_ = this.svg.append('g')
    .classed('axes', true);
  this.svgLegends_ = this.svg.append('g')
    .classed('legends', true);
};

/** @inheritDoc */
visflow.LineChart.prototype.drawBrush = function() {
  this.drawSelectBox();
};

/** @inheritDoc */
visflow.LineChart.prototype.selectItems = function() {
  this.selectItemsInBox_();
  this.itemProps_ = this.getItemProperties_();
  this.lineProps_ = this.getLineProperties_();
  visflow.LineChart.base.selectItems.call(this);
};


/**
 * Selects the data items in the range selection box.
 * @private
 */
visflow.LineChart.prototype.selectItemsInBox_ = function() {
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
      x: this.xScale(this.options.xDim == visflow.data.INDEX_DIM ?
          +index : values[index][this.options.xDim]),
      y: this.yScale(values[index][this.options.yDim])
    };

    if (visflow.utils.pointInBox(point, box)) {
      this.selected[index] = true;
    }
  }
};

/** @inheritDoc */
visflow.LineChart.prototype.initPanel = function(container) {
  visflow.LineChart.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList(null, true);

  var units = [
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#x-dim'),
        list: dimensionList,
        selected: this.options.xDim,
        listTitle: 'Series'
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
        listTitle: 'Value'
      },
      change: function(event, dim) {
        this.options.yDim = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#group-by'),
        list: dimensionList,
        allowClear: true,
        selected: this.options.groupBy,
        listTitle: 'Group By'
      },
      change: function(event, dim) {
        this.options.groupBy = dim;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#points'),
        value: this.options.points,
        title: 'Points'
      },
      change: function(event, value) {
        this.options.points = value;
        this.show();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#legends'),
        value: this.options.legends,
        title: 'Legends'
      },
      change: function(event, value) {
        this.options.legends = value;
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#curve'),
        value: this.options.curve,
        title: 'Curve'
      },
      change: function(event, value) {
        this.options.curve = value;
        this.show();
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
        this.show();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#y-ticks'),
        value: this.options.xTicks,
        title: 'Y Ticks'
      },
      change: function(event, value) {
        this.options.yTicks = value;
        this.layoutChanged();
      }
    }
  ];
  this.initPanelInterface(units);
  this.updateCollisionMessage_();
};

/**
 * Updates the collision message in the panel.
 * @private
 */
visflow.LineChart.prototype.updateCollisionMessage_ = function() {
  if (!visflow.optionPanel.isOpen) {
    return;
  }
  var container = visflow.optionPanel.contentContainer();
  var collided = container.find('#collided');
  if (this.xCollided_) {
    collided.show();
    collided.children('#msg').text(this.xCollidedMsg_);
  } else {
    collided.hide();
  }
};

/**
 * Updates the bottom margin based on the visibility of xTicks.
 * @private
 */
visflow.LineChart.prototype.updateBottomMargin_ = function() {
  this.bottomMargin_ = this.PLOT_MARGINS.bottom +
    (this.options.xTicks ? this.TICKS_HEIGHT_ : 0);
};


/**
 * Updates the left margin of the plot based on the longest label for y-axis.
 * @private
 */
visflow.LineChart.prototype.updateLeftMargin_ = function() {
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

  if (this.options.legends) {
    maxLength = 0;
    this.drawLegends_(this.lineProps_);
    $(this.svgLegends_.node())
      .find('text')
      .each(function(index, element) {
        maxLength = Math.max(maxLength, element.getBBox().width);
      });
    this.leftMargin_ += maxLength +
        this.LEGEND_LABEL_OFFSET_X_ + this.LEGEND_OFFSET_X_;
  }

  if (tempShow) {
    this.content.hide();
  }
};

/** @inheritDoc */
visflow.LineChart.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  this.drawLines_(this.lineProps_);
  this.drawPoints_(this.itemProps_);
  this.drawLegends_(this.lineProps_);
  this.showSelection();
  this.drawAxes_();
};

/** @inheritDoc */
visflow.LineChart.prototype.showSelection = function() {
  // Change position of tag to make them appear on top.
  var svg = $(this.svgPoints_.node());
  for (var index in this.selected) {
    svg.find('circle#p' + index).appendTo(svg);
  }
};

/**
 * Computes and returns the line properties to be rendered.
 * @return {!Array<!Object>}
 * @private
 */
visflow.LineChart.prototype.getLineProperties_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;
  var values = data.values;
  var lineProps = [];
  this.itemGroups_.forEach(function(itemIndices) {
    var prop = _.extend(
      {
        itemIndices: itemIndices,
        points: [],
        label: this.options.groupBy == visflow.data.INDEX_DIM ||
            this.options.groupBy === '' ?
            '' : values[_(itemIndices).first()][this.options.groupBy]
      },
      this.defaultProperties
    );
    itemIndices.forEach(function(index) {
      _(prop).extend(items[index].properties);
      prop.points.push([
        this.options.xDim == visflow.data.INDEX_DIM ?
            +index : values[index][this.options.xDim],
        values[index][this.options.yDim]
      ]);
    }, this);
    lineProps.push(prop);
  }, this);
  return lineProps;
};

/**
 * Computes and returns the item properties to be rendered.
 * @return {!Array<!Object>}
 * @private
 */
visflow.LineChart.prototype.getItemProperties_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var values = inpack.data.values;
  // Data to be rendered.
  var itemProps = [];
  for (var index in items) {
    var prop = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        id: 'p' + index,
        x: this.xScale(this.options.xDim == visflow.data.INDEX_DIM ?
          +index : values[index][this.options.xDim]),
        y: this.yScale(values[index][this.options.yDim])
      }
    );
    if (index in this.selected) {
      _(prop).extend(this.selectedProperties);
      this.multiplyProperties(prop, this.selectedMultiplier);
    }
    itemProps.push(prop);
  }
  return itemProps;
};

/**
 * Renders the grouped line legends.
 * @param {!Array<!Object>} lineProps
 * @private
 */
visflow.LineChart.prototype.drawLegends_ = function(lineProps) {
  if (this.options.groupBy == visflow.data.INDEX_DIM ||
    this.options.groupBy === '' || !this.options.legends) {
    _(this.svgLegends_.selectAll('*')).fadeOut();
    return;
  }
  var boxes = this.svgLegends_.selectAll('g').data(lineProps);
  var enteredBoxes = boxes.enter().append('g');
  enteredBoxes.append('rect');
  enteredBoxes.append('text');
  _(boxes.exit()).fadeOut();
  boxes
    .attr('transform', function(prop, index) {
      return visflow.utils.getTransform([
        this.LEGEND_OFFSET_X_,
        (index + 1) * this.LEGEND_OFFSET_Y_
      ]);
    }.bind(this));
  boxes.select('rect')
    .style('fill', _.getValue('color'));
  var labelTransform = visflow.utils.getTransform([
    this.LEGEND_LABEL_OFFSET_X_,
    this.LEGEND_LABEL_OFFSET_Y_
  ]);
  boxes.select('text')
    .attr('transform', labelTransform)
    .text(_.getValue('label'));
};

/**
 * Renders the line chart points.
 * @param {!Array<!Object>} itemProps
 * @private
 */
visflow.LineChart.prototype.drawPoints_ = function(itemProps) {
  if (!this.options.points) {
    this.svgPoints_.selectAll('*').remove();
    return;
  }
  var points = this.svgPoints_.selectAll('circle')
    .data(itemProps, _.getValue('id'));
  points.enter().append('circle')
    .attr('id', _.getValue('id'))
    .style('opacity', 0);
  _(points.exit()).fadeOut();

  var updatedPoints = this.allowTransition_ ? points.transition() : points;
  updatedPoints
    .attr('cx', _.getValue('x'))
    .attr('cy', _.getValue('y'))
    .attr('r', _.getValue('size'))
    .style('fill', _.getValue('color'))
    .style('stroke', _.getValue('border'))
    .style('stroke-width', _.getValue('width'))
    .style('opacity', _.getValue('opacity'));
};

/**
 * Renders the polylines.
 * @param {!Array<!Object>} lineProps
 * @private
 */
visflow.LineChart.prototype.drawLines_ = function(lineProps) {
  var lines = this.svgLines_.selectAll('path').data(lineProps);
  lines.enter().append('path')
    .style('opacity', 0);
  _(lines.exit()).fadeOut();

  var line = d3.svg.line()
    .x(function(point) {
      return this.xScale(point[0]);
    }.bind(this))
    .y(function(point) {
      return this.yScale(point[1]);
    }.bind(this));
  if (this.options.curve) {
    line.interpolate('basis');
  }

  var updatedLines = this.allowTransition_ ? lines.transition() : lines;
  updatedLines
    .style('stroke', _.getValue('color'))
    .style('stroke-width', _.getValue('width'))
    .style('opacity', _.getValue('opacity'))
    .attr('d', function(prop) {
      return line(prop.points);
    }.bind(this));
};

/**
 * Groups items based on 'groupBy' attribute.
 * @private
 */
visflow.LineChart.prototype.groupItems_ = function() {
  this.itemGroups_ = [];
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;
  if (this.options.groupBy === '') {
    this.itemGroups_.push(_.allKeys(items));
  } else {
    var valueSet = {};
    var valueCounter = 0;
    for (var index in items) {
      var val = this.options.groupBy == visflow.data.INDEX_DIM ?
          index : data.values[index][this.options.groupBy];
      var group = valueSet[val];
      if (group != null) {
        this.itemGroups_[group].push(index);
      } else {
        valueSet[val] = valueCounter;
        this.itemGroups_[valueCounter++] = [index];
      }
    }
  }
};

/**
 * Sorts items based on 'sortBy' attribute.
 * @private
 */
visflow.LineChart.prototype.sortItems_ = function() {
  var inpack = this.ports['in'].pack;
  var data = inpack.data;

  var xCollided = false;
  this.itemGroups_.forEach(function(itemIndices) {
    var sortBy = this.options.xDim;
    itemIndices.sort(function(a, b) {
      if (sortBy == visflow.data.INDEX_DIM) {
        // Empty string is to sort by item index.
        return (+a) - (+b);
      } else {
        return visflow.utils.compare(data.values[a][sortBy],
            data.values[b][sortBy]);
      }
    }.bind(this));
    for (var i = 1; !xCollided && i < itemIndices.length; i++) {
      var index = itemIndices[i];
      var prevIndex = itemIndices[i - 1];
      var curValue = sortBy == visflow.data.INDEX_DIM ?
          index : data.values[index][sortBy];
      var prevValue = sortBy == visflow.data.INDEX_DIM ?
          prevIndex : data.values[prevIndex][sortBy];
      if (visflow.utils.compare(curValue, prevValue) == 0) {
        this.xCollidedMsg_ =
        xCollided = true;
      }
    }
  }, this);
  this.xCollided_ = xCollided;
  this.updateCollisionMessage_();
};


/**
 * Renders the x-axis.
 * @private
 */
visflow.LineChart.prototype.drawXAxis_ = function() {
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
visflow.LineChart.prototype.drawYAxis_ = function() {
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
 * Renders the line chart axes.
 * @private
 */
visflow.LineChart.prototype.drawAxes_ = function() {
  this.drawXAxis_();
  this.drawYAxis_();
};

/**
 * Prepares the scales for line chart.
 */
visflow.LineChart.prototype.prepareScales = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;

  this.updateBottomMargin_();

  var svgSize = this.getSVGSize();
  var yRange = [
    svgSize.height - this.bottomMargin_,
    this.PLOT_MARGINS.top
  ];
  var yScaleInfo = visflow.scales.getScale(data, this.options.yDim, items,
    yRange, {
      domainMargin: 0.1,
      ordinalPadding: 1.0
    });
  this.yScale = yScaleInfo.scale;
  this.yScaleType = yScaleInfo.type;

  // Compute new left margin based on selected y dimension.
  // xScale has to be created after yScale because the left margin depends on
  // yScale's domain.
  // Left margin also depends on legend, if shown.
  this.updateLeftMargin_();

  var xRange = [
    this.leftMargin_,
    svgSize.width - this.PLOT_MARGINS.right
  ];
  var xScaleInfo = visflow.scales.getScale(data, this.options.xDim, items,
    xRange, {
      domainMargin: 0.1,
      ordinalPadding: 1.0
    });
  this.xScale = xScaleInfo.scale;
  this.xScaleType = xScaleInfo.type;
};

/** @inheritDoc */
visflow.LineChart.prototype.dimensionChanged = function() {
  this.inputChanged();
  this.updateCollisionMessage_();
  visflow.LineChart.base.dimensionChanged.call(this);
};

/**
 * Finds reasonable y dimension. X dimension will be default to empty.
 * @return {{x: number, y: number, groupBy: number}}
 * @override
 */
visflow.LineChart.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var x = null;
  var y = null;
  var groupBy = null;
  for (var dim = 0; dim < data.dimensionTypes.length; dim++) {
    if (data.dimensionTypes[dim] == visflow.ValueType.STRING &&
       !data.dimensionDuplicate[dim]) {
      if (groupBy == null) {
        groupBy = dim;
      } else if (x == null) {
        x = dim;
      }
    }
    if (data.dimensionTypes[dim] != visflow.ValueType.STRING) {
      y = dim;
    }
  }
  return {
    x: x != null ? x : visflow.data.INDEX_DIM,
    y: y != null ? y : 0,
    groupBy: groupBy != null ? groupBy : ''
  };
};

/** @inheritDoc */
visflow.LineChart.prototype.dataChanged = function() {
  var dims = this.findPlotDimensions();
  this.options.xDim = dims.x;
  this.options.yDim = dims.y;
  this.options.groupBy = dims.groupBy;
  this.inputChanged();
};

/** @inheritDoc */
visflow.LineChart.prototype.inputChanged = function() {
  this.groupItems_();
  this.sortItems_();
  this.itemProps_ = this.getItemProperties_();
  this.lineProps_ = this.getLineProperties_();
};
