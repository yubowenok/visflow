/**
 * @fileoverview VisFlow network visualization.
 */

/**
 * @param {visflow.params.Node} params
 * @constructor
 * @extends {visflow.Visualization}
 */
visflow.Network = function(params) {
  visflow.Network.base.constructor.call(this, params);

  /**
   * Network has special in/out ports to handle nodes and edges separately.
   */
  this.ports = {
    'in': new visflow.SubsetPort({
      node: this,
      id: 'in',
      isInput: true,
      text: 'input nodes'
    }),
    'inEdges': new visflow.SubsetPort({
      node: this,
      id: 'inEdges',
      isInput: true,
      text: 'input edges'
    }),
    'outs': new visflow.SelectionPort({
      node: this,
      id: 'outs',
      text: 'selected nodes'
    }),
    'outsEdges': new visflow.SelectionPort({
      node: this,
      id: 'outsEdges',
      text: 'selected edges',
      fromPort: 'inEdges'
    }),
    'out': new visflow.MultiSubsetPort({
      node: this,
      id: 'out',
      isInput: false,
      text: 'output nodes'
    }),
    'outEdges': new visflow.MultiSubsetPort({
      node: this,
      id: 'outEdges',
      isInput: false,
      text: 'output edges',
      fromPort: 'inEdges'
    })
  };

  /**
   * References to node objects.
   * @protected {!Object<number, !Object>}
   */
  this.nodes = {};
  /**
   * References to edge objects.
   * @protected {!Object<number, !Object>}
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

  /** @protected {!Object<number, boolean>} */
  this.selectedEdges = {};

  /**
   * Last data id for edges.
   * @protected {string}
   */
  this.lastEdgeDataId = visflow.data.EMPTY_DATA_ID;

  // Navigation state.
  /** @private {!Array<number>} */
  this.zoomTranslate_ = [0, 0];
  /** @private {number} */
  this.zoomScale_ = 1.0;
  /** @private {?d3.Zoom} */
  this.zoom_ = null;

  /**
   * D3 force for graph layout.
   * @private {d3.ForceSimulation}
   */
  this.force_ = d3.forceSimulation();

  /**
   * SVG group for nodes.
   * @private {!d3}
   */
  this.svgNodes_ = _.d3();
  /**
   * SVG group for edges.
   * @private {!d3}
   */
  this.svgEdges_ = _.d3();
  /**
   * SVG group for node labels.
   * @private {!d3}
   */
  this.svgNodeLabels_ = _.d3();
};

_.inherit(visflow.Network, visflow.Visualization);

/** @inheritDoc */
visflow.Network.prototype.init = function() {
  visflow.Network.base.init.call(this);
  this.svgEdges_ = this.svg.append('g')
    .classed('edges render-group', true);
  this.svgNodes_ = this.svg.append('g')
    .classed('nodes render-group', true);
  this.svgNodeLabels_ = this.svg.append('g')
    .classed('labels render-group', true);

  this.zoom_ = d3.zoom()
    .scaleExtent(visflow.Network.zoomExtent())
    .on('zoom', this.zoom.bind(this));
  this.svg.call(this.zoom_);

  this.zoom_.filter(function() {
    return this.options.navigation;
  }.bind(this));
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

  visflow.listenMany(this.contextMenu, [
    {
      event: visflow.Event.NAVIGATION,
      callback: this.toggleNavigation_.bind(this)
    },
    {
      event: visflow.Event.NODE_LABEL,
      callback: this.toggleNodeLabel_.bind(this)
    }
  ]);
};

