/**
 * @fileoverview FlowManager handles all operations related to flow graph.
 * Currently, we assume only one graph is being edited at any time.
 * So FlowManager equivalently represent the graph itself.
 */

/**
 * @constructor
 */
visflow.Flow = function() {
  /**
   * Visualization mode on/off.
   * @type {boolean}
   */
  this.visMode = false;

  /**
   * De-serialization flag. Propagation and panel show are disabled during
   * de-serialization.
   * @type {boolean}
   */
  this.deserializing = false;

  /**
   * Selected diagram nodes.
   * @type {!Object<!visflow.Node>}
   */
  this.nodesSelected = {};

  /**
   * Hovered diagram nodes.
   * @type {!Object<!visflow.Node>}
   */
  this.nodesHovered = {};

  /**
   * Selected diagram edge.
   * @type {visflow.Edge}
   */
  this.edgeSelected = null;

  /**
   * Diagram nodes.
   * @type {!Object<!visflow.Node>}
   */
  this.nodes = {};

  /**
   * Diagram edges.
   * @type {!Object<!visflow.Edge>}
   */
  this.edges = {};

  /**
   * Data sources in the diagram, which appear first in topological order.
   * @type {!Array<!visflow.Node>}
   */
  this.dataSources = [];

  /**
   * Used to deserialize the diagram.
   * @private {number}
   */
  this.nodeCounter_ = 0;

  /**
   * Used to deserialize the diagram.
   * @private {number}
   */
  this.edgeCounter_ = 0;

  /** @protected {d3.ForceSimulation} */
  this.force = null;
};

/** @private @const {number} */
visflow.Flow.NEARBY_THRESHOLD_ = 200;


/**
 * Initializes flow manager.
 */
visflow.Flow.prototype.init = function() {
  this.resetFlow();

  $(visflow.upload).on('vf.uploaded', this.updateDataSources_);
};

/**
 * Resets the loaded flow.
 */
visflow.Flow.prototype.resetFlow = function() {
  // Clear visMode.
  this.visMode = false;
  visflow.signal(visflow.flow, 'visMode');

  // counters start from 1
  this.nodeCounter_ = 0;
  this.edgeCounter_ = 0;

  this.dataSources = [];

  this.nodes = {};
  this.edges = {};

  // the whole data collection
  // each id refers to a data object
  this.data = {};

  this.nodesSelected = {};
  this.nodesHovered = {};
  this.lastSelectedNode = null;

  this.edgeSelected = null;
};

/**
 * Mapping from node type to node constructor.
 * @return {!Object<Function>}
 * @private
 */
visflow.Flow.prototype.nodeConstructors_ = function() {
  return {
    dataSource: visflow.DataSource,
    intersect: visflow.Intersect,
    minus: visflow.Minus,
    union: visflow.Union,
    range: visflow.RangeFilter,
    value: visflow.ValueFilter,
    sampler: visflow.Sampler,
    valueExtractor: visflow.ValueExtractor,
    valueMaker: visflow.ValueMaker,
    propertyEditor: visflow.PropertyEditor,
    propertyMapping: visflow.PropertyMapping,
    table: visflow.Table,
    scatterplot: visflow.Scatterplot,
    parallelCoordinates: visflow.ParallelCoordinates,
    histogram: visflow.Histogram,
    lineChart: visflow.LineChart,
    heatmap: visflow.Heatmap,
    network: visflow.Network,
    map: visflow.Map
  };
};

/**
 * Mapping from obsolete type names to new ones.
 * @return {!Object<string>}
 * @private
 */
visflow.Flow.prototype.obsoleteTypes_ = function() {
  return {
    bandLimiter: 'sampler',
    contain: 'value'
  };
};

/**
 * Creates a node of given type.
 * @param {string} type
 * @param {Object=} save Saved node data for de-serialization.
 * @return {visflow.Node}
 */
