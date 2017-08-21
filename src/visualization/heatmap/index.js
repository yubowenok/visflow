/**
 * @fileoverview VisFlow heatmap visualization.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Heatmap = function(params) {
  visflow.Heatmap.base.constructor.call(this, params);

  /**
   * Scale in column direction.
   * @protected {d3.Scale|undefined}
   */
  this.xScale = undefined;

  /**
   * Scale in row direction.
   * @protected {d3.Scale|undefined}
   */
  this.yScale = undefined;

  /**
   * Scales from column values to [0, 1]
   * @protected {!Array<d3.Scale>}
   */
  this.normalizeScales = [];

  /**
   * Left margin computed based on row label width.
   * @private {number}
   */
  this.leftMargin_ = 0;

  /**
   * Top margin computed based on the column label height.
   * @private {number}
   */
  this.topMargin_ = 0;

  /**
   * Whether to render column label vertically. Updated by updateTopMargin().
   * @private {boolean}
   */
  this.colLabelVertical_ = false;

  /**
   * Whether the column labels have switched from horizontal to vertical or vice
   * versa.
   * @private {boolean}
   */
  this.colLabelVerticalChanged_ = false;

  /**
   * Sorted item indexes.
   * @private {!Array<number>}
   */
  this.itemIndices_ = [];

  /**
   * Item rendering properties.
   * @private {!Array}
   */
  this.itemProps_ = [];

  /** @private {!d3} */
  this.svgHeatmap_ = _.d3();

  /** @private {!d3} */
  this.svgRowLabels_ = _.d3();

  /** @private {!d3} */
  this.svgColLabels_ = _.d3();

  /** @private {!d3} */
  this.svgRowTempLabels_ = _.d3();

  /** @private {!d3} */
  this.svgColTempLabels_ = _.d3();
};

_.inherit(visflow.Heatmap, visflow.Visualization);

/** @inheritDoc */
visflow.Heatmap.prototype.init = function() {
  visflow.Heatmap.base.init.call(this);
  this.svgHeatmap_ = this.svg.append('g')
    .classed('heatmap', true);
  this.svgRowLabels_ = this.svg.append('g')
    .classed('row-labels', true);
  this.svgRowTempLabels_ = this.svg.append('g')
    .classed('row-labels', true);
  this.svgColLabels_ = this.svg.append('g')
    .classed('col-labels', true);
  this.svgColTempLabels_ = this.svg.append('g')
    .classed('col-labels', true);
};

/** @inheritDoc */
visflow.Heatmap.prototype.serialize = function() {
  var result = visflow.Heatmap.base.serialize.call(this);
  result.dimensions = this.options.dims;
  return result;
};

