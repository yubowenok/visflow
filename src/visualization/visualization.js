/**
 * @fileoverview VisFlow visualization base class.
 */

'use strict';

/**
 * @param {!Object} params
 * @constructor
 */
visflow.Visualization = function(params) {
  visflow.Visualization.base.constructor.call(this, params);

  // visualization nodes have same ports
  this.inPorts = [
    new visflow.Port(this, 'in', 'in-single', 'D')
  ];
  this.outPorts = [
    new visflow.Port(this, 'outs', 'out-multiple', 'S'),
    new visflow.Port(this, 'out', 'out-multiple', 'D')
  ];

  this.optionsOn = false;

  _(this.options).extend({
    label: true
  });

  this.label = this.plotName + ' (' + this.id + ')';

  this.visWidth = null;
  this.visHeight = null;

  // selection applies to all visualization
  this.selected = {};

  this.isEmpty = true;

  this.lastDataId = 0;  // default: empty data

  this.visModeOn = true;
};

visflow.utils.inherit(visflow.Visualization, visflow.Node);

/**
 * Plot name used for debugging and hint message.
 * @const {string}
 */
visflow.Visualization.prototype.PLOT_NAME = '';;
/** @inheritDoc */
visflow.Visualization.prototype.SHAPE_CLASS = 'shape-vis';

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

/**
 * Mapping to let d3 know to use attr or style for each key.
 * @const {!Object<boolean>}
 */
visflow.Visualization.prototype.isAttr = {
  id: true,
  r: true,
  cx: true,
  cy: true,
  x1: true,
  x2: true,
  y1: true,
  y2: true,
  transform: true
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
  this.jqvis = this.content;
  this.createSVG();
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

  this.lastDataId = save.lastDataId;
  if (this.lastDataId == null) {
    visflow.error('lastDataId not saved in visualization');
    this.lastDataId = 0;
  }
};

/**
 * Checks if the node's data is empty.
 * @return {boolean}
 */
visflow.Visualization.prototype.checkDataEmpty = function() {
  this.clearMessage();
  if (this.ports['in'].pack.isEmpty()) {
    // otherwise scales may be undefined
    this.showMessage('empty data in ' + this.plotName);
    this.isEmpty = true;

    if (this.svg) {
      // this.svg.remove();
      this.svg.style('display', 'none');
      this.interactionOn = false;
    }
    return;
  }
  this.svg.style('display', '');
  this.isEmpty = false;
};

/**
 * Prepares the svg canvas.
 */
visflow.Visualization.prototype.createSVG = function() {
  /*
  if (this.svg) {
    if (keepOld == true) {
      return;
    }
    this.svg.remove();
    this.interactionOn = false;
  }
  */
  this.svg = d3.selectAll(this.jqvis.toArray()).append('svg');
  this.jqsvg = $(this.svg[0]);

  this.svgSize = [this.jqsvg.width(), this.jqsvg.height()];
};

/** @inheritDoc */
visflow.Visualization.prototype.showDetails = function() {
  visflow.Visualization.base.showDetails.call(this);

  var node = this;

  this.container
    .css('width', this.visWidth)
    .css('height', this.visHeight)
    .resizable('enable');
  this.viewWidth = this.container.width();
  this.viewHeight = this.container.height();

  // show selection shall be in show visualization
  // so does interaction()
  this.showVisualization();
};

/** @inheritDoc */
visflow.Visualization.prototype.showIcon = function() {
  visflow.Visualization.base.showIcon.call(this);

  if (this.jqvis) {
    this.jqvis.hide();
  }
    /*
  this.container
    .css('width', '')
    .css('height', '')
    .resizable('disable');
  */
  this.viewWidth = this.container.width();
  this.viewHeight = this.container.height();
  // must be called AFTER viewWidth & viewHeight are set
};