visflow.Flow.prototype.createNode = function(type, save) {
  // Convert to camel case. HTML use dash separated strings.
  type = $.camelCase(type);

  var params = {};

  var obsoleteTypes = this.obsoleteTypes_();
  // Convert old types to new ones.
  if (type in obsoleteTypes) {
    type = obsoleteTypes[type];
  }

  var constructors = this.nodeConstructors_();
  // Gets the node constructor.
  if (!(type in constructors)) {
    visflow.error('unknown node type', type);
    return null;
  }
  var nodeConstructor = constructors[type];

  _.extend(params, {
    id: ++this.nodeCounter_,
    type: type,
    container: visflow.viewManager.createNodeContainer()
  });
  var newNode = new nodeConstructor(params);
  $(newNode).on('vf.ready', function() {
    if (save) {
      // If node is created from diagram loading, then de-serialize.
      this.deserialize(save);
      this.loadCss();
    }
    this.show();
    this.focus();
    if (save) {
      // Node size might be de-serialized from save and a resize event must be
      // explicitly fired in order to re-draw correctly.
      this.resize();
    }
  }.bind(newNode));

  this.nodes[newNode.id] = newNode;
  if (type == 'dataSource' || type == 'valueMaker') {
    this.dataSources.push(newNode);
  }
  // Select newNode (exclusive) after node creation.
  this.clearNodeSelection();
  this.addNodeSelection(newNode);
  return newNode;
};

/**
 * Creates an edge in the flow from 'sourcePort' to 'targetPort'.
 * @param {!visflow.Port} sourcePort
 * @param {!visflow.Port} targetPort
 * @return {visflow.Edge}
 */
visflow.Flow.prototype.createEdge = function(sourcePort, targetPort) {
  var sourceNode = sourcePort.node,
      targetNode = targetPort.node;

  var con = sourcePort.connectable(targetPort);

  if (!con.connectable) {
    visflow.tooltip.create(/** @type {string} */(con.reason));
    return null;
  }

  var newedge = new visflow.Edge({
    id: ++visflow.flow.edgeCounter_,
    sourceNode: sourceNode,
    sourcePort: sourcePort,
    targetNode: targetNode,
    targetPort: targetPort,
    container: visflow.viewManager.getEdgeContainer()
  });
  newedge.show();

  sourcePort.connect(newedge);
  targetPort.connect(newedge);

  this.edges[newedge.id] = newedge;
  return newedge;
};

/**
 * Deletes the given node.
 * @param {!visflow.Node} node
 */
visflow.Flow.prototype.deleteNode = function(node) {
  node.removeEdges();
  if (this.lastSelectedNode == node) {
    this.lastSelectedNode = null;
    if (node.id in this.nodesSelected) {
      delete this.nodesSelected[node.id];
    }
  }
  if (node.IS_DATASOURCE) {
    this.dataSources.splice(this.dataSources.indexOf(node), 1);
  }
  // Must first clear then toggle false. Otherwise the panel will not get
  // correct left offset (as its width changes).
  visflow.optionPanel.close();
  node.remove();  // removes the container
  delete this.nodes[node.id];
};

/**
 * Deletes the given edge.
 * @param {!visflow.Edge} edge
 */
visflow.Flow.prototype.deleteEdge = function(edge) {
  // remove the references in port's connection list
  var sourcePort = edge.sourcePort,
      targetPort = edge.targetPort;

  sourcePort.disconnect(edge);
  targetPort.disconnect(edge);

  // Propagation does not include processing the node being propagated.
  // Update is required on the downflow node so that it becomes aware of the
  // upflow changes.
  if (!this.deserializing) {
    edge.targetNode.update();
  }
  this.propagate(edge.targetNode);

  // Remove the container
  edge.remove();

  delete this.edges[edge.id];
};

/**
 * Deletes all edges incident to this port.
 * @return {!Array<!visflow.Port>} The ports that this port is currently
 *     connected to.
 * @param {!visflow.Port} port
 */
visflow.Flow.prototype.disconnectPort = function(port) {
  // Must copy. Array will be changed during deletion!
  var connections = port.connections.concat();
  var ports = [];
  connections.forEach(function(edge) {
    ports.push(port.isInput ? edge.sourcePort : edge.targetPort);
    visflow.flow.deleteEdge(edge);
  });
  return ports;
};

/**
 * Checks if connecting 'sourceNode' to 'targetNode' will result in a cycle.
 * @param {!visflow.Node} sourceNode
 * @param {!visflow.Node} targetNode
 * @return {boolean}
 */