/** @inheritDoc */
visflow.Heatmap.prototype.deserialize = function(save) {
  visflow.Heatmap.base.deserialize.call(this, save);

  if (this.options.dims == null) {
    // Try to deserialize from older version saves.
    this.options.dims = save.dimensions || this.findPlotDimensions().dimensions;
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectItems = function() {
  this.selectItemsInBox_();
  this.itemProps_ = this.getItemProperties_();
  visflow.Heatmap.base.selectItems.call(this);
};

/**
 * Selects rows based on brush vertical ranges.
 * @private
 */
visflow.Heatmap.prototype.selectItemsInBox_ = function() {
  var box = this.getSelectBox(true);
  if (box == null) {
    return;
  }

  if (!visflow.interaction.shifted) {
    this.selected = {}; // reset selection if shift key is not down
  }
  this.itemIndices_.forEach(function(itemIndex, rowIndex) {
    var y1 = this.yScale(rowIndex + 1);
    var y2 = this.yScale(rowIndex);
    if (y2 >= box.y1 && y1 <= box.y2) {
      this.selected[itemIndex] = true;
    }
  }, this);
};

/** @typedef {{
 *   id: string,
 *   colors: !Array<string>,
 *   border: string,
 *   label: string,
 *   labelBorder: string,
 *   width: number
 * }}
 */
visflow.Heatmap.ItemProperty;

/**
 * Gets the rendering properties for all data items, which can be the binded by
 * D3.
 * @return {!Array<!visflow.Heatmap.ItemProperty>}
 * @private
 */
visflow.Heatmap.prototype.getItemProperties_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;
  // visflow.Scale information
  var colorScaleInfo = visflow.scales[this.options.colorScaleId];
  var colorScale = colorScaleInfo.scale;
  var dimInfos = this.uniqueDimensions(this.options.dims);

  var itemProps = this.itemIndices_.map(function(index) {
    var prop = {
      index: index,
      cells: this.options.dims.map(function(dim, dimIndex) {
        var value = data.values[index][dim];
        return {
          color: colorScale(this.normalizeScales[dimIndex](value)),
          dimId: /** @type {{
            dim: number,
            uniqId: string
          }} */(dimInfos[dimIndex]).uniqId
        };
      }, this),
      border: 'none',
      label: this.options.labelBy === '' ? '' :
          data.values[index][this.options.labelBy],
      labelBorder: 'none',
      width: 0
    };
    if (!$.isEmptyObject(items[index].properties)) {
      prop.bound = true;
    }
    if (index in this.selected) {
      prop.selected = true;
      var selectedProperties = this.selectedProperties();
      // Manually coded property for selected.
      prop.border = colorScaleInfo.contrastColor != null ?
        colorScaleInfo.contrastColor : selectedProperties.border;
      prop.labelBorder = selectedProperties.border;
      prop.labelColor = selectedProperties.color;
      prop.width = selectedProperties.width;
    } else {
      if (items[index].properties.color != null) {
        prop.labelColor = items[index].properties.color;
      }
      if (items[index].properties.border != null) {
        prop.labelBorder = items[index].properties.border;
      }
    }
    return prop;
  }, this);
  return itemProps;
};

/** @inheritDoc */
visflow.Heatmap.prototype.drawBrush = function() {
  this.drawRowSelectbox_();
};

/**
 * Renders the selectbox that has width equal to heatmap width.
 * @private
 */
visflow.Heatmap.prototype.drawRowSelectbox_ = function() {
  var box = this.svg.select('.selectbox');
  if (box.empty()) {
    box = this.svg.append('rect')
      .classed('selectbox', true);
  }
  var startPos = _.first(this.brushPoints);
  var endPos = _.last(this.brushPoints);

  var y1 = Math.min(startPos.y, endPos.y);
  var y2 = Math.max(startPos.y, endPos.y);

  var svgSize = this.getSVGSize();
  box
    .attr('x', this.leftMargin_)
    .attr('y', y1)
    .attr('width', svgSize.width - this.leftMargin_ - this.plotMargins().right)
    .attr('height', y2 - y1);
};

/** @inheritDoc */
visflow.Heatmap.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }
  this.drawHeatmap_(this.itemProps_);
  this.drawRowLabels_(this.svgRowLabels_, this.itemProps_);
  this.drawColLabels_(this.svgColLabels_);
  this.showSelection();
};

/**
 * Renders the heatmap.
 * @param {!Array<!visflow.Heatmap.ItemProperty>} itemProps
 * @private
 */
visflow.Heatmap.prototype.drawHeatmap_ = function(itemProps) {
  var rows = this.svgHeatmap_.selectAll('g')
    .data(itemProps, _.getValue('index'));

  _.fadeOut(rows.exit());

  rows = rows.enter().append('g')
    .style('opacity', 0)
    .attr('id', _.getValue('index'))
    .merge(rows)
    .attr('bound', _.getValue('bound'))
    .attr('selected', _.getValue('selected'));

  var updatedRows = this.allowTransition ? rows.transition() : rows;
  updatedRows
    .style('stroke', _.getValue('border'))
    .style('stroke-width', _.getValue('width', 'px'))
    .attr('transform', function(row, index) {
      return visflow.utils.getTransform([0, this.yScale(index + 1)]);
    }.bind(this))
    .style('opacity', 1);

  var cellWidth = Math.ceil(this.xScale(1) - this.xScale(0));
  var cellHeight = Math.ceil(this.yScale(0) - this.yScale(1));

  var cellTransform = function(cell, index) {
    return visflow.utils.getTransform([this.xScale(index), 0]);
  }.bind(this);

  var cells = rows.selectAll('rect')
    .data(_.getValue('cells'), _.getValue('dimId'));

  _.fadeOut(cells.exit());

  cells = cells.enter().append('rect')
    .style('opacity', 0)
    .attr('id', _.getValue('dimId'))
    .attr('transform', cellTransform)
    .merge(cells);

  var updatedCells = this.allowTransition ? cells.transition() : cells;
  updatedCells
    .attr('fill', _.getValue('color'))
    .attr('transform', cellTransform)
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('opacity', 1);
};

