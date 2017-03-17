/**
 * @fileoverview VisFlow line chart visualization.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.LineChart = function(params) {
  visflow.LineChart.base.constructor.call(this, params);

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
   * Grouped item indices for lines.
   * @private {!Array<!Array<string>>}
   */
  this.itemGroups_ = [];

  /**
   * SVG group for points.
   * @private {!d3}
   */
  this.svgPoints_ = _.d3();
  /**
   * SVG group for the line.
   * @private {!d3}
   */
  this.svgLines_ = _.d3();

  /**
   * Selected group indices.
   * @protected {!Object<boolean>}
   */
  this.selectedGroups = {};

  /**
   * Whether x axis have duplicated values.
   * @protected {boolean}
   */
  this.xCollided = false;

  /**
   * The collided value.
   * @protected {string}
   */
  this.xCollidedMsg = '';

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

  /**
   * Index of item in the properties array.
   * @private {!Object<number>}
   */
  this.itemPropIndices_ = {};
};

_.inherit(visflow.LineChart, visflow.Visualization);

/** @inheritDoc */
visflow.LineChart.prototype.serialize = function() {
  var result = visflow.LineChart.base.serialize.call(this);
  result.selectedGroups = this.selectedGroups;
  return result;
};

/** @inheritDoc */
visflow.LineChart.prototype.deserialize = function(save) {
  visflow.LineChart.base.deserialize.call(this, save);
  this.selectedGroups = save.selectedGroups;
};

/** @inheritDoc */
visflow.LineChart.prototype.init = function() {
  visflow.LineChart.base.init.call(this);
  this.svgLines_ = this.svg.append('g')
    .classed('lines', true);
  this.svgPoints_ = this.svg.append('g')
    .classed('points', true);
  this.svgAxes = this.svg.append('g')
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
  if (this.options.points) {
    this.itemProps_ = this.getItemProperties_();
  }
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
  // Mapping from item to group index.
  var groupIndices = {};
  this.itemGroups_.forEach(function(itemIndices, groupIndex) {
    itemIndices.forEach(function(index) {
      groupIndices[index] = groupIndex;
    });
  });
  if (!visflow.interaction.shifted) {
    this.selected = {}; // reset selection if shift key is not down
    this.selectedGroups = {};
  }
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var values = inpack.data.values;
  for (var itemIndex in items) {
    var index = +itemIndex;
    var groupIndex = groupIndices[index];
    if (groupIndex in this.selectedGroups) {
      continue;
    }
    var point = {
      x: this.xScale(this.options.xDim == visflow.data.INDEX_DIM ?
          +index : values[index][this.options.xDim]),
      y: this.yScale(values[index][this.options.yDim])
    };

    if (visflow.utils.pointInBox(point, box)) {
      this.selectedGroups[groupIndices[index]] = true;
    }
  }
  for (index in items) {
    if (groupIndices[index] in this.selectedGroups) {
      this.selected[index] = true;
    }
  }
};

/**
 * Updates the bottom margin based on the visibility of xTicks.
 * @private
 */
