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
    // Id corresponding to the id of visflow.scales.
    colorScaleId: 'redGreen',
    // By which column value shall the rows be sorted.
    sortBy: 0,
    // By which column value shall the rows be labeled. If this is empty string,
    // then show no row label.
    labelBy: 0
  });
};

visflow.utils.inherit(visflow.Heatmap, visflow.Visualization);

/** @inheritDoc */
visflow.Heatmap.prototype.NODE_NAME = 'Heatmap';
/** @inheritDoc */
visflow.Heatmap.prototype.NODE_CLASS = 'heatmap';
/** @private @const {number} */
visflow.Heatmap.prototype.ROW_LABEL_OFFSET_ = 10;
/** @private @const {number} */
visflow.Heatmap.prototype.COL_LABEL_OFFSET_ = 10;
/** @inheritDoc */
visflow.Heatmap.prototype.PANEL_TEMPLATE =
    './src/visualization/heatmap/heatmap-panel.html';

/** @inheritDoc */
visflow.Heatmap.prototype.defaultProperties = {
  color: '#555'
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectedProperties = {
  border: '#6699ee',
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

  this.dimensions = save.dimensions;
  if (this.dimensions == null) {
    visflow.error('dimensions not saved for ' + this.NODE_NAME);
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
  var colorScaleInfo = visflow.scales[this.options.colorScaleId];
  var colorScale = colorScaleInfo.scale;
  var dimInfos = this.uniqueDimensions(this.dimensions);

  return this.itemIndices_.map(function(index) {
    var prop = {
      id: 'r' + index,
      cells: this.dimensions.map(function (dim, dimIndex) {
        var value = data.values[index][dim];
        return {
          color: colorScale(this.normalizeScales[dimIndex](value)),
          dimId: dimInfos[dimIndex].uniqId
        };
      }, this),
      border: 'none',
      label: this.options.labelBy === '' ? '' :
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
    .style('opacity', 0)
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
    }.bind(this))
    .style('opacity', 1);

  var cellWidth = Math.ceil(this.xScale(1) - this.xScale(0));
  var cellHeight = Math.ceil(this.yScale(0) - this.yScale(1));

  var cellTransform = function(cell, index) {
    return visflow.utils.getTransform([this.xScale(index), 0]);
  }.bind(this);

  var cells = rows.selectAll('rect')
    .data(_.getValue('cells'), _.getValue('dimId'));
  cells.enter().append('rect')
    .style('opacity', 0)
    .attr('id', _.getValue('dimId'))
    .attr('transform', cellTransform);
  cells.exit()
    .transition()
    .style('opacity', 0)
    .remove();

  var updatedCells = this.allowTransition_ ? cells.transition() : cells;
  updatedCells
    .attr('fill', _.getValue('color'))
    .attr('transform', cellTransform)
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .style('opacity', 1);
};

/**
 * Renders the heatmap row labels.
 * @param {!Array<!visflow.Heatmap.ItemProperty>} itemProps
 * @private
 */
visflow.Heatmap.prototype.drawRowLabels_ = function(itemProps) {
  if (this.options.labelBy === '') {
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
  var dimInfos = this.uniqueDimensions(this.dimensions);
  var labels = this.svgColLabels_.selectAll('.vis-label')
    .data(dimInfos, _.getValue('uniqId'));
  labels.enter().append('text')
    .attr('id', _.getValue('uniqId'))
    .classed('vis-label', true);
  labels.exit()
    .transition()
    .style('opacity', 0)
    .remove();
  var updatedLabels = this.allowTransition_ ? labels.transition() : labels;
  updatedLabels
    .text(function(dimInfo) {
      return data.dimensions[dimInfo.dim];
    })
    .attr('x', function(dimInfo, dimIndex) {
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
visflow.Heatmap.prototype.initPanel = function(container) {
  visflow.Heatmap.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

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

  var sortBySelect = new visflow.Select({
    container: container.find('#sort-by'),
    list: dimensionList,
    allowClear: true,
    selected: this.options.sortBy,
    listTitle: 'Sort By'
  });
  $(sortBySelect).on('visflow.change', function(event, dim) {
    this.options.sortBy = dim;
    this.sortItems_();
    this.show();
  }.bind(this));

  var labelBySelect = new visflow.Select({
    container: container.find('#label-by'),
    list: dimensionList,
    allowClear: true,
    selected: this.options.labelBy,
    listTitle: 'Label By'
  });
  $(labelBySelect).on('visflow.change', function(event, dim) {
    this.options.labelBy = dim;
    // Label dimension change may lead to leftMargin change.
    this.prepareScales();
    this.show();
  }.bind(this));

  var colorScaleSelect = new visflow.ColorScaleSelect({
    container: container.find('#color-scale'),
    selected: this.options.colorScaleId,
    listTitle: 'Color Scale'
  });
  $(colorScaleSelect).on('visflow.change', function(event, scaleId) {
    this.options.colorScaleId = scaleId;
    this.show();
  }.bind(this));
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
    var sortBy = this.options.sortBy;
    // Sorting is in reversed order, as rendering starts from bottom.
    if (sortBy === '') {
      // Default sort by index.
      return b - a;
    } else {
      return -visflow.utils.compare(data.values[a][sortBy],
          data.values[b][sortBy], data.dimensionTypes[sortBy]);
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
  if (this.options.labelBy === '') {
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
  // We choose to sort by nothing by default.
  this.options.sortBy = '';

  this.updateLeftMargin_();
  this.sortItems_();
};
