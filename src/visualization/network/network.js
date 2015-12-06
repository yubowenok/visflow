/**
 * @fileoverview VisFlow network visualization.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Network = function(params) {
  visflow.Network.base.constructor.call(this, params);

  /**
   * Network has special in/out ports to handle nodes and edges separately.
   */
  this.ports = {
    in: new visflow.Port({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false,
      text: 'input nodes'
    }),
    inEdges: new visflow.Port({
      node: this,
      id: 'inEdges',
      isInput: true,
      isConstants: false,
      text: 'input edges'
    }),
    outs: new visflow.SelectionPort({
      node: this,
      id: 'outs',
      text: 'selected nodes',
    }),
    outsEdges: new visflow.SelectionPort({
      node: this,
      id: 'outsEdges',
      text: 'selected edges',
      fromPort: 'inEdges'
    }),
    out: new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false,
      text: 'output nodes',
    }),
    outEdges: new visflow.MultiplePort({
      node: this,
      id: 'outEdges',
      isInput: false,
      isConstants: false,
      text: 'output edges',
      fromPort: 'inEdges'
    })
  };

  /**
   * References to node objects.
   * @protected {!Object}
   */
  this.nodes = {};
  /**
   * References to edge objects.
   * @protected {!Object}
   */
  this.edges = {};

  /**
   * Node rendering properties.
   * @private {!Array<!Object>}
   */
  this.nodeProps_ = [];
  /**
   * Edge rendering properties.
   * @private {!Array<!Object>}
   */
  this.edgeProps_ = [];

  /** @protected {!Object<boolean>} */
  this.selectedEdges = {};

  /**
   * Last data id for edges.
   * @protected {number}
   */
  this.lastEdgeDataId = 0;

  // Navigation state.
  /** @private {!Array<number>} */
  this.zoomTranslate_ = [0, 0];
  /** @private {number} */
  this.zoomScale_ = 1.0;
  /** @private {d3.zoom} */
  this.zoom_;

  /**
   * D3 force for graph layout.
   * @private {!d3.force}
   */
  this.force_ = d3.layout.force();

  /**
   * SVG group for nodes.
   * @private {d3.selection}
   */
  this.svgNodes_;
  /**
   * SVG group for edges.
   * @private {d3.selection}
   */
  this.svgEdges_;
  /**
   * SVG group for node labels.
   * @private {d3.selection}
   */
  this.svgNodeLabels_;
};

visflow.utils.inherit(visflow.Network, visflow.Visualization);

/** @inheritDoc */
visflow.Network.prototype.NODE_NAME = 'Network';
/** @inheritDoc */
visflow.Network.prototype.NODE_CLASS = 'network';
/** @inheritDoc */
visflow.Network.prototype.PANEL_TEMPLATE =
    './src/visualization/network/network-panel.html';

/** @inheritDoc */
visflow.Network.prototype.defaultProperties = {
  color: '#555',
  border: 'black',
  width: 2,
  size : 5
};

/**
 * Default network related options.
 * @const {!Object}
 */
visflow.Network.prototype.DEFAULT_OPTIONS = {
  // Whether to show label.
  nodeLabel: true,
  // Which dimension is used as label.
  labelBy: 0,
  // D3 force-directed layout force charge.
  charge: -10000,
  // Node identifier corresponding to edges,
  nodeIdBy: 0,
  // Edge dimension used as source (node id).
  sourceBy: 0,
  // Edge dimension used as target (node id).
  targetBy: 1,
  // Whether navigation is enabled.
  navigation: false
};

/**
 * Default properties for edges.
 * @protected {!Object<number|string>}
 */
visflow.Network.prototype.defaultEdgeProperties = {
  width: 1.5,
  color: '#333'
};

/** @inheritDoc */
visflow.Network.prototype.selectedProperties = {
  color: 'white',
  border: '#6699ee'
};

/** @inheritDoc */
visflow.Network.prototype.selectedEdgeProperties = {
  color: '#6699ee'
};

/** @inheritDoc */
visflow.Network.prototype.selectedMultiplier = {
  size: 1.2,
  width: 1.2
};

