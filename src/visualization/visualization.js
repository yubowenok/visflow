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

  /**
   * Interactive selectbox (rectangle).
   * @protected {!visflow.Box}
   */
  this.selectbox = {x1: 0, y1: 0, x2: 0, y2: 0};

  // Range used for selectbox.
  /** @private {!Array<number} */
  this.startPos_ = [0, 0];
  /** @private {!Array<number} */
  this.endPos_ = [0, 0];

  /**
   * Last used dataset ID.
   * @protected {number}
   */
  this.lastDataId = 0;  // default: empty data

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

  outpack.copy(inpack, true); // always pass through

  // During async data load, selection is first de-serialized to vis nodes
  // However the data have not reached this point.
  // Thus the selection might be erroneously cleared if continue processing.
  if (inpack.isEmpty()) {
    outspack.copy(inpack, true);
    outspack.items = {};
    return;
  }
  this.validateSelection();

  if (this.lastDataId != inpack.data.dataId) {
    // Data has changed, fire change event
    // visualization can update selected dimension in this function.
    this.dataChanged();

    this.lastDataId = inpack.data.dataId;
  }

  // Each time process() is called, input must have changed. Scales depend on
  // input and should be updated.
  this.prepareScales();

  // Inheriting visualization classes may implement this to change routine that
  // sends selection to output S.
  this.processSelection();

  // Do extra processing, such as sorting the item indexes in heatmap.
  this.processExtra();
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
    // Left click triggers selectbox.
    this.mouseMode = 'selectbox';
    this.startPos_ = visflow.utils.getOffset(event, this.content);
    event.stopPropagation();
  } else {
    event.stopPropagation();
  }
};

/** @inheritDoc */
visflow.Visualization.prototype.mouseup = function(event) {
  if (this.mouseMode == 'selectbox') {
    if (this.endPos_.left != this.startPos_.left &&
        this.endPos_.top != this.startPos_.top) {
      // Only select when mouse moved.
      this.selectItemsInBox(this.selectbox);
    }
    this.svg.selectAll('.vis-selectbox').remove();
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
  this.mouseup(event);
  if (!visflow.interaction.visualizationBlocking) {
    visflow.Visualization.base.mouseleave.call(this, event);
    return;
  }
  event.stopPropagation();
};

/** @inheritDoc */
visflow.Visualization.prototype.mousemove = function(event) {
  if (this.mouseMode == 'selectbox') {
    this.endPos_ = visflow.utils.getOffset(event, this.content);
    _(this.selectbox).extend({
      x1: Math.min(this.startPos_.left, this.endPos_.left),
      x2: Math.max(this.startPos_.left, this.endPos_.left),
      y1: Math.min(this.startPos_.top, this.endPos_.top),
      y2: Math.max(this.startPos_.top, this.endPos_.top)
    });
    this.showSelectbox(this.selectbox);
    event.stopPropagation();
  }
  // Do not block mousemove, otherwise dragging may hang.
  // e.g. start dragging on an edge, and mouse enters visualization...
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



/** @inheritDoc */
visflow.Visualization.prototype.resize = function() {
  visflow.Visualization.base.resize.call(this);
  var width = this.container.width();
  var height = this.container.height();
  if (!this.options.minimized) {
    this.visWidth = width;
    this.visHeight = height;
    this.updateSVGSize();
  }
  this.prepareScales();
  this.showDetails();
  this.showSelection();
};

/** @inheritDOc */
visflow.Visualization.prototype.resizeStop = function(size) {
  visflow.Visualization.base.resizeStop.call(this, size);
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
 * Displays the selectbox.
 * @param {!visflow.Box} selectbox
 */
visflow.Visualization.prototype.showSelectbox = function(selectbox) {};

/**
 * Selects the items within the selectbox.
 * @param {!visflow.Box} selectbox
 */
visflow.Visualization.prototype.selectItemsInBox = function(selectbox) {};

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