/** @inheritDoc */
visflow.Network.prototype.mousedown = function(event) {
  if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
    // Left click potentially triggers navigation.
    if (this.options.navigation && !visflow.interaction.isAlted()) {
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
  visflow.assert(this.options.navigation);

  var transform = d3.event.transform;
  var translate = [transform.x, transform.y];
  var scale = transform.k;

  this.svg.selectAll('.render-group')
    .attr('transform', visflow.utils.getTransform(translate, scale));

  this.zoomTranslate_ = translate;
  this.zoomScale_ = scale;

  this.updateNetwork_();
};

/** @inheritDoc */
visflow.Network.prototype.selectItems = function() {
  this.selectItemsInBox_();
  visflow.Network.base.selectItems.call(this);
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

  for (var nodeIndex in this.nodes) {
    var index = +nodeIndex;
    var node = this.nodes[index];
    var x = node.x;
    var y = node.y;
    var point = this.applyTransform_(x, y);
    if (visflow.utils.pointInBox(point, box)) {
      this.selected[index] = true;
    }
  }
  for (var edgeIndex in this.edges) {
    var index = + edgeIndex;
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
};

/** @inheritDoc */
visflow.Network.prototype.isDataEmpty = function() {
  var inpackNodes = this.getDataInPort().pack;
  var inpackEdges = this.getPort('inEdges').getSubset();
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
  _.fadeOut(nodes.exit());
};

/**
 * Renders the node labels.
 * @private
 */
visflow.Network.prototype.drawNodeLabels_ = function() {
  var labels = this.svgNodeLabels_.selectAll('text')
    .data(this.nodeProps_, _.getValue('id'));
  labels.enter().append('text');
  _.fadeOut(labels.exit());
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
  _.fadeOut(edges.exit());
};

/**
 * Updates the network nodes. This does not deal with entering and exiting.
 * @private
 */
visflow.Network.prototype.updateNodes_ = function() {
  var nodes = this.svgNodes_.selectAll('circle');
  nodes
    .attr('bound', _.getValue('bound'))
    .attr('selected', _.getValue('selected'))
    .attr('transform', function(prop) {
      return visflow.utils.getTransform([
        prop.node.x,
        prop.node.y
      ]);
    })
    .attr('r', function(prop) {
      return prop.size / this.zoomScale_;
    }.bind(this))
    .style('stroke', _.getValue('border'))
    .style('stroke-width', function(prop) {
      return (prop.width / this.zoomScale_) + 'px';
    }.bind(this))
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
    .style('font-size', visflow.const.DEFAULT_FONT_SIZE / this.zoomScale_)
    .attr('transform', function(prop) {
      return visflow.utils.getTransform([
        prop.node.x + visflow.Network.NODE_LABEL_OFFSET_X,
        prop.node.y + visflow.Network.NODE_LABEL_OFFSET_Y
      ]);
    }.bind(this));
};

/**
 * Updates the network edges. This does not deal with entering and exiting.
 * @private
 */
visflow.Network.prototype.updateEdges_ = function() {
  var edges = this.svgEdges_.selectAll('g')
    .attr('bound', _.getValue('bound'))
    .attr('selected', _.getValue('selected'));

  // Create a shifted point around the middle of the edge to be the control
  // point of the edge's curve.
  var getShiftPoint = function(ps, pt) {
    var m = visflow.vectors.middlePoint(ps, pt);
    var d = visflow.vectors.subtractVector(ps, pt);
    d = visflow.vectors.perpendicularVector(d);
    d = visflow.vectors.normalizeVector(d);
    d = visflow.vectors.multiplyVector(d,
      visflow.vectors.vectorDistance(ps, pt) *
      visflow.Network.EDGE_CURVE_SHIFT);
    return visflow.vectors.addVector(m, d);
  }.bind(this);

  var curve = d3.line().curve(d3.curveBasis);
  edges.select('path.edge')
    .style('stroke', _.getValue('color'))
    .style('stroke-width', function(prop) {
      return (prop.width / this.zoomScale_) + 'px';
    }.bind(this))
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
      visflow.vectors.multiplyVector(dm,
        visflow.Network.NODE_SIZE / this.zoomScale_));
    var p2 = visflow.vectors.addVector(p1,
      visflow.vectors.multiplyVector(ds,
        visflow.Network.EDGE_ARROW_LENGTH / this.zoomScale_));
    var p3 = visflow.vectors.mirrorPoint(p2, p1, pm);
    return [p1, p2, p3];
  }.bind(this);

  var line = d3.line().curve(d3.curveLinearClosed);
  edges.select('path.arrow')
    .style('stroke', _.getValue('color'))
    .style('stroke-width', function(prop) {
      return (prop.width / this.zoomScale_) + 'px';
    }.bind(this))
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
  var items = this.getDataInPort().pack.items;
  this.nodeProps_ = [];
  for (var nodeIndex in this.nodes) {
    var index = +nodeIndex;
    var node = this.nodes[index];
    var prop = _.extend(
      {},
      this.defaultProperties(),
      items[index].properties,
      {
        id: 'n' + index,
        node: node
      }
    );
    if (!$.isEmptyObject(items[index].properties)) {
      prop.bound = true;
    }
    if (index in this.selected) {
      prop.selected = true;
      _.extend(prop, this.selectedProperties());
      this.multiplyProperties(prop, this.selectedMultiplier());
    }
    this.nodeProps_.push(prop);
  }
  var edgeItems = this.getPort('inEdges').getSubset().items;
  this.edgeProps_ = [];
  for (var edgeIndex in this.edges) {
    var index = +edgeIndex;
    var edge = this.edges[index];
    var prop = _.extend(
      {},
      this.defaultEdgeProperties(),
      edgeItems[index].properties,
      {
        id: 'e' + index,
        source: edge.source,
        target: edge.target
      }
    );
    if (!$.isEmptyObject(edgeItems[index].properties)) {
      prop.bound = true;
    }
    if (index in this.selectedEdges) {
      prop.selected = true;
      _.extend(prop, this.selectedEdgeProperties());
      this.multiplyProperties(prop, this.selectedMultiplier());
    }
    this.edgeProps_.push(prop);
  }
};