/** @inheritDoc */
visflow.Visualization.prototype.process = function() {
  var inpack = this.ports['in'].pack,
      outpack = this.ports['out'].pack,
      outspack = this.ports['outs'].pack;

  outpack.copy(inpack, true); // always pass through

  // during async data load, selection is first deserialized to vis nodes
  // however the data have not passed in
  // thus the selection might be erronesouly cleared if continue processing
  if (inpack.isEmpty()) {
    outspack.copy(inpack, true);
    outspack.items = {};
    return;
  }
  this.validateSelection();

  if (this.lastDataId != inpack.data.dataId) {
    // data has changed, fire change event
    // visualization can update selected dimension in this function
    this.dataChanged();

    this.lastDataId = inpack.data.dataId;
  }

  // inheriting visualization classes may implement this
  // to change routine that sends selection to output S
  this.processSelection();

  // do extra processing, such as sorting the item indexes in heatmap
  this.processExtra();
};

/**
 * Processes the current user selection.
 */
visflow.Visualization.prototype.processSelection = function() {
  var inpack = this.ports['in'].pack,
      outspack = this.ports['outs'].pack;
  outspack.copy(inpack);
  outspack.filter(_.allKeys(this.selected));
};

/**
 * Validates the data element selection.
 */
visflow.Visualization.prototype.validateSelection = function() {
  var inpack = this.ports['in'].pack;
  // some selection items no longer exists in the input
  // we shall remove those selection
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

/** @inheritDoc */
visflow.Visualization.prototype.interaction = function() {
  visflow.Visualization.base.interaction.call(this);
  if (!this.interactionOn) {
    this.prepareInteraction();
    this.interactionOn = true;
  }
};

/**
 * Displays a text message at the center of the node.
 */
visflow.Visualization.prototype.showMessage = function(msg) {
  this.jqmsg = $('<div></div>')
    .text(msg)
    .addClass('visualization-message')
    .css('line-height', this.viewHeight + 'px')
    .prependTo(this.container);
};

/**
 * Clears the message shown.
 */
visflow.Visualization.prototype.clearMessage = function() {
  if (this.jqmsg) {
    this.jqmsg.hide();
  }
};

/** @inheritDoc */
visflow.Visualization.prototype.keyAction = function(key, event) {
  visflow.Visualization.base.keyAction.call(this, key, event);

  if (key == 'ctrl+A') {
    this.selectAll();
  } else if (key == 'ctrl+shift+A') {
    this.clearSelection();
  }
};

/**
 * Sets up the callback so that once a vis is interacted with, the view is
 * selected.
 */
visflow.Visualization.prototype.prepareInteraction = function() {
  if (this.jqsvg == null) {
    return visflow.error('no svg for prepareInteraction');
  }
  var node = this;
  this.jqsvg.mousedown(function(){
    // always add this view to selection
    if (!visflow.interaction.shifted)
      visflow.flow.clearNodeSelection();
    visflow.flow.addNodeSelection(node);
  });

  // default select box interaction
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
      if (visflow.interaction.visualizationBlocking) {
        event.stopPropagation();
      }
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
visflow.Visualization.prototype.resize = function(size) {
  visflow.Visualization.base.resize.call(this, size);
  if (!this.options.showIcon) {
    this.visWidth = size.width;
    this.visHeight = size.height;
  }
};

/** @inheritDOc */
visflow.Visualization.prototype.resizeStop = function(size) {
  visflow.Visualization.base.resizeStop.call(this, size);
};

/**
 * Displays the visualization.
 */
visflow.Visualization.prototype.showVisualization = function() {};

/**
 * Re-renders the visualization.
 */
visflow.Visualization.prototype.updateVisualization = function() {};

/**
 * Prepares scales required by visualization.
 */
visflow.Visualization.prototype.prepareScales = function() {};

/**
 * Prepares scale from data domain to [0, 1].
 * @param {number} d Dimension index.
 */
visflow.Visualization.prototype.prepareDataScale = function(d) {};

/**
 * Prepares screen scale from [0, 1] to screen coordinates.
 * @param {number} d Dimension index.
 */
visflow.Visualization.prototype.prepareScreenScale = function(d) {};

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
