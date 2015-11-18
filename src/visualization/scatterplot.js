/**
 * @fileoverview VisFlow scatterplot visualization.
 */

'use strict';

/**
 * @param {Object} params
 * @constructor
 */
visflow.Scatterplot = function(params) {
  visflow.Scatterplot.base.constructor.call(this, params);

  this.prepare();

  // 0: X axis, 1: Y axis
  this.dimensions = [0, 0];
  this.selectDimensions = [];

  this.scaleTypes = [null, null];
  // dataScale : datavalue <-> [0, 1]
  this.dataScales = [null, null];
  // screenScale: [0, 1] <-> screen pixel (rendering region)
  this.screenScales = [null, null];
  // leave some space for axes
  this.plotMargins = [ { before: 40, after: 10 }, { before: 10, after: 30 } ];

  this.plotName = 'Scatterplot';
};

visflow.utils.inherit(visflow.Scatterplot, visflow.Visualization);

/** @inheritDoc */
visflow.Scatterplot.prototype.ICON_CLASS =
    'scatterplot-icon square-icon';

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

/** @inheritDoc */
visflow.Scatterplot.prototype.prepareInteraction = function() {
  visflow.Scatterplot.base.prepareInteraction.call(this);

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
    if (visflow.interaction.visualizationBlocking) {
      event.stopPropagation();
    }
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
    var ok = 1;
    [0, 1].map(function(d) {
      var value = values[index][this.dimensions[d]];
      value = this.dataScales[d](value);
      value = this.screenScales[d](value);
      if (value < box[d][0] || value > box[d][1]) {
        ok = 0;
      }
    }, this);

    if (ok) {
      this.selected[index] = true;
    }
  }

  this.showVisualization();
  this.pushflow();
};

/**
* Displays the range selection box.
*/
visflow.Scatterplot.prototype.showSelectbox = function(box) {
  var node = this;
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
visflow.Scatterplot.prototype.showVisualization = function(useTransition) {
  var inpack = this.ports['in'].pack,
      items = inpack.items,
      data = inpack.data,
      values = data.values;

  this.checkDataEmpty();
  this.prepareSvg(useTransition);
  if (this.isEmpty)
    return;
  this.prepareScales();
  this.interaction();

  var node = this;

  if (!useTransition) {
    this.svgPoints = this.svg.append('g');
  }

  var ritems = []; // data to be rendered
  for (var index in items) {
    var c = [];
    [0, 1].map(function(d) {
      var value = values[index][node.dimensions[d]];
      value = node.dataScales[d](value);
      value = node.screenScales[d](value);
      c[d] = value;
    }, this);

    var properties = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        id: 'i' + index,
        cx: c[0],
        cy: c[1]
      }
    );
    if (this.selected[index]) {
      _(properties).extend(this.selectedProperties);
      for (var p in this.selectedMultiplier) {
        var v = properties[p];
        if (v != null) {
          properties[p] = v * this.selectedMultiplier[p];
        }
      }
    }
    ritems.push(properties);
  }

  var points;
  if (!useTransition) {
    points = this.svgPoints.selectAll('circle').data(ritems, function(e) {
      return e.id;
    }).enter()
      .append('circle')[0];
  }
  else {
    points = this.svgPoints.selectAll('circle').data(ritems, function(e) {
      return e.id;
    })[0];
  }

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

  this.showSelection();

  // axis appears on top
  [0, 1].map(function(d) {
    this.showAxis(d);
  }, this);
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
visflow.Scatterplot.prototype.showOptions = function() {
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
        node.showVisualization(true);
      }
    });
  }, this);
};

/**
 * Displays the scatterplot axis.
 */
visflow.Scatterplot.prototype.showAxis = function(d) {
  var dt = !d? 'x' : 'y';
  var margins = this.plotMargins;
  var axis = d3.svg.axis()
    .orient(!d ? 'bottom' : 'left')
    .ticks(5);
  if (this.scaleTypes[d] == 'ordinal'){
    axis.scale(this.dataScales[d].copy()
        .rangePoints(this.screenScales[d].range(), 1.0));
  } else {
    axis.scale(this.dataScales[d].copy()
        .range(this.screenScales[d].range()));
  }
  var transX = !d ? 0 : margins[0].before,
      transY = !d ? this.svgSize[1] - margins[1].after : 0;
  var labelX = !d ? this.svgSize[0] - margins[0].after : margins[1].before,
      labelY = -5;

  var data = this.ports['in'].pack.data;

  var u = this.svg.select('.' + dt +'.axis');
  if (u.empty()) {
    u = this.svg.append('g')
     .attr('class', dt + ' axis')
     .attr('transform', 'translate(' + transX + ',' + transY + ')');
  }
  u.call(axis);
  var t = u.select('.vis-label');
  if (t.empty()) {
    t = u.append('text')
      .attr('class', 'vis-label')
      .style('text-anchor', !d ? 'end' : 'start')
      .attr('transform', !d ? '' : 'rotate(90)')
      .attr('x', labelX)
      .attr('y', labelY);
    }
  t.text(data.dimensions[this.dimensions[d]]);
};

/** @inheritDoc */
visflow.Scatterplot.prototype.prepareScales = function() {
  [0, 1].map(function(d) {
    this.prepareDataScale(d);
    this.prepareScreenScale(d);
  }, this);
};

/** @inheritDoc */
visflow.Scatterplot.prototype.prepareDataScale = function(d) {
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
    var span = maxVal - minVal;

    // leave some spaces on the margin
    scale.domain([minVal - span * .15, maxVal + span * .15]);

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
  var data = this.ports['in'].pack.data;
  var chosen = [];
  for (var i in data.dimensionTypes) {
    if (data.dimensionTypes[i] != 'string') {
      chosen.push(i);
    }
    if (chosen.length == 2)
      break;
  }
  this.dimensions = [chosen[0], chosen[1 % chosen.length]];
};

/** @inheritDoc */
visflow.Scatterplot.prototype.selectAll = function() {
  visflow.Scatterplot.base.selectAll.call(this);
  this.showVisualization();
};

/** @inheritDoc */
visflow.Scatterplot.prototype.clearSelection = function() {
  visflow.Scatterplot.base.clearSelection.call(this);
  this.showVisualization(); // TODO　not efficient
};

/** @inheritDoc */
visflow.Scatterplot.prototype.resize = function(size) {
  visflow.Scatterplot.base.resize.call(this, size);
  [0, 1].map(function(d) {
    this.prepareScreenScale(d);
  }, this);
  this.showVisualization();
};
