/**
 * @fileoverview visflow flow edge.
 */

/**
 * @param {!Object} params
 * @constructor
 */
visflow.Edge = function(params) {
  if (params == null) {
    visflow.error('null params');
    return;
  }
  this.id = params.id;
  this.sourceNode = params.sourceNode;
  this.sourcePort = params.sourcePort;
  this.targetNode = params.targetNode;
  this.targetPort = params.targetPort;

  /**
   * Edge parent container.
   * @private {!jQuery}
   */
  this.edgesContainer_ = params.container;

  /**
   * Edge container.
   * @type {!d3}
   */
  this.svg = d3.select(this.edgesContainer_[0]).append('g');

  /**
   * Edge path.
   * @type {!d3}
   */
  this.path = this.svg.append('path')
    .classed('segment', true);

  /**
   * Edge arrow path.
   * @type {!d3}
   */
  this.arrow = this.svg.append('path')
    .classed('arrow', true);

  this.initContextMenu();

  // right-click menu
  this.svg
    .on('mouseenter', function() {
      // Prevent drag interference
      if (visflow.interaction.mouseMode != '' || visflow.flow.visMode) {
        return;
      }
      visflow.flow.addEdgeSelection(this);
      this.addHover();
    }.bind(this))
    .on('mouseleave', function() {
      visflow.flow.clearEdgeSelection();
      this.removeHover();
    }.bind(this));
};

 /**
 * Serializes the edge into JSON.
 * @return {!Object}
 */
visflow.Edge.prototype.serialize = function() {
  var result = {
    id: this.id,
    sourceNodeHash: this.sourceNode.hashtag,
    targetNodeHash: this.targetNode.hashtag,
    sourcePortId: this.sourcePort.id,
    targetPortId: this.targetPort.id
  };
  return result;
};

/**
 * Updates the edge.
 */
visflow.Edge.prototype.update = function() {
  if (visflow.flow.visMode) {
    this.hide(); // not showing edges in vis mode
    return;
  }
  this.draw();
};

/**
 * Draws a linear edge with given coordinates. This is used to show temporary
 * edge being drawn.
 * @param {number} sx
 * @param {number} sy
 * @param {number} ex
 * @param {number} ey
 */
visflow.Edge.prototype.drawLinear = function(sx, sy, ex, ey) {
  this.path.attr('d', d3.line()([[sx, sy], [ex, ey]]));
  this.drawArrow([sx, sy], [ex, ey], true);
};

/**
 * Re-renders the existing edge between two ports.
 */
visflow.Edge.prototype.draw = function() {
  var sourceOffset = visflow.utils.offsetMain(this.sourcePort.container);
  var targetOffset = visflow.utils.offsetMain(this.targetPort.container);
  var sx = sourceOffset.left + this.sourcePort.container.width() / 2;
  var sy = sourceOffset.top + this.sourcePort.container.height() / 2;
  var ex = targetOffset.left + this.targetPort.container.width() / 2;
  var ey = targetOffset.top + this.targetPort.container.height() / 2;

  var points = [[sx, sy]];
  // Draw edges in 2 or 3 segments, hacky...
  var wArrow = this.ARROW_SIZE_PX_;
  var yDirDown = ey > sy;
  if (ex >= sx) {
    var headWidth = Math.max(0, (ex - sx) / 2 - wArrow);
    var tailWidth = ex - sx - headWidth;
    if (tailWidth < wArrow && Math.abs(ey - sy) >= wArrow) {
      // tail too short, and sufficient y space
      headWidth = ex - sx;
      // go right and then up
      points.push([sx + headWidth, sy]);
    } else {
      // go right, up, then right
      points.push([sx + headWidth, sy]);
      points.push([sx + headWidth, ey]);
    }
  } else {  // ex < ey
    var midy;
    var sourceNodeOffset = visflow.utils.offsetMain(this.sourceNode.container);
    var targetNodeOffset = visflow.utils.offsetMain(this.targetNode.container);
    var sourceYrange = [
      sourceNodeOffset.top,
      sourceNodeOffset.top + this.sourceNode.container.outerHeight()
    ];
    var targetYrange = [
      targetNodeOffset.top,
      targetNodeOffset.top + this.targetNode.container.outerHeight()
    ];
    if (sourceYrange[0] <= targetYrange[1] &&
        sourceYrange[1] >= targetYrange[0]) {
       // two nodes have intersecting y range, get around
       if (!yDirDown) {
         // up is from human view (reversed screen coordinate)
         midy = targetYrange[0] - 20;
       } else {
         midy = targetYrange[1] + 20;
       }
    } else {
      midy = (Math.max(sourceYrange[0], targetYrange[0]) +
        Math.min(sourceYrange[1], targetYrange[1])) / 2;
    }
    // 2 turns
    points.push([sx, midy]);
    points.push([ex, midy]);
  }
  var lastPoint = [ex, ey];
  points.push(lastPoint);
  var dAttr = d3.line().curve(d3.curveBundle.beta(1))(points);
  this.path.attr('d', dAttr);
  this.drawArrow(this.getArrowPreviousPoint_(dAttr), lastPoint);
};