/** @private @const {!Array<number>} */
visflow.Network.prototype.ZOOM_EXTENT_ = [.01, 8];
/** @private @const {number} */
visflow.Network.prototype.NODE_LABEL_SIZE_ = 14;
/** @private @const {number} */
visflow.Network.prototype.NODE_LABEL_OFFSET_X_ = 10;
/** @private @const {number} */
visflow.Network.prototype.NODE_LABEL_OFFSET_Y_ =
  visflow.Network.prototype.NODE_LABEL_SIZE_ / 2;
/** @private @const {number} */
visflow.Network.prototype.NODE_SIZE_ = 6;
/** @private @const {number} */
visflow.Network.prototype.EDGE_ARROW_LENGTH_ = 10;
/**
 * Shifting percentage of curved edge.
 * @private @const {number}
 */
visflow.Network.prototype.EDGE_CURVE_SHIFT_ = 0.1;


/** @inheritDoc */
visflow.Network.prototype.CONTEXTMENU_ITEMS = [
  {id: 'selectAll', text: 'Select All'},
  {id: 'clearSelection', text: 'Clear Selection'},
  {id: 'nodeLabel', text: 'Node Label'},
  {id: 'navigation', text: 'Navigation'},
  {id: 'minimize', text: 'Minimize', icon: 'glyphicon glyphicon-resize-small'},
  {id: 'visMode', text: 'Visualization Mode', icon: 'glyphicon glyphicon-facetime-video'},
  {id: 'panel', text: 'Control Panel', icon: 'glyphicon glyphicon-th-list'},
  {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
];

/** @inheritDoc */
visflow.Network.prototype.init = function() {
  visflow.Network.base.init.call(this);
  this.svgEdges_ = this.svg.append('g')
    .classed('edges render-group', true);
  this.svgNodes_ = this.svg.append('g')
    .classed('nodes render-group', true);
  this.svgNodeLabels_ = this.svg.append('g')
    .classed('labels render-group', true);

  this.zoom_ = d3.behavior.zoom()
    .scaleExtent(this.ZOOM_EXTENT_)
    .on('zoom', this.zoom.bind(this));
  this.svg.call(this.zoom_);
};

/** @inheritDoc */
visflow.Network.prototype.serialize = function() {
  var result = visflow.Network.base.serialize.call(this);
  result.selectedEdges = this.selectedEdges;
  result.lastEdgeDataId = this.lastEdgeDataId;
  return result;
};

/** @inheritDoc */
visflow.Network.prototype.deserialize = function(save) {
  visflow.Network.base.deserialize.call(this, save);

  this.lastEdgeDataId = save.lastEdgeDataId;

  this.selectedEdges = save.selectedEdges;
  if (this.selectedEdges == null) {
    this.selectedEdges = {};
    visflow.warning('selectedEdges not saved in', this.label);
  }
};

/** @inheritDoc */
visflow.Network.prototype.initContextMenu = function() {
  visflow.Network.base.initContextMenu.call(this);

  $(this.contextMenu)
    .on('visflow.navigation', this.toggleNavigation_.bind(this, null))
    .on('visflow.nodeLabel', this.toggleNodeLabel_.bind(this))
    .on('visflow.beforeOpen', function(event, menuContainer) {
      var nodeLabelIcon = menuContainer.find('#nodeLabel > i');
      if (this.options.nodeLabel) {
        nodeLabelIcon.addClass('glyphicon-ok');
      } else {
        nodeLabelIcon.removeClass('glyphicon-ok');
      }
      var navigationIcon = menuContainer.find('#navigation > i');
      if (this.options.navigation) {
        navigationIcon.addClass('glyphicon-ok');
      } else {
        navigationIcon.removeClass('glyphicon-ok');
      }
    }.bind(this));
};

/** @inheritDoc */
visflow.Network.prototype.mousedown = function(event) {
  if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
    // Left click potentially triggers navigation.
    if (this.options.navigation) {
      this.mouseMode = 'navigation';
      this.container.draggable('disable');
    } else {
      // Let base class handle it.
      visflow.Network.base.mousedown.call(this, event);
    }
  }
};

/**
 * Handles zoom event.
 */
visflow.Network.prototype.zoom = function() {
  if (!this.options.navigation) {
    this.zoom_
      .translate(this.zoomTranslate_)
      .scale(this.zoomScale_);
    return;
  }
  var translate = d3.event.translate;
  var scale = d3.event.scale;

  this.svg.selectAll('.render-group')
    .attr('transform', visflow.utils.getTransform(translate, scale));

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;

  this.updateNetwork_();
};

