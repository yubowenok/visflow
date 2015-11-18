/**
 * @fileoverview VisFlow parallel coordinates visualization.
 */

'use strict';

/**
 *
 * @constructor
 */
visflow.ParallelCoordinates = function(params) {
  visflow.ParallelCoordinates.base.constructor.call(this, params);

  this.prepare();

  // shown dimensions in parallel coordinates
  this.dimensions = [];

  this.scaleTypes = [];
  // dataScale : datavalue <-> [0, 1]
  this.dataScales = [];
  // screenScale: [0, 1] <-> screen pixel (rendering region)
  this.screenScales = [];

  // map each axis to the corresponding X position on screen
  this.axisScale = null;
  // leave some space for axes
  this.plotMargins = [ { before: 30, after: 30 }, { before: 20, after: 20 } ];
};

visflow.utils.inherit(visflow.ParallelCoordinates, visflow.Visualization);

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.PLOT_NAME = 'ParallelCoordinates';

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.defaultProperties = {
  color: 'black',
  size: 1,
  fill: 'none',
  opacity: 0.5
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.selectedProperties = {
  color: '#FF4400'
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.propertyTranslate = {
  size: 'ignore',
  color: 'stroke',
  width: 'stroke-width'
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.ICON_CLASS =
    'parallelcoordinates-icon square-icon';

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.serialize = function() {
  var result = visflow.ParallelCoordinates.base.serialize.call(this);
  result.dimensions = this.dimensions;
  return result;
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.deserialize = function(save) {
  visflow.ParallelCoordinates.base.deserialize.call(this, save);

  this.dimensions = save.dimensions;
  if (this.dimensions == null) {
    visflow.error('dimensions not saved for ' + this.plotName);
    this.dimensions = [0, 0];
  }
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.prepareInteraction = function() {
  var node = this,
      mode = 'none';
  var startPos = [0, 0],
      lastPos = [0, 0],
      endPos = [0, 0];
  var brush = [];

  var mouseupHandler = function(event) {
    if (mode == 'brush') {
      node.selectItemsBrushed(brush);

      if (node.brush) {
        node.brush.remove();
        node.brush = null;
      }
    }
    mode = 'none';
    if (visflow.interactionManager.visualizationBlocking)
      event.stopPropagation();
  };

  this.jqsvg
    .mousedown(function(event) {
      if (visflow.interactionManager.ctrled) // ctrl drag mode blocks
        return;

      startPos = visflow.utils.getOffset(event, $(this));

      if (event.which == 1) { // left click triggers brush
        mode = 'brush';
        brush = [];
      }
      if (visflow.interactionManager.visualizationBlocking)
        event.stopPropagation();
    })
    .mousemove(function(event) {
      if (mode == 'brush') {
        endPos = visflow.utils.getOffset(event, $(this));
        brush.push(endPos);

        node.showBrush(brush);

        lastPos = [endPos[0], endPos[1]];
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

/**
 * Selects the brushed item.
 * @param {!Array<!Array<number>>} brush Brush stroke polyline.
 */
visflow.ParallelCoordinates.prototype.selectItemsBrushed = function(brush) {
  if (!visflow.interactionManager.shifted) {
    this.selected = {}; // reset selection if shift key is not down
  }

  var inpack = this.ports['in'].pack,
      items = inpack.items,
      values = inpack.data.values;

  var points = [];
  for (var d in this.dimensions) {
    // use axisScale to map d-th axis to its X position
    points[d] = [this.axisScale(d)];
  }

  for (var index in items) {
    if (this.selected[index] != null) // already selected
      continue;
    for (var d in this.dimensions) {
      var value = values[index][this.dimensions[d]];
      value = this.dataScales[d](value);
      value = this.screenScales[d](value);
      points[d][1] = value;
    }
    var ok = 0;
    for (var d = 0; d < this.dimensions.length - 1 && !ok; d++) {
      for (var i = 0; i < brush.length - 1; i++) {
        if (visflow.utils.intersect(points[d], points[d + 1],
            brush[i], brush[i+1])) {
          this.selected[index] = true;
          break;
        }
      }
    }
  }
  this.showVisualization();
  this.pushflow();
};

/**
 * Displays the brush stroke.
 * @param {!Array<!Array<number>} points Brush stroke polyline points.
 */
visflow.ParallelCoordinates.prototype.showBrush = function(points) {
  var line = d3.svg.line()
      .x(function(e) {
        return e[0];
      })
      .y(function(e) {
        return e[1];
      })
      .interpolate('linear');
  this.brush = this.svg.append('path')
    .attr('class', 'df-parallelcoordinates-brush')
    .attr('d', line(points));
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.showVisualization = function() {
  var inpack = this.ports['in'].pack,
      items = inpack.items,
      data = inpack.data,
      values = data.values;

  this.checkDataEmpty();
  this.prepareSvg();
  if (this.isEmpty)
    return;
  this.prepareScales();
  this.interaction();

  var node = this;

  this.svgLines = this.svg.append('g');

  var points = [];
  for (var d in this.dimensions) {
    // use axisScale to map d-th axis to its X position
    points[d] = [this.axisScale(d)];
  }

  for (var index in items) {
    for (var d in this.dimensions) {
      var value = values[index][node.dimensions[d]];
      value = this.dataScales[d](value);
      value = this.screenScales[d](value);
      points[d][1] = value;
    }

    var properties = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        id: 'i' + index
      }
    );

    if (this.selected[index]) {
      _(properties).extend(this.selectedProperties);
    }

    var line = d3.svg.line()
      .x(function(e) {
        return e[0];
      })
      .y(function(e) {
        return e[1];
      })
      .interpolate('linear');

    var u = this.svgLines.append('path')
      .attr('id', 'i' + index)
      .attr('d', line(points));
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

  this.showSelection();

  // axis appears on top
  for (var d in this.dimensions) {
    this.showAxis(d);
  }
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.showSelection = function() {
  // otherwise no item data can be used
  if (this.isEmpty) {
    return;
  }
  // change position of tag to make them appear on top
  for (var index in this.selected) {
    var jqu = this.jqsvg.find('#i' + index)
      .appendTo($(this.svgLines[0]));
  }
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.showOptions = function() {
  this.selectDimensions = new visflow.Select({
    id: 'dimensions',
    label: 'Dimensions',
    target: this.jqoptions,
    multiple: true,
    sortable: true,
    relative: true,
    value: this.dimensions,
    list: this.prepareDimensionList(),
    change: function(event) {
      var unitChange = event.unitChange;
      this.dimensions = unitChange.value;
      this.pushflow();
      this.showVisualization();
    }.bind(this)
  });
};

/**
 * Shows the parallel coordinate axis for one dimension.
 * @param {number} d Dimension index.
 */
visflow.ParallelCoordinates.prototype.showAxis = function(d) {
  var margins = this.plotMargins;
  var axis = d3.svg.axis()
    .orient('left')
    .tickValues(this.dataScales[d].domain());
  if (this.scaleTypes[d] == 'ordinal'){
    axis.scale(this.dataScales[d].copy()
        .rangePoints(this.screenScales[d].range()));
  } else {
    axis.scale(this.dataScales[d].copy()
        .range(this.screenScales[d].range()));
  }
  var transX = this.axisScale(d),
      transY = 0;
  var labelX = 0,
      labelY = this.svgSize[1] - this.plotMargins[1].after + 15;

  var data = this.ports['in'].pack.data;

  var u = this.svg.select('#axis' + d);
  if (u.empty()) {
    u = this.svg.append('g')
     .attr('id', 'axis' + d)
     .attr('class', 'axis')
     .attr('transform', 'translate(' + transX + ',' + transY + ')');
  }
  u.call(axis);
  var t = u.select('.vis-label');
  if (t.empty()) {
    t = u.append('text')
      .attr('class', 'vis-label')
      .attr('x', labelX)
      .attr('y', labelY);
    }
  t.text(data.dimensions[this.dimensions[d]]);
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.prepareScales = function() {
  for (var d in this.dimensions) {
    this.prepareDataScale(d);
    this.prepareScreenScale(d);
  }
  this.prepareAxisScale();
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.prepareDataScale = function(d) {
  var inpack = this.ports['in'].pack;
  var items = inpack.items,
      data = inpack.data;

  var dim = this.dimensions[d],
      dimType = data.dimensionTypes[dim];

  var scaleType = dimType == 'string' ? 'ordinal' : 'numerical';
  this.scaleTypes[d] = scaleType;
  var scale;
  if (scaleType == 'numerical') {
    scale = this.dataScales[d] = d3.scale.linear().range([0,1]);

    var minVal = Infinity, maxVal = -Infinity;
    // compute min max
    for (var index in items) {
      var value = data.values[index][dim];
      minVal = Math.min(minVal, value);
      maxVal = Math.max(maxVal, value);
    }
    // NOT leave some spaces on the margin
    scale.domain([minVal, maxVal]);

  } else if (scaleType == 'ordinal') {
    scale = this.dataScales[d] = d3.scale.ordinal().rangePoints([0,1], 1.0);  // TODO check padding
    // find unique values
    var has = {};
    for (var index in items) {
      var value = data.values[index][dim];
      has[value] = true;
    }
    var values = [];
    for (var value in has) {
      values.push(value);
    }
    scale.domain(values);
  }
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.prepareScreenScale = function(d) {
  var scale = this.screenScales[d] = d3.scale.linear();
  var interval = [this.svgSize[1] - this.plotMargins[1].after, this.plotMargins[1].before];
  scale
    .domain([0, 1])
    .range(interval);
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.prepareAxisScale = function() {
  var numDims = this.dimensions.length;
  this.axisScale = d3.scale.linear()
    .domain([0, numDims - 1])
    .range([this.plotMargins[0].before, this.svgSize[0] - this.plotMargins[0].after]);
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.dataChanged = function() {
  var data = this.ports['in'].pack.data;
  // data has changed, by default load all dimensions
  this.dimensions = [];
  for (var i in data.dimensionTypes) {
    if (data.dimensionTypes[i] == 'string') // ignore string by default
      continue;
    this.dimensions.push(i);
  }
  this.lastDataId = data.dataId;
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.selectAll = function() {
  visflow.ParallelCoordinates.base.selectAll.call(this);
  this.showVisualization();
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.clearSelection = function() {
  visflow.ParallelCoordinates.base.clearSelection.call(this);
  this.showVisualization(); // TODO(bowen):　This is not efficient.
};

/** @inheritDoc */
visflow.ParallelCoordinates.prototype.resize = function(size) {
  visflow.ParallelCoordinates.base.resize.call(this, size);
  // TODO update scales for dimensions
  this.showVisualization();
};
