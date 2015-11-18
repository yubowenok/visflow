/**
 * @fileoverview VisFlow heatmap visualization.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Heatmap = function(params) {
  visflow.Heatmap.base.constructor.call(this, params);

  this.prepare();

  // shown dimensions in parallel coordinates
  this.dimensions = [];

  this.scaleTypes = [];
  // index pair (0~n-1, 0~m-1) to screen pixels
  this.screenScales = [];
  // value scale that handles all numerical entries to [0, 1]
  // [0, 1] is further mapped to color in rendering
  this.dataScale = [];

  // default
  this.colorScale = 'red-green';

  // leave some space for axes
  this.plotMargins = [ { before: 10, after: 10 }, { before: 30, after: 10 } ];
  this.plotMarginsInit = {};
  $.extend(true, this.plotMarginsInit, this.plotMargins);

  this.rowLabelsShifts = [-5, 0];
  this.rowLabels = null;

  // scale all columns
  this.allColumns = false;
  // sort criterion
  this.sortBy = null;
};

visflow.utils.inherit(visflow.Heatmap, visflow.Visualization);

/** @inheritDoc */
visflow.Heatmap.prototype.PLOT_NAME = 'Heatmap';

/** @inheritDoc */
visflow.Heatmap.prototype.ICON_CLASS =
    'heatmap-icon square-icon';

