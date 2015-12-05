/**
 * @fileoverview FlowManager handles all operations related to flow graph.
 * Currently, we assume only one graph is being edited at any time.
 * So FlowManager equivalently represent the graph itself.
 */

'use strict';

/** @const */
visflow.flow = {};

/**
 * Initializes flow manager.
 */
visflow.flow.init = function() {
  this.resetFlow();
};

/**
 * Resets the loaded flow.
 */
visflow.flow.resetFlow = function() {
  // counters start from 1
  this.nodeCounter = 0;
  this.visCounter = 0;
  this.edgeCounter = 0;
  this.dataCounter = 0;

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


  this.asyncDataLoadCount = 0;
  this.asyncDataLoadQueue = [];

  this.visModeOn = false;
};

/**
 * De-serialization flag. Propagation and panel show are disabled during
 * de-serialization.
 * @type {boolean}
 */
visflow.flow.deserializing = false;


/**
 * Mapping from node type to node constructor.
 * @const @private {!Object<*>}
 */
visflow.flow.NODE_CONSTRUCTORS_ = {
  dataSource: visflow.DataSource,
  intersect: visflow.Intersect,
  minus: visflow.Minus,
  union: visflow.Union,
  range: visflow.RangeFilter,
  contain: visflow.ContainFilter,
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
  network: visflow.Network
};

/**
 * Visualization node types.
 * @const @private {!Object<boolean>}
 */
visflow.flow.VISUALIZATION_TYPES_ = {
  table: true,
  scatterplot: true,
  parallelCoordinates: true,
  histogram: true,
  heatmap: true,
  lineChart: true,
  network: true
};

/**
 * Creates a node of given type.
 * @param {string} type
 * @param {Object} nodeSave Saved node data for de-serialization.
 */
visflow.flow.createNode = function(type, save) {
  // Convert to camel case. HTML use dash separated strings.
  type = $.camelCase(type);

  var newnode, nodeConstructor;
  var params = {};

  // Gets the node constructor.
  if (!(type in this.NODE_CONSTRUCTORS_)) {
    visflow.error('unknown node type', type);
    return;
  }
  nodeConstructor = this.NODE_CONSTRUCTORS_[type];

  if (type in this.VISUALIZATION_TYPES_) {
    // Increment visualization node counter.
    _(params).extend({
      visId: ++this.visCounter
    });
  }

  _(params).extend({
    id: ++this.nodeCounter,
    type: type,
    container: visflow.viewManager.createNodeContainer()
  });
  newnode = new nodeConstructor(params);
  $(newnode).on('visflow.ready',
    /** @this {!visflow.Node} */
    function() {
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
    }.bind(newnode));

  this.nodes[newnode.id] = newnode;
  if (type == 'dataSource' || type == 'valueMaker') {
    this.dataSources.push(newnode);
  }
  // Select newnode (exclusive) after node creation.
  visflow.flow.clearNodeSelection();
  visflow.flow.addNodeSelection(newnode);
  return newnode;
};

/**
 * Creates an edge in the flow from 'sourcePort' to 'targetPort'.
 * @param {!visflow.Port} sourcePort
 * @param targetPort
 * @return {visflow.Edge}
 */