/** @inheritDoc */
visflow.Network.prototype.selectItems = function() {
  this.selectItemsInBox_();
};

/**
 * Applies the current transform to a node.
 * @param {number} x
 * @param {number} y
 * @return {{x: number, y: number}}
 * @private
 */
visflow.Network.prototype.applyTransform_ = function(x, y) {
  return {
    x: (x * this.zoomScale_) + this.zoomTranslate_[0],
    y: (y * this.zoomScale_) + this.zoomTranslate_[1]
  };
};

/**
 * Selects the nodes and edges in the range selection box.
 * @private
 */
visflow.Network.prototype.selectItemsInBox_ = function() {
  var box = this.getSelectBox(true);
  if (box == null) {
    return;
  }

  if (!visflow.interaction.shifted) {
    this.selected = {};
    this.selectedEdges = {};
  }

  for (var index in this.nodes) {
    var node = this.nodes[index];
    var x = node.x;
    var y = node.y;
    var point = this.applyTransform_(x, y);
    if (visflow.utils.pointInBox(point, box)) {
      this.selected[index] = true;
    }
  }
  for (var index in this.edges) {
    var edge = this.edges[index];
    var x1 = edge.source.x;
    var y1 = edge.source.y;
    var x2 = edge.target.x;
    var y2 = edge.target.y;
    var point1 = this.applyTransform_(x1, y1);
    var point2 = this.applyTransform_(x2, y2);
    if (visflow.utils.pointInBox(point1, box) &&
        visflow.utils.pointInBox(point2, box)) {
      this.selectedEdges[index] = true;
    }
  }
  this.show();
  this.pushflow();
};

/** @inheritDoc */
visflow.Network.prototype.isDataEmpty = function() {
  var inpackNodes = this.ports['in'].pack;
  var inpackEdges = this.ports['inEdges'].pack;
  return inpackNodes.isEmpty() || inpackEdges.isEmpty();
};

/** @inheritDoc */
visflow.Network.prototype.showDetails = function() {
  if (this.checkDataEmpty()) {
    return;
  }

  this.applyProperties_();

  this.drawNetwork_();
  // Ensure at least one pass of update, e.g. to update selection. Otherwise
  // no update is made when force is already over.
  this.updateNetwork_();
  // Start force is the entry of rendering updates.
  this.startForce_();

  this.showSelection();
};

/**
 * Renders the network onto the canvas.
 * @private
 */
visflow.Network.prototype.drawNetwork_ = function() {
  this.drawNodes_();
  this.drawEdges_();
  this.drawNodeLabels_();
};

/**
 * Updates the network. This does not deal with entering and exiting.
 * @private
 */
visflow.Network.prototype.updateNetwork_ = function() {
  this.updateNodes_();
  this.updateEdges_();
  this.updateNodeLabels_();
};

/**
 * Renders the network nodes.
 * @private
 */
visflow.Network.prototype.drawNodes_ = function() {
  var nodes = this.svgNodes_.selectAll('circle')
    .data(this.nodeProps_, _.getValue('id'));
  nodes.enter().append('circle');
  _(nodes.exit()).fadeOut();
};

/**
 * Renders the node labels.
 * @private
 */
visflow.Network.prototype.drawNodeLabels_ = function() {
  var labels = this.svgNodeLabels_.selectAll('text')
    .data(this.nodeProps_, _.getValue('id'));
  labels.enter().append('text');
  _(labels.exit()).fadeOut();
};

/**
 * Renders the network edges.
 * @private
 */
visflow.Network.prototype.drawEdges_ = function() {
  var edges = this.svgEdges_.selectAll('g')
    .data(this.edgeProps_, _.getValue('id'));
  var edgesEntered = edges.enter().append('g');
  edgesEntered.append('path')
    .classed('edge', true);
  edgesEntered.append('path')
    .classed('arrow', true);
  _(edges.exit()).fadeOut();
};

/**
 * Updates the network nodes. This does not deal with entering and exiting.
 * @private
 */
visflow.Network.prototype.updateNodes_ = function() {
  var nodes = this.svgNodes_.selectAll('circle');
  nodes
    .attr('transform', function(prop) {
      return visflow.utils.getTransform([
        prop.node.x,
        prop.node.y
      ]);
    })
    .attr('r', _.getValue('size'))
    .style('stroke', _.getValue('border'))
    .style('stroke-width', _.getValue('width'))
    .style('fill', _.getValue('color'))
    .style('opacity', _.getValue('opacity'));
};

