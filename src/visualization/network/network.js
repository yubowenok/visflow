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
    in: new visflow.Port(this, 'in', 'in-single', 'D'),
    ine: new visflow.Port(this, 'ine', 'in-single', 'D'),
    outs: new visflow.Port(this, 'outs', 'out-multiple', 'S'),
    outse: new visflow.Port(this, 'outse', 'out-multiple', 'S'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'D'),
    oute: new visflow.Port(this, 'oute', 'out-multiple', 'D')
  };

  /**
   * Processed nodes from node list table.
   * @protected {!Array}
   */
  this.nodeList = [];
  /**
   * Processed edges from edge list table.
   * @protected {!Array}
   */
  this.edgeList = [];
  /**
   * References to node objects.
   * @protected {!Object}
   */
  this.nodes = {};
  /**
   * References to edge objects.
   * @protected {!Object}
   */
  this.edges = {};  // refer to edge objects

  /** @protected {!Object<boolean>} */
  this.selectedEdges = {};

  /**
   * Last data id for edges.
   * @protected {number}
   */
  this.lastEdgeDataId = 0;

  /**
   * Interactive panning state.
   * @private {boolean}
   */
  this.panning_ = false;

  /**
   * Interactive translation.
   * @private {!Array<number>}
   */
  this.translate_ = [0, 0];

  $(this.options).extend({
    // Whether to show label.
    nodeLabel: true,
    // Which dimension is used as label.
    labelBy: 0,
    // D3 force-directed layout force charge.
    charge: -10000
  });
};

visflow.utils.inherit(visflow.Network, visflow.Visualization);

/** @inheritDoc */
visflow.Network.prototype.NODE_NAME = 'Network';
/** @inheritDoc */
visflow.Network.prototype.NODE_CLASS = 'network';

/** @inheritDoc */
visflow.Network.prototype.defaultProperties = {
  color: '#555',
  border: 'black',
  width: 2,
  size : 5
};

/**
 * Default properties for edges.
 * @protected {!Object<number|string>}
 */
visflow.Network.prototype.defaultPropertiesEdge = {
  width: 3,
  color: '#333'
};

/** @inheritDoc */
visflow.Network.prototype.selectedProperties = {
  color: 'white',
  border: '#6699ee'
};

/** @inheritDoc */
visflow.Network.prototype.selectedPropertiesEdge = {
  color: '#6699ee'
};

/** @inheritDoc */
visflow.Network.prototype.selectedMultiplier = {
  size: 1.2,
  width: 1.2
};

/** @private @const {number} */
visflow.Network.prototype.DEFAULT_FORCE_CHARGE_ = -10000;

/** @inheritDoc */
visflow.Network.prototype.CONTEXTMENU_ITEMS = [
  {id: 'selectAll', text: 'Select All'},
  {id: 'clearSelection', text: 'Clear Selection'},
  {id: 'nodeLabel', text: 'Node Label'},
  {id: 'pan', text: 'Panning'},
  {id: 'minimize', text: 'Minimize', icon: 'glyphicon glyphicon-resize-small'},
  {id: 'visMode', text: 'Visualization Mode', icon: 'glyphicon glyphicon-picture'},
  {id: 'panel', text: 'Control Panel', icon: 'glyphicon glyphicon-th-list'},
  {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
];

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
  if (this.options.forceCharge == null) {
    this.options.forceCharge = this.DEFAULT_FORCE_CHARGE_;
    visflow.warning('forceCharge not saved in', this.label);
  }
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
    .on('visflow.pan', this.togglePanning_.bind(this))
    .on('visflow.nodeLabel', this.toggleNodeLabel_.bind(this));
};

/** @inheritDoc */
visflow.Network.prototype.mousedown = function(event) {
  if (event.which == visflow.interaction.keyCodes.LEFT_MOUSE) {
    // Left click potentially triggers panning.
    if (this.panning_) {
      this.mouseMode = 'pan';
      if (visflow.interaction.visualizationBlocking) {
        event.stopPropagation();
      }
    } else {
      // Let base class handle it.
      visflow.Network.base.mousedown.call(this, event);
    }
  }
};

/** @inheritDoc */
visflow.Network.prototype.mousemove = function(event) {
  if (this.mouseMode == 'pan') {
    event.stopPropagation();
    if (this.brushPoints_.length < 2) {
      return;
    }
    var pos2 = _(this.brushPoints_).last();
    var pos1 = this.brushPoints_[this.brushPoints_.length - 2];
    var dx = pos2.x - pos1.x;
    var dy = pos2.y - pos1.y;
    this.moveNetwork_(dx, dy);
  }
}

/**
 * Translates the network.
 * @private
 */
visflow.Network.prototype.moveNetwork_ = function(dx, dy) {
  this.translate_[0] += dx;
  this.translate_[1] += dy;
  this.drawNetwork_();
};