visflow.Flow.prototype.cycleTest = function(sourceNode, targetNode) {
  var visited = {};
  visited[sourceNode.id] = true;
  // traverse graph to find cycle
  var traverse = function(node) {
    if (node.id == sourceNode.id)
      return true;
    if (visited[node.id])
      return false;
    visited[node.id] = true;
    for (var i in node.outPorts) {
      var port = node.outPorts[i];
      for (var j in port.connections) {
        if (traverse(port.connections[j].targetNode))
          return true;
      }
    }
    return false;
  };
  return traverse(targetNode);
};

/**
 * Propagates result starting from a given node.
 * @param {!(visflow.Node|Array<!visflow.Node>)} node
 */
visflow.Flow.prototype.propagate = function(node) {
  if (this.deserializing) {
    return;
  }

  var topo = [], // visited node list, in reversed topo order
      visited = {};
  var traverse = function(node) {
    if (visited[node.id]) {
      return;
    }
    visited[node.id] = true;
    for (var i in node.outPorts) {
      var port = node.outPorts[i];
      for (var j in port.connections) {
        traverse(port.connections[j].targetNode);
      }
    }
    topo.push(node);
  };
  if (visflow.Node.prototype.isPrototypeOf(node)) {
    traverse(node);
  } else if (node instanceof Array) {
    for (var i = 0; i < node.length; i++) {
      traverse(node[i]);
    }
  }
  // Iterate in reverse order to obtain topo order.
  // Skip the first one, i.e. the node itself.
  for (var i = topo.length - 2; i >= 0; i--) {
    topo[i].update();
  }
  for (var i = 0; i < topo.length; i++) {
    for (var j in topo[i].ports) {
      // Clear change flags for all in/out ports.
      topo[i].ports[j].pack.changed = false;
    }
  }
};

/**
 * Serializes the current flow as JSON.
 * This function parses the current flow and returns a standard visflow config
 * object.
 * @return {!Object}
 */
visflow.Flow.prototype.serializeFlow = function() {
  var result = {
    timestamp: (new Date()).getTime(),
    nodes: [],
    edges: [],
    data: []
  };
  for (var i in this.nodes) {
    var node = this.nodes[i];
    result.nodes.push(node.serialize());
    if (node.IS_DATASOURCE) {
      node.data.forEach(function(dataInfo) {
        result.data.push(+dataInfo.id);
      });
    }
  }
  result.data = _.unique(result.data);
  for (var i in this.edges) {
    result.edges.push(this.edges[i].serialize());
  }
  return result;
};

/**
 * Deserializes a flow from a flow JSON.
 * @param {!Object} flowObject
 */
visflow.Flow.prototype.deserializeFlow = function(flowObject) {
  this.clearFlow();

  this.deserializing = true;  // temporarily switch off propagation

  var hashes = {};

  // Count pending node loads.
  var loadCount = 0;

  flowObject.nodes.forEach(function(nodeSaved) {
    var type = nodeSaved.type;

    for (var i = 0; i < type.length; i++) {
      if (type[i] == '_') {
        type = type.replace(/_/g, '-');
        visflow.warning('fix old type with underscore');
        break;
      }
    }
    if (type == 'datasrc') {
      type = 'dataSource';
      visflow.warning('fix old type datasrc');
    }
    loadCount++;
    var newNode = this.createNode(type, nodeSaved);
    $(newNode).on('vf.ready', function() {
      loadCount--;
      if (loadCount == 0) {
        this.deserializeFlowEdges_(flowObject, hashes);
      }
    }.bind(this));
    hashes[nodeSaved.hashtag] = newNode;
  }, this);

  // Corner case: saved diagram is empty. In this case no edge de-serialization
  // is called and we have to turn deserializing flag off here.
  if (flowObject.nodes.length == 0) {
    this.deserializing = false;
  }
};

/**
 * De-serializes the flow edges.
 * @param {!Object} flow
 * @param {!Object<!visflow.Node>} hashes
 * @private
 */