/**
 * Updates the ndoe labels. This does not deal with entering and exiting.
 * @private
 */
visflow.Network.prototype.updateNodeLabels_ = function() {
  var labels = this.svgNodeLabels_.selectAll('text');
  labels
    .text(this.options.nodeLabel ? function(prop) {
      return prop.node.label;
    } : '')
    .attr('transform', function(prop) {
      return visflow.utils.getTransform([
        prop.node.x + this.NODE_LABEL_OFFSET_X_,
        prop.node.y + this.NODE_LABEL_OFFSET_Y_
      ]);
    }.bind(this));
};

/**
 * Updates the network edges. This does not deal with entering and exiting.
 * @private
 */
visflow.Network.prototype.updateEdges_ = function() {
  var edges = this.svgEdges_.selectAll('g');
  // Create a shifted point around the middle of the edge to be the control
  // point of the edge's curve.
  var getShiftPoint = function(ps, pt) {
    var m = visflow.vectors.middlePoint(ps, pt);
    var d = visflow.vectors.subtractVector(ps, pt);
    d = visflow.vectors.perpendicularVector(d);
    d = visflow.vectors.normalizeVector(d);
    d = visflow.vectors.multiplyVector(d,
      visflow.vectors.vectorDistance(ps, pt) * this.EDGE_CURVE_SHIFT_);
    return visflow.vectors.addVector(m, d);
  }.bind(this);

  var curve = d3.svg.line().interpolate('basis');
  edges.select('path.edge')
    .style('stroke', _.getValue('color'))
    .style('stroke-width', _.getValue('width'))
    .style('opacity', _.getValue('opacity'))
    .attr('d', function(edge) {
      var ps = [edge.source.x, edge.source.y];
      var pt = [edge.target.x, edge.target.y];
      var pm = getShiftPoint(ps, pt);
      return curve([ps, pm, pt]);
    });

  // Create a stroke that looks like an arrow.
  var getArrowPoints = function(ps, pt) {
    var pm = getShiftPoint(ps, pt);
    var ds = visflow.vectors.normalizeVector(
      visflow.vectors.subtractVector(ps, pt));
    var dm = visflow.vectors.normalizeVector(
      visflow.vectors.subtractVector(pm, pt));
    var p1 = visflow.vectors.addVector(pt,
      visflow.vectors.multiplyVector(dm, this.NODE_SIZE_));
    var p2 = visflow.vectors.addVector(p1,
      visflow.vectors.multiplyVector(ds, this.EDGE_ARROW_LENGTH_));
    var p3 = visflow.vectors.mirrorPoint(p2, p1, pm, 1);
    return [p1, p2, p3];
  }.bind(this);

  var line = d3.svg.line().interpolate('linear-closed');
  edges.select('path.arrow')
    .style('stroke', _.getValue('color'))
    .style('stroke-width', _.getValue('width'))
    .style('opacity', _.getValue('opacity'))
    .style('fill', _.getValue('color'))
    .attr('d', function(edge) {
      var ps = [edge.source.x, edge.source.y];
      var pt = [edge.target.x, edge.target.y];
      var points = getArrowPoints(ps, pt);
      return line(points);
    });
};

/**
 * Applies the rendering properties to the nodes and edges.
 * @private
 */
visflow.Network.prototype.applyProperties_ = function() {
  var items = this.ports['in'].pack.items;
  this.nodeProps_ = [];
  for (var index in this.nodes) {
    var node = this.nodes[index];
    var prop = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        id: 'n' + index,
        node: node
      }
    );
    if (this.selected[index]) {
      _(prop).extend(this.selectedProperties);
      this.multiplyProperties(prop, this.selectedMultiplier);
    }
    this.nodeProps_.push(prop);
  }
  var edgeItems = this.ports['inEdges'].pack.items;
  this.edgeProps_ = [];
  for (var index in this.edges) {
    var edge = this.edges[index];
    var prop = _.extend(
      {},
      this.defaultEdgeProperties,
      edgeItems[index].properties,
      {
        id: 'e' + index,
        source: edge.source,
        target: edge.target
      }
    );
    if (this.selectedEdges[index]) {
      _(prop).extend(this.selectedEdgeProperties);
      this.multiplyProperties(prop, this.selectedMultiplier);
    }
    this.edgeProps_.push(prop);
  }
};