/**
 * Retrieves the previous point from the bezier curve d attribute to direct
 * the arrow.
 * @param {string} dAttr
 * @return {visflow.Vector}
 * @private
 */
visflow.Edge.prototype.getArrowPreviousPoint_ = function(dAttr) {
  // Find all curve points and take the point a quarter to start of the last
  // Bezier curve.
  var curveCoords = dAttr.match(/^.*([,CLM].*,.*C(?:.*,.*)+)L.*$/)[1]
    .split(/[C,]/)
    .slice(1)
    .map(function(val) { return +val; });
  var xCoords = curveCoords.filter(
    function(ele, index) { return index % 2 == 0; });
  var yCoords = curveCoords.filter(
    function(ele, index) { return index % 2 == 1; });
  var bezierFunc = function(t, val) {
    var ct = 1 - t;
    return ct * ct * ct * val[0] + t * t * t * val[3] +
      3 * ct * t * (ct * val[1] + t * val[2]);
  };
  return [bezierFunc(.6, xCoords), bezierFunc(.6, yCoords)];
};

/**
 * Draws the arrow at the tip of each edge.
 * @param {visflow.Vector} previousPoint
 * @param {visflow.Vector} lastPoint
 * @param {boolean=} noOffset
 *     If set, draws the arrow without offset towards the port.
 */
visflow.Edge.prototype.drawArrow = function(previousPoint, lastPoint,
                                            noOffset) {
  var backVector = visflow.vectors.normalizeVector(
    visflow.vectors.subtractVector(previousPoint, lastPoint));
  previousPoint = visflow.vectors.addVector(lastPoint,
    visflow.vectors.multiplyVector(backVector, this.ARROW_SIZE_PX_));
  if (!noOffset) {
    lastPoint = visflow.vectors.addVector(lastPoint,
      visflow.vectors.multiplyVector(backVector, this.ARROW_OFFSET_PX_));
  }

  var perpNorm = visflow.vectors.perpendicularVector(backVector);
  var pointLeft = visflow.vectors.addVector(previousPoint,
    visflow.vectors.multiplyVector(perpNorm, this.ARROW_SIZE_PX_ / 4));
  var pointRight = visflow.vectors.subtractVector(previousPoint,
    visflow.vectors.multiplyVector(perpNorm, this.ARROW_SIZE_PX_ / 4));
  var arrowPoints = [pointLeft, pointRight, lastPoint];
  this.arrow.attr('d', d3.line().curve(d3.curveLinearClosed)(arrowPoints));
};

/**
 * Removes an edge. Use with caution! May simply hide the edge.
 */
visflow.Edge.prototype.remove = function() {
  this.path.remove();
  this.arrow.remove();
};

/**
 * Shows the edge.
 */
visflow.Edge.prototype.show = function() {
  this.svg.style('display', 'block');
};

/**
 * Hides the edge.
 */
visflow.Edge.prototype.hide = function() {
  this.svg.style('display', 'none');
};


/**
 * Deletes the edge.
 */
visflow.Edge.prototype.delete = function() {
  visflow.flow.deleteEdge(this);
};

/**
 * Adds hovering effect.
 */
visflow.Edge.prototype.addHover = function() {
  this.svg.classed('hover', true);
};

/**
 * Removes hovering effect.
 */
visflow.Edge.prototype.removeHover = function() {
  this.svg.classed('hover', false);
};

/**
 * Handles key action on edge.
 * @param {string} key
 */
visflow.Edge.prototype.keyAction = function(key) {
  if (key == '.' || key == 'ctrl+X') {
    visflow.flow.deleteEdge(this);
    this.removeHover();
  }
};

/**
 * Gets the edge container.
 * @return {!jQuery}
 */
visflow.Edge.prototype.getContainer = function() {
  return $(this.svg.node());
};

/**
 * Prepares contextMenu for the edge.
 */
visflow.Edge.prototype.initContextMenu = function() {
  var contextMenu = new visflow.ContextMenu({
    container: $(this.svg.node()),
    items: this.contextMenuItems()
  });

  $(contextMenu)
    .on('vf.delete', this.delete.bind(this));
};