/** @inheritDoc */
visflow.Network.prototype.showSelection = function() {
  var svgNodes = $(this.svgNodes_.node());
  svgNodes.children('circle[bound]').appendTo(svgNodes);
  svgNodes.children('circle[selected]').appendTo(svgNodes);
  var svgEdges = $(this.svgEdges_.node());
  svgEdges.children('g[bound]').appendTo(svgEdges);
  svgEdges.children('g[selected]').appendTo(svgEdges);
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
  var inpackNodes = this.getDataInPort().getSubset();
  var inpackEdges = this.getPort('inEdges').getSubset();

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
  var inpack = this.getDataInPort().pack;
  var items = inpack.items;
  var data = inpack.data;

  // Eliminate randomness in initial layout.
  var randValue = 3;
  var rand = function() {
    randValue = randValue * 997 + 317;
    randValue %= 1003;
    return randValue;
  };

  for (var itemIndex in items) {
    var index = +itemIndex;
    if (!(index in this.nodes)) {
      // Create an empty object for new node.
      this.nodes[index] = {};
    }
    var node = this.nodes[index];
    _.extend(node, {
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
  var inpackNodes = this.getDataInPort().pack;
  var nodeItems = inpackNodes.items;
  var nodeData = inpackNodes.data;
  var nodeIdToIndex = {};
  for (var itemIndex in nodeItems) {
    var index = +itemIndex;
    var id = nodeData.values[index][this.options.nodeIdBy];
    nodeIdToIndex[id] = index;
  }

  var inpack = this.getPort('inEdges').getSubset();
  var items = inpack.items;
  var data = inpack.data;

  for (var itemIndex in items) {
    var index = +itemIndex;
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
    _.extend(edge, {
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
  var inpackNodes = this.getDataInPort().getSubset();
  var nodeItems = inpackNodes.items;
  var deletedNodes = {};
  for (var nodeIndex in this.nodes) {
    var index = +nodeIndex;
    if (!(index in nodeItems)) {
      delete this.nodes[index];
      deletedNodes[index] = true;
    }
  }

  var inpackEdges = this.getPort('inEdges').getSubset();
  var edgeItems = inpackEdges.items;
  for (var edgeIndex in this.edges) {
    var index = +edgeIndex;
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
  var inpack = this.getPort('inEdges').getSubset();
  var outspack = this.getPort('outsEdges').getSubset();
  outspack.copy(inpack);
  outspack.filter(_.allKeys(this.selectedEdges));
};

/**
 * Vadlidates the data item selection.
 */
visflow.Network.prototype.validateSelection = function() {
  visflow.Network.base.validateSelection.call(this); // clear selection of nodes
  var inpackEdges = this.getPort('inEdges').getSubset();
  for (var edgeIndex in this.selectedEdges) { // clear selection of edges
    var index = +edgeIndex;
    if (inpackEdges.items[index] == null) {
      delete this.selectedEdges[index];
    }
  }
};

/** @inheritDoc */
visflow.Network.prototype.processSync = function() {
  var inpackNodes = this.getDataInPort().getSubset();
  var inpackEdges = this.getPort('inEdges').getSubset();
  var outpackNodes = this.getDataOutPort().getSubset();
  var outpackEdges = this.getPort('outEdges').getSubset();
  var outspackNodes = this.getPort('outs').getSubset();
  var outspackEdges = this.getPort('outsEdges').getSubset();

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
  if (this.lastDataId != inpackNodes.data.dataId ||
    this.lastEdgeDataId != inpackEdges.data.dataId) {

    this.dataChanged();

    this.lastDataId = inpackNodes.data.dataId;
    this.lastEdgeDataId = inpackEdges.data.dataId;
  }
  this.processNetwork();
  this.processSelection();
};

/** @private @const {number} */
visflow.Network.prototype.FORCE_FRICTION_ = 0.25;

/**
 * Prepares and starts the force layout.
 * @private
 */
visflow.Network.prototype.startForce_ = function() {
  var svgSize = this.getSVGSize();
  this.force_.stop();

  this.force_ = d3.forceSimulation(_.toArray(this.nodes))
    .force('link', d3.forceLink(_.toArray(this.edges))
      .distance(this.options.distance))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(
      svgSize.width / 2, svgSize.height / 2))
    .velocityDecay(this.FORCE_FRICTION_)
    .on('tick', this.updateNetwork_.bind(this));

  this.force_.restart();
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
  _.extend(this.options, {
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
  this.getDataInPort().pack.data.dimensionTypes.forEach(function(type, index) {
    if (labelBy == null && type == visflow.ValueType.STRING) {
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
  var dimTypes = this.getPort('inEdges').getSubset().data.dimensionTypes;
  var sourceBy = null;
  var targetBy = null;
  dimTypes.forEach(function(type, index) {
    if (type == visflow.ValueType.STRING) {
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
 * @param {boolean=} opt_value
 * @private
 */
visflow.Network.prototype.toggleNodeLabel_ = function(opt_value) {
  this.options.nodeLabel = opt_value != null ? opt_value :
      !this.options.nodeLabel;
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

/** @inheritDoc */
visflow.Network.prototype.selectAll = function() {
  for (var edgeIndex in this.edges) {
    this.selectedEdges[+edgeIndex] = true;
  }
  visflow.Network.base.selectAll.call(this);
};
