/**
 * @fileoverview VisFlow visualization base class.
 */

/**
 * @param {!Object} params
 * @constructor
 * @abstract
 * @extends {visflow.SubsetNode}
 */
visflow.Visualization = function(params) {
  visflow.Visualization.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    'in': new visflow.SubsetPort({
      node: this,
      id: 'in',
      isInput: true
    }),
    'outs': new visflow.SelectionPort({
      node: this,
      id: 'outs'
    }),
    'out': new visflow.MultiSubsetPort({
      node: this,
      id: 'out',
      isInput: false
    })
  };

  /**
   * D3 selection of the svg container.
   * @protected {d3|undefined}
   */
  this.svg = undefined;

  /**
   * SVG group for axes.
   * @protected {d3|undefined}
   */
  this.svgAxes = undefined;

  /**
   * Selected data items.
   * @protected {!Object<number, boolean>}
   */
  this.selected = {};

  /**
   * Points of user brush.
   * @protected {!Array<{x: number, y: number}>}
   */
  this.brushPoints = [];

  /**
   * Last used dataset ID. Default is empty data.
   * @protected {string}
   */
  this.lastDataId = visflow.data.EMPTY_DATA_ID;

  /**
   * Margins of the plot in the four directions.
   * @protected {visflow.Margins}
   */
  this.margins = this.plotMargins();

  /**
   * Whether rendering should be using transition. When the view is resized,
   * the view shall be re-rendered without transition.
   * @protected {boolean}
   */
  this.allowTransition = true;

  this.options.extend(this.visualizationOptions());
};

_.inherit(visflow.Visualization, visflow.SubsetNode);


/** @inheritDoc */
visflow.Visualization.prototype.init = function() {
  visflow.Visualization.base.init.call(this);

  // We need to add visualization class to the container manually because it is
  // a middle class, of which the NODE_CLASS would be overwritten by inheritting
  // class.
  this.container.addClass('visualization');

  this.svg = d3.select(this.content.children('svg')[0]);
  this.updateSVGSize();
};

/**
 * Serializes the visualization node.
 * @return {!Object}
 */
visflow.Visualization.prototype.serialize = function() {
  var result = visflow.Visualization.base.serialize.call(this);
  _.extend(result, {
    selected: this.selected,
    lastDataId: this.lastDataId
  });
  // Data item selection.
  result.selected = this.selected;
  // Last data Id.
  result.lastDataId = this.lastDataId;
  return result;
};

/**
 * Deserializes the visualization node.
 * @param {!Object} save
 */
visflow.Visualization.prototype.deserialize = function(save) {
  visflow.Visualization.base.deserialize.call(this, save);
  this.selected = save.selected;
  if (this.selected instanceof Array || this.selected == null) {
    visflow.error('incorrect selection saved: array/null');
    this.selected = {};
  }
  this.lastDataId = save.lastDataId;
  if (this.lastDataId == null) {
    visflow.error('lastDataId not saved in visualization');
    this.lastDataId = visflow.data.EMPTY_DATA_ID;
  }
  this.fillOptions(this.options, this.visualizationOptions());
};

/**
 * Checks whether the input data is empty.
 * @return {boolean}
 */
visflow.Visualization.prototype.isDataEmpty = function() {
  return this.getDataInPort().isEmpty();
};

/**
 * Checks if the node's data is empty.
 * @return {boolean}
 */
visflow.Visualization.prototype.checkDataEmpty = function() {
  if (this.isDataEmpty()) {
    // otherwise scales may be undefined
    this.showMessage(visflow.Node.Message.EMPTY_DATA);
    this.content.hide();
    return true;
  } else {
    this.hideMessage(visflow.Node.Message.EMPTY_DATA);
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
  this.updateSVGSize();
};

/** @inheritDoc */
visflow.Visualization.prototype.processSync = function() {
  var inpack = this.getDataInPort().getSubset();
  var outpack = this.getDataOutPort().getSubset();
  var outspack = this.ports['outs'].getSubset();

  // always pass data through
  outpack.copy(inpack, true);

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
    // Data has changed. Visualization can update selected dimension here.
    // If the node is de-serialized, it would have received its last used
    // dataId so that dataChanged is not fired.
    this.dataChanged();

    this.lastDataId = inpack.data.dataId;
  }

  if (this.inPortsChanged()) {
    // Do extra processing, such as sorting the item indexes in heatmap.
    this.inputChanged();

    // Each time process() is called, input must have changed. Scales depend on
    // input and should be updated.
    this.prepareScales();
  }
};

/**
 * Processes the current user selection.
 */
visflow.Visualization.prototype.processSelection = function() {
  var inpack = this.getDataInPort().getSubset();
  var outspack = this.getSelectionOutPort().getSubset();
  outspack.copy(inpack);
  outspack.filter(_.allKeys(this.selected));
};

/**
 * Validates the data item selection. Removes all data items that no longer
 * exist. This may be result of upflow input change.
 */