visflow.Flow.prototype.deserializeFlowEdges_ = function(flow, hashes) {
  flow.edges.forEach(function(edgeSaved) {
    var sourceNode = hashes[edgeSaved.sourceNodeHash],
      targetNode = hashes[edgeSaved.targetNodeHash];
    var sourcePort = sourceNode.getPort(edgeSaved.sourcePortId),
      targetPort = targetNode.getPort(edgeSaved.targetPortId);

    visflow.assert(sourceNode != null);
    visflow.assert(targetNode != null);

    if (targetPort == null) {
      visflow.error('old version found, port id may have changed');
      targetPort = targetNode.getPort('in');
    }
    this.createEdge(sourcePort, targetPort);
  }, this);
  this.deserializing = false; // full propagation
  this.propagate(this.dataSources);
};

/**
 * Toggles the VisMode.
 */
visflow.Flow.prototype.toggleVisMode = function() {
  // We must call node.animateToVisModeOn/Off before inverting the Flow.visMode
  // flag because nodes use this flag to determine to which css to save their
  // current state.
  if (!this.visMode) {
    // Turn visMode on.
    _.each(this.nodes, function(node) {
      node.animateToVisModeOn();
    });
    $(visflow.const.EDGE_CONTAINER_SELECTOR).css('opacity', 0);
  } else {
    // Turn visMode off.
    _.each(this.nodes, function(node) {
      node.animateToVisModeOff();
    });
    setTimeout(function() {
      $(visflow.const.EDGE_CONTAINER_SELECTOR).css('opacity', 1);
    }, visflow.const.VISMODE_TRANSITION_DURATION);
  }

  this.visMode = !this.visMode;
  visflow.signal(visflow.flow, 'visMode');
};

/**
 * Clears the current flow.
 */
visflow.Flow.prototype.clearFlow = function() {
  // clear screen
  visflow.viewManager.clearFlowViews();
  this.resetFlow();
  visflow.optionPanel.close();
};

/**
 * Adds an edge to the edge selection.
 * @param {!visflow.Edge} edge
 */
visflow.Flow.prototype.addEdgeSelection = function(edge) {
  // can only select a single edge at a time by hovering
  this.edgeSelected = edge;
};

/**
 * Clears the edge selection.
 */
visflow.Flow.prototype.clearEdgeSelection = function() {
  this.edgeSelected = null;
};

/**
 * Adds a list of nodes to the node selection.
 * @param {!(Array<!visflow.Node>|Object<!visflow.Node>|visflow.Node)} nodes
 */
visflow.Flow.prototype.addNodeSelection = function(nodes) {
  var toAdd = {};
  if (nodes instanceof Array) {
    for (var i = 0; i < nodes.length; i++) {
      toAdd[nodes[i].id] = nodes[i];
    }
  } else if (visflow.Node.prototype.isPrototypeOf(nodes)) {
    toAdd[nodes.id] = nodes;
  } else {
    toAdd = nodes;
  }

  this.iterateActiveness();

  for (var i in toAdd) {
    var node = toAdd[i];

    // Selected node has higher activeness.
    node.activeness += 1.0;

    this.nodesSelected[node.id] = node;
    node.toggleSelected(true);
    this.lastSelectedNode = node;
  }
};

/**
 * Clears the selection a set of nodes.
 * @param {(!Array<!visflow.Node>|!visflow.Node)=} nodes
 */
visflow.Flow.prototype.clearNodeSelection = function(nodes) {
  var toClear = {};
  if (nodes == null) {
    toClear = this.nodesSelected;
  } else if (nodes instanceof Array) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      toClear[node.id] = node;
    }
  } else {
    toClear[nodes.id] = nodes;
  }
  for (var i in toClear) {
    var node = toClear[i];
    node.toggleSelected(false);
    if (node == this.lastSelectedNode) {
      this.lastSelectedNode = null;
    }
    delete this.nodesSelected[node.id];
  }
};

/**
 * Clears the selection because of background click.
 */
visflow.Flow.prototype.backgroundClearSelection = function() {
  this.clearNodeSelection();
  this.clearEdgeHover();
  visflow.optionPanel.toggle(false);
};

/**
 * Adds hovering to a set of nodes.
 * @param {!Array<!visflow.Node>|!visflow.Node} nodes
 */
