/**
 * @fileoverview VisFlow visualization base class.
 */

'use strict';

/**
 * @param {!Object} params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.Visualization = function(params) {
  visflow.Visualization.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    in: new visflow.Port(this, 'in', 'in-single', 'D'),
    outs: new visflow.Port(this, 'outs', 'out-multiple', 'S'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };

  /** @inheritDoc */
  this.label = this.PLOT_NAME + ' (' + this.id + ')';

  /**
   * D3 selection of the svg container.
   * @protected {d3.selection}
   */
  this.svg;

  /**
   * Selected data items.
   * @protected {!Object<number>}
   */
  this.selected = {};

  // Points of user brush.
  /** @private {!Array<{x: number, y: number}>} */
  this.brushPoints_ = [];

  /**
   * Last used dataset ID.
   * @protected {number}
   */
  this.lastDataId = 0;  // Default: empty data

  /**
   * Whether rendering should be using transition. When the view is resized,
   * the view shall be re-rendered without transition.
   * @private {boolean}
   */
  this.allowTransition_ = true;

  _(this.options).extend({
    label: true,
    visMode: true
  });
};

visflow.utils.inherit(visflow.Visualization, visflow.Node);

/**
 * Plot name used for debugging and hint message.
 * @const {string}
 */
visflow.Visualization.prototype.PLOT_NAME = 'visualization';
/** @inheritDoc */
visflow.Visualization.prototype.SHAPE_CLASS = 'shape-vis';
/** @inheritDoc */
visflow.Visualization.prototype.TEMPLATE = './src/visualization/visualization.html';

/**
 * @const {!Array<{left: number, right: number, top: number, bottom: number}>}
 */
visflow.Visualization.prototype.PLOT_MARGINS = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0
};

/**
 * Object for specifying default rendering properties.
 * @const {!Object<number|string>}
 */
visflow.Visualization.prototype.defaultProperties = {
  color: '#555',
  border: 'black',
  width: 1,
  size: 3
};

/**
 * These properties are shown when items are selected.
 * @const {!Object<number|string>}
 */
visflow.Visualization.prototype.selectedProperties = {
  color: 'white',
  border: '#FF4400'
};

/**
 * Highlight effect for selected elements, using multiplier.
 * @const {!Object<number|string>}
 */
visflow.Visualization.prototype.selectedMultiplier = {
  size: 1.2,
  width: 1.2
};