/** @inheritDoc */
visflow.Network.prototype.showSelection = function() {
  var svgNodes = $(this.svgNodes_.node());
  for (var index in this.selected) {
    svgNodes.find('#n' + index).appendTo(svgNodes);
  }
  var svgEdges = $(this.svgEdges_.node());
  for (var index in this.selectedEdges) {
    svgEdges.find('#e' + index).appendTo(svgEdges);
  }
};

/** @inheritDoc */
visflow.Network.prototype.initPanel = function(container) {
  visflow.Network.base.initPanel.call(this, container);
  var nodeDimensionList = this.getDimensionList();
  var edgeDimensionList = this.getDimensionList(
    this.ports['inEdges'].pack.data);

  var nodeIdSelect = new visflow.Select({
    container: container.find('#node-id-by'),
    list: nodeDimensionList,
    allowClear: false,
    selected: this.options.nodeIdBy,
    listTitle: 'Node Id'
  });
  $(nodeIdSelect).on('visflow.change', function(event, dim) {
    this.options.nodeIdBy = dim;
    this.inputChanged();
  }.bind(this));

  var sourceSelect = new visflow.Select({
    container: container.find('#source-by'),
    list: edgeDimensionList,
    allowClear: false,
    selected: this.options.sourceBy,
    listTitle: 'Edge Source'
  });
  $(sourceSelect).on('visflow.change', function(event, dim) {
    this.options.sourceBy = dim;
    this.inputChanged();
  }.bind(this));
  var targetSelect = new visflow.Select({
    container: container.find('#target-by'),
    list: edgeDimensionList,
    allowClear: false,
    selected: this.options.targetBy,
    listTitle: 'Edge Target'
  });
  $(targetSelect).on('visflow.change', function(event, dim) {
    this.options.targetBy = dim;
    this.inputChanged();
  }.bind(this));

  var labelBySelect = new visflow.Select({
    container: container.find('#label-by'),
    list: nodeDimensionList,
    allowClear: true,
    selected: this.options.labelBy,
    listTitle: 'Label By'
  });
  $(labelBySelect).on('visflow.change', function(event, dim) {
    this.options.labelBy = dim;
    this.inputChanged();
  }.bind(this));

  var inputCharge = new visflow.Input({
    container: container.find('#charge'),
    value: this.options.charge,
    accept: 'int',
    range: [-200000, 0],
    scrollDelta: 500,
    title: 'Force Charge'
  });
  $(inputCharge).on('visflow.change', function(event, value) {
    this.options.charge = value;
    this.inputChanged();
  }.bind(this));

  // Toggles
  var nodeLabelToggle = new visflow.Checkbox({
    container: container.find('#label-node'),
    value: this.options.nodeLabel,
    title: 'Node Label'
  });
  $(nodeLabelToggle).on('visflow.change', function(event, value) {
    this.options.nodeLabel = value;
    this.show();
  }.bind(this));
  var navigationToggle = new visflow.Checkbox({
    container: container.find('#navigation'),
    value: this.options.navigation,
    title: 'Navigation'
  });
  $(navigationToggle).on('visflow.change', function(event, value) {
    this.options.navigation = value;
  }.bind(this));
};

/** @inheritDoc */
visflow.Network.prototype.drawBrush = function() {
  this.drawSelectBox();
};

/** @inheritDoc */
visflow.Network.prototype.inputChanged = function() {
  this.processNetwork();
  this.show();
};

/**
 * Processes the network data.
 */
visflow.Network.prototype.processNetwork = function() {
  var inpackNodes = this.ports['in'].pack;
  var inpackEdges = this.ports['inEdges'].pack;

  if (inpackEdges.isEmpty() || inpackNodes.isEmpty()) {
    return;
  }
  this.validateNetwork();
  this.processNodes_();
  this.processEdges_();
};

/**
 * Processes the nodes data.
 * @private
 */