/**
 * Renders the heatmap row labels.
 * @param {!d3} svg
 * @param {!Array<!visflow.Heatmap.ItemProperty>} itemProps
 * @param {boolean=} opt_temp Whether this is temporary rendering.
 * @private
 */
visflow.Heatmap.prototype.drawRowLabels_ = function(svg, itemProps, opt_temp) {
  if (this.options.labelBy === '') {
    svg.selectAll('*').remove();
    return;
  }
  var cellHeight = opt_temp ? 0 : this.yScale(0) - this.yScale(1);
  var clutter = opt_temp ? false :
    cellHeight < visflow.Heatmap.LABEL_FONT_SIZE_Y;

  // First clear potentially existing row clutter hint.
  svg.select('g').remove();

  var labelTransform = function(row, index) {
    return visflow.utils.getTransform([
      this.leftMargin_ - visflow.Heatmap.ROW_LABEL_OFFSET,
      opt_temp ? 0 : this.yScale(index + 1) + cellHeight / 2
    ]);
  }.bind(this);

  var labels = svg.selectAll('text')
    .data(itemProps, _.getValue('index'));

  _.fadeOut(labels.exit());

  labels = labels.enter().append('text')
    .attr('id', _.getValue('index'))
    .attr('transform', labelTransform)
    .classed('row-label', true)
    .merge(labels);

  var updatedLabels = this.allowTransition ? labels.transition() : labels;
  updatedLabels
    .text(function(row, index) {
      if (clutter) {
        if (index == 0 || index == itemProps.length - 1) {
          return row.label;
        }
        return '';
      }
      return row.label;
    }.bind(this))
    .style('fill', _.getValue('labelColor'))
    .style('stroke', _.getValue('labelBorder'))
    .attr('transform', labelTransform);

  // Must run after the regular label rendering.
  if (clutter) {
    var midIndex = itemProps.length >> 1;
    svg.append('g')
      .append('text')
      .classed('vis-label', true)
      .text(visflow.Heatmap.ROW_LABEL_CLUTTER_MSG)
      .attr('transform', visflow.utils.getTransform([
        this.leftMargin_ - visflow.Heatmap.ROW_LABEL_OFFSET -
          visflow.Heatmap.ROW_LABEL_CLUTTER_OFFSET,
        this.yScale(midIndex + 1) + cellHeight / 2
      ], 1, 90));
  } else {
    svg.select('g').remove();
  }
};

/**
 * Renders the column labels.
 * @param {!d3} svg
 * @private
 */