visflow.LineChart.prototype.updateBottomMargin_ = function() {
  this.margins.bottom = this.plotMargins().bottom +
    (this.options.xTicks ? this.TICKS_HEIGHT : 0);
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

  if (this.options.legends) {
    maxLength = 0;
    this.drawLegends_(this.lineProps_);
    $(this.svgLegends_.node())
      .find('text')
      .each(function(index, element) {
        maxLength = Math.max(maxLength, element.getBBox().width);
      });
    this.margins.left += maxLength + visflow.LineChart.LEGEND_LABEL_OFFSET_X +
      visflow.LineChart.LEGEND_OFFSET_X + visflow.LineChart.LEGEND_MARGIN_RIGHT;
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
  this.drawLines_(this.lineProps_, this.itemProps_);
  this.drawPoints_(this.itemProps_);
  this.drawLegends_(this.lineProps_);
  this.showSelection();
  this.drawAxes_();
};

/** @inheritDoc */
visflow.LineChart.prototype.showSelection = function() {
  var svg = $(this.svgLines_.node());
  svg.children('path[bound]').appendTo(svg);
  svg.children('path[selected]').appendTo(svg);
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
  this.itemGroups_.forEach(function(itemIndices, groupIndex) {
    var prop = _.extend(
      {
        itemIndices: itemIndices,
        points: [],
        label: this.options.groupBy == visflow.data.INDEX_DIM ||
            this.options.groupBy === '' ?
            '' : values[+_.first(itemIndices)][this.options.groupBy]
      },
      this.defaultProperties()
    );

    var bound = false;
    itemIndices.forEach(function(itemIndex) {
      var index = +itemIndex;
      _.extend(prop, items[index].properties);
      prop.points.push([
        this.options.xDim == visflow.data.INDEX_DIM ?
            +index : values[index][this.options.xDim],
        values[index][this.options.yDim]
      ]);

      if (!bound && !$.isEmptyObject(items[index].properties)) {
        bound = true;
      }
    }, this);

    if (bound) {
      prop.bound = true;
    }

    if (groupIndex in this.selectedGroups) {
      prop.selected = true;
      _.extend(prop, this.selectedLineProperties());
      this.multiplyProperties(prop, this.selectedMultiplier());
    }
    prop.index = groupIndex;
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
  for (var itemIndex in items) {
    var index = +itemIndex;
    var prop = _.extend(
      {},
      this.defaultProperties(),
      items[index].properties,
      {
        index: index,
        x: this.options.xDim == visflow.data.INDEX_DIM ?
          +index : values[index][this.options.xDim],
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
 * Renders the grouped line legends.
 * @param {!Array<!Object>} lineProps
 * @private
 */
visflow.LineChart.prototype.drawLegends_ = function(lineProps) {
  if (this.options.groupBy == visflow.data.INDEX_DIM ||
    this.options.groupBy === '' || !this.options.legends) {
    _.fadeOut(this.svgLegends_.selectAll('*'));
    return;
  }
  var boxes = this.svgLegends_.selectAll('g').data(lineProps);
  var enteredBoxes = boxes.enter().append('g');
  enteredBoxes.append('rect');
  enteredBoxes.append('text');
  _.fadeOut(boxes.exit());
  boxes
    .attr('transform', function(prop, index) {
      return visflow.utils.getTransform([
        visflow.LineChart.LEGEND_OFFSET_X,
        (index + 1) * visflow.LineChart.LEGEND_OFFSET_Y
      ]);
    }.bind(this));
  boxes.select('rect')
    .style('fill', _.getValue('color'));
  var labelTransform = visflow.utils.getTransform([
    visflow.LineChart.LEGEND_LABEL_OFFSET_X,
    visflow.LineChart.LEGEND_LABEL_OFFSET_Y
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
    .data(itemProps, _.getValue('index'));

  _.fadeOut(points.exit());

  points = points.enter().append('circle')
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
    .attr('r', _.getValue('size'))
    .style('fill', _.getValue('color'))
    .style('stroke', _.getValue('border'))
    .style('stroke-width', _.getValue('width', 'px'))
    .style('opacity', _.getValue('opacity'));
};

/**
 * Renders the polylines.
 * @param {!Array<!Object>} lineProps
 * @param {!Array<!Object>} itemProps
 * @private
 */
visflow.LineChart.prototype.drawLines_ = function(lineProps, itemProps) {
  var line = d3.line()
    .x(function(index) {
      return this.xScale(points[index].x);
    }.bind(this))
    .y(function(index) {
      return this.yScale(points[index].y);
    }.bind(this));
  if (this.options.curve) {
    line.curve(d3.curveBasis);
  }

  var points = {};
  itemProps.forEach(function(prop) {
    points[prop.index] = {x: prop.x, y: prop.y};
  });

  var lines = this.svgLines_.selectAll('path').data(lineProps,
    _.getValue('index'));

  _.fadeOut(lines.exit());

  lines = lines.enter().append('path')
    .attr('id', _.getValue('index'))
    .merge(lines)
    .attr('bound', _.getValue('bound'))
    .attr('selected', _.getValue('selected'));

  var updatedLines = this.transitionFeasible() ? lines.transition() : lines;
  updatedLines
    .style('stroke', _.getValue('color'))
    .style('stroke-width', _.getValue('width', 'px'))
    .style('opacity', _.getValue('opacity'))
    .attr('d', function(prop) {
      return line(prop.itemIndices);
    }.bind(this));
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
        return a - b;
      } else {
        return visflow.utils.compare(data.values[a][sortBy],
            data.values[b][sortBy]);
      }
    }.bind(this));
    for (var i = 1; !xCollided && i < itemIndices.length; i++) {
      var index = +itemIndices[i];
      var prevIndex = +itemIndices[i - 1];

      var curValue = sortBy == visflow.data.INDEX_DIM ?
          index : data.values[index][sortBy];
      var prevValue = sortBy == visflow.data.INDEX_DIM ?
          prevIndex : data.values[prevIndex][sortBy];
      if (visflow.utils.compare(curValue, prevValue) == 0) {
        this.xCollidedMsg = [
          'values collided',
          '(' + curValue + ')',
          'on',
          sortBy == visflow.data.INDEX_DIM ? 'index' : data.dimensions[sortBy]
        ].join(' ');
        xCollided = true;
      }
    }
  }, this);
  this.xCollided_ = xCollided;
  this.updateCollisionMessage();
};


/**
 * Renders the x-axis.
 * @private
 */
visflow.LineChart.prototype.drawXAxis_ = function() {
  var svgSize = this.getSVGSize();
  var data = this.ports['in'].pack.data;
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
visflow.LineChart.prototype.drawYAxis_ = function() {
  var data = this.ports['in'].pack.data;
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
        this.plotMargins().top
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
  var margins = this.plotMargins();

  this.updateBottomMargin_();

  var svgSize = this.getSVGSize();
  var yRange = [
    svgSize.height - this.margins.bottom,
    margins.top
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
  // Left margin also depends on legend, if shown.
  this.updateLeftMargin_();

  var xRange = [
    this.margins.left,
    svgSize.width - margins.right
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
visflow.LineChart.prototype.dimensionChanged = function() {
  this.inputChanged();
  this.updateCollisionMessage();
  visflow.LineChart.base.dimensionChanged.call(this);
};

/**
 * Finds reasonable y dimension. X dimension will be default to empty.
 * @return {{x: number, y: number, groupBy: (number|string)}}
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
visflow.LineChart.prototype.transitionFeasible = function() {
  return this.allowTransition &&
      this.itemProps_.length < this.TRANSITION_ELEMENT_LIMIT;
};

/** @inheritDoc */
visflow.LineChart.prototype.setDimensions = function(dims) {
  var dimensions = this.getDimensionNames();
  // Show speed over years
  if (dims.length >= 1) {
    // First dim is on y
    this.options.yDim = dimensions.indexOf(dims[0]);
  }
  if (dims.length >= 2) {
    // Second dim is on x (series dim)
    this.options.xDim = dimensions.indexOf(dims[1]);
  }
  if (dims.length >= 3) {
    // Third dim is groupby
    this.options.groupBy = dimensions.indexOf(dims[2]);
  }
  this.dimensionChanged();
};

/** @inheritDoc */
visflow.LineChart.prototype.dataChanged = function() {
  var dims = this.findPlotDimensions();
  this.options.xDim = dims.x;
  this.options.yDim = dims.y;
  this.options.groupBy = dims.groupBy;
  this.selectedGroups = {};
  this.inputChanged();
};

/** @inheritDoc */
visflow.LineChart.prototype.inputChanged = function() {
  this.selectedGroups = {};
  this.itemGroups_ = this.ports['in'].pack.groupItems(this.options.groupBy);
  this.sortItems_();
  this.itemProps_ = this.getItemProperties_();
  this.lineProps_ = this.getLineProperties_();
};

/**
 * This overrides the default as line chart has groups.
 * @inheritDoc
 */
visflow.LineChart.prototype.selectAll = function() {
  // Repeat getting selected items as we need to update the properties.
  var items = this.ports['in'].pack.items;
  this.selected = _.keySet(items);
  this.selectedGroups = _.keySet(_.range(0, this.lineProps_.length));
  this.itemProps_ = this.getItemProperties_();
  this.lineProps_ = this.getLineProperties_();
  // Parent class will select primitive data items, and update the rendering.
  visflow.LineChart.base.selectAll.call(this);
};

/** @inheritDoc */
visflow.LineChart.prototype.clearSelection = function() {
  this.selected = {};
  this.selectedGroups = {};
  this.itemProps_ = this.getItemProperties_();
  this.lineProps_ = this.getLineProperties_();
  visflow.LineChart.base.clearSelection.call(this);
};