visflow.flow.createEdge = function(sourcePort, targetPort) {
  var sourceNode = sourcePort.node,
      targetNode = targetPort.node;

  var con = sourcePort.connectable(targetPort);

  if (!con.connectable) {
    visflow.tooltip.create(con.reason);
    return null;
  }

  var newedge = new visflow.Edge({
    id: ++this.edgeCounter,
    sourceNode: sourceNode,
    sourcePort: sourcePort,
    targetNode: targetNode,
    targetPort: targetPort,
    container: visflow.viewManager.createEdgeContainer()
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
visflow.flow.deleteNode = function(node) {
  for (var key in node.ports) {
    var port = node.ports[key];
    var connections = port.connections.slice();
    // cannot use port.connections, because the length is changing
    for (var i in connections) {
      this.deleteEdge(connections[i]);
    }
  }
  if (this.lastSelectedNode == node) {
    this.lastSelectedNode = null;
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
visflow.flow.deleteEdge = function(edge) {
  // remove the references in port's connection list
  var sourcePort = edge.sourcePort,
      targetPort = edge.targetPort;

  sourcePort.disconnect(edge);
  targetPort.disconnect(edge);

  // Propagation does not include processing the node being propagated.
  // Update is required on the downflow node so that it becomes aware of the
  // upflow changes.
  if (!visflow.flow.deserializing) {
    edge.targetNode.update();
  }
  visflow.flow.propagate(edge.targetNode);

  // Remove the container
  edge.remove();
  
  delete visflow.flow.edges[edge.id];
};

/**
 * Checks if connecting 'sourceNode' to 'targetNode' will result in a cycle.
 * @param {!visflow.Node} sourceNode
 * @param {!visflow.Node} targetNode
 */
visflow.flow.cycleTest = function(sourceNode, targetNode) {
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
 * @param {!visflow.Node} node
 */
visflow.flow.propagate = function(node) {
  if (visflow.flow.deserializing) {
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
    for (var i in node) {
      traverse(node[i]);
    }
  }
  // Iterate in reverse order to obtain topo order.
  // Skip the first one, i.e. the node itself.
  for (var i = topo.length - 2; i >= 0; i--) {
    topo[i].update();
  }
  for (var i in topo) {
    for (var j in topo[i].ports) {
      // Clear change flags for all in/out ports.
      topo[i].ports[j].pack.changed = false;
    }
  }
};

/**
 * Registers the flow data.
 * @param {!visflow.Data} data
 */
visflow.flow.registerData = function(data) {
  if (data == null || data.type == 'empty') {
    return visflow.error('attempt register null/empty data');
  }
  this.data[data.type] = data;
  data.dataId = ++this.dataCounter;
};

/**
 * Serializes the current flow as JSON.
 * This function parses the current flow and returns a standard visflow config
 * object.
 * @return {!Object}
 */
visflow.flow.serializeFlow = function() {
  var result = {
    timestamp: (new Date()).getTime(),
    nodes: [],
    edges: []
  };
  for (var i in this.nodes) {
    result.nodes.push(this.nodes[i].serialize());
  }
  for (var i in this.edges) {
    result.edges.push(this.edges[i].serialize());
  }
  return result;
};

/**
 * Deserializes a flow from a flow JSON.
 * @param {!Object} flow
 */
visflow.flow.deserializeFlow = function(flow) {
  this.clearFlow();

  visflow.flow.deserializing = true;  // temporarily switch off propagation

  var hashes = {};

  // Count pending node loads.
  var loadCount = 0;

  flow.nodes.forEach(function(nodeSaved) {
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
    var newnode = visflow.flow.createNode(type, nodeSaved);
    $(newnode).on('visflow.ready', function() {
      loadCount--;
      if (loadCount == 0) {
        visflow.flow.deserializeFlowEdges_(flow, hashes);
      }
    });
    hashes[nodeSaved.hashtag] = newnode;
  });

  // Corner case: saved diagram is empty. In this case no edge de-serialization
  // is called and we have to turn deserializing flag off here.
  if (flow.nodes.length == 0) {
    visflow.flow.deserializing = false;
  }
};

/**
 * De-serializes the flow edges.
 * @param {!Object} flows
 * @param {!Object<!visflow.Node>} hashes
 * @private
 */
visflow.flow.deserializeFlowEdges_ = function(flow, hashes) {
  flow.edges.forEach(function(edgeSaved) {
    var sourceNode = hashes[edgeSaved.sourceNodeHash],
      targetNode = hashes[edgeSaved.targetNodeHash];
    var sourcePort = sourceNode.ports[edgeSaved.sourcePortId],
      targetPort = targetNode.ports[edgeSaved.targetPortId];

    visflow.assert(sourceNode != null);
    visflow.assert(targetNode != null);

    if (targetPort == null) {
      visflow.error('old version found, port id may have changed');
      targetPort = targetNode.ports['in'];
    }
    this.createEdge(sourcePort, targetPort);
  }, this);
  visflow.flow.deserializing = false; // full propagation
  this.propagate(this.dataSources);
};


/**
 * Previews the VisMode on/off effect.
 * @param {boolean} on
 */
visflow.flow.previewVisMode = function(on) {
  if (on) {
    for (var i in this.edges) {
      var edge = this.edges[i];
      edge.container.css('opacity', 0.2);
    }
    for (var i in this.nodes){
      var node = this.nodes[i];
      if (!node.options.visMode) {
        node.container.css('opacity', 0.2);
      }
    }
  } else {
    for (var i in this.edges) {
      var edge = this.edges[i];
      edge.container.css('opacity', '');
    }
    for (var i in this.nodes){
      var node = this.nodes[i];
      node.container.css('opacity', '');
      node.show();
    }
  }
};

/**
 * Toggles the VisMode.
 */
visflow.flow.toggleVisMode = function() {
  // First save the current configuration.
  this.nodes.forEach(function(node) {
    node.saveCss();
  });
  // Then toggle the mode, otherwise saveCss will overwrite wrong settings.
  this.visModeOn = !this.visModeOn;

  if (this.visModeOn) {
    for (var id in this.edges) {
      this.edges[id].hide();
    }
    for (var id in this.nodes) {
      this.nodes[id].hide();
    }
    for (var id in this.nodes) {
      this.nodes[id].loadCss();
      this.nodes[id].show();
    }
  } else {
    for (var id in this.nodes) {
      this.nodes[id].loadCss();
      this.nodes[id].show();
    }
    for (var id in this.edges) {
      this.edges[id].show();
    }
  }
};

/**
 * Clears the current flow.
 */
visflow.flow.clearFlow = function() {
  // clear screen
  visflow.viewManager.clearFlowViews();
  this.resetFlow();
  visflow.optionPanel.close();
};

/**
 * Adds an edge to the edge selection.
 * @param {!visflow.Edge} edge
 */
visflow.flow.addEdgeSelection = function(edge) {
  // can only select a single edge at a time by hovering
  this.edgeSelected = edge;
};

/**
 * Clears the edge seletion.
 */
visflow.flow.clearEdgeSelection = function() {
  this.edgeSelected = null;
};

/**
 * Adds a list of nodes to the node selection.
 * @param {!Array<!visflow.Node>} nodes
 */
visflow.flow.addNodeSelection = function(nodes) {
  var toAdd = {};
  if (nodes instanceof Array) {
    for (var i in nodes) {
      toAdd[nodes[i].id] = nodes[i];
    }
  } else if (visflow.Node.prototype.isPrototypeOf(nodes)){
    toAdd[nodes.id] = nodes;
  } else {
    toAdd = nodes;
  }
  for (var i in toAdd) {
    var node = toAdd[i];
    this.nodesSelected[node.id] = node;
    node.container.addClass('selected');
    this.lastSelectedNode = node;
  }
};

/**
 * Clears the selection a set of nodes.
 * @param {!Array<!visflow.Node>} nodes
 */
visflow.flow.clearNodeSelection = function(nodes) {
  var toClear = {};
  if (nodes == null) {
    toClear = this.nodesSelected;
  } else if (nodes instanceof Array) {
    for (var i in nodes) {
      var node = nodes[i];
      toClear[node.id] = node;
    }
  } else {
    toClear[nodes.id] = nodes;
  }
  for (var i in toClear) {
    var node = toClear[i];
    node.container.removeClass('selected');
    if (node == this.lastSelectedNode) {
      this.lastSelectedNode = null;
    }
    delete this.nodesSelected[node.id];
  }
};

/**
 * Clears the selection because of background click.
 */
visflow.flow.backgroundClearSelection = function() {
  visflow.flow.clearNodeSelection();
  visflow.optionPanel.close();
};

/**
 * Adds hovering to a set of nodes.
 * @param {!Array<!visflow.Node>} nodes
 */
visflow.flow.addNodeHover = function(nodes) {
  var toAdd = {};
  if (nodes instanceof Array) {
    for (var i in nodes) {
      toAdd[nodes[i].id] = nodes[i];
    }
  } else if (visflow.Node.prototype.isPrototypeOf(nodes)){
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
 * @param {!Array<!visflow.Node>} nodes
 */
visflow.flow.clearNodeHover = function(nodes) {
  var toClear = {};
  if (nodes == null) {
    toClear = this.nodesHovered;
  } else if (nodes instanceof Array) {
    for (var i in nodes) {
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
 * released}.
 * @param {!Object} selectbox
 * @return {!Array<!visflow.Node>}
 */
visflow.flow.getNodesInSelectbox = function(selectbox) {
  var result = [];
  for (var i in this.nodes) {
    var container = this.nodes[i].container;
    var box1 = {
      width: container.width(),
      height: container.height(),
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
visflow.flow.addHoveredToSelection = function() {
  this.addNodeSelection(this.nodesHovered);
  this.clearNodeHover();
};

/**
 * Moves a set of nodes by (dx, dy)
 * @param {number} dx
 * @param {number} dy
 * @param {!Array<!visflow.Node>} nodes
 */
visflow.flow.moveNodes = function(dx, dy, nodes) {
  for (var i in nodes) {
    var node = nodes[i];
    var x = node.container.position().left,
        y = node.container.position().top;
    node.container.css({
      left: x + dx,
      top: y + dy
    });
    node.updatePorts();
  }
};

/**
 * Checks if a node is selected.
 * @param {!visflow.Node} node
 * @return {boolean}
 */
visflow.flow.isNodeSelected = function(node) {
  return this.nodesSelected[node.id] != null;
};

/**
 * Passes key actions to selected nodes and edge.
 * @param {string} key
 * @param {!jQuery.event} event
 */
visflow.flow.keyAction = function(key, event) {
  if (key == 'ctrl+S') {
    visflow.diagram.save();
    event.preventDefault();
  } else if (key == 'ctrl+L') {
    visflow.diagram.load();
    event.preventDefault();
  } else {
    // Edge and node selection are exclusive.
    if (this.edgeSelected == null) {
      for (var id in this.nodesSelected) {
        var node = this.nodesSelected[id];
        node.keyAction(key, event);
      }
    } else {
      this.edgeSelected.keyAction(key, event);
    }
  }
};

/**
 * Handles async data loading starts event.
 * Prevents rushing in async data loading.
 * @param {!visflow.Node} node
 */
visflow.flow.asyncDataLoadStart = function(node) {
  this.asyncDataLoadCount++;
  this.asyncDataLoadQueue.push(node);
};

/**
 * Handles async data loading ends event.
 */
visflow.flow.asyncDataLoadEnd = function() {
  this.asyncDataLoadCount --;
  if (this.asyncDataLoadCount == 0) {
    this.propagate(this.asyncDataLoadQueue);
    this.asyncDataLoadQueue = [];
  }
};