visflow.Flow.prototype.addNodeHover = function(nodes) {
  var toAdd = {};
  if (nodes instanceof Array) {
    for (var i = 0; i < nodes.length; i++) {
      toAdd[nodes[i].id] = nodes[i];
    }
  } else if (visflow.Node.prototype.isPrototypeOf(nodes)) {
    toAdd[nodes.id] = nodes;
  } else {
    toAdd = nodes;
  }
  for (var i in toAdd) {
    var node = toAdd[i];
    node.container.addClass('hover');
    this.nodesHovered[node.id] = node;
  }
};

/**
 * Clears the hovering of a set of nodes.
 * @param {(!Array<!visflow.Node>|!visflow.Node)=} nodes
 */
visflow.Flow.prototype.clearNodeHover = function(nodes) {
  var toClear = {};
  if (nodes == null) {
    toClear = this.nodesHovered;
  } else if (nodes instanceof Array) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      toClear[node.id] = node;
    }
  } else {
    toClear[nodes.id] = nodes;
  }
  for (var i in toClear) {
    var node = toClear[i];
    node.container.removeClass('hover');
    delete this.nodesHovered[node.id];
  }
};

/**
 * Gets the nodes currently inside the selection box (box has not yet been
 * released).
 * @param {{left: number, top: number, width: number, height: number}} selectbox
 * @return {!Array<!visflow.Node>}
 */
visflow.Flow.prototype.getNodesInSelectbox = function(selectbox) {
  var result = [];
  for (var i in this.nodes) {
    var container = this.nodes[i].getContainer();
    var box1 = {
      width: /** @type {number} */(container.width()),
      height: /** @type {number} */(container.height()),
      left: container.position().left,
      top: container.position().top
    };
    if (visflow.viewManager.intersectBox(box1, selectbox)) {
      result.push(this.nodes[i]);
    }
  }
  return result;
};

/**
 * Adds the currently hovered nodes to selection.
 */
visflow.Flow.prototype.addHoveredToSelection = function() {
  this.addNodeSelection(this.nodesHovered);
  this.clearNodeHover();
};

/**
 * Moves a set of nodes by (dx, dy)
 * @param {number} dx
 * @param {number} dy
 * @param {!Object<!visflow.Node>} nodes
 */
visflow.Flow.prototype.moveNodes = function(dx, dy, nodes) {
  for (var id in nodes) {
    var node = nodes[id];
    if (this.visMode && !node.getOption('visMode')) {
      // Prevent moving non-vismode nodes in vismode.
      continue;
    }
    var box = node.getBoundingBox();
    node.moveTo(box.left + dx, box.top + dy);
  }
};

/**
 * Checks if a node is selected.
 * @param {!visflow.Node} node
 * @return {boolean}
 */
visflow.Flow.prototype.isNodeSelected = function(node) {
  return this.nodesSelected[node.id] != null;
};

/**
 * Passes key actions to selected nodes and edge.
 * @param {string} key
 * @param {!jQuery.Event} event
 */
visflow.Flow.prototype.keyAction = function(key, event) {
  switch (key) {
    case 'ctrl+E':
      visflow.diagram.new();
      event.preventDefault();
      break;
    case 'ctrl+S':
      visflow.diagram.save();
      event.preventDefault();
      break;
    case 'ctrl+L':
      visflow.diagram.load();
      event.preventDefault();
      break;
    default:
      // Edge and node selection are exclusive.
      if (this.edgeSelected == null) {
        for (var id in this.nodesSelected) {
          var node = this.nodesSelected[id];
          node.keyAction(key, event);
        }
      } else {
        this.edgeSelected.keyAction(key);
      }
  }
};

/**
 * Updates the node labels based on the currently node label visibility option.
 */
visflow.Flow.prototype.updateNodeLabels = function() {
  for (var id in this.nodes) {
    var node = this.nodes[id];
    node.showLabel();
  }
};

/**
 * Updates the data source data names/files when new data is uploaded.
 * @private
 */
visflow.Flow.prototype.updateDataSources_ = function() {
  if (!this.dataSources) {
    return;
  }
  this.dataSources.forEach(function(node) {
    node.showDataList();
  });
};

/**
 * Clears all edge hovers.
 */
visflow.Flow.prototype.clearEdgeHover = function() {
  for (var id in this.edges) {
    this.edges[id].removeHover();
  }
};

