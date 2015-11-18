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
  this.lastFilename = 'myDiagram';
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

  this.edgeSelected = null;

  this.propagateDisabled = false;

  this.asyncDataloadCount = 0;
  this.asyncDataloadQueue = [];

  this.visModeOn = false;
};


/**
 * Mapping from node type to node constructor.
 * @const @private {!Object<*>}
 */
visflow.flow.NODE_CONSTRUCTORS_ = {
  datasrc: visflow.DataSource,
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
  network: true
};

/**
 * Creates a node of given type.
 * @param {string} type
 */
visflow.flow.createNode = function(type) {
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
    nodeId: ++this.nodeCounter,
    type: type
  });
  newnode = new nodeConstructor(params);
  var jqview = visflow.viewManager.createNodeView();
  newnode.setJqview(jqview);
  newnode.show();
  this.nodes[newnode.nodeId] = newnode;
  if (type == 'datasrc' || type == 'value-maker') {
    this.dataSources.push(newnode);
  }
  this.activateNode(newnode.nodeId);

  // Select newnode (exclusive) after node creation.
  this.clearNodeSelection();
  this.addNodeSelection(newnode);
  return newnode;
};

/**
 * Creates an edge in the flow from 'sourcePort' to 'targetPort'.
 * @param {!visflow.Port} sourcePort
 * @param targetPort
 * @return {number|visflow.Edge} TODO(bowen): check this
 */
visflow.flow.createEdge = function(sourcePort, targetPort) {
  var sourceNode = sourcePort.node,
      targetNode = targetPort.node;

  var con = sourcePort.connectable(targetPort);

  if (con !== 0) {
    // 0 means okay
    return visflow.viewManager.tip(con), -1;
  }

  var newedge = new visflow.Edge({
    edgeId: ++this.edgeCounter,
    sourceNode: sourceNode,
    sourcePort: sourcePort,
    targetNode: targetNode,
    targetPort: targetPort
  });
  var jqview = visflow.viewManager.createEdgeView();
  newedge.setJqview(jqview);
  newedge.show();

  sourcePort.connect(newedge);
  targetPort.connect(newedge);

  this.edges[newedge.edgeId] = newedge;
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
  node.remove();  // removes the jqview
  delete this.nodes[node.nodeId];
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

  this.propagate(edge.targetNode);  // not efficient when deleting nodes?

  edge.remove();  // removes the jqview
  delete this.edges[edge.edgeId];
};

/**
 * Activates the node with given Id.
 * @param {string} nodeId
 */
visflow.flow.activateNode = function(nodeId) {
  if (this.nodes[nodeId].jqview == null) {
    visflow.error('node does not have jqview');
  }
  visflow.viewManager.bringFrontView(this.nodes[nodeId].jqview);
};

/**
 * Checks if connecting 'sourceNode' to 'targetNode' will result in a cycle.
 * @param {!visflow.Node} sourceNode
 * @param {!visflow.Node} targetNode
 */