visflow.Heatmap.prototype.drawColLabels_ = function(svg) {
  if (!this.options.colLabel || this.options.dims.length == 0) {
    _.fadeOut(svg.selectAll('*'));
    return;
  }

  var labelTransform;
  if (this.colLabelVertical_) {
    svg.classed('vertical', true);
    labelTransform = function(dimInfo, dimIndex) {
      return visflow.utils.getTransform([
        this.xScale(dimIndex + 0.5) + visflow.Heatmap.LABEL_FONT_SIZE_Y / 2,
        this.topMargin_ - visflow.Heatmap.COL_LABEL_OFFSET
      ], 1, -90);
    }.bind(this);
  } else {
    svg.classed('vertical', false);
    labelTransform = function(dimInfo, dimIndex) {
      return visflow.utils.getTransform([
        this.xScale(dimIndex + 0.5),
        this.topMargin_ - visflow.Heatmap.COL_LABEL_OFFSET
      ]);
    }.bind(this);
  }
  var inpack = this.ports['in'].pack;
  var data = inpack.data;
  var dimInfos = this.uniqueDimensions(this.options.dims);

  var labels = svg.selectAll('.vis-label')
    .data(dimInfos, _.getValue('uniqId'));

  _.fadeOut(labels.exit());

  labels = labels.enter().append('text')
    .attr('id', _.getValue('uniqId'))
    .classed('vis-label', true)
    .attr('transform', labelTransform)
    .merge(labels);

  var updatedLabels = this.allowTransition ? labels.transition() : labels;
  if (this.colLabelVerticalChanged_) {
    this.colLabelVerticalChanged_ = false;
    var counter = updatedLabels.size(); //updatedLabels[0].length;
    updatedLabels = updatedLabels.transition()
      .on('end', function() {
        if (--counter == 0) { // Will be fired for each element
          // Redraw after transition to keep up-to-date with resize.
          this.drawColLabels_(svg);
        }
      }.bind(this));
  }
  updatedLabels
    .text(function(dimInfo) {
      return data.dimensions[dimInfo.dim];
    })
    .attr('transform', labelTransform);
};

/**
 * Renders the temporary labels to determine the label widths.
 * @param {Function} check
 * @param {string} type 'row' or 'col'
 * @private
 */
visflow.Heatmap.prototype.drawTempLabels_ = function(check, type) {
  var tempShow = !this.content.is(':visible');
  if (tempShow) {
    this.content.show();
  }
  var allowTransition = this.allowTransition;
  this.allowTransition = false;

  if (type == 'row') {
    this.drawRowLabels_(this.svgRowTempLabels_, this.itemProps_, true);
  } else {
    this.drawColLabels_(this.svgColTempLabels_);
  }
  this.allowTransition = allowTransition;

  check();

  if (type == 'row') {
    this.svgRowTempLabels_.selectAll('*').remove();
  } else {
    this.svgColTempLabels_.selectAll('*').remove();
  }

  if (tempShow) {
    this.content.hide();
  }
};


/** @inheritDoc */
visflow.Heatmap.prototype.showSelection = function() {
  var svg = $(this.svgHeatmap_.node());
  svg.find('g[bound]').appendTo(svg);
  svg.find('g[selected]').appendTo(svg);
};

/**
 * Sorts items based on 'sortBy' attribute.
 * @private
 */
visflow.Heatmap.prototype.sortItems_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;

  this.itemIndices_ = [];
  for (var index in items) {
    this.itemIndices_.push(+index); // index is string
  }
  this.itemIndices_.sort(function(a, b) {
    var sortBy = this.options.sortBy;
    // Sorting is in reversed order, as rendering starts from bottom.
    if (sortBy === '') {
      // Default sort by index.
      return b - a;
    } else {
      return -visflow.utils.compare(data.values[a][sortBy],
        data.values[b][sortBy]);
    }
  }.bind(this));
};

/**
 * Prepares heatmap xScale and yScale.
 * @private
 */
visflow.Heatmap.prototype.prepareXYScales_ = function() {
  var margins = this.plotMargins();
  var svgSize = this.getSVGSize();
  this.xScale = d3.scaleLinear()
    .domain([0, this.options.dims.length])
    .range([this.leftMargin_, svgSize.width - margins.right]);
  this.yScale = d3.scaleLinear()
    .domain([0, this.itemIndices_.length])
    .range([svgSize.height - margins.bottom, this.topMargin_]);
};

/**
 * Prepares normalize scales that map data range to [0, 1].
 * @private
 */
visflow.Heatmap.prototype.prepareNormalizeScales_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;

  this.options.dims.forEach(function(dim, dimIndex) {
    var scaleInfo = visflow.scales.getScale(data, dim, items, [0, 1]);
    this.normalizeScales[dimIndex] = scaleInfo.scale;
  }, this);
};

/**
 * Updates the left margin based on the row label spans.
 * @private
 */