/**
 * Finds the closest node to the given (x, y) position.
 * @param {number} x
 * @param {number} y
 * @param {{
 *   type: (string|undefined),
 *   label: (string|undefined),
 *   differentData: (string|undefined),
 *   differentNode: (string|undefined)
 * }=} opt_condition
 * @return {?visflow.Node}
 */
visflow.Flow.prototype.closestNode = function(x, y, opt_condition) {
  var condition = opt_condition !== undefined ? opt_condition : {};
  var found = null;
  var bestDistance = Infinity;
  for (var id in this.nodes) {
    var node = this.nodes[id];

    // Filter by condition
    if (condition.type !== undefined && !node.matchType(condition.type)) {
      continue;
    }
    if (condition.label !== undefined && !node.matchLabel(condition.label)) {
      continue;
    }
    if (condition.differentData !== undefined && node.getData().dataId ==
      condition.differentData) {
      continue;
    }
    if (condition.differentNode !== undefined && node.id ==
      condition.differentNode) {
      continue;
    }

    if (!found) {
      found = node;
    } else {
      var center = node.getCenter();
      var distance = visflow.vectors.vectorLength([center.left - x,
        center.top - y]);
      if (distance < bestDistance) {
        bestDistance = distance;
        found = node;
      }
    }
  }
  return found;
};

/**
 * Finds the closest node to the mouse position
 * @param {{
 *   type: (string|undefined),
 *   label: (string|undefined),
 *   differentData: (string|undefined),
 *   differentNode: (string|undefined)
 * }=} opt_condition
 * @return {?visflow.Node}
 */
visflow.Flow.prototype.closestNodeToMouse = function(opt_condition) {
  return this.closestNode(visflow.interaction.mouseX,
    visflow.interaction.mouseY, opt_condition);
};

/**
 * Finds the nodes near a given position (x, y).
 * @param {number} x
 * @param {number} y
 * @param {number=} opt_desiredDistance
 * @return {!Object<number, boolean>} A collection of nearby node ids.
 */
visflow.Flow.prototype.nearbyNodes = function(x, y, opt_desiredDistance) {
  var desiredDistance = opt_desiredDistance !== undefined ?
    opt_desiredDistance : visflow.Flow.NEARBY_THRESHOLD_;
  var result = {};
  for (var id in this.nodes) {
    var node = this.nodes[id];
    var center = node.getCenter();
    var distance = visflow.vectors.vectorLength([center.left - x,
      center.top - y]);
    if (distance <= desiredDistance) {
      result[id] = true;
    }
  }
  return result;
};

/**
 * Finds the nodes in the current screen.
 * @return {!Object<number, boolean>} A collection of nodes inside the screen.
 */
visflow.Flow.prototype.nodesInScreen = function() {
  var result = {};
  var width = $('#main').width();
  var height = $('#main').height();
  for (var id in this.nodes) {
    var node = this.nodes[id];
    var box = node.getBoundingBox();
    if ((box.left < width && box.left + box.width > 0) ||
        (box.top < height && box.top + box.height > 0)) {
      result[id] = true;
    }
  }
  return result;
};

/**
 * Minimizes all the nodes that are not visualizations.
 */
visflow.Flow.prototype.minimizeNonVisualizations = function() {
  for (var id in this.nodes) {
    var node = this.nodes[id];
    if (!node.IS_VISUALIZATION) {
      node.setMinimized(true);
    }
  }
};

/**
 * Returns the dimension names in all the data sources.
 * @return {!Array<string>}
 */
visflow.Flow.prototype.getAllDimensionNames = function() {
  var names = [];
  this.dataSources.forEach(function(node) {
    names = names.concat(node.getDimensionNames());
  });
  return names;
};

/**
 * Decreases activeness for all nodes.
 */
visflow.Flow.prototype.iterateActiveness = function() {
  for (var id in this.nodes) {
    var node = this.nodes[id];
    node.activeness /= 2.0; // exponentially decrease activeness
  }
};

/**
 * VisFlow flow diagram. Exactly one flow instance is maintained globally.
 * @type {?visflow.Flow}
 */
visflow.flow = new visflow.Flow();
