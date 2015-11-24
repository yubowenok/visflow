/**
 * @fileoverview VisFlow heatmap visualization.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Heatmap = function(params) {
  visflow.Heatmap.base.constructor.call(this, params);

  /**
   * Selected dimensions to visualize in heatmap (columns).
   * @protected {!Array<number>}
   */
  this.dimensions = [];

  /**
   * Scale in column direction.
   * @protected {d3.scale}
   */
  this.xScale;

  /**
   * Scale in row direction.
   * @protected {d3.scale}
   */
  this.yScale;

  /**
   * Scales from column values to [0, 1]
   * @protected {!d3.scale}
   */
  this.normalizeScales = [];

  /**
   * Id corresponding to the id of visflow.scales.
   * @protected {visflow.ScaleId}
   */
  this.colorScaleId = 'redGreen';

  /**
   * Left margin computed based on label width.
   * @private {number}
   */
  this.leftMargin_ = 0;

  /**
   * Sorted item indexes.
   * @private {!Array<number>}
   */
  this.itemIndices_ = [];

  /** @private {d3.selection} */
  this.svgHeatmap_;
  /** @private {d3.selection} */
  this.svgRowLabels_;
  /** @private {d3.selection} */
  this.svgColLabels_;

  _(this.options).extend({
    // Whether to show row labels.
    rowLabels: true,
    // By which column value shall the rows be sorted.
    sortBy: 0,
    // By which column value shall the rows be labeled.
    labelBy: 0
  });
};

visflow.utils.inherit(visflow.Heatmap, visflow.Visualization);

/** @inheritDoc */
visflow.Heatmap.prototype.PLOT_NAME = 'Heatmap';
/** @inheritDoc */
visflow.Heatmap.prototype.MINIMIZED_CLASS = 'heatmap-icon square-icon';
/** @private @const {number} */
visflow.Heatmap.prototype.ROW_LABEL_OFFSET_ = 10;
/** @private @const {number} */
visflow.Heatmap.prototype.COL_LABEL_OFFSET_ = 10;