visflow.Network.prototype.processNodes_ = function() {
  var inpack = this.ports['in'].pack;
  var items = inpack.items;
  var data = inpack.data;

  // Eliminate randomness in initial layout.
  var randValue = 3;
  var rand = function() {
    randValue = randValue * 997 + 317;
    randValue %= 1003;
    return randValue;
  };

  for (var index in items) {
    if (!(index in this.nodes)) {
      // Create an empty object for new node.
      this.nodes[index] = {};
    }
    var node = this.nodes[index];
    _(node).extend({
      index: index,
      label: data.values[index][this.options.labelBy]
    });
    if (node.x == null) {
      node.x = rand();
    }
    if (node.y == null) {
      node.y = rand();
    }
  }
};

/**
 * Processes the edges data.
 * @private
 */
visflow.Network.prototype.processEdges_ = function() {
  var inpackNodes = this.ports['in'].pack;
  var nodeItems = inpackNodes.items;
  var nodeData = inpackNodes.data;
  var nodeIdToIndex = {};
  for (var index in nodeItems) {
    var id = nodeData.values[index][this.options.nodeIdBy];
    nodeIdToIndex[id] = index;
  }

  var inpack = this.ports['inEdges'].pack;
  var items = inpack.items;
  var data = inpack.data;

  for (var index in items) {
    var sourceId = data.values[index][this.options.sourceBy];
    var targetId = data.values[index][this.options.targetBy];
    var sourceIndex = nodeIdToIndex[sourceId];
    var targetIndex = nodeIdToIndex[targetId];
    if (!(index in this.edges)) {
      // Create an empty object for new edge.
      this.edges[index] = {};
    }

    if (sourceIndex == null || targetIndex == null) {
      // Ignore edges without corresponding nodes.
      delete this.edges[index];
      continue;
    }
    if (sourceIndex == targetIndex) {
      // Ignore self loop edges.
      delete this.edges[index];
      continue;
    }

    var edge = this.edges[index];
    _(edge).extend({
      index: index,
      source: this.nodes[sourceIndex],
      target: this.nodes[targetIndex]
    });
  }
};

/**
 * Validates the network.
 */
visflow.Network.prototype.validateNetwork = function() {
  var inpackNodes = this.ports['in'].pack;
  var nodeItems = inpackNodes.items;
  var deletedNodes = {};
  for (var index in this.nodes) {
    if (!(index in nodeItems)) {
      delete this.nodes[index];
      deletedNodes[index] = true;
    }
  }

  var inpackEdges = this.ports['inEdges'].pack;
  var edgeItems = inpackEdges.items;
  for (var index in this.edges) {
    var edge = this.edges[index];
    if (!(index in edgeItems) ||
        deletedNodes[edge.source.index] != null ||
        deletedNodes[edge.target.index] != null) {
      delete this.edges[index];
    }
  }
};


/** @inheritDoc */
visflow.Network.prototype.processSelection = function() {
  visflow.Network.base.processSelection.call(this); // process node selection
  var inpack = this.ports['inEdges'].pack;
  var outspack = this.ports['outsEdges'].pack;
  outspack.copy(inpack);
  outspack.filter(_.allKeys(this.selectedEdges));
};

/**
 * Vadlidates the data item selection.
 */
visflow.Network.prototype.validateSelection = function() {
  visflow.Network.base.validateSelection.call(this); // clear selection of nodes
  var inpackEdges = this.ports['inEdges'].pack;
  for (var index in this.selectedEdges) { // clear selection of edges
    if (inpackEdges.items[index] == null){
      delete this.selectedEdges[index];
    }
  }
};

/** @inheritDoc */
visflow.Network.prototype.process = function() {
  var inpackNodes = this.ports['in'].pack;
  var inpackEdges = this.ports['inEdges'].pack;
  var outpackNodes = this.ports['out'].pack;
  var outpackEdges = this.ports['outEdges'].pack;
  var outspackNodes = this.ports['outs'].pack;
  var outspackEdges = this.ports['outsEdges'].pack;

  if (this.force_ != null) {
    this.force_.stop();  // Prevent further update
  }

  outpackNodes.copy(inpackNodes, true);
  outpackEdges.copy(inpackEdges, true); // always pass through
  outspackNodes.copy(inpackNodes, true);
  outspackNodes.items = {};
  outspackEdges.copy(inpackEdges, true);
  outspackEdges.items = {};

  if (inpackNodes.isEmpty() || inpackEdges.isEmpty()) {
    return;
  }

  this.validateSelection();
  if (this.lastDataId != inpackNodes.data.dataId
    || this.lastEdgeDataId != inpackEdges.data.dataId) {

    this.dataChanged();

    this.lastDataId = inpackNodes.data.dataId;
    this.lastEdgeDataId = inpackEdges.data.dataId;
  }
  this.processNetwork();
  this.processSelection();
};

