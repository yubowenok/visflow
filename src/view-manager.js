/**
 * @fileoverview VisFlow view manager.
 */

'use strict';

/** @const */
visflow.viewManager = {};

/**
 * Initializes the viewManager.
 */
visflow.viewManager.init = function() {
};

/** @type {number} */
visflow.viewManager.zIndex = 0;

/**
 * Gets the current top z-index. Each time this function is called, a new
 * z-index will be used so that it is always larger than the previous
 * z-indices.
 * @return {number}
 */
visflow.viewManager.topZIndex = function() {
  return ++visflow.viewManager.zIndex;
};

/**
 * Creates a container for node.
 * @return {!jQuery}
 */
visflow.viewManager.createNodeContainer = function() {
  return $('<div></div>').appendTo('#main > #nodes');
};

/**
 * Creates a container for edge.
 * @return {!jQuery}
 */
visflow.viewManager.createEdgeContainer = function() {
  return $('<div></div>').appendTo('#main > #edges');
};

/**
 * Removes the container view of a node.
 * @param {!jQuery} container
 */
visflow.viewManager.removeNodeView = function(container) {
  $(container).remove();
};

/**
 * Removes the container view of an edge.
 * @param {!jQuery} container
 */
visflow.viewManager.removeEdgeView = function(container) {
  $(container).remove();
};

/**
 * Clears all the views.
 */
visflow.viewManager.clearFlowViews = function() {
  $('.node').remove();
  $('#edges').children().remove();
  // after this, nodes and edges cannot reuse their container
};

/**
 * Adds hover effect for an edge.
 * @param {!visflow.Edge} edge
 */
visflow.viewManager.addEdgeHover = function(edge) {
  var container = edge.getContainer();
  // make a shadow
  container.children('.edge-segment').clone()
    .appendTo('#hover')
    .addClass('edge-segment-hover edge-clone');
  container.children().clone()
    .appendTo('#main')
    .addClass('edge-clone');
  // copy port
  edge.sourcePort.container
    .clone()
    .appendTo('#main')
    .addClass('edge-clone hover')
    .css(visflow.utils.offsetMain(edge.sourcePort.container));
  edge.targetPort.container
    .clone()
    .appendTo('#main')
    .addClass('edge-clone hover')
    .css(visflow.utils.offsetMain(edge.targetPort.container));
};

/**
 * Clears hover effect for an edge.
 */
visflow.viewManager.clearEdgeHover = function() {
  $('#main').find('.edge-clone').remove();
};

/**
 * Checks if two rectangular boxes intersect.
 * @param {{left: number, top: number, width: number, height: number}} box1
 * @param {{left: number, top: number, width: number, height: number}} box2
 * @return {boolean}
 */
visflow.viewManager.intersectBox = function(box1, box2) {
  var x1l = box1.left,
      x1r = box1.left + box1.width,
      y1l = box1.top,
      y1r = box1.top + box1.height;
  var x2l = box2.left,
      x2r = box2.left + box2.width,
      y2l = box2.top,
      y2r = box2.top + box2.height;
  return x1l <= x2r && x2l <= x1r && y1l <= y2r && y2l <= y1r;
};