visflow.Visualization.prototype.validateSelection = function() {
  var inpack = this.getDataInPort().pack;
  for (var itemIndex in this.selected) {
    var index = +itemIndex;
    if (inpack.items[index] == null) {
      delete this.selected[index];
    }
  }
};

/**
 * Gets the SVG size.
 * @return {{width: number, height: number}}
 */
visflow.Visualization.prototype.getSVGSize = function() {
  return {
    width: /** @type {number} */(this.content.width()),
    height: /** @type {number} */(this.content.height())
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
  if (visflow.interaction.isAlted()) {
    // Alt drag mode blocks.
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
      return true;
    }
    // Left click triggers item selection.
    this.mouseMode = 'brush';
    var pos = visflow.utils.mouseOffset(event, /** @type {!jQuery} */(
      this.content));
    this.brushPoints = [{x: pos.left, y: pos.top}];

    this.container.draggable('disable');
  }
};

/** @inheritDoc */
visflow.Visualization.prototype.mousemove = function(event) {
  if (this.mouseMode == 'brush') {
    var pos = visflow.utils.mouseOffset(event, /** @type {!jQuery} */(
      this.content));
    this.brushPoints.push({x: pos.left, y: pos.top});
    this.drawBrush();
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
  this.container.draggable('enable');
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
};

/**
 * Multiplies the rendering properties by a set of multipliers.
 * @param {visflow.Properties} properties
 * @param {visflow.Multiplier} multiplier
 */
visflow.Visualization.prototype.multiplyProperties = function(properties,
                                                              multiplier) {
  for (var p in multiplier) {
    if (p in properties) {
      properties[p] *= multiplier[p];
    }
  }
};

/**
 * Adds selectAll and clearAll entries for contextMenu.
 */
visflow.Visualization.prototype.initContextMenu = function() {
  visflow.Visualization.base.initContextMenu.call(this);
  visflow.listenMany(this.contextMenu, [
    {
      event: visflow.Event.SELECT_ALL,
      callback: this.selectAll.bind(this)
    },
    {
      event: visflow.Event.CLEAR_SELECTION,
      callback: this.clearSelection.bind(this)
    }
  ]);
};

/**
 * Creates a unique dimension array for potentially duplicated dimensions.
 * @param {!Array<number>} dimensions
 * @return {!Array<{dim: number, uniqueDim: string}>}
 */
visflow.Visualization.prototype.uniqueDimensions = function(dimensions) {
  var result = [];
  var counter = {};
  dimensions.forEach(function(dim) {
    if (!(dim in counter)) {
      counter[dim] = 0;
    }
    result.push({
      uniqId: dim + '-' + (++counter[dim]),
      dim: dim
    });
  });
  return result;
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
 * Selects user chosen items from the data. Inheriting classes implement this
 * based on different selection mechanism, e.g. scatterplot uses range box while
 * parallelCoordinates uses lasso stroke.
 */
visflow.Visualization.prototype.selectItems = function() {
  this.pushflow();
};

/**
 * Selects the given items.
 * @param {!Object<number, boolean>} items
 * @private
 */
visflow.Visualization.prototype.select_ = function(items) {
  this.selected = items;
  this.selectedChanged();
  this.pushflow();
};

/**
 * Renders the selection range as lasso stroke.
 */
visflow.Visualization.prototype.drawLasso = function() {
  var line = d3.line()
    .x(_.getValue('x'))
    .y(_.getValue('y'));
  this.svg.append('path')
    .classed('lasso', true)
    .attr('d', line(this.brushPoints));
};

/**
 * Renders the selection range as range box.
 */
visflow.Visualization.prototype.drawSelectBox = function() {
  var box = this.svg.select('.selectbox');
  if (box.empty()) {
    box = this.svg.append('rect')
      .classed('selectbox', true);
  }
  var startPos = _.first(this.brushPoints);
  var endPos = _.last(this.brushPoints);

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
 * Computes the select range box.
 * @param {boolean=} opt_ignoreEmpty
 * @return {?visflow.Rect2Points}
 */
visflow.Visualization.prototype.getSelectBox = function(opt_ignoreEmpty) {
  var startPos = _.first(this.brushPoints);
  var endPos = _.last(this.brushPoints);

  if (opt_ignoreEmpty) {
    if (startPos.x == endPos.x && startPos.y == endPos.y) {
      // Only select when mouse moved.
      return null;
    }
  }
  return {
    x1: Math.min(startPos.x, endPos.x),
    y1: Math.min(startPos.y, endPos.y),
    x2: Math.max(startPos.x, endPos.x),
    y2: Math.max(startPos.y, endPos.y)
  };
};

/**
 * Selects all data items.
 */
visflow.Visualization.prototype.selectAll = function() {
  var items = this.getDataInPort().getSubset().items;
  this.select_(_.keySet(items));
};

/**
 * Clears all item selection
 */
visflow.Visualization.prototype.clearSelection = function() {
  this.select_({});
};

/**
 * Renders an axis label.
 * @param {{
 *   svg: !d3,
 *   scale: d3.Scale,
 *   scaleType: visflow.ScaleType,
 *   classes: string,
 *   orient: string,
 *   ticks: number,
 *   transform: string,
 *   noTicks: (boolean|undefined),
 *   label: {
 *     text: string,
 *     transform: string
 *   }
 * }} params
 */
visflow.Visualization.prototype.drawAxis = function(params) {
  var svg = params.svg;
  var axis;
  switch (params.orient) {
    case 'top':
      axis = d3.axisTop();
      break;
    case 'bottom':
      axis = d3.axisBottom();
      break;
    case 'left':
      axis = d3.axisLeft();
      break;
    case 'right':
      axis = d3.axisRight();
      break;
    default:
      console.error('unknown axis orient');
  }
  axis.ticks(params.ticks);
  if (params.noTicks) {
    axis.tickValues([]);
  }
  axis.scale(params.scale.copy());

  if (svg.empty()) {
    svg = this.svgAxes.append('g')
      .classed(params.classes, true);
  }
  svg
    .attr('transform', params.transform)
    .call(axis);

  var label = svg.select('.vis-label');
  if (label.empty()) {
    label = svg.append('text')
      .classed('vis-label', true);
  }
  label
    .text(params.label.text)
    .attr('transform', params.label.transform);
};

/** @inheritDoc */
visflow.Visualization.prototype.updateContent = function() {
  if (!this.options.minimized && !this.isDataEmpty()) {
    this.updateSVGSize();
    this.prepareScales();
  }
  visflow.Visualization.base.updateContent.call(this);
};

/** @inheritDoc */
visflow.Visualization.prototype.resize = function() {
  visflow.Visualization.base.resize.call(this);
  if (!this.options.minimized) {
    this.updateSVGSize();
    if (!this.checkDataEmpty()) {
      this.prepareScales();
      this.allowTransition = false;
      this.updateContent();
      this.allowTransition = true;
    }
  }
};

/** @inheritDoc */
visflow.Visualization.prototype.resizeStop = function() {
  visflow.Visualization.base.resizeStop.call(this);
};

/**
 * Prepares the scales for rendering.
 */
visflow.Visualization.prototype.prepareScales = function() {};

/**
 * Does extra processing required by the visualization on input changes.
 */
visflow.Visualization.prototype.inputChanged = function() {};

/**
 * Highlights the selected data items. Usually this brings all selected items
 * to front. Selected items rendering properties are handled in render routines.
 */
visflow.Visualization.prototype.showSelection = function() {};

/**
 * Handles data change in visualization.
 */
visflow.Visualization.prototype.dataChanged = function() {};

/**
 * Finds reasonable dimensions to show.
 * @return {!Array<number>|!Object}
 *   Usually this should return an array of dimension indices. Yet some plots
 *   may return a compound dimension info object.
 */
visflow.Visualization.prototype.findPlotDimensions = function() {
  return [];
};

/**
 * Checks if transition should be applied.
 * Transitions should not be applied when there are too many elements.
 * @return {boolean}
 */
visflow.Visualization.prototype.transitionFeasible = function() {
  return true;
};

/**
 * Handles layout changes such as label visibility changes.
 */
visflow.Visualization.prototype.layoutChanged = function() {
  this.prepareScales();
  this.show();
};

/**
 * Handles user changing dimension(s) to be visualized.
 */
visflow.Visualization.prototype.dimensionChanged = function() {
  this.prepareScales();
  this.show();
};

/**
 * Handles selection changes from shortcuts (selectAll and clearSelection).
 */
visflow.Visualization.prototype.selectedChanged = function() {
  this.allPorts().forEach(function(port) {
    if (port.IS_SELECTION_PORT) {
      port.changed(true);
    }
  });
};

/**
 * Sets the dimensions to be visualized.
 * @param {!Array<string>} dims
 */
visflow.Visualization.prototype.setDimensions = function(dims) {
  var dimensions = this.getDimensionNames();
  this.options.dims = dims.map(function(name) {
    return dimensions.indexOf(name);
  });
  this.dimensionChanged();
};

/**
 * Gets the data selection output port.
 * @return {!visflow.SubsetPort}
 */
visflow.Visualization.prototype.getSelectionOutPort = function() {
  return /** @type {!visflow.SubsetPort} */(this.getPort('outs'));
};

/**
 * Gets the nodes connected to the selection port.
 * @return {!Array<!visflow.SubsetNode>}
 */
visflow.Visualization.prototype.selectionTargetNodes = function() {
  var nodes = [];
  var nodeIds = {}; // used to deduplicate
  this.outputPorts().forEach(function(port) {
    if (!port.IS_SELECTION_PORT) {
      return;
    }
    port.connections.forEach(function(edge) {
      var node = edge.targetNode;
      if (!(node.id in nodeIds)) {
        nodeIds[node.id] = true;
        nodes.push(node);
      }
    });
  });
  return nodes;
};
