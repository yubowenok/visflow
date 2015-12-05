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
  this.xScaleType = null;

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
   * Left margin computed based on the y Axis labels.
   * @private {number}
   */
  this.leftMargin_ = 0;

  _(this.options).extend(this.DEFAULT_OPTIONS);
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
  xDim: '',
  yDim: 0,
  groupBy: '',
  points: false,
  legends: true
};

/** @private @const {number} */
visflow.LineChart.prototype.LABEL_FONT_SIZE_ = 5.5;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_OFFSET_X_ = 20;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_OFFSET_Y_ = 15;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_LABEL_OFFSET_X_ = 15;
/** @private @const {number} */
visflow.LineChart.prototype.LEGEND_LABEL_OFFSET_Y_ = 10;

/**
 * Margin space for axes.
 * @const {!Array<{before:number, after:number}>}
 */
visflow.LineChart.prototype.PLOT_MARGINS = {
  left: 15,
  right: 10,
  top: 10,
  bottom: 20
};

/** @inheritDoc */
visflow.LineChart.prototype.defaultProperties = {
  color: '#333',
  border: 'black',
  width: 1,
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
visflow.LineChart.prototype.serialize = function() {
  var result = visflow.LineChart.base.serialize.call(this);
  return result;
};

/** @inheritDoc */
visflow.LineChart.prototype.deserialize = function(save) {
  visflow.LineChart.base.deserialize.call(this, save);
};


/** @inheritDoc */
visflow.LineChart.prototype.drawBrush = function() {
  this.drawSelectBox();
};


/** @inheritDoc */
visflow.LineChart.prototype.selectItems = function() {
  this.selectItemsInBox_();
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
      x: this.xScale(this.options.xDim === '' ?
          index : values[index][this.options.xDim]),
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
  var dimensionList = this.getDimensionList();

  var xSelect = new visflow.Select({
    container: container.find('#x-dim'),
    list: dimensionList,
    allowClear: true,
    selected: this.options.xDim,
    listTitle: 'Series'
  });
  $(xSelect).on('visflow.change', function(event, dim) {
    this.options.xDim = dim;
    this.dimensionChanged();
  }.bind(this));
  var ySelect = new visflow.Select({
    container: container.find('#y-dim'),
    list: dimensionList,
    selected: this.options.yDim,
    listTitle: 'Value'
  });
  $(ySelect).on('visflow.change', function(event, dim) {
    this.options.yDim = dim;
    this.dimensionChanged();
  }.bind(this));

  var groupBySelect = new visflow.Select({
    container: container.find('#group-by'),
    list: dimensionList,
    allowClear: true,
    selected: this.options.groupBy,
    listTitle: 'Group By'
  });
  $(groupBySelect).on('visflow.change', function(event, dim) {
    this.options.groupBy = dim;
    this.dimensionChanged();
  }.bind(this));

  var pointsToggle = new visflow.Checkbox({
    container: container.find('#points'),
    value: this.options.points,
    title: 'Points'
  });
  $(pointsToggle).on('visflow.change', function(event, value) {
    this.options.points = value;
    this.show();
  }.bind(this));

  var legendsToggle = new visflow.Checkbox({
    container: container.find('#legends'),
    value: this.options.legends,
    title: 'Legends'
  });
  $(legendsToggle).on('visflow.change', function(event, value) {
    this.options.legends = value;
    this.show();
  }.bind(this));
};

/**
 * Updates the left margin of the plot based on the longest label for y-axis.
 * @private
 */
visflow.LineChart.prototype.updateLeftMargin_ = function() {
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
visflow.LineChart.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  var lineProps = this.getLineProperties_();
  var itemProps = this.getItemProperties_();
  this.drawLines_(lineProps);
  this.drawPoints_(itemProps);
  this.drawLegends_(lineProps);
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
        label: this.options.groupBy === '' ? '' :
            values[_(itemIndices).first()][this.options.groupBy]
      },
      this.defaultProperties
    );
    itemIndices.forEach(function(index) {
      _(prop).extend(items[index].properties);
      prop.points.push([
        this.xScale(this.options.xDim === '' ?
            index : values[index][this.options.xDim]),
        this.yScale(values[index][this.options.yDim])
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
        x: this.xScale(this.options.xDim === '' ?
          index : values[index][this.options.xDim]),
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
  if (this.options.groupBy === '' || !this.options.legends) {
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
        this.leftMargin_ + this.LEGEND_OFFSET_X_,
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
  var line = d3.svg.line();
  var updatedLines = this.allowTransition_ ? lines.transition() : lines;
  updatedLines
    .style('stroke', _.getValue('color'))
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
      var val = data.values[index][this.options.groupBy];
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
    var sortBy = this.options.xDim
    itemIndices.sort(function (a, b) {
      if (sortBy === '') {
        // Empty string is to sort by item index.
        return a - b;
      } else {
        return visflow.utils.compare(data.values[a][sortBy],
          data.values[b][sortBy], data.dimensionTypes[sortBy]);
      }
    }.bind(this));
    if (sortBy !== '') {
      for (var i = 1; !xCollided && i < itemIndices.length; i++) {
        var index = itemIndices[i];
        var prevIndex = itemIndices[i - 1];
        if (visflow.utils.compare(data.values[index][sortBy],
            data.values[prevIndex][sortBy],
            data.dimensionTypes[sortBy]) == 0) {
          xCollided = true;
        }
      }
    }
  }, this);
  if (xCollided) {
    visflow.warning('collided series x values in', this.label);
  }
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
    classes: 'x axis',
    orient: 'bottom',
    ticks: this.DEFAULT_TICKS_,
    transform: visflow.utils.getTransform([
      0,
      svgSize.height - this.PLOT_MARGINS.bottom
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
    classes: 'y axis',
    orient: 'left',
    ticks: this.DEFAULT_TICKS_,
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

  var svgSize = this.getSVGSize();
  var yRange = [
    svgSize.height - this.PLOT_MARGINS.bottom,
    this.PLOT_MARGINS.top
  ];
  var yScaleInfo = visflow.utils.getScale(data, this.options.yDim, items,
    yRange, {
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
  var xScaleInfo = visflow.utils.getScale(data, this.options.xDim, items,
    xRange, {
      domainMargin: 0.1,
      ordinalPadding: 1.0
    });
  this.xScale = xScaleInfo.scale;
  this.xScaleType = xScaleInfo.type;
};

/** @inheritDoc */
visflow.LineChart.prototype.validDimensions = function() {
  var dims = this.ports['in'].pack.data.dimensions;
  if (this.options.xDim == null || this.options.yDim == null) {
    return false;
  }
  if (this.options.xDim >= dims.length ||
      this.options.yDim >= dims.length ) {
    return false;
  }
  return true;
};

/** @inheritDoc */
visflow.LineChart.prototype.dimensionChanged = function() {
  this.groupItems_();
  this.sortItems_();
  visflow.LineChart.base.dimensionChanged.call(this);
};

/**
 * Finds reasonable y dimension. X dimension will be default to empty.
 * @return {{x: string, y: number}}
 * @override
 */
visflow.LineChart.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var chosen = 0;
  for (var i = 0; i < data.dimensionTypes.length; i++) {
    if (data.dimensionTypes[i] != 'string') {
      chosen = i;
      break;
    }
  }
  return {
    x: '',
    y: chosen
  };
};

/** @inheritDoc */
visflow.LineChart.prototype.dataChanged = function() {
  visflow.LineChart.base.dataChanged.call(this);
  var dims = this.findPlotDimensions();
  this.options.xDim = dims.x;
  this.options.yDim = dims.y;
  this.options.groupBy = '';
  this.groupItems_();
  this.sortItems_();
};

/** @inheritDoc */
visflow.LineChart.prototype.inputChanged = function() {
  this.groupItems_();
  this.sortItems_();
};