/** @inheritDoc */
visflow.Visualization.prototype.CONTEXTMENU_ITEMS = [
  {id: 'selectAll', text: 'Select All'},
  {id: 'clearSelection', text: 'Clear Selection'},
  {id: 'minimize', text: 'Minimize', icon: 'glyphicon glyphicon-minus'},
  {id: 'visMode', text: 'Visualization Mode', icon: 'glyphicon glyphicon-picture'},
  {id: 'panel', text: 'Control Panel', icon: 'glyphicon glyphicon-th-list'},
  {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
];


/** @inheritDoc */
visflow.Visualization.prototype.init = function() {
  visflow.Visualization.base.init.call(this);
  this.container.addClass('visualization');
  this.svg = d3.select(this.content.children('svg')[0]);
  this.updateSVGSize();
};

/**
 * Serializes the visualization node.
 * @returns {!Object}
 */
visflow.Visualization.prototype.serialize = function() {
  var result = visflow.Visualization.base.serialize.call(this);

  // view sizes
  result.viewWidth = this.viewWidth;
  result.viewHeight = this.viewHeight;
  result.visWidth = this.visWidth;
  result.visHeight = this.visHeight;

  // selection
  result.selected = this.selected;

  // last data
  result.lastDataId = this.lastDataId;

  return result;
};

/**
 * Deserializes the visualization node.
 * @param save
 */
visflow.Visualization.prototype.deserialize = function(save) {
  visflow.Visualization.base.deserialize.call(this, save);
  this.visWidth = save.visWidth;
  this.visHeight = save.visHeight;
  this.viewWidth = save.viewWidth;
  this.viewHeight = save.viewHeight;

  this.selected = save.selected;
  if (this.selected instanceof Array || this.selected == null) {
    visflow.error('incorrect selection saved: array/null');
    this.selected = {};
  }

  /*
  this.lastDataId = save.lastDataId;
  if (this.lastDataId == null) {
    visflow.error('lastDataId not saved in visualization');
    this.lastDataId = 0;
  }
  */
};

/** @inheritDoc */
visflow.Visualization.prototype.show = function() {
  visflow.Visualization.base.show.call(this);

  if (!this.options.minimized) {
    this.showSelection();
  }
};

/**
 * Checks whether the input data is empty.
 * @return {boolean}
 */
visflow.Visualization.prototype.isDataEmpty = function() {
  return this.ports['in'].pack.isEmpty();
};

/**
 * Checks if the node's data is empty.
 * @return {boolean}
 */
visflow.Visualization.prototype.checkDataEmpty = function() {
  if (this.isDataEmpty()) {
    // otherwise scales may be undefined
    this.showMessage('empty data in ' + this.PLOT_NAME);
    this.content.hide();
    return true;
  } else {
    this.hideMessage();
    this.content.show();
    return false;
  }
};

/** @inheritDoc */
visflow.Visualization.prototype.interaction = function() {
  visflow.Visualization.base.interaction.call(this);

  // Resizable is enabled for all visualization nodes.
  this.container.resizable('enable');
};

/** @inheritDoc */
visflow.Visualization.prototype.showDetails = function() {
  visflow.Visualization.base.showDetails.call(this);

  // Update SVG size.
  this.svg
    .attr('width', this.container.width())
    .attr('height', this.container.height());
};

/** @inheritDoc */
visflow.Visualization.prototype.process = function() {
  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack,
      outspack = this.ports['outs'].pack;

  outpack.copy(inpack, true); // always pass data through

  // During async data load, selection is first de-serialized to vis nodes
  // However the data have not reached this point.
  // Thus the selection might be erroneously cleared if continue processing.
  if (inpack.isEmpty()) {
    outspack.copy(inpack, true);
    outspack.items = {};
    return;
  }
  this.validateSelection();

  // Inheriting visualization classes may implement this to change routine
  // that sends selection to output S.
  this.processSelection();

  if (this.lastDataId != inpack.data.dataId) {
    // Data has changed, fire change event
    // visualization can update selected dimension in this function.
    this.dataChanged();

    this.lastDataId = inpack.data.dataId;
  }

  if (this.inPortsChanged()) {
    // Each time process() is called, input must have changed. Scales depend on
    // input and should be updated.
    this.prepareScales();

    // Do extra processing, such as sorting the item indexes in heatmap.
    this.processExtra();
  }
};

/**
 * Processes the current user selection.
 */
visflow.Visualization.prototype.processSelection = function() {
  var inpack = this.ports['in'].pack;
  var outspack = this.ports['outs'].pack;
  outspack.copy(inpack);
  outspack.filter(_.allKeys(this.selected));
};

/**
 * Validates the data item selection. Removes all data items that no longer
 * exist. This may be result of upflow input change.
 */
visflow.Visualization.prototype.validateSelection = function() {
  var inpack = this.ports['in'].pack;
  for (var index in this.selected) {
    if (inpack.items[index] == null){
      delete this.selected[index];
    }
  }
};

/**
 * Provides an extra flag to
 */

/**
 * Selects all elements.
 */
visflow.Visualization.prototype.selectAll = function() {
  var inpack = this.ports['in'].pack;
  this.selected = {};
  for (var index in inpack.items) {
    this.selected[index] = true;
  }
  this.pushflow();
};

/**
 * Clears the selection.
 */
visflow.Visualization.prototype.clearSelection = function() {
  this.selected = {};
  this.pushflow();
};

/**
 * Gets the SVG size.
 * @return {{width: number, height: number}}
 */
visflow.Visualization.prototype.getSVGSize = function() {
  return {
    width: this.content.width(),
    height: this.content.height()
  };
};

/**
 * Updates the SVG size.
 */
visflow.Visualization.prototype.updateSVGSize = function() {
  $(this.svg.node()).css({
    width: this.content.width(),
    height: this.content.height()
  });
};

/** @inheritDoc */
visflow.Visualization.prototype.keyAction = function(key, event) {
  switch (key) {
    case 'ctrl+A':
      this.selectAll();
      break;
    case 'ctrl+shift+A':
      this.clearSelection();
      break;
    default:
      visflow.Visualization.base.keyAction.call(this, key, event);
  }
};

/** @inheritDoc */
visflow.Visualization.prototype.mousedown = function(event) {
  // always add this view to selection
  if (!visflow.interaction.shifted) {
    visflow.flow.clearNodeSelection();
  }
  visflow.flow.addNodeSelection(this);

  if (visflow.interaction.ctrled) {
    // Ctrl drag mode blocks.
    return false;
  }

  if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
    if ($(event.target).closest('.content').length == 0) {
      // If mouse event does not happen in content, then pass it on to other
      // handlers.
      return true;
    }

    if (!visflow.interaction.visualizationBlocking) {
      visflow.Visualization.base.mousedown.call(this, event);
      return;
    }
    // Left click triggers item selection.
    this.mouseMode = 'brush';
    var pos = visflow.utils.getOffset(event, this.content);
    this.brushPoints_ = [{x: pos.left, y: pos.top}];
    event.stopPropagation();
  } else {
    event.stopPropagation();
  }
};

/** @inheritDoc */
visflow.Visualization.prototype.mousemove = function(event) {
  if (this.mouseMode == 'brush') {
    var pos = visflow.utils.getOffset(event, this.content);
    this.brushPoints_.push({x: pos.left, y: pos.top});
    this.drawBrush();
    event.stopPropagation();
  }
  // Do not block mousemove, otherwise dragging may hang.
  // e.g. start dragging on an edge, and mouse enters visualization...
};


/** @inheritDoc */
visflow.Visualization.prototype.mouseup = function(event) {
  if (this.mouseMode == 'brush') {
    this.selectItems();
    this.clearBrush();
  }
  this.mouseMode = '';
  // Do not block mouseup, otherwise dragging may hang.
  // e.g. mouse released on node.
};

