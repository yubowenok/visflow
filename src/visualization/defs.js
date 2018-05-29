/**
 * @fileoverview Visualization defs.
 */

/** @inheritDoc */
visflow.Visualization.prototype.DEFAULT_LABEL = 'Chart';

/** @inheritDoc */
visflow.Visualization.prototype.TEMPLATE =
  './dist/html/visualization/visualization.html';

/** @protected @const {number} */
visflow.Visualization.prototype.LABEL_OFFSET = 5;

/** @protected @const {number} */
visflow.Visualization.prototype.DEFAULT_TICKS = 5;

/** @protected @const {number} */
visflow.Visualization.prototype.TRANSITION_ELEMENT_LIMIT = 5000;

/** @protected @const {number} */
visflow.Visualization.prototype.TICKS_HEIGHT = 10;

/** @const {boolean} */
visflow.Visualization.prototype.IS_VISUALIZATION = true;

/**
 * Visualization nodes specific options.
 * @return {!visflow.options.Node}
 */
visflow.Visualization.prototype.visualizationOptions = function() {
  return new visflow.options.Node({
    label: true,
    visMode: true
  });
};

/**
 * Returns the plot margins.
 * @return {visflow.Margins}
 * @protected
 */
visflow.Visualization.prototype.plotMargins = function() {
  return {
    left: 10,
    right: 10,
    top: 10,
    bottom: 10
  };
};

/**
 * Returns object for specifying default rendering properties.
 * @return {visflow.Properties}
 * @protected
 */
visflow.Visualization.prototype.defaultProperties = function() {
  return {
    color: '#555',
    border: 'black',
    width: 1,
    size: 3
  };
};

/**
 * These properties are shown when items are selected.
 * @return {visflow.Properties}
 * @protected
 */
visflow.Visualization.prototype.selectedProperties = function() {
  return {
    color: 'white',
    border: visflow.const.SELECTED_COLOR
  };
};

/**
 * Highlight effect for selected elements, using multiplier.
 * @return {visflow.Properties}
 * @protected
 */
visflow.Visualization.prototype.selectedMultiplier = function() {
  return {
    size: 1.2,
    width: 1.2
  };
};

/** @inheritDoc */
visflow.Visualization.prototype.contextMenuItems = function() {
  var items = visflow.Visualization.base.contextMenuItems();
  return items.concat([
    {id: visflow.Event.SELECT_ALL, text: 'Select All'},
    {id: visflow.Event.CLEAR_SELECTION, text: 'Clear Selection'}
  ]);
};

