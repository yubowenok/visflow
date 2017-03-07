/**
 * @fileoverview Algorithm to auto adjust flow diagram layout.
 */

/** @private @const {number} */
visflow.Flow.prototype.ALPHA_DECAY_ = .1;

/** @private @const {number} */
visflow.Flow.prototype.COLLIDE_ITERATIONS_ = 3;

/**
 * When the node size exceeds this number, pad the node with fake nodes for
 * expulsion.
 * @private @const {number}
 */
visflow.Flow.prototype.PADDING_THRESHOLD_ = 100;

/** @private @const {number} */
visflow.Flow.prototype.FORCE_X_STRENGTH_ = .5;

/** @private @const {number} */
visflow.Flow.prototype.FORCE_Y_STRENGTH_ = .1;

/** @private @const {number} */
visflow.Flow.prototype.DEFAULT_CHARGE_ = -50;

/** @private @const {number} */
visflow.Flow.prototype.DEFAULT_MARGIN_ = 50;

/**
 * Number of padded coordinates on one dimension.
 * @private @const {number}
 */
visflow.Flow.prototype.PADDING_NUM_ = 5;

/**
 * Auto-adjusts flow diagram layout.
 * @param {!Object=} opt_movableNodes
 *     Nodes with Ids in this object will not be fixed.
 */
visflow.Flow.prototype.autoLayout = function(opt_movableNodes) {
  var nodes = [];
  var links = [];
  var nodeIndex = {};
  var indexCounter = 0;
  var movableNodes = opt_movableNodes == undefined ? {} : opt_movableNodes;
  for (var nodeId in this.nodes) {
    var node = this.nodes[nodeId];
    var size = node.getSize();
    var center = node.getCenter();
    var box = node.getBoundingBox();

    // Center anchor
    var newNode = {
      id: nodeId,
      x: center.left,
      y: center.top,
      ox: center.left,
      oy: center.top,
      width: size.width,
      height: size.height,
      size: Math.min(size.width, size.height) / 2
    };
    if (!(nodeId in movableNodes)) {
      newNode.fx = newNode.x;
      newNode.fy = newNode.y;
    }
    nodes.push(newNode);
    nodeIndex[node.id] = indexCounter++;

    if (Math.max(size.width, size.height) > this.PADDING_THRESHOLD_) {
      var deltaX = box.width / this.PADDING_NUM_;
      var deltaY = box.height / this.PADDING_NUM_;
      for (var dx = -box.width / 2; dx <= box.width / 2; dx += deltaX) {
        for (var dy = -box.height / 2; dy <= box.height / 2; dy += deltaY) {
          nodes.push({
            x: center.left + dx,
            y: center.top + dy,
            ox: center.left + dx,
            oy: center.top + dy,
            size: 5,
            dx: dx,
            dy: dy,
            baseNode: newNode
          });
          indexCounter++;
        }
      }
    }
  }
  for (var edgeId in this.edges) {
    var edge = this.edges[edgeId];
    var boxSource = edge.sourceNode.getBoundingBox();
    var boxTarget = edge.targetNode.getBoundingBox();
    var centerSource = edge.sourceNode.getCenter();
    var centerTarget = edge.targetNode.getCenter();
    var distance = visflow.vectors.vectorDistance(
        [centerSource.left, centerSource.top],
        [centerTarget.left, centerTarget.top]);
    var strength = Math.min(1, distance / 300);
    var desiredDistance = ((boxSource.width + boxTarget.width) / 2 +
        this.DEFAULT_MARGIN_);
    links.push({
      source: nodes[nodeIndex[edge.sourceNode.id]],
      target: nodes[nodeIndex[edge.targetNode.id]],
      distance: desiredDistance,
      strength: strength
    });
  }

  var screenHeight = $('#main').height();
  this.force_ = d3.forceSimulation(nodes)
    .alphaDecay(this.ALPHA_DECAY_)
    .force('x', d3.forceX()
      .strength(this.FORCE_X_STRENGTH_)
      .x(_.getValue('ox')))
    .force('y', d3.forceY()
      .strength(function(node) {
        // Prevent the nodes from moving vertically when they are too away
        // from the vertical center.
        return Math.max(this.FORCE_Y_STRENGTH_,
          Math.min(1, Math.abs(node.y - screenHeight / 2) / screenHeight));
      }.bind(this))
      .y(_.getValue('oy')))
    .force('link', d3.forceLink(links)
      .distance(_.getValue('distance'))
      .strength(_.getValue('strength')))
    .force('charge', d3.forceManyBody()
      .strength(function(node) {
        return this.DEFAULT_CHARGE_ * (node.baseNode == undefined ? 1 : 3);
      }.bind(this)))
    .force('collide', d3.forceCollide().radius(_.getValue('size'))
      .iterations(this.COLLIDE_ITERATIONS_));

  var alphaDiff = this.force_.alpha() - this.force_.alphaMin();
  this.force_.on('tick', function() {
    var curAlphaDiff = this.force_.alpha() - this.force_.alphaMin();
      if (curAlphaDiff <= 0) {
        visflow.progress.end();
      }
      this.updateFixedPoints_(nodes);
      this.updateLayout_(nodes);
      visflow.progress.setPercentage(1 - curAlphaDiff / alphaDiff);
    }.bind(this));

  visflow.progress.start('Adjusting layout', true);
  this.force_.restart();
};

/**
 * Updates the coordinates of the fixed points, relative to their anchor points.
 * @param {!Array<!Object>} nodes
 * @private
 */
visflow.Flow.prototype.updateFixedPoints_ = function(nodes) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].baseNode != undefined) {
      nodes[i].x = nodes[i].baseNode.x + nodes[i].dx;
      nodes[i].y = nodes[i].baseNode.y + nodes[i].dy;
    }
  }
};

/**
 * Updates the nodes' positions with the computed layout.
 * @param {!Array<!Object>} nodes
 * @private
 */
visflow.Flow.prototype.updateLayout_ = function(nodes) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].baseNode != undefined) {
      continue; // Skip fixed points
    }
    var id = nodes[i].id;
    this.nodes[id].moveTo(nodes[i].x - nodes[i].width / 2,
      nodes[i].y - nodes[i].height / 2); //WithTransition
  }
};