/** @inheritDoc */
visflow.Visualization.prototype.mouseleave = function(event) {
  if ($(event.target).parent().length == 0) {
    // During svg update, the parent of mouseout event is unstable
    return;
  }

  // Leaving the node triggers mouse up too to release potential select.
  this.mouseup(event);

  if (!visflow.interaction.visualizationBlocking) {
    visflow.Visualization.base.mouseleave.call(this, event);
    return;
  }
  event.stopPropagation();
};

/**
 * Multiplies the rendering properties by a set of multipliers.
 * @param {!Object} properties
 * @param {!Object} multiplier
 */
visflow.Visualization.prototype.multiplyProperties = function(properties, multiplier) {
  for (var p in multiplier) {
    var v = properties[p];
    if (v != null) {
      properties[p] = v * multiplier[p];
    }
  }
};

/**
 * Applies the rendering properties to the elements.
 * @param u
 * @param properties
 * @param translate
 */
visflow.Visualization.prototype.applyProperties = function(u, properties, translate) {
  // u is a d3 selection
  for (var key in properties) {
    var value = properties[key];
    if (translate[key] != null) {
      key = translate[key];
    }
    if (key == 'ignore') {
      continue;
    }
    if (this.isAttr[key] == true) {
      u.attr(key, value);
    } else {
      u.style(key, value);
    }
  }
};

/**
 * Adds selectAll and clearAll entries for contextMenu.
 */
visflow.Visualization.prototype.initContextMenu = function() {
  visflow.Visualization.base.initContextMenu.call(this);
  $(this.contextMenu)
    .on('visflow.selectAll', this.selectAll.bind(this))
    .on('visflow.clearSelection', this.clearSelection.bind(this));
};

/**
 * Handles user changing dimension(s) to be visualized.
 */
visflow.Visualization.prototype.dimensionChanged = function() {
  this.prepareScales();
  this.show();
};

/**
 * Displays the brush based on selection type, e.g. range box or lasso stroke.
 */
visflow.Visualization.prototype.drawBrush = function() {
  visflow.error('drawBrush not implemented');
};

/**
 * Clears the brush shown.
 */
visflow.Visualization.prototype.clearBrush = function() {
  this.svg.selectAll('.lasso, .selectbox').remove();
};

/**
 * Selects within data the user chosen items. Inheriting classes implement this
 * based on different selection mechanism, e.g. scatterplot uses range box while
 * parallelCoordinates uses lasso stroke.
 */
visflow.Visualization.prototype.selectItems = function() {
};

/**
 * Renders the selection range as lasso stroke.
 */
visflow.Visualization.prototype.drawLasso = function() {
  var line = d3.svg.line()
    .x(_.getValue('x'))
    .y(_.getValue('y'))
    .interpolate('linear');
  this.svg.append('path')
    .classed('lasso', true)
    .attr('d', line(this.brushPoints_));
};

/**
 * Renders the selection range as range box.
 */
visflow.Visualization.prototype.drawSelectbox = function() {
  var box = this.svg.select('.selectbox');
  if (box.empty()) {
    box = this.svg.append('rect')
      .classed('selectbox', true);
  }
  var startPos = _(this.brushPoints_).first();
  var endPos = _(this.brushPoints_).last();

  var x1 = Math.min(startPos.x, endPos.x);
  var x2 = Math.max(startPos.x, endPos.x);
  var y1 = Math.min(startPos.y, endPos.y);
  var y2 = Math.max(startPos.y, endPos.y);
  box
    .attr('x', x1)
    .attr('y', y1)
    .attr('width', x2 - x1)
    .attr('height', y2 - y1);
};

/**
 * Selects all data items.
 */
visflow.Visualization.prototype.selectAll = function() {
  var items = this.ports['in'].pack.items;
  this.selected = _.keySet(items);
  this.showDetails();
};

/**
 * Clears all item selection
 */
visflow.Visualization.prototype.clearSelection = function() {
  this.selected = {};
  this.showDetails();
};

/** @inheritDoc */
visflow.Visualization.prototype.resize = function() {
  visflow.Visualization.base.resize.call(this);
  if (!this.options.minimized) {
    this.updateSVGSize();
    this.prepareScales();
    this.allowTransition_ = false;
    this.show();
    this.showSelection();
    this.allowTransition_ = true;
  }
};

/** @inheritDOc */
visflow.Visualization.prototype.resizeStop = function(size) {
  visflow.Visualization.base.resizeStop.call(this, size);
};

/**
 * Prepares the scales for rendering.
 */
visflow.Visualization.prototype.prepareScales = function() {};

/**
 * Does extra processing required by the visualization.
 */
visflow.Visualization.prototype.processExtra = function() {};

/**
 * Highlights the selected data items.
 */
visflow.Visualization.prototype.showSelection = function() {};

/** @inheritDoc */
visflow.Visualization.prototype.showOptions = function() {};

/** @inheritDoc */
visflow.Visualization.prototype.dataChanged = function() {};

/**
 * Finds reasonable dimensions to show.
 * @return {*}
 */
visflow.Visualization.prototype.findPlotDimensions = function() {};