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
   * @protected {!Array<!d3.scale>}
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

  /** @private {d3} */
  this.svgHeatmap_;
  /** @private {d3} */
  this.svgRowLabels_;
  /** @private {d3} */
  this.svgColLabels_;
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
/** @private @const {number} */
visflow.Heatmap.prototype.ROW_LABEL_CLUTTER_OFFSET_ = 5;
/** @private @const {string} */
visflow.Heatmap.prototype.ROW_LABEL_CLUTTER_MSG_ = '(too many labels to show)';

/** @inheritDoc */
visflow.Heatmap.prototype.defaultOptions = function() {
  return {
    // Id corresponding to the id of visflow.scales.
    colorScaleId: 'redGreen',
      // By which column value shall the rows be sorted.
      sortBy: 0,
    // By which column value shall the rows be labeled. If this is empty string,
    // then show no row label.
    labelBy: 0,
    // Whether to show column label.
    colLabel: true
  };
};

/**
 * Default number of dimensions the heatmap would show.
 * @private
 */
visflow.Heatmap.prototype.DEFAULT_NUM_DIMENSION_ = 5;

/** @inheritDoc */
visflow.Heatmap.prototype.PANEL_TEMPLATE =
    './src/visualization/heatmap/heatmap-panel.html';

/** @inheritDoc */
visflow.Heatmap.prototype.defaultProperties = function() {
  return {
    color: '#555'
  };
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectedProperties = function() {
  return {
    border: '#6699ee',
    width: 1.5
  };
};

/** @private @const {number} */
visflow.Heatmap.prototype.LABEL_FONT_SIZE_X_ = 6;
/** @private @const {number} */
visflow.Heatmap.prototype.LABEL_FONT_SIZE_Y_ = 9;

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
  var dimInfos = this.uniqueDimensions(this.dimensions);

  var itemProps = this.itemIndices_.map(function(index) {
    var prop = {
      index: index,
      cells: this.dimensions.map(function(dim, dimIndex) {
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
    if (this.selected[index]) {
      var selectedProperties = this.selectedProperties();
      // Manually coded property for selected.
      prop.border = colorScaleInfo.contrastColor != null ?
        colorScaleInfo.contrastColor : selectedProperties.border;
      prop.labelBorder = selectedProperties.border;
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
  this.drawRowLabels_(this.itemProps_);
  this.drawColLabels_();
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
  rows.enter().append('g')
    .style('opacity', 0)
    .attr('id', _.getValue('index'));
  _.fadeOut(rows.exit());

  var updatedRows = this.allowTransition ? rows.transition() : rows;
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
  _.fadeOut(cells.exit());

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
 * @param {!Array<!visflow.Heatmap.ItemProperty>} itemProps
 * @param {boolean=} opt_temp Whether this is temporary rendering.
 * @private
 */
visflow.Heatmap.prototype.drawRowLabels_ = function(itemProps, opt_temp) {
  if (this.options.labelBy === '') {
    this.svgRowLabels_.selectAll('*').remove();
    return;
  }
  var cellHeight = opt_temp ? 0 : this.yScale(0) - this.yScale(1);
  var clutter = opt_temp ? false : cellHeight < this.LABEL_FONT_SIZE_Y_;

  // First clear potentially existing row clutter hint.
  this.svgRowLabels_.select('g').remove();

  var labels = this.svgRowLabels_.selectAll('text')
    .data(itemProps, _.getValue('index'));

  var labelTransform = function(row, index) {
    return visflow.utils.getTransform([
      this.leftMargin_ - this.ROW_LABEL_OFFSET_,
      opt_temp ? 0 : this.yScale(index + 1) + cellHeight / 2
    ]);
  }.bind(this);

  labels.enter().append('text')
    .attr('id', _.getValue('index'))
    .attr('transform', labelTransform)
    .classed('row-label', true);
  _.fadeOut(labels.exit());

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
    this.svgRowLabels_.append('g')
      .append('text')
      .classed('vis-label', true)
      .text(this.ROW_LABEL_CLUTTER_MSG_)
      .attr('transform', visflow.utils.getTransform([
        this.leftMargin_ - this.ROW_LABEL_OFFSET_ -
            this.ROW_LABEL_CLUTTER_OFFSET_,
        this.yScale(midIndex + 1) + cellHeight / 2
      ], 1, 90));
  } else {
    this.svgRowLabels_.select('g').remove();
  }
};

/**
 * Renders the column labels.
 * @private
 */
visflow.Heatmap.prototype.drawColLabels_ = function() {
  if (!this.options.colLabel || this.dimensions.length == 0) {
    _.fadeOut(this.svgColLabels_.selectAll('*'));
    return;
  }

  var labelTransform;
  if (this.colLabelVertical_) {
    this.svgColLabels_.classed('vertical', true);
    labelTransform = function(dimInfo, dimIndex) {
      return visflow.utils.getTransform([
        this.xScale(dimIndex + 0.5) + this.LABEL_FONT_SIZE_Y_ / 2,
        this.topMargin_ - this.COL_LABEL_OFFSET_
      ], 1, -90);
    }.bind(this);
  } else {
    this.svgColLabels_.classed('vertical', false);
    labelTransform = function(dimInfo, dimIndex) {
      return visflow.utils.getTransform([
        this.xScale(dimIndex + 0.5),
        this.topMargin_ - this.COL_LABEL_OFFSET_
      ]);
    }.bind(this);
  }
  var inpack = this.ports['in'].pack;
  var data = inpack.data;
  var dimInfos = this.uniqueDimensions(this.dimensions);
  var labels = this.svgColLabels_.selectAll('.vis-label')
    .data(dimInfos, _.getValue('uniqId'));
  labels.enter().append('text')
    .attr('id', _.getValue('uniqId'))
    .classed('vis-label', true)
    .attr('transform', labelTransform);
  _.fadeOut(labels.exit());
  var updatedLabels = this.allowTransition ? labels.transition() : labels;
  if (this.colLabelVerticalChanged_) {
    this.colLabelVerticalChanged_ = false;
    var counter = updatedLabels[0].length;
    updatedLabels = labels.transition()
      .each('end', function() {
        if ((--counter) == 0) {
          // Redraw after transition to keep up-to-date with resize.
          this.drawColLabels_();
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
 * Renders the temporary row labels to determine the label widths.
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
    this.drawRowLabels_(this.itemProps_, true);
  } else {
    this.drawColLabels_();
  }
  this.allowTransition = allowTransition;

  check();

  this.svgRowLabels_.selectAll('*').remove();

  if (tempShow) {
    this.content.hide();
  }
};


/** @inheritDoc */
visflow.Heatmap.prototype.showSelection = function() {
  var svg = $(this.svgHeatmap_.node());
  for (var index in this.selected) {
    svg.find('g#' + index).appendTo(svg);
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.initPanel = function(container) {
  visflow.Heatmap.base.initPanel.call(this, container);
  var dimensionList = this.getDimensionList();

  var units = [
    {
      constructor: visflow.EditableList,
      params: {
        container: container.find('#dims'),
        list: dimensionList,
        selected: this.dimensions,
        listTitle: 'Dimensions',
        addTitle: 'Add Dimension'
      },
      change: function(event, items) {
        this.dimensions = items;
        this.dimensionChanged();
      }
    },
    {
      constructor: visflow.ColorScaleSelect,
      params: {
        container: container.find('#color-scale'),
        selected: this.options.colorScaleId,
        listTitle: 'Color Scale'
      },
      change: function(event, scaleId) {
        this.options.colorScaleId = scaleId;
        this.itemProps_ = this.getItemProperties_();
        this.show();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#sort-by'),
        list: dimensionList,
        allowClear: true,
        selected: this.options.sortBy,
        listTitle: 'Sort By'
      },
      change: function(event, dim) {
        this.options.sortBy = dim;
        this.sortItems_();
        this.itemProps_ = this.getItemProperties_();
        this.show();
      }
    },
    {
      constructor: visflow.Select,
      params: {
        container: container.find('#label-by'),
        list: dimensionList,
        allowClear: true,
        selected: this.options.labelBy,
        listTitle: 'Row Labels'
      },
      change: function(event, dim) {
        this.options.labelBy = dim;
        this.itemProps_ = this.getItemProperties_();
        // Label dimension change may lead to leftMargin change.
        this.layoutChanged();
      }
    },
    {
      constructor: visflow.Checkbox,
      params: {
        container: container.find('#col-label'),
        value: this.options.colLabel,
        title: 'Column Labels'
      },
      change: function(event, value) {
        this.options.colLabel = value;
        this.layoutChanged();
      }
    }
  ];
  this.initInterface(units);
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
  this.xScale = d3.scale.linear()
    .domain([0, this.dimensions.length])
    .range([this.leftMargin_, svgSize.width - margins.right]);
  this.yScale = d3.scale.linear()
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

  this.dimensions.forEach(function(dim, dimIndex) {
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
      $(this.svgRowLabels_.node()).find('.row-label')
        .each(function(index, element) {
          maxWidth = Math.max(maxWidth, element.getBBox().width);
        });
    }.bind(this), 'row');
    this.leftMargin_ += this.ROW_LABEL_OFFSET_ + maxWidth;
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
      this.dimensions.length;
    var maxLength = d3.max(this.dimensions.map(function(dim) {
      return data.dimensions[dim].length;
    }));
    if (maxLength == null) {
      maxLength = 0;
    }
    var oldVertical = this.colLabelVertical_;
    if (colWidth < maxLength * this.LABEL_FONT_SIZE_X_) {
      this.colLabelVertical_ = true;
      this.topMargin_ += this.LABEL_FONT_SIZE_X_ * maxLength;
    } else {
      this.colLabelVertical_ = false;
      this.topMargin_ += this.LABEL_FONT_SIZE_Y_ + this.COL_LABEL_OFFSET_;
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
 */
visflow.Heatmap.prototype.findPlotDimensions = function() {
  var data = this.ports['in'].pack.data;
  var dimensions = [];
  var labelBy = null;
  data.dimensionTypes.forEach(function(type, index) {
    if (type != visflow.ValueType.STRING) {
      if (dimensions.length < this.DEFAULT_NUM_DIMENSION_) {
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
  this.dimensions = info.dimensions;
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
