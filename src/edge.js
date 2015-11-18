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
 * Sets the container of the edge.
 * @param {!jQuery} container
 */
visflow.Edge.prototype.setContainer = function(container) {
  this.container = container.addClass('edge');
};

/**
 * Shows the edge.
 */
visflow.Edge.prototype.show = function() {
  // clear before drawing
  this.container.children().remove();

  if (visflow.flow.visModeOn)
    return; // not showing edges in vis mode

  this.container.show();

  this.jqarrow = $('<div></div>')
    .addClass('edge-arrow')
    .appendTo(this.container);

  // right-click menu
  var edge = this;

  this.container.contextMenu({
    selector: this.container,
    callback: function(key, options) {
      console.log(options);
      switch(key) {
        case 'delete':
          visflow.flow.deleteEdge(edge);
      }
    },
    items: {
      delete: {name: 'delete', icon: 'delete'}
    }
  });
  this.update();

  var container = this.container;
  this.container
    .mouseenter(function(event) {

      // prevent drag interference
      if (visflow.interaction.mouseMode != 'none')
        return;
      visflow.flow.addEdgeSelection(edge);
      visflow.viewManager.addEdgeHover(edge);
    })
    .mouseleave(function(event) {
      visflow.flow.clearEdgeSelection();
      visflow.viewManager.clearEdgeHover();
    });
};

/**
 * Re-renders the edge.
 */
visflow.Edge.prototype.update = function() {
  var sx = this.sourcePort.container.offset().left + this.sourcePort.container.width() / 2,
      sy = this.sourcePort.container.offset().top + this.sourcePort.container.height() / 2,
      ex = this.targetPort.container.offset().left + this.targetPort.container.width() / 2,
      ey = this.targetPort.container.offset().top + this.targetPort.container.height() / 2,
      dx = ex - sx,
      dy = ey - sy;

  // draw edges in 2 or 3 segments, hacky...

  //var length = Math.sqrt(dx * dx + dy * dy);
  //var angle = Math.atan2(dy, dx);
  this.container.children().not('.edge-arrow').remove();

  var hseg = 3,
      hArrow = 9,
      wArrow = 25;
  var topOffset = {
    up: wArrow,
    down: -wArrow - 5
  };
  // edge segment has height, the anchor point is considered to be
  // at the middle of the segment, we need to shift this biase when computing position
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
      this.jqarrow.css({
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
      this.jqarrow.css({
        left: ex - wArrow,
        top: ey + hseg / 2 - hArrow / 2,
        transform: ''
      });
    }
  } else {  // ex < ey
    var midy;
    var sourceYrange = [
        this.sourceNode.container.offset().top,
        this.sourceNode.container.offset().top + this.sourceNode.container.outerHeight()
      ],
        targetYrange = [
        this.targetNode.container.offset().top,
        this.targetNode.container.offset().top + this.targetNode.container.outerHeight()
      ];
    if ( sourceYrange[0] <= targetYrange[1] &&
         sourceYrange[1] >= targetYrange[0] ) {
       // two nodes have intersecting y range, get around
       if (yDir == 'up') {
         midy = targetYrange[0] - 20; // up is from human view (reversed screen coordinate)
       } else {
         midy = targetYrange[1] + 20;
       }
    } else {
      midy = (Math.max(sourceYrange[0], targetYrange[0])
      + Math.min(sourceYrange[1], targetYrange[1]))/2;
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
    this.jqarrow.css({
      left: ex + hseg / 2,
      top: ey + topOffset[ey > midy ? 'down' : 'up'],
      transform: 'rotate(' + Math.atan2(ey - midy, 0) + 'rad)'
    });
  }

  this.jqarrow.appendTo(this.container); // re-append to appear on top
  //.css('transform', 'rotate(' + angle + 'rad)');
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
 * Handles key action on edge.
 * @param {string} key
 */
visflow.Edge.prototype.keyAction = function(key) {
  if (key == '.' || key == 'ctrl+X') {
    visflow.flow.deleteEdge(this);
    visflow.viewManager.clearEdgeHover();
  }
};
