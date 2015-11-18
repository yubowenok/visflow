/**
 * @fileoverview VisFlow view manager.
 */

'use strict';

/** @const */
visflow.viewManager = {};

visflow.viewManager.init = function() {
  $('#main').droppable({
    disabled: true
  });

  this.loadColorScales();
  this.colorScaleQueue = [];
};

/**
 * Creates a container view for node.
 */
visflow.viewManager.createNodeView = function() {
  return $('<div></div>').appendTo('#main');
};

/**
 * Creates a container view for edge.
 */
visflow.viewManager.createEdgeView = function() {
  return $('<div></div>').appendTo('#edges');
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
  var container = edge.container;
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
    .addClass('edge-clone')
    .css(edge.sourcePort.container.offset());
  edge.targetPort.container
    .clone()
    .appendTo('#main')
    .addClass('edge-clone')
    .css(edge.targetPort.container.offset());
};

/**
 * Clears hover effect for an edge.
 */
visflow.viewManager.clearEdgeHover = function() {
  $('#main').find('.edge-clone').remove();
};

/**
 * Clears colorpicker.
 */
visflow.viewManager.hideColorpickers = function(exception) {
  $('.iris-picker').not(exception).hide();
};

/**
 * Brings a jQuery container to the front.
 * @param {!jQuery} container
 */
visflow.viewManager.bringToFront = function(container) {
  $(container).appendTo('#main');
};

/**
 * Gets the popup panel name,
 * @return {string|null}
 */
visflow.viewManager.getPopupPanelName = function() {
  if (this.popupPanel == null) {
    return null;
  }
  return this.popupPanel.name;
};

/**
 * Loads the color scale file.
 */
visflow.viewManager.loadColorScales = function() {
  var manager = this;
  $.get('src/unit/colorScales.json', function(scales) {
    var list = [];
    manager.colorScales = {};
    for (var i in scales) {
      var scale = scales[i];
      // save to node, map from value to scale object
      manager.colorScales[scale.value] = scale;

      var div = $('<div></div>')
        .addClass('scalevis');
      var gradient = 'linear-gradient(to right,';
      if (scale.type == 'color') {
        // NOT support uneven scales
        for (var j in scale.range) {
          gradient += scale.range[j];
          gradient += j == scale.range.length - 1 ? ')' : ',';
        }
        div.css('background', gradient);
      } else if (scale.type == 'color-category10') {
        scale.domain = d3.range(10);
        scale.range = d3.scale.category10().range();
        var n = scale.range.length;
        for (var j = 0; j < n; j++) {
          gradient += scale.range[j] + ' ' + (j * 100 / n) + '%,';
          gradient += scale.range[j] + ' ' + ((j + 1) * 100 / n) + '%';
          gradient += j == scale.range.length - 1 ? ')' : ',';
        }
        div.css('background', gradient);
      }
      list.push({
        value: scale.value,
        text: scale.text,
        div: div
      });
    }
    manager.colorScaleList = list;

    for (var i in manager.colorScalesQueue) {
      var callback = manager.colorScalesQueue[i];
      callback();
    }
  });
};

/**
 * Gets the color scales.
 */
visflow.viewManager.getColorScales = function(unitCallback){
  if (this.colorScales == null) {
    this.colorScalesQueue.push(unitCallback);
    console.log('q');
    return null;
  }
  return this.colorScales;
};

/**
 * Creates a tooltip.
 */
visflow.viewManager.tip = function(text, csspara) {
  // csspara is the css object to define the tip's position, style, etc
  if (csspara == null)
    // by default show at mouse cursor
    csspara = {
      left: visflow.interaction.currentMouseX + 5,
      top: visflow.interaction.currentMouseY + 5
    };

  $('<div></div>')
    .addClass('tip-mouse ui-tooltip ui-tooltip-content')
    .text(text)
    .css(csspara)
    .appendTo('body')
    .delay(1000)
    .animate({
      opacity: 0
    }, 500, function() {
      $(this).remove();
    });
};

/**
 * Checks if two rectangular boxes intersect.
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