/** @inheritDoc */
visflow.Heatmap.prototype.defaultProperties = {
  color: '#555'
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectedProperties = {
  border: '#FF4400',
  width: 1.5
};

/**
 * No translate for heatmap, heatmap's rendering is not item based.
 * @inheritDoc
 */
visflow.Heatmap.prototype.propertyTranslate = {
};

/** @protected @const {number} */
visflow.Heatmap.prototype.FONT_WIDTH = 5.5;

/** @inheritDoc */
visflow.Heatmap.prototype.serialize = function() {
  var result = visflow.Heatmap.base.serialize.call(this);
  result.dimensions = this.dimensions;
  result.colorScale = this.colorScale;
  result.rowLabels = this.rowLabels;
  result.allColumns = this.allColumns;
  result.sortBy = this.sortBy;
  return result;
};

/** @inheritDoc */
visflow.Heatmap.prototype.deserialize = function(save) {
  visflow.Heatmap.base.deserialize.call(this, save);

  this.colorScale = save.colorScale;
  this.rowLabels = save.rowLabels;
  this.allColumns = save.allColumns;
  this.dimensions = save.dimensions;
  this.sortBy = save.sortBy;
  if (this.dimensions == null) {
    visflow.error('dimensions not saved for ' + this.plotName);
    this.dimensions = [];
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.prepareInteraction = function() {
  visflow.Heatmap.base.prepareInteraction.call(this);

  var node = this,
      mode = 'none';
  var startPos = [0, 0],
      lastPos = [0, 0],
      endPos = [0, 0];
  var selectbox = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0
  };

  var mouseupHandler = function(event) {
    if (mode == 'selectbox') {
      node.selectItemsInBox([
          [selectbox.x1, selectbox.x2],
          [selectbox.y1, selectbox.y2]
        ]);
      if (node.selectbox) {
        node.selectbox.remove();
        node.selectbox = null;
      }
    }
    mode = 'none';
    if (visflow.interaction.visualizationBlocking)
      event.stopPropagation();
  };

  this.jqsvg
    .mousedown(function(event) {
      if (visflow.interaction.ctrled) // ctrl drag mode blocks
        return;

      startPos = visflow.utils.getOffset(event, $(this));

      if (event.which == 1) { // left click triggers selectbox
        mode = 'selectbox';
      }
      if (visflow.interaction.visualizationBlocking)
        event.stopPropagation();
    })
    .mousemove(function(event) {
      if (mode == 'selectbox') {
        endPos = visflow.utils.getOffset(event, $(this));
        selectbox.x1 = Math.min(startPos[0], endPos[0]);
        selectbox.x2 = Math.max(startPos[0], endPos[0]);
        selectbox.y1 = Math.min(startPos[1], endPos[1]);
        selectbox.y2 = Math.max(startPos[1], endPos[1]);
        node.showSelectbox(selectbox);
      }
      // we shall not block mousemove (otherwise dragging edge will be problematic)
      // as we can start a drag on edge, but when mouse enters the visualization, drag will hang there
    })
    .mouseup(mouseupHandler)
    .mouseleave(function(event) {
      if ($(this).parent().length == 0) {
        return; // during svg update, the parent of mouseout event is unstable
      }
      mouseupHandler(event);
    });
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectItemsInBox = function(box) {
  if (!visflow.interaction.shifted) {
    this.selected = {}; // reset selection if shift key is not down
  }

  var inpack = this.ports['in'].pack,
      items = inpack.items,
      values = inpack.data.values;

  for (var i = 0; i < this.itemIndexes.length; i++) { // avoid i being string
    var index = this.itemIndexes[i];
    var y1 = this.screenScales[1](i+1), y2 = this.screenScales[1](i);

    if (y2 >= box[1][0] && y1 <= box[1][1]) {
      this.selected[index] = true;
    }
  }
  this.showVisualization();
  this.pushflow();
};

/**
 * Displays the select range box.
 * @param box
 */
visflow.Heatmap.prototype.showSelectbox = function(box) {
  var node = this;
  this.selectbox = this.svg.select('.vis-selectbox');
  if (this.selectbox.empty())
    this.selectbox = this.svg.append('rect')
      .attr('class', 'vis-selectbox');

  this.selectbox
    .attr('x', this.plotMargins[0].before)
    .attr('y', box.y1)
    .attr('width', this.svgSize[0] - this.plotMargins[0].before - this.plotMargins[0].after)
    .attr('height', box.y2 - box.y1);
};

/** @inheritDoc */
visflow.Heatmap.prototype.showVisualization = function(useTransition) {
  // may reach here when node is in icon mode but options are on, and colorscale callback
  if (!this.detailsOn)
    return;

  var node = this;
  var inpack = this.ports['in'].pack,
      items = inpack.items,
      data = inpack.data;

  this.checkDataEmpty();
  this.prepareSvg(useTransition);
  if (this.isEmpty)
    return;
  this.prepareScales();
  this.interaction();

  var scale;
  if (this.colorScale == null
     || (scale = visflow.viewManager.colorScales[this.colorScale]) == null) {
   return;
  }

  var colorScale = d3.scale.linear()
    .domain(scale.domain)
    .range(scale.range);

  var ritems = [];
  for (var i in this.itemIndexes) {
    var index = this.itemIndexes[i];
    var cols = [];
    for (var j in this.dimensions) {
      var dim = this.dimensions[j],
          value = data.values[index][dim];
      var color;
      if (this.allColumns)
        color = colorScale(this.dataScale(value));
      else
        color = colorScale(this.dataScale[j](value));
      cols.push(color);
    }
    if (this.rowLabels) {
      cols.label = data.values[index][this.rowLabels];
    }
    if (this.selected[index]) {
      // manually coded property for selected
      cols.border = scale.contrast != null ? scale.contrast : this.selectedProperties.border;
      cols.labelborder = this.selectedProperties.border;
      cols.width = this.selectedProperties.width;
    } else {
      if (items[index].properties.color != null) {
        cols.labelborder = items[index].properties.color;
      }
    }
    cols.index = index;
    ritems.push(cols);
  }

  var selrows = this.svg.selectAll('g').data(ritems, function(e){
    return '' + e.index;
  });
  var rows = selrows;
  if (useTransition)
    rows = rows.interrupt().transition();
  else {
    rows = rows.enter().append('g')
      .attr('id', function(e) {
        return 'r' + e.index;
      });
  }
  rows
    .style('stroke', function(e){ // selected properties
      return e.border != null ? e.border : '';
    })
    .style('stroke-width', function(e){
      return e.width != null ? e.width : '';
    })                            // selected properties end
    .attr('transform', function(e, i) {
      return 'translate(0,'
        + (node.screenScales[1](i + 1)) + ')';
    });

  var width = this.screenScales[0](1) - this.screenScales[0](0),
      height = this.screenScales[1](0) - this.screenScales[1](1);
  width = Math.ceil(width);
  height = Math.ceil(height);

  if (!useTransition) {
    var cells = rows.selectAll('rect').data(function(row){ return row; })
      .enter().append('rect')
      .attr('transform', function(e, j) {
        return 'translate(' + node.screenScales[0](j) + ',0)';
      })
      .attr('fill', function(e) {
        return e;
      })
      .attr('width', width)
      .attr('height', height);
  }

  this.svg.selectAll('.df-row-label').remove();
  if (this.rowLabels) {
    var labels = this.svg.selectAll('g').data(ritems, function(e) {
        return e.index;
      })
      .append('text')
      .attr('class', 'df-row-label')
      .text(function(e) {
        return e.label;
      })
      .style('stroke', function(e){ // selected properties
        return e.labelborder != null ? e.labelborder : '';
      })
      .style('stroke-width', function(e){
        return e.labelborder != null ? 1 : '';
      })
      .attr('transform', function(e) {
        return 'translate(' + (node.plotMargins[0].before + node.rowLabelsShifts[0]) + ','
          + (height/2) + ')';
      });
  }
  this.showDimensionLabels(useTransition);
  this.showSelection();
};

/** @inheritDoc */
visflow.Heatmap.prototype.showSelection = function() {
  // otherwise no item data can be used
  if (this.isEmpty)
    return;
  // nothing
  for (var index in this.selected) {
    this.jqsvg.find('#r' + index)
      .appendTo(this.jqsvg);
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.showDimensionLabels = function(useTransition) {
  var inpack = this.ports['in'].pack,
      data = inpack.data;
  var node = this;
  var labels = this.svg.selectAll('.vis-label');
  if (!useTransition)
    labels = labels.data(this.dimensions).enter().append('text');
  else
    labels = labels.interrupt().transition();
  labels
    .attr('class', 'vis-label')
    .text(function(e) {
      return data.dimensions[e];
    })
    .attr('x', function(e, i) {
      return node.screenScales[0](i + 0.5);
    })
    .attr('y', this.plotMargins[1].before - 10);
};

/** @inheritDoc */
visflow.Heatmap.prototype.showOptions = function() {
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
      node.showVisualization(); // show after process (in pushflow)
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
      node.showVisualization(); // show after process (in pushflow)
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
      node.showVisualization(); // show after process (in pushflow)
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
      node.showVisualization(); // show after process (in pushflow)
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
      node.showVisualization(true); // show after process (in pushflow)
    }
  });
};

/** @inheritDoc */
visflow.Heatmap.prototype.processExtra = function() {
  var node = this,
      inpack = this.ports['in'].pack,
      items = inpack.items,
      data = inpack.data;

  // Get a sorted list of indexes.
  this.itemIndexes = [];
  for (var index in items) {
    this.itemIndexes.push(parseInt(index)); // index is string
  }
  this.itemIndexes.sort(function(a, b){
    if (node.sortBy == null) {
      return a - b; // default sort by index
    } else {
      return visflow.utils.compare(data.values[a][node.sortBy],
          data.values[b][node.sortBy],
          data.dimensionTypes[node.sortBy]);
    }
  });

  // Get dataScale.
  var minVal = Infinity, maxVal = -Infinity;
  if (!this.allColumns)
    this.dataScale = [];
  for (var i in this.dimensions) {
    if (!this.allColumns) {
     minVal = Infinity;
     maxVal = -Infinity;  // make scale for each column
    }
    for (var index in items) {
      var dim = this.dimensions[i];
      var value = data.values[index][dim];
      if (value < minVal)
        minVal = value;
      if (value > maxVal)
        maxVal = value;
    }
    if (!this.allColumns)
      this.dataScale[i] = d3.scale.linear()
        .domain([minVal, maxVal])
        .range([0, 1]);
  }
  if (this.allColumns) {
    this.dataScale = d3.scale.linear()
      .domain([minVal, maxVal])
      .range([0, 1]);
  }

  // get left margin of row labels
  var margin = this.plotMarginsInit[0].before;
  if (this.rowLabels != null) {
    for (var index in items) {
      var value = '' + data.values[index][this.rowLabels];
      margin = Math.max(margin, value.length * this.FONT_WIDTH);
    }
  }
  this.plotMargins[0].before = margin + (-this.rowLabelsShifts[0]);
};

/** @inheritDoc */
visflow.Heatmap.prototype.prepareScales = function() {
  [0, 1].map(function(d) {
    this.prepareScreenScale(d);
  }, this);
};

/** @inheritDoc */
visflow.Heatmap.prototype.prepareScreenScale = function(d) {
  var inpack = this.ports['in'].pack;
  var items = inpack.items,
      data = inpack.data;
  var scale = this.screenScales[d] = d3.scale.linear();
  var interval = [this.plotMargins[d].before, this.svgSize[d] - this.plotMargins[d].after];
  if (d) {
    var t = interval[0];
    interval[0] = interval[1];
    interval[1] = t;
  }
  scale.range(interval);
  if (!d){
    scale.domain([0, this.dimensions.length]);
  } else {
    scale.domain([0, inpack.count()]);
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.dataChanged = function() {
  var data = this.ports['in'].pack.data;
  // clear dimension selection upon data change
  this.dimensions = [];
  // find all non-string dimensions
  for (var i in data.dimensionTypes) {
    if (data.dimensionTypes[i] != 'string') {
      this.dimensions.push(i);
    }
  }
};

/** @inheritDoc */
visflow.Heatmap.prototype.selectAll = function() {
  visflow.Heatmap.base.selectAll.call(this);
  this.showVisualization();
};

/** @inheritDoc */
visflow.Heatmap.prototype.clearSelection = function() {
  visflow.Heatmap.base.clearSelection.call(this);
  this.showVisualization(); // TODO　not efficient
};

/** @inheritDoc */
visflow.Heatmap.prototype.resize = function(size) {
  visflow.Heatmap.base.resize.call(this, size);
  [0, 1].map(function(d) {
    this.prepareScreenScale(d);
  }, this);
  this.showVisualization();
};
