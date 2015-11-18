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
    id: ++this.nodeCounter,
    type: type,
    container: visflow.viewManager.createNodeView()
  });
  newnode = new nodeConstructor(params);
  newnode.show();
  this.nodes[newnode.id] = newnode;
  if (type == 'datasrc' || type == 'value-maker') {
    this.dataSources.push(newnode);
  }
  this.activateNode(newnode.id);

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
    id: ++this.edgeCounter,
    sourceNode: sourceNode,
    sourcePort: sourcePort,
    targetNode: targetNode,
    targetPort: targetPort
  });
  var container = visflow.viewManager.createEdgeView();
  newedge.setContainer(container);
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

  this.propagate(edge.targetNode);  // not efficient when deleting nodes?

  edge.remove();  // removes the container
  delete this.edges[edge.id];
};

/**
 * Activates the node with given ID.
 * @param {string} id Node ID.
 */
visflow.flow.activateNode = function(id) {
  if (this.nodes[id].container == null) {
    visflow.error('node does not have container');
  }
  visflow.viewManager.bringToFront(this.nodes[id].container);
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
  if (this.propagateDisabled)
    return;

  var topo = [], // visited node list, in reversed topo order
      visited = {};
  var traverse = function(node) {
    if (visited[node.id])
      return;
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
    //newnode.container.css(nodeSaved.css);

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
      edge.container.css('opacity', 0.2);
    }
    for (var i in this.nodes){
      var node = this.nodes[i];
      if (!node.visModeOn) {
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
    delete this.nodesSelected[node.id];
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
    if (this.edgeSelected == null) { // edge and node selection are exclusive
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