/** @inheritDoc */
visflow.Network.prototype.selectItems = function() {
  this.selectNodesInBox_();
};

/**
 * Selects the nodes and edges in the range selection box.
 */
visflow.Network.prototype.selectNodesInBox_ = function() {
  if (!visflow.interaction.shifted) {
    this.selected = {};
    this.selectedEdges = {};
  }

  // TODO(bowen): implement below
  return;

  var inpack = this.ports['in'].pack,
      items = inpack.items,
      values = inpack.data.values;

  for (var i in this.nodes) {
    var x = this.nodes[i].x,
        y = this.nodes[i].y; // get current node coordinates
    x += this.translate[0];
    y += this.translate[1];
    if (x >= box[0][0] && x <= box[0][1]
      && y >= box[1][0] && y <= box[1][1]) {
      this.selected[this.nodes[i].dfindex] = true;
    }
  }
  for (var i in this.edges) {
    var x1 = this.edges[i].source.x,
        y1 = this.edges[i].source.y,
        x2 = this.edges[i].target.x,
        y2 = this.edges[i].target.y;
    x1 += this.translate[0];
    y1 += this.translate[1];
    x2 += this.translate[0];
    y2 += this.translate[1];
    if ( (x1 >= box[0][0] && x1 <= box[0][1] && y1 >= box[1][0] && y1 <= box[1][1])
    && (x2 >= box[0][0] && x2 <= box[0][1] && y2 >= box[1][0] && y2 <= box[1][1]) ) {
      this.selectedEdges[this.edges[i].dfindex] = true;
    }
  }
  this.pushflow();
  this.showDetails(false);
};

/** @inheritDoc */
visflow.Network.prototype.isDataEmpty = function() {
  var inpackNodes = this.ports['in'].pack,
      inpackEdges = this.ports['ine'].pack;
  return inpackNodes.isEmpty() || inpackEdges.isEmpty();
};

/** @inheritDoc */
visflow.Network.prototype.showDetails = function(preventForce) {
  if (this.checkDataEmpty()) {
    return;
  }

  if (this.nodes == null) {
    this.processNetwork();
  }

  var node = this;

  this.svgg = this.svg.append('g')
    .attr('transform', 'translate(' + this.translate[0] + ',' + this.translate[1] + ')');

  this.svgEdges = this.svgg.selectAll('.network-edge')
    .data(this.edgeList).enter().append('line')
    .attr('class', 'network-edge');

  this.svgArrows = this.svgg.append('g')
    .attr('class', 'network-arrow')
    .selectAll('.network-arrow')
    .data(this.edgeList).enter().append('line');
  this.svgArrows2 = this.svgg.append('g')
    .attr('class', 'network-arrow')
    .selectAll('.network-arrow')
    .data(this.edgeList).enter().append('line');

  this.svgNodes = this.svgg.selectAll('.circle')
    .data(this.nodeList, function(e) { return e.dfindex; }).enter().append('circle')
    .on('dblclick', function(e) {
      d3.select(this).classed('fixed', d.fixed = false);
    });

  var inpackNodes = this.ports['in'].pack,
      nodeData = inpackNodes.data;

  if (this.nodeLabelOn) {
    this.svgLabels = this.svgg.selectAll('.network-label')
      .data(this.nodeList).enter().append('text')
      .attr('class', 'network-label')
      .text(function(e) {
        return node.isEmptyNodes? e.label : nodeData.values[e.dfindex][node.nodeLabel];
      });
  }

  if (!preventForce) {
    this.prepareForce();
    this.force.start();
  }
  this.showSelection();
};