/** @inheritDoc */
visflow.Heatmap.prototype.defaultProperties = {
  color: '#555'
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectedProperties = {
  border: '#FF4400',
  width: 1.5
};

/** @inheritDoc */
visflow.Heatmap.prototype.PLOT_MARGINS = {
  left: 10,
  right: 10,
  top: 20,
  bottom: 10
};

/** @private @const {number} */
visflow.Heatmap.prototype.LABEL_FONT_SIZE_ = 6;

/** @inheritDoc */
visflow.Heatmap.prototype.init = function() {
  visflow.Heatmap.base.init.call(this);
  this.svgHeatmap_ = this.svg.append('g')
    .classed('heatmap', true);
  this.svgRowLabels_ = this.svg.append('g')
    .classed('row-labels', true);
  this.svgColLabels_ = this.svg.append('g')
    .classed('col-labels', true);
};


/** @inheritDoc */
visflow.Heatmap.prototype.serialize = function() {
  var result = visflow.Heatmap.base.serialize.call(this);
  result.dimensions = this.dimensions;
  return result;
};

/** @inheritDoc */
visflow.Heatmap.prototype.deserialize = function(save) {
  visflow.Heatmap.base.deserialize.call(this, save);

  if (this.dimensions == null) {
    visflow.error('dimensions not saved for ' + this.PLOT_NAME);
    this.dimensions = [];
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectItems = function() {
  this.selectItemsInBox_();
};

/**
 * Selects rows based on brush vertical ranges.
 * @private
 */
visflow.Heatmap.prototype.selectItemsInBox_ = function() {
  var brush = this.brushPoints_;
  var startPos = _(brush).first();
  var endPos = _(brush).last();
  if (startPos.x == endPos.x && startPos.y == endPos.y) {
    return;
  }

  if (!visflow.interaction.shifted) {
    this.selected = {}; // reset selection if shift key is not down
  }
  var yMin = Math.min(startPos.y, endPos.y);
  var yMax = Math.max(startPos.y, endPos.y);
  this.itemIndices_.forEach(function(itemIndex, rowIndex) {
    var y1 = this.yScale(rowIndex + 1);
    var y2 = this.yScale(rowIndex);
    if (y2 >= yMin && y1 <= yMax) {
      this.selected[itemIndex] = true;
    }
  }, this);
  this.showDetails();
  this.pushflow();
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
  var inpack = this.ports['in'].pack,
    items = inpack.items,
    data = inpack.data;
  // visflow.Scale information
  var colorScaleInfo = visflow.scales[this.colorScaleId];
  var colorScale = colorScaleInfo.scale;

  return this.itemIndices_.map(function(index) {
    var prop = {
      id: 'r' + index,
      colors: this.dimensions.map(function (dim, dimIndex) {
        var value = data.values[index][dim];
        return colorScale(this.normalizeScales[dimIndex](value));
      }, this),
      border: 'none',
      label: !this.options.rowLabels ? '' :
          data.values[index][this.options.labelBy],
      labelBorder: 'none',
      width: 0
    };
    if (this.selected[index]) {
      // Manually coded property for selected.
      prop.border = colorScaleInfo.contrastColor != null ?
        colorScaleInfo.contrastColor : this.selectedProperties.border;
      prop.labelBorder = this.selectedProperties.border;
      prop.width = this.selectedProperties.width;
    } else {
      if (items[index].properties.color != null) {
        prop.labelBorder = items[index].properties.color;
      }
    }
    return prop;
  }, this);
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
  var startPos = _(this.brushPoints_).first();
  var endPos = _(this.brushPoints_).last();

  var y1 = Math.min(startPos.y, endPos.y);
  var y2 = Math.max(startPos.y, endPos.y);

  var svgSize = this.getSVGSize();
  box
    .attr('x', this.leftMargin_)
    .attr('y', y1)
    .attr('width', svgSize.width - this.leftMargin_ - this.PLOT_MARGINS.right)
    .attr('height', y2 - y1);
};

/** @inheritDoc */
visflow.Heatmap.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }

  var itemProps = this.getItemProperties_();
  this.drawHeatmap_(itemProps);
  this.drawRowLabels_(itemProps);
  this.drawColLabels_();
  this.showSelection();
};

/**
 * Renders the heatmap.
 * @param {!Array<!visflow.Heatmap.ItemProperty>} itemProps
 * @private
 */
visflow.Heatmap.prototype.drawHeatmap_ = function(itemProps) {
  var rows = this.svgHeatmap_.selectAll('g').data(itemProps, _.getValue('id'));
  rows.enter().append('g')
    .attr('id', _.getValue('id'));
  rows.exit()
    .transition()
    .style('opacity', 0)
    .remove();

  var updatedRows = this.allowTransition_ ? rows.transition() : rows;
  updatedRows
    .style('stroke', _.getValue('border'))
    .style('stroke-width', _.getValue('width'))
    .attr('transform', function(row, index) {
      return visflow.utils.getTransform([0, this.yScale(index + 1)]);
    }.bind(this));

  var cellWidth = Math.ceil(this.xScale(1) - this.xScale(0));
  var cellHeight = Math.ceil(this.yScale(0) - this.yScale(1));

  var cellTransform = function(cell, index) {
    return visflow.utils.getTransform([this.xScale(index), 0]);
  }.bind(this);

  var cells = rows.selectAll('rect').data(_.getValue('colors'));
  cells.enter().append('rect')
    .attr('transform', cellTransform)
    .attr('fill', _.identity);
  cells.exit()
    .transition()
    .style('opacity', 0)
    .remove();

  var updatedCells = this.allowTransition_ ? cells.transition() : cells;
  updatedCells
    .attr('transform', cellTransform)
    .attr('width', cellWidth)
    .attr('height', cellHeight);
};

/**
 * Renders the heatmap row labels.
 * @param {!Array<!visflow.Heatmap.ItemProperty>} itemProps
 * @private
 */
visflow.Heatmap.prototype.drawRowLabels_ = function(itemProps) {
  if (!this.options.rowLabels) {
    this.svgRowLabels_.selectAll('*').remove();
    return;
  }
  var cellHeight = Math.ceil(this.yScale(0) - this.yScale(1));
  var labels = this.svgRowLabels_.selectAll('text')
    .data(itemProps, _.getValue('id'));

  var labelTransform = function(cell, index) {
    return visflow.utils.getTransform([
      this.leftMargin_ - this.ROW_LABEL_OFFSET_,
      this.yScale(index + 1) + cellHeight / 2
    ]);
  }.bind(this);

  labels.enter().append('text')
    .attr('id', _.getValue('id'))
    .attr('transform', labelTransform)
    .classed('row-label', true);
  labels.exit()
    .transition()
    .style('opacity', 0)
    .remove();

  var updatedLabels = this.allowTransition_ ? labels.transition(): labels;
  updatedLabels
    .text(_.getValue('label'))
    .style('stroke', _.getValue('labelBorder'))
    .attr('transform', labelTransform);
};

/**
 * Renders the column labels.
 * @private
 */
visflow.Heatmap.prototype.drawColLabels_ = function() {
  var inpack = this.ports['in'].pack,
    data = inpack.data;
  var node = this;
  var labels = this.svgColLabels_.selectAll('.vis-label').data(this.dimensions);
  labels.enter().append('text')
    .classed('vis-label', true);
  labels.exit()
    .transition()
    .style('opacity', 0)
    .remove();
  var updatedLabels = this.allowTransition_ ? labels.transition() : labels;
  updatedLabels
    .text(function(dim) {
      return data.dimensions[dim];
    })
    .attr('x', function(dim, dimIndex) {
      return this.xScale(dimIndex + 0.5);
    }.bind(this))
    .attr('y', this.PLOT_MARGINS.top - this.COL_LABEL_OFFSET_);
};

/** @inheritDoc */
visflow.Heatmap.prototype.showSelection = function() {
  var svg = $(this.svgHeatmap_.node());
  for (var index in this.selected) {
    svg.find('#r' + index).appendTo(svg);
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.panel = function() {
  /*
  var node = this;

  this.selectDimensions = new visflow.Select({
    id: 'dimensions',
    label: 'Dimensions',
    target: this.jqoptions,
    multiple: true,
    sortable: true,
    relative: true,
    value: this.dimensions,
    list: this.prepareDimensionList('string'),
    change: function(event) {
      var unitChange = event.unitChange;
      node.dimensions = unitChange.value;
      node.pushflow();
      node.showDetails(); // show after process (in pushflow)
    }
  });

  // a select list of color scales
  this.selectColorScale = new visflow.ColorScale({
    id: 'scale',
    label: 'Scale',
    target: this.jqoptions,
    value: this.colorScale,
    placeholder: 'No Scale',
    relative: true,
    change: function(event) {
      var unitChange = event.unitChange;
      node.colorScale = unitChange.value;
      //node.pushflow();  // not necessary, nothing changes downflow
      node.showDetails(); // show after process (in pushflow)
    }
  });

  this.checkboxAllColumns = new visflow.Checkbox({
    id: 'allColumns',
    label: 'All Columns',
    target: this.jqoptions,
    value: this.allColumns,
    relative: true,
    change: function(event) {
      var unitChange = event.unitChange;
      node.allColumns = unitChange.value;
      node.pushflow();
      node.showDetails(); // show after process (in pushflow)
    }
  });

  this.selectRowLabels = new visflow.Checkbox({
    id: 'rowLabels',
    label: 'Row Labels',
    target: this.jqoptions,
    value: this.rowLabels,
    placeholder: 'No Labels',
    relative: true,
    list: this.prepareDimensionList(),
    change: function(event) {
      var unitChange = event.unitChange;
      node.rowLabels = unitChange.value;
      node.pushflow();
      node.showDetails(); // show after process (in pushflow)
    }
  });

  this.selectSortBy = new visflow.Select({
    id: 'sortby',
    label: 'Sort By',
    target: this.jqoptions,
    value: this.sortBy,
    placeholder: '(auto-index)',
    relative: true,
    list: this.prepareDimensionList(),
    change: function(event) {
      var unitChange = event.unitChange;
      node.sortBy = unitChange.value;
      node.pushflow();
      node.showDetails(); // show after process (in pushflow)
    }
  });
  */
};

/** @inheritDoc */
visflow.Heatmap.prototype.inputChanged = function() {
  this.sortItems_();
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
  this.itemIndices_.sort(function(a, b){
    if (this.sortBy == null) {
      return a - b; // default sort by index
    } else {
      return visflow.utils.compare(data.values[a][node.sortBy],
          data.values[b][node.sortBy], data.dimensionTypes[node.sortBy]);
    }
  }.bind(this));
};

/**
 * Prepares heatmap xScale and yScale.
 * @private
 */
visflow.Heatmap.prototype.prepareXYScales_ = function() {
  var svgSize = this.getSVGSize();
  this.xScale = d3.scale.linear()
    .domain([0, this.dimensions.length])
    .range([this.leftMargin_, svgSize.width - this.PLOT_MARGINS.right]);
  this.yScale = d3.scale.linear()
    .domain([0, this.itemIndices_.length])
    .range([svgSize.height - this.PLOT_MARGINS.bottom, this.PLOT_MARGINS.top]);
};

/**
 * Prepares normalize scales that map data range to [0, 1].
 * @private
 */
visflow.Heatmap.prototype.prepareNormalizeScales_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;

  this.dimensions.forEach(function(dim, dimIndex) {
    var scaleInfo = visflow.utils.getScale(data, dim, items, [0, 1]);
    this.normalizeScales[dimIndex] = scaleInfo.scale;
  }, this);
};

/**
 * Updates the left margin based on the row label spans.
 * @private
 */
visflow.Heatmap.prototype.updateLeftMargin_ = function() {
  var inpack = this.ports['in'].pack,
    items = inpack.items,
    data = inpack.data;
  if (!this.options.rowLabels) {
    this.leftMargin_ = this.PLOT_MARGINS.left;
  } else {
    var maxLength = 0;
    for (var index in items) {
      var value = '' + data.values[index][this.options.labelBy];
      maxLength = Math.max(maxLength, value.length);
    }
    this.leftMargin_ = this.PLOT_MARGINS.left + maxLength *
        this.LABEL_FONT_SIZE_;
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.prepareScales = function() {
  this.updateLeftMargin_();
  // xScale depends on leftMargin.
  this.prepareXYScales_();
  this.prepareNormalizeScales_();
};

/**
 * Gets non-string dimensions as showing categorical dimension in heatmap is not
 * very helpful in general. However user may choose to render categorical data
 * in heatmap later.
 * @return {{
 *   labelBy: number,
 *   dimensions: !Array<number>
 * }}
 */
visflow.Heatmap.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var dimensions = [];
  var labelBy = null;
  data.dimensionTypes.forEach(function(type, index) {
    if (type != 'string') {
      dimensions.push(index);
    } else if (labelBy == null) {
      labelBy = index;
    }
  });
  return {
    dimensions: dimensions,
    labelBy: labelBy == null ? 0 : labelBy
  };
};

/** @inheritDoc */
visflow.Heatmap.prototype.dataChanged = function() {
  var info = this.findPlotDimensions();
  this.dimensions = info.dimensions;
  this.options.labelBy = info.labelBy;
  // The previous sortBy corresponds to unknown dimension in new data set.
  // We choose to sort by labels (usually item names) by default.
  this.options.sortBy = info.labelBy;

  this.updateLeftMargin_();
  this.sortItems_();
};