visflow.Heatmap.prototype.updateLeftMargin_ = function() {
  this.leftMargin_ = this.plotMargins().left;
  if (this.options.labelBy !== '') {
    var maxWidth = 0;
    this.drawTempLabels_(function() {
      $(this.svgRowTempLabels_.node()).find('.row-label')
        .each(function(index, element) {
          maxWidth = Math.max(maxWidth, element.getBBox().width);
        });
    }.bind(this), 'row');
    this.leftMargin_ += visflow.Heatmap.ROW_LABEL_OFFSET + maxWidth;
  }
};

/**
 * Updates the top margin based on the column label spans.
 * @private
 */
visflow.Heatmap.prototype.updateTopMargin_ = function() {
  var data = this.ports['in'].pack.data;
  var margins = this.plotMargins();
  this.topMargin_ = margins.top;
  if (data.isEmpty()) {
    return;
  }
  if (this.options.colLabel) {
    var svgSize = this.getSVGSize();
    var colWidth = (svgSize.width - this.leftMargin_ - margins.right) /
      this.options.dims.length;
    var maxLength = d3.max(this.options.dims.map(function(dim) {
      return data.dimensions[dim].length;
    }));
    if (maxLength == null) {
      maxLength = 0;
    }
    var oldVertical = this.colLabelVertical_;
    if (colWidth < maxLength * visflow.Heatmap.LABEL_FONT_SIZE_X) {
      this.colLabelVertical_ = true;
      this.topMargin_ += visflow.Heatmap.LABEL_FONT_SIZE_X * maxLength;
    } else {
      this.colLabelVertical_ = false;
      this.topMargin_ += visflow.Heatmap.LABEL_FONT_SIZE_Y +
        visflow.Heatmap.COL_LABEL_OFFSET;
    }
    if (this.colLabelVertical_ != oldVertical) {
      this.colLabelVerticalChanged_ = true;
    }
  }
};

/**
 * Updates the left and top margins of the rectangles.
 * @private
 */
visflow.Heatmap.prototype.updateMargins_ = function() {
  this.updateLeftMargin_();
  // Top margin depends on left margin.
  this.updateTopMargin_();
};

/**
 * Prepares the scales relating to layouts. Normalized scales are not prepared
 * here!
 * @inheritDoc
 */
visflow.Heatmap.prototype.prepareScales = function() {
  this.updateMargins_();
  // xScale depends on leftMargin.
  this.prepareXYScales_();
};

/**
 * Gets non-string dimensions as showing categorical dimension in heatmap is not
 * very helpful in general. However user may choose to render categorical data
 * in heatmap later.
 * @return {{
 *   labelBy: number,
 *   dimensions: !Array<number>
 * }}
 * @override
 */
visflow.Heatmap.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var dimensions = [];
  var labelBy = null;
  data.dimensionTypes.forEach(function(type, index) {
    if (type != visflow.ValueType.STRING) {
      if (dimensions.length < visflow.Heatmap.DEFAULT_NUM_DIMENSION) {
        dimensions.push(index);
      }
    } else if (labelBy == null) {
      labelBy = index;
    }
  }, this);
  return {
    dimensions: dimensions.length == 0 ? [0] : dimensions,
    labelBy: labelBy == null ? 0 : labelBy
  };
};

/** @inheritDoc */
visflow.Heatmap.prototype.inputChanged = function() {
  this.sortItems_();
  this.prepareNormalizeScales_();
  this.itemProps_ = this.getItemProperties_();
};

/** @inheritDoc */
visflow.Heatmap.prototype.dataChanged = function() {
  var info = this.findPlotDimensions();
  this.options.dims = info.dimensions;
  this.options.labelBy = info.labelBy;
  // The previous sortBy corresponds to unknown dimension in new data set.
  // We choose to sort by nothing by default.
  this.options.sortBy = '';
};

/** @inheritDoc */
visflow.Heatmap.prototype.dimensionChanged = function() {
  this.prepareNormalizeScales_();
  this.itemProps_ = this.getItemProperties_();
  visflow.Heatmap.base.dimensionChanged.call(this);
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectedChanged = function() {
  this.itemProps_ = this.getItemProperties_();
};