/** @inheritDoc */
visflow.Network.prototype.updateVisualization = function() {
  // pan
  this.svgg
    .attr('transform', 'translate(' + this.translate[0] + ',' + this.translate[1] + ')');
  // must use dfindex to avoid conflict with d3 force layout index
  // first update edges
  var items = this.ports['ine'].pack.items,
      ritems = [];
  for (var i in this.edges) {
    var edge = this.edges[i],
        index = edge.dfindex;

    var x1 = edge.source.x, y1 = edge.source.y,
        x2 = edge.target.x, y2 = edge.target.y;
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx*dx+dy*dy);
    dx /= len; dy /= len;
    var shift = 3;
    var properties = _.extend(
      {},
      this.defaultPropertiesEdge,
      items[index].properties,
      {
        id: 'e' + index,
        dfindex: index,
        x1: x1 - dy * shift,
        y1: y1 + dx * shift,
        x2: x2 - dy * shift,
        y2: y2 + dx * shift
      }
    );
    if (this.selectedEdges[index]) {
      _(properties).extend(this.selectedPropertiesEdge);
      this.multiplyProperties(properties, this.selectedMultiplierEdge);
    }
    ritems.push(properties);
  }

  var edges = this.svgEdges.data(ritems, function(e) { return e.dfindex; })[0];
  for (var i = 0; i < edges.length; i++) {
    if (edges[i] == null) {
      console.log(edges);
    }
    var properties = edges[i].__data__;
    var u = d3.select(edges[i]);
    this.applyProperties(u, properties, this.propertyTranslateEdge);
  }

  // change arrow direction
  for (var i = 0; i < ritems.length; i++) {
    var properties = ritems[i];
    var x1 = properties.x1, y1 = properties.y1,
        x2 = properties.x2, y2 = properties.y2;
    var dx = x1 - x2, dy = y1 - y2;
    var len = Math.sqrt(dx * dx + dy * dy);
    dx /= len; dy /= len;
    var size = 18;
    _(properties).extend({
      x1: x2,
      y1: y2,
      x2: x2 + dx * size,
      y2: y2 + dy * size,
      transform: 'rotate(10,' + x2 + ',' + y2 + ')'
    });
  }
  var arrows = this.svgArrows.data(ritems, function(e) { return e.dfindex; })[0];
  for (var i = 0; i < arrows.length; i++) {
    var properties = arrows[i].__data__;
    var u = d3.select(arrows[i]);
    this.applyProperties(u, properties, this.propertyTranslateEdge);
  }
  for (var i = 0; i < ritems.length; i++) {
    var properties = ritems[i];
    _(properties).extend({
      transform: 'rotate(-10,' + properties.x1 + ',' + properties.y1 + ')'
    });
  }
  var arrows2 = this.svgArrows2.data(ritems, function(e) { return e.dfindex; })[0];
  for (var i = 0; i < arrows2.length; i++) {
    var properties = arrows2[i].__data__;
    var u = d3.select(arrows2[i]);
    this.applyProperties(u, properties, this.propertyTranslateEdge);
  }

  var ritems = [];
  var items = this.ports['in'].pack.items;
  for (var i in this.nodes) {
    var node = this.nodes[i],
        index = node.dfindex;
    var properties = _.extend(
      {},
      this.defaultProperties,
      items[index].properties,
      {
        id: 'n' + index,
        dfindex: index,
        cx: node.x,
        cy: node.y
      }
    );
    if (this.selected[index]) {
      _(properties).extend(this.selectedProperties);
      this.multiplyProperties(properties, this.selectedMultiplier);
    }
    ritems.push(properties);
  }
  var nodes = this.svgNodes.data(ritems, function(e) { return e.dfindex; })[0];
  for (var i = 0; i < nodes.length; i++) {
    var properties = nodes[i].__data__;
    var u = d3.select(nodes[i]);
    this.applyProperties(u, properties, this.propertyTranslate);
  }

  if (this.nodeLabelOn) {
    // update label positions
    this.svgLabels
      .attr('x', function(e) { return e.x; })
      .attr('y', function(e) { return e.y - 12; });
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
  var dimensionList = this.getDimensionList();

  var labelBySelect = new visflow.Select({
    container: container.find('#label-by'),
    list: dimensionList,
    allowClear: true,
    selected: this.options.labelBy,
    listTitle: 'Label By'
  });
  $(labelBySelect).on('visflow.change', function(event, dim) {
    this.options.labelBy = dim;
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
    // TODO(bowen)
  }.bind(this));
  /*
  var node = this;
  this.checkboxNodeLabel = new visflow.Checkbox({
    id: 'nodelabel',
    label: 'Node Labels',
    target: this.jqoptions,
    value: this.nodeLabelOn,
    relative: true,
    change: function(event) {
      console.log(event.unitChange);
      var unitChange = event.unitChange;
      node.nodeLabelOn = unitChange.value;
      node.pushflow();
      node.showDetails();
    }
  });
  */
};


/**
 * Processes the network data.
 */
