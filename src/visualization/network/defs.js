/**
 * @fileoverview Network defs.
 */


/** @inheritDoc */
visflow.Network.prototype.NODE_CLASS = 'network';

/** @inheritDoc */
visflow.Network.prototype.PANEL_TEMPLATE =
  './dist/html/visualization/network/network-panel.html';

/** @const {number} */
visflow.Network.NODE_LABEL_SIZE = 14;

/** @const {number} */
visflow.Network.NODE_LABEL_OFFSET_X = 10;

/** @const {number} */
visflow.Network.NODE_LABEL_OFFSET_Y =
  visflow.Network.NODE_LABEL_SIZE / 2;

/** @const {number} */
visflow.Network.NODE_SIZE = 6;

/** @const {number} */
visflow.Network.EDGE_ARROW_LENGTH = 10;

/**
 * Shifting percentage of curved edge.
 * @const {number}
 */
visflow.Network.EDGE_CURVE_SHIFT = 0.1;

/** @inheritDoc */
visflow.Network.prototype.defaultOptions = function() {
  return new visflow.options.Network({
    // Whether to show label.
    nodeLabel: true,
    // Which dimension is used as label.
    labelBy: 0,
    // D3 force-directed layout link distance.
    distance: 30,
    // Node identifier corresponding to edges.
    nodeIdBy: 0,
    // Edge dimension used as source (node id).
    sourceBy: 0,
    // Edge dimension used as target (node id).
    targetBy: 1,
    // Whether navigation is enabled.
    navigation: false
  });
};

/** @inheritDoc */
visflow.Network.prototype.defaultProperties = function() {
  return {
    color: '#555',
    border: 'black',
    width: 2,
    size: 5
  };
};

/**
 * Default properties for edges.
 * @return {!Object<number|string>}
 * @protected
 */
visflow.Network.prototype.defaultEdgeProperties = function() {
  return {
    width: 1.5,
    color: '#333'
  };
};

/** @inheritDoc */
visflow.Network.prototype.selectedProperties = function() {
  return {
    color: 'white',
    border: visflow.const.SELECTED_COLOR
  };
};

/**
 * Rendering properties for selected edges.
 * @return {{color: string}}
 * @protected
 */
visflow.Network.prototype.selectedEdgeProperties = function() {
  return {
    color: visflow.const.SELECTED_COLOR
  };
};

/** @inheritDoc */
visflow.Network.prototype.selectedMultiplier = function() {
  return {
    size: 1.2,
    width: 1.2
  };
};

/**
 * @return {!Array<number>}
 */
visflow.Network.zoomExtent = function() {
  return [.01, 8];
};

/** @inheritDoc */
visflow.Network.prototype.contextMenuItems = function() {
  var baseItems = visflow.Network.base.contextMenuItems();
  return baseItems.concat([
    // network node label
    {id: visflow.Event.NODE_LABEL, text: 'Node Label', bind: 'nodeLabel'},
    {id: visflow.Event.NAVIGATION, text: 'Navigation', bind: 'navigation'}
  ]);
};
