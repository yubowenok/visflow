/**
 * @fileoverview visflow flow edge.
 */

'use strict';

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
   * Edge container.
   * @protected {!jQuery}
   */
  this.container = params.container;

  this.contextMenu();
};

/**
 * Returns the constant array of edge contextmenu items.
 * @return {!Array<!visflow.contextMenu.Item>}
 */
visflow.Edge.prototype.contextMenuItems = function() {
  return [
    {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
  ];
};

/**
 * Prepares contextMenu for the edge.
 */
visflow.Edge.prototype.contextMenu = function() {
  var contextMenu = new visflow.ContextMenu({
    container: this.container,
    items: this.contextMenuItems()
  });

  $(contextMenu)
    .on('visflow.delete', this.delete.bind(this));
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
 * Shows the edge.
 */
visflow.Edge.prototype.show = function() {
  // clear before drawing
  this.container.children().remove();

  if (visflow.flow.visMode) {
    return; // not showing edges in vis mode
  }

  this.container.show();

  this.arrow = $('<div></div>')
    .addClass('edge-arrow')
    .appendTo(this.container);

  // right-click menu
  var edge = this;

  this.update();

  this.container
    .mouseenter(function() {
      // Prevent drag interference
      if (visflow.interaction.mouseMode != '' || visflow.flow.visMode) {
        return;
      }
      visflow.flow.addEdgeSelection(edge);
      visflow.viewManager.addEdgeHover(edge);
    })
    .mouseleave(function() {
      visflow.flow.clearEdgeSelection();
      visflow.viewManager.clearEdgeHover();
    });
};

/**
 * Re-renders the edge.
 */
visflow.Edge.prototype.update = function() {
  var sourceOffset = visflow.utils.offsetMain(this.sourcePort.container);
  var targetOffset = visflow.utils.offsetMain(this.targetPort.container);
  var sx = sourceOffset.left + this.sourcePort.container.width() / 2;
  var sy = sourceOffset.top + this.sourcePort.container.height() / 2;
  var ex = targetOffset.left + this.targetPort.container.width() / 2;
  var ey = targetOffset.top + this.targetPort.container.height() / 2;

  // Draw edges in 2 or 3 segments, hacky auto-layout...
  this.container.children().not('.edge-arrow').remove();

  var hseg = 3,
      hArrow = 7.5,
      wArrow = 20;
  var topOffset = {
    up: wArrow,
    down: -wArrow - 5
  };
  // Edge segment has height. The anchor point is considered to be at the middle
  // of the segment. We need to shift this biase when computing position.
  sx -= hseg / 2;
  ex -= hseg / 2;
  sy -= hseg / 2;
  ey -= hseg / 2;
  var yDir = ey > sy ? 'down' : 'up';
  var yAngle = Math.atan2(ey - sy, 0);
  if (ex >= sx) {
    var headWidth = Math.max(0, (ex - sx) / 2 - wArrow);
    var head = $('<div></div>')
      .appendTo(this.container)
      .addClass('edge-segment')
      .css({
        width: headWidth + hseg / 2,
        left: sx,
        top: sy
      });

    var tailWidth = ex - sx - headWidth;
    if (tailWidth < wArrow && Math.abs(ey - sy) >= wArrow) {
      // tail too short, and sufficient y space
      headWidth = ex - sx;
      // go right and then up
      if (head)
        head.css('width', headWidth);
      $('<div></div>')
        .appendTo(this.container)
        .addClass('edge-segment')
        .css({
          width: Math.abs(ey - sy) + hseg / 2,
          left: sx + headWidth,
          top: sy,
          transform: 'rotate(' + yAngle + 'rad)'
        });
      this.arrow.css({
        left: ex + hseg / 2,
        top: ey + topOffset[yDir],
        transform: 'rotate(' + yAngle + 'rad)'
      });
    } else {
      // go right, up, then right
      $('<div></div>')
        .appendTo(this.container)
        .addClass('edge-segment')
        .css({
          width: Math.abs(ey - sy) + hseg / 2,
          left: sx + headWidth,
          top: sy,
          transform: 'rotate(' + Math.atan2(ey - sy, 0) + 'rad)'
        });
      $('<div></div>')
        .appendTo(this.container)
        .addClass('edge-segment')
        .css({
          width: ex - sx - headWidth + hseg / 2,
          left: sx + headWidth,
          top: ey
        });
      this.arrow.css({
        left: ex - wArrow,
        top: ey + hseg / 2 - hArrow / 2,
        transform: ''
      });
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
       if (yDir == 'up') {
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
    var headWidth = Math.abs(midy - sy);
    $('<div></div>')
      .appendTo(this.container)
      .addClass('edge-segment')
      .css({
        width: headWidth + hseg / 2,
        left: sx,
        top: sy,
        transform: 'rotate(' + Math.atan2(midy - sy, 0) + 'rad)'
      });
    $('<div></div>')
      .appendTo(this.container)
      .addClass('edge-segment')
      .css({
        width: Math.abs(ex - sx) + hseg / 2,
        left: sx,
        top: midy,
        transform: 'rotate(' + Math.atan2(0, ex - sx) + 'rad)'
      });
    var tailWidth = Math.abs(ey - midy);
    $('<div></div>')
      .appendTo(this.container)
      .addClass('edge-segment')
      .css({
        width: tailWidth + hseg / 2,
        left: ex,
        top: midy,
        transform: 'rotate(' + Math.atan2(ey - midy, 0) + 'rad)'
      });
    this.arrow.css({
      left: ex + hseg / 2,
      top: ey + topOffset[ey > midy ? 'down' : 'up'],
      transform: 'rotate(' + Math.atan2(ey - midy, 0) + 'rad)'
    });
  }

  this.arrow.appendTo(this.container); // re-append to appear on top
};

/**
 * Removes an edge.
 */
visflow.Edge.prototype.remove = function() {
  this.container.children().remove();
  visflow.viewManager.removeEdgeView(this.container);
};

/**
 * Hides the edge.
 */
visflow.Edge.prototype.hide = function() {
  this.container.hide();
};


/**
 * Deletes the edge.
 */
visflow.Edge.prototype.delete = function() {
  visflow.flow.deleteEdge(this);
};

/**
 * Handles key action on edge.
 * @param {string} key
 */
visflow.Edge.prototype.keyAction = function(key) {
  if (key == '.' || key == 'ctrl+X') {
    visflow.flow.deleteEdge(this);
    visflow.viewManager.clearEdgeHover();
  }
};

/**
 * Gets the edge container.
 * @return {!jQuery}
 */
visflow.Edge.prototype.getContainer = function() {
  return this.container;
};