visflow.flow.cycleTest = function(sourceNode, targetNode) {
  var visited = {};
  visited[sourceNode.nodeId] = true;
  // traverse graph to find cycle
  var traverse = function(node) {
    if (node.nodeId == sourceNode.nodeId)
      return true;
    if (visited[node.nodeId])
      return false;
    visited[node.nodeId] = true;
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
  if (this.propagateDisabled)
    return;

  var topo = [], // visited node list, in reversed topo order
      visited = {};
  var traverse = function(node) {
    if (visited[node.nodeId])
      return;
    visited[node.nodeId] = true;
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
  // iterate in reverse order to obtain topo order
  // skip the first one (the node itself)
  for (var i = topo.length - 1; i >= 0; i--) {
    topo[i].update();
  }
  for (var i in topo) {
    for (var j in topo[i].ports) {  // include both in and out
      topo[i].ports[j].pack.changed = false;  // unmark changes
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
  console.log(result);
  return result;
};

/**
 * Deserializes a flow from a flow JSON.
 * @param {!Object} flow
 */
visflow.flow.deserializeFlow = function(flow) {
  this.clearFlow();

  this.propagateDisabled = true;  // temporarily switch off propagation

  var hashes = {};

  for (var i in flow.nodes) {
    var nodeSaved = flow.nodes[i];
    var type = nodeSaved.type;

    for (var j in type) {
      if (type[j] == '_') {
        type = type.replace(/_/g, '-');
        visflow.error('fix old type with underscore');
        break;
      }
    }

    var newnode = this.createNode(type);
    hashes[nodeSaved.hashtag] = newnode;
    //newnode.jqview.css(nodeSaved.css);

    newnode.deserialize(nodeSaved);
    newnode.loadCss();
    newnode.updatePorts();
  }
  for (var i in flow.edges) {
    var edgeSaved = flow.edges[i];
    var sourceNode = hashes[edgeSaved.sourceNodeHash],
        targetNode = hashes[edgeSaved.targetNodeHash],
        sourcePort = sourceNode.ports[edgeSaved.sourcePortId],
        targetPort = targetNode.ports[edgeSaved.targetPortId];

    if (targetPort == null) {
      visflow.error('older version set nodes detected');
      targetPort = targetNode.ports['in'];
    }
    this.createEdge(sourcePort, targetPort);
  }

  this.propagateDisabled = false; // full propagation
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
      edge.jqview.css('opacity', 0.2);
    }
    for (var i in this.nodes){
      var node = this.nodes[i];
      if (!node.visModeOn) {
        node.jqview.css('opacity', 0.2);
      }
    }
  } else {
    for (var i in this.edges) {
      var edge = this.edges[i];
      edge.jqview.css('opacity', '');
    }
    for (var i in this.nodes){
      var node = this.nodes[i];
      node.jqview.css('opacity', '');
      node.show();
    }
  }
};

/**
 * Toggles the VisMode.
 */
visflow.flow.toggleVisMode = function() {
  // first save the current configuration
  for (var i in this.nodes){
    var node = this.nodes[i];
    node.saveCss();
  }
  // then toggle the mode, otherwise saveCss will overwrite wrong settings
  this.visModeOn = !this.visModeOn;

  if (this.visModeOn) {
    for (var i in this.edges)
      this.edges[i].hide();
    for (var i in this.nodes)
      this.nodes[i].hide();
    for (var i in this.nodes){
      this.nodes[i].loadCss();
      this.nodes[i].show();
    }
  } else {
    for (var i in this.nodes) {
      this.nodes[i].loadCss();
      this.nodes[i].show();
    }
    for (var i in this.edges)
      this.edges[i].show();
  }
};

/**
 * Clears the current flow.
 */
visflow.flow.clearFlow = function() {
  // clear screen
  visflow.viewManager.clearFlowViews();
  this.resetFlow();
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
      toAdd[nodes[i].nodeId] = nodes[i];
    }
  } else if (visflow.Node.prototype.isPrototypeOf(nodes)){
    toAdd[nodes.nodeId] = nodes;
  } else {
    toAdd = nodes;
  }
  for (var i in toAdd) {
    var node = toAdd[i];
    this.nodesSelected[node.nodeId] = node;
    node.jqview.addClass('node-selected');
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
      toClear[node.nodeId] = node;
    }
  } else {
    toClear[nodes.nodeId] = nodes;
  }
  for (var i in toClear) {
    var node = toClear[i];
    node.jqview.removeClass('node-selected');
    delete this.nodesSelected[node.nodeId];
  }
};

/**
 * Adds hovering to a set of nodes.
 * @param {!Array<!visflow.Node>} nodes
 */
visflow.flow.addNodeHover = function(nodes) {
  var toAdd = {};
  if (nodes instanceof Array) {
    for (var i in nodes) {
      toAdd[nodes[i].nodeId] = nodes[i];
    }
  } else if (visflow.Node.prototype.isPrototypeOf(nodes)){
    toAdd[nodes.nodeId] = nodes;
  } else {
    toAdd = nodes;
  }
  for (var i in toAdd) {
    var node = toAdd[i];
    node.jqview.addClass('node-hover');
    this.nodesHovered[node.nodeId] = node;
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
      toClear[node.nodeId] = node;
    }
  } else {
    toClear[nodes.nodeId] = nodes;
  }
  for (var i in toClear) {
    var node = toClear[i];
    node.jqview.removeClass('node-hover');
    delete this.nodesHovered[node.nodeId];
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
    var jqview = this.nodes[i].jqview;
    var box1 = {
      width: jqview.width(),
      height: jqview.height(),
      left: jqview.position().left,
      top: jqview.position().top
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
    var x = node.jqview.position().left,
        y = node.jqview.position().top;
    node.jqview.css({
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
  return this.nodesSelected[node.nodeId] != null;
};

/**
 * Passes key actions to selected nodes and edge.
 * @param {string} key
 * @param {!jQuery.event} event
 */
visflow.flow.keyAction = function(key, event) {
  if (key == 'ctrl+S') {
    this.saveDiagram();
    event.preventDefault();
  } else if (key == 'ctrl+L') {
    this.loadDiagram();
    event.preventDefault();
  } else {
    if (this.edgeSelected == null) { // edge and node selection are exclusive
      for (var nodeId in this.nodesSelected) {
        var node = this.nodesSelected[nodeId];
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
visflow.flow.asyncDataloadStart = function(node) {
  this.asyncDataloadCount ++;
  this.asyncDataloadQueue.push(node);
};

/**
 * Handles async data loading ends event.
 */
visflow.flow.asyncDataloadEnd = function() {
  this.asyncDataloadCount --;
  if (this.asyncDataloadCount == 0) {
    this.propagate(this.asyncDataloadQueue);
    this.asyncDataloadQueue = [];
  }
};