/** @private @const {number} */
visflow.Network.prototype.FORCE_GRAVITY_ = 0.5;
/** @private @const {number} */
visflow.Network.prototype.FORCE_FRICTION_ = 0.25;
/** @private @const {number} */
visflow.Network.prototype.FORCE_LINK_DISTANCE_ = 30;


/**
 * Prepares and starts the force layout.
 * @private
 */
visflow.Network.prototype.startForce_ = function() {
  var svgSize = this.getSVGSize();
  this.force_.stop();

  this.force_ = d3.layout.force()
    .nodes(_.toArray(this.nodes))
    .links(_.toArray(this.edges))
    .size([svgSize.width, svgSize.height])
    .charge(this.options.charge)
    .linkDistance(this.FORCE_LINK_DISTANCE_)
    .gravity(this.FORCE_GRAVITY_)
    .friction(this.FORCE_FRICTION_)
    .on('tick', this.updateNetwork_.bind(this));

  this.force_.drag()
    .on('dragstart', function(node) {
      d3.select(this).classed('fixed', node.fixed = true);
    });

  this.force_.start();
};

/** @inheritDoc */
visflow.Network.prototype.resize = function() {
  visflow.Network.base.resize.call(this);
};

/** @inheritDoc */
visflow.Network.prototype.dataChanged = function() {
  this.nodes = {}; // Cached positions shall be discarded
  this.edges = {};
  var idDim = this.findLabelByDimension_();
  var edgeDims = this.findEdgeDimensions_();
  _(this.options).extend({
    labelBy: idDim,
    nodeIdBy: idDim,
    sourceBy: edgeDims.sourceBy,
    targetBy: edgeDims.targetBy
  });
  this.processNetwork();
};

/**
 * Finds a dimension that can be used for label.
 * @return {number}
 * @private
 */
visflow.Network.prototype.findLabelByDimension_ = function() {
  var labelBy = null;
  this.ports['in'].pack.data.dimensionTypes.forEach(function(type, index) {
    if (labelBy == null && type == 'string') {
      labelBy = index;
    }
  });
  return labelBy == null ? 0 : labelBy;
};

/**
 * Finds the edge dimensions for sources and targets.
 * @return {{sourceBy: number, targetBy: number}}
 * @private
 */
visflow.Network.prototype.findEdgeDimensions_ = function() {
  var dimTypes = this.ports['inEdges'].pack.data.dimensionTypes;
  var sourceBy = null;
  var targetBy = null;
  dimTypes.forEach(function(type, index) {
    if (type == 'string') {
      if (sourceBy == null) {
        sourceBy = index;
      } else if (targetBy == null) {
        targetBy = index;
      }
    }
  });
  sourceBy = sourceBy == null ?
      0 : sourceBy;
  targetBy = targetBy == null ?
      Math.min(sourceBy + 1, dimTypes.length - 1) : targetBy;
  return {
    sourceBy: sourceBy,
    targetBy: targetBy
  };
};


/**
 * Toggles navigation (zooming/panning) mode.
 * @param {boolean=} opt_value
 * @private
 */
visflow.Network.prototype.toggleNavigation_ = function(opt_value) {
  this.options.navigation = opt_value != null ? opt_value :
      !this.options.navigation;
  if (visflow.optionPanel.isOpen) {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};

/**
 * Toggles node label visibility.
 * @private
 */
visflow.Network.prototype.toggleNodeLabel_ = function() {
  this.options.nodeLabel = !this.options.nodeLabel;
  if (visflow.optionPanel.isOpen) {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};

/** @inheritDoc */
visflow.Network.prototype.keyAction = function(key, event) {
  if (key == 'N') {
    this.toggleNavigation_();
  }
  visflow.Network.base.keyAction.call(this, key, event);
};

/** @inheritDoc */
visflow.Network.prototype.clearSelection = function() {
  this.selectedEdges = {};
  visflow.Network.base.clearSelection.call(this);
};