visflow.Network.prototype.processNetwork = function() {
  var inpackNodes = this.ports['in'].pack,
    inpackEdges = this.ports['ine'].pack;

  if (inpackEdges.isEmpty() || inpackNodes.isEmpty())
    return;

  if (this.nodes == null) { // never processed
    this.nodes = {};
    this.edges = {};
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
  var inpackNodes = this.ports['in'].pack,
      items = inpackNodes.items,
      data = inpackNodes.data;

  this.nodeList = [];

  // eliminate randomness in initial layout
  var randValue = 3;
  var rand = function() {
    randValue = randValue * 997 + 317;
    randValue %= 1003;
    return randValue;
  };

  for (var index in items) {
   var values = data.values[index];
    // TODO, temporarily assuming name is first column
    var name = values[0];
    var node = this.nodes[name];
    if (node == null) {
      // create an empty object for new node
      node = this.nodes[name] = {};
    }
    _(node).extend({
      dfindex: index
    });
    if (node.x == null)
      node.x = rand();
    if (node.y == null)
      node.y = rand();
    this.nodeList.push(node);
  }
};

/**
 * Processes the edges data.
 * @private
 */
visflow.Network.prototype.processEdges_ = function() {
  var inpack = this.ports['ine'].pack,
      items = inpack.items,
      data = inpack.data;

  this.edgeList = [];

  var skipped = 0;
  for (var index in items) {
    var values = data.values[index];
    var source = this.nodes[values[0]],
        target = this.nodes[values[1]];

    if (source == null || target == null) {
      skipped ++;
      continue; // skip edges without corresponding nodes
    }
    var edge = this.edges[index];
    if (edge == null) {
      // create an empty object for new edge
      edge = this.edges[index] = {};
    }
    _(edge).extend({
      dfindex: index,
      source: source,
      target: target,
      dfweight: values[2] // TODO, hacky
    });
    this.edgeList.push(edge);
  }
  //console.log(skipped, 'edges skipped');
};

/**
 * Validates the network.
 */
visflow.Network.prototype.validateNetwork = function() {
  var inpackNodes = this.ports['in'].pack,
      inpackEdges = this.ports['ine'].pack;

  var deletedNodes = {};
  var items = inpackNodes.items;
  for (var i in this.nodes) {
    var node = this.nodes[i],
        index = node.dfindex;
    if (items[index] == null) {
      delete this.nodes[i];
      deletedNodes[index] = true;
    }
  }
  var items = inpackEdges.items;
  for (var i in this.edges) {
    var edge = this.edges[i],
        index = edge.dfindex;
    if (items[index] == null
      || deletedNodes[edge.source.dfindex] != null
      || deletedNodes[edge.target.dfindex] != null) {
      delete this.edges[i];
    }
  }
};


/** @inheritDoc */
visflow.Network.prototype.processSelection = function() {
  visflow.Network.base.processSelection.call(this); // process node selection
  var inpack = this.ports['ine'].pack,
      outspack = this.ports['outse'].pack;
  outspack.copy(inpack);
  outspack.filter(_.allKeys(this.selectedEdges));
};

/**
 * Vadlidates the data item selection.
 */
visflow.Network.prototype.validateSelection = function() {
  visflow.Network.base.validateSelection.call(this); // clear selection of nodes
  var inpackEdges = this.ports['ine'].pack;
  for (var index in this.selectedEdges) { // clear selection of edges
    if (inpackEdges.items[index] == null){
      delete this.selectedEdges[index];
    }
  }
};

/** @inheritDoc */
visflow.Network.prototype.process = function() {
  var inpackNodes = this.ports['in'].pack,
      inpackEdges = this.ports['ine'].pack,
      outpackNodes = this.ports['out'].pack,
      outpackEdges = this.ports['oute'].pack,
      outspackNodes = this.ports['outs'].pack,
      outspackEdges = this.ports['outse'].pack;

  if (this.force != null) {
    this.force.stop();  // prevent further update
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

    //console.log(inpackNodes);

    this.lastDataId = inpackNodes.data.dataId;
    this.lastEdgeDataId = inpackEdges.data.dataId;
  }
  this.processNetwork();
  this.processSelection();
};

/**
 * Prepares the force layout.
 */
visflow.Network.prototype.prepareForce = function() {
  var node = this;
  if (this.force != null)
    this.force.stop();
  this.force = d3.layout.force()
    .nodes(this.nodeList)
    .links(this.edgeList)
    .size([this.svgSize[0], this.svgSize[1]])
    .charge(this.forceCharge)
    .linkDistance(30)
    .gravity(0.5)
    .friction(0.25)
    .on('tick', function() {
      node.updateVisualization();
    });
  this.force.drag()
    .on('dragstart', function(e) {
      console.log('dd');
      d3.select(this).classed('fixed', d.fixed = true);
    });
};

/** @inheritDoc */
visflow.Network.prototype.dataChanged = function() {
  this.nodes = {}; // cached positions shall be discarded
  this.edges = {};
  this.nodeLabel = 0;
  this.processNetwork();
};

/**
 * Toggles panning/selection mode.
 * @private
 */
visflow.Network.prototype.togglePanning_ = function() {
  this.panning_ = !this.panning_;
};

/**
 * Toggles node label visibility.
 * @private
 */
visflow.Network.prototype.toggleNodeLabel_ = function() {
  this.options.nodeLabel = !this.options.nodeLabel;
};

/** @inheritDoc */
visflow.Network.prototype.keyAction = function(key, event) {
  if (key == 'H') {
    this.togglePanning_();
    event.stopPropagation();
  }
  visflow.Network.base.keyAction.call(this, key, event);
};

/** @inheritDoc */
visflow.Network.prototype.clearSelection = function() {
  this.selectedEdges = {};
  visflow.Network.base.clearSelection.call(this);
};
